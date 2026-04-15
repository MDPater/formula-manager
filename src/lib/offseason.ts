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

    if (driver.age >= 40) {
        return {
            retire: true,
            reason: 'End of career',
        };
    }

    if (driver.age >= 38 && Math.random() > 0.3) {
        return {
            retire: true,
            reason: 'Age and long career',
        };
    }

    if (driver.age >= 37 && driver.overall <= 82 && Math.random() > 0.4) {
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
        retired: false,
        retiredSeason: null,
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

export function previewOffseasonDriverChanges(
    drivers: Driver[],
    teamRosters: TeamRoster,
    seasonHistory: RaceHistoryEntry[]
): {
    retirements: RetirementRecord[];
    newDrivers: NewDriverRecord[];
} {
    const activeIds = new Set(Object.values(teamRosters).flat());
    const activeDrivers = drivers.filter((driver) => activeIds.has(driver.id) && !driver.retired);

    const retirements: RetirementRecord[] = [];
    const newDrivers: NewDriverRecord[] = [];
    let tempDrivers = [...drivers];

    for (const driver of activeDrivers) {
        const decision = shouldRetire(driver, seasonHistory);
        if (!decision.retire) continue;

        const teamId = getDriverTeamId(teamRosters, driver.id);

        retirements.push({
            driverId: driver.id,
            name: driver.name,
            country: driver.country,
            age: driver.age,
            overall: driver.overall,
            reason: decision.reason,
            teamId,
        });

        const generated = createGeneratedDriver(tempDrivers);
        tempDrivers = [...tempDrivers, generated.driver];

        newDrivers.push({
            ...generated.record,
            teamId,
        });
    }

    return {
        retirements,
        newDrivers,
    };
}

export function applyOffseasonDriverChanges(
    drivers: Driver[],
    teamRosters: TeamRoster,
    retirements: RetirementRecord[],
    newDrivers: NewDriverRecord[],
    retiredSeason: number
): {
    drivers: Driver[];
    teamRosters: TeamRoster;
} {
    let updatedDrivers = [...drivers];
    const updatedRosters: TeamRoster = Object.fromEntries(
        Object.entries(teamRosters).map(([teamId, ids]) => [teamId, [...ids]])
    );

    for (const retirement of retirements) {
        updatedDrivers = updatedDrivers.map((driver) =>
            driver.id === retirement.driverId
                ? {
                    ...driver,
                    retired: true,
                    retiredSeason,
                    marketValue: Math.max(1000000, Math.round(driver.marketValue * 0.45)),
                }
                : driver
        );

        if (retirement.teamId) {
            updatedRosters[retirement.teamId] = (updatedRosters[retirement.teamId] ?? []).filter(
                (id) => id !== retirement.driverId
            );
        }
    }

    for (const entry of newDrivers) {
        const generatedDriver: Driver = {
            id: entry.driverId,
            name: entry.name,
            country: entry.country,
            age: entry.age,
            overall: entry.overall,
            qualifying: Math.max(60, Math.min(99, entry.overall + Math.floor(Math.random() * 5) - 2)),
            racecraft: Math.max(60, Math.min(99, entry.overall + Math.floor(Math.random() * 5) - 2)),
            consistency: Math.max(60, Math.min(99, entry.overall + Math.floor(Math.random() * 5) - 2)),
            wetSkill: Math.max(60, Math.min(99, entry.overall + Math.floor(Math.random() * 5) - 2)),
            marketValue: Math.max(1500000, entry.overall * 250000),
            retired: false,
            retiredSeason: null,
        };

        updatedDrivers.push(generatedDriver);

        if (entry.teamId) {
            updatedRosters[entry.teamId] = [...(updatedRosters[entry.teamId] ?? []), entry.driverId].slice(
                0,
                2
            );
        }
    }

    return {
        drivers: updatedDrivers,
        teamRosters: updatedRosters,
    };
}