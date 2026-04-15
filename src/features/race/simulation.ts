import type {
    Driver,
    PitCrewChief,
    Race,
    ResultRow,
    Team,
    TeamRoster,
} from '../season/types';
import { getActiveDrivers, getDriverTeamId } from '../../lib/roster';

const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

function randomRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function simulateRace(
    roundIndex: number,
    drivers: Driver[],
    teams: Team[],
    teamRosters: TeamRoster,
    calendar: Race[],
    playerTeamId: string,
    playerPitCrewChief: PitCrewChief | null
): ResultRow[] {
    const race = calendar[roundIndex];
    const activeDrivers = getActiveDrivers(drivers, teamRosters);

    return activeDrivers
        .map((driver) => {
            const teamId = getDriverTeamId(teamRosters, driver.id);
            const team = teams.find((t) => t.id === teamId);

            const aero = team?.aero ?? 70;
            const power = team?.power ?? 70;
            const reliability = team?.reliability ?? 70;
            const carPerformance = aero * 0.55 + power * 0.45;
            const driverPerformance =
                driver.overall * 0.55 +
                driver.racecraft * 0.3 +
                driver.consistency * 0.15;


            const trackBonus =
                race?.trackBias === 'aero'
                    ? aero * 0.55
                    : race?.trackBias === 'power'
                        ? power * 0.55
                        : (aero + power) * 0.275;

            const weatherBonus =
                race?.weather === 'wet' ? driver.wetSkill * 0.22 : driver.consistency * 0.12;

            let dnfChance = Math.max(
                0.03,
                0.22 - reliability / 500 - (race?.chaos ?? 0) * 0.1
            );

            let varianceMin = -8;
            let varianceMax = 8;

            if (teamId === playerTeamId && playerPitCrewChief) {
                dnfChance -= playerPitCrewChief.reliabilitySkill / 1000;
                dnfChance -= playerPitCrewChief.consistencySkill / 1500;

                const reduction = playerPitCrewChief.consistencySkill / 20;
                varianceMin += reduction / 2;
                varianceMax -= reduction / 2;
            }

            const dnf = Math.random() < Math.max(0.01, dnfChance);

            return {
                driverId: driver.id,
                driverName: driver.name,
                score: dnf
                    ? -999
                    : carPerformance * 0.7 +
                    driverPerformance * 0.65 +
                    trackBonus +
                    weatherBonus +
                    randomRange(varianceMin, varianceMax),
                position: 0,
                dnf,
                points: 0,
            };
        })
        .sort((a, b) => b.score - a.score)
        .map((result, index) => ({
            ...result,
            position: index + 1,
            points: result.dnf ? 0 : pointsTable[index] ?? 0,
        }));
}