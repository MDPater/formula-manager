import type {
    Driver,
    NewDriverRecord,
    RaceHistoryEntry,
    RetirementRecord,
    TeamRoster,
} from '../features/season/types';
import { getDriverTeamId } from './roster';

const firstNames = [
    'Liam',
    'Mason',
    'Leo',
    'Nico',
    'Oliver',
    'Enzo',
    'Hugo',
    'Victor',
    'Theo',
    'Daniel',
    'Jonah',
    'Aiden',
    'Marco',
    'Sami',
    'Ruben',
    'Noel',
    'Tobias',
    'Adrian',
];

const lastNames = [
    'Costa',
    'Berg',
    'Volkov',
    'Barrett',
    'Silva',
    'Rossi',
    'Meyer',
    'Kovac',
    'Nielsen',
    'Ibrahim',
    'Fischer',
    'Petrescu',
    'Santos',
    'Molina',
    'Novak',
    'Duarte',
    'Mercer',
    'Tanaka',
];

const countries = [
    'Italy',
    'Germany',
    'United Kingdom',
    'Spain',
    'Portugal',
    'Brazil',
    'Japan',
    'Netherlands',
    'France',
    'Australia',
    'Canada',
    'Argentina',
    'Sweden',
    'Poland',
    'United States',
];

function randomItem<T>(items: T[]) {
    return items[Math.floor(Math.random() * items.length)];
}

function buildName() {
    return `${randomItem(firstNames)} ${randomItem(lastNames)}`;
}

function getSeasonStats(history: RaceHistoryEntry[], driverId: string) {
    const results = history
        .map((race) => race.results.find((entry) => entry.driverId === driverId))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    const points = results.reduce((sum, result) => sum + result.points, 0);
    const dnfs = results.filter((result) => result.dnf).length;
    const classified = results.filter((result) => !result.dnf);
    const averageFinish =
        classified.length > 0
            ? classified.reduce((sum, result) => sum + result.position, 0) / classified.length
            : 20;

    return {
        points,
        dnfs,
        averageFinish,
    };
}

function shouldRetire(driver: Driver, history: RaceHistoryEntry[]) {
    const stats = getSeasonStats(history, driver.id);

    if (driver.age >= 37 && driver.overall <= 80) {
        return {
            retire: true,
            reason: 'Age and declining pace',
        };
    }

    if (driver.age >= 35 && driver.overall <= 76 && Math.random() > 0.25) {
        return {
            retire: true,
            reason: 'Age and reduced competitiveness',
        };
    }

    if (
        driver.age >= 30 &&
        driver.age <= 34 &&
        driver.overall >= 72 &&
        driver.overall <= 80 &&
        stats.points <= 5 &&
        stats.averageFinish >= 14 &&
        Math.random() > 0.6
    ) {
        return {
            retire: true,
            reason: 'Poor season and loss of seat prospects',
        };
    }

    return {
        retire: false,
        reason: '',
    };
}

function createDriverId(drivers: Driver[]) {
    const maxId = drivers.reduce((max, driver) => {
        const numeric = Number(driver.id.replace('d', ''));
        return Number.isNaN(numeric) ? max : Math.max(max, numeric);
    }, 0);

    return `d${maxId + 1}`;
}

function createGeneratedDriver(existingDrivers: Driver[]): {
    driver: Driver;
    record: Omit<NewDriverRecord, 'teamId'>;
} {
    const archetypeRoll = Math.random();
    let archetype: 'wonderkid' | 'experienced' | 'veteran' = 'experienced';
    let age = 24;
    let overall = 75;

    if (archetypeRoll < 0.35) {
        archetype = 'wonderkid';
        age = 18 + Math.floor(Math.random() * 4);
        overall = 67 + Math.floor(Math.random() * 8);
    } else if (archetypeRoll < 0.8) {
        archetype = 'experienced';
        age = 24 + Math.floor(Math.random() * 6);
        overall = 73 + Math.floor(Math.random() * 8);
    } else {
        archetype = 'veteran';
        age = 31 + Math.floor(Math.random() * 5);
        overall = 74 + Math.floor(Math.random() * 7);
    }

    const id = createDriverId(existingDrivers);
    const name = buildName();
    const country = randomItem(countries);
    const qualifying = Math.max(60, Math.min(99, overall + Math.floor(Math.random() * 5) - 2));
    const racecraft = Math.max(60, Math.min(99, overall + Math.floor(Math.random() * 5) - 2));
    const consistency = Math.max(60, Math.min(99, overall + Math.floor(Math.random() * 5) - 2));
    const wetSkill = Math.max(60, Math.min(99, overall + Math.floor(Math.random() * 5) - 2));
    const marketValue = Math.max(1500000, overall * 250000);

    const driver: Driver = {
        id,
        name,
        country,
        age,
        overall,
        qualifying,
        racecraft,
        consistency,
        wetSkill,
        marketValue,
    };

    return {
        driver,
        record: {
            driverId: id,
            name,
            country,
            age,
            overall,
            archetype,
        },
    };
}

export function runOffseasonDriverChanges(
    drivers: Driver[],
    teamRosters: TeamRoster,
    seasonHistory: RaceHistoryEntry[]
): {
    drivers: Driver[];
    teamRosters: TeamRoster;
    retirements: RetirementRecord[];
    newDrivers: NewDriverRecord[];
} {
    const activeIds = new Set(Object.values(teamRosters).flat());
    const activeDrivers = drivers.filter((driver) => activeIds.has(driver.id));

    const retirements: RetirementRecord[] = [];
    let remainingDrivers = [...drivers];
    const updatedRosters: TeamRoster = Object.fromEntries(
        Object.entries(teamRosters).map(([teamId, ids]) => [teamId, [...ids]])
    );

    for (const driver of activeDrivers) {
        const decision = shouldRetire(driver, seasonHistory);
        if (!decision.retire) continue;

        const teamId = getDriverTeamId(updatedRosters, driver.id);

        retirements.push({
            driverId: driver.id,
            name: driver.name,
            country: driver.country,
            age: driver.age,
            overall: driver.overall,
            reason: decision.reason,
            teamId,
        });

        remainingDrivers = remainingDrivers.filter((item) => item.id !== driver.id);

        if (teamId) {
            updatedRosters[teamId] = updatedRosters[teamId].filter((id) => id !== driver.id);
        }
    }

    const newDrivers: NewDriverRecord[] = [];

    for (const retirement of retirements) {
        const generated = createGeneratedDriver(remainingDrivers);
        remainingDrivers = [...remainingDrivers, generated.driver];

        if (retirement.teamId) {
            updatedRosters[retirement.teamId] = [
                ...(updatedRosters[retirement.teamId] ?? []),
                generated.driver.id,
            ].slice(0, 2);
        }

        newDrivers.push({
            ...generated.record,
            teamId: retirement.teamId,
        });
    }

    return {
        drivers: remainingDrivers,
        teamRosters: updatedRosters,
        retirements,
        newDrivers,
    };
}