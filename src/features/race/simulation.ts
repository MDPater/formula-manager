import type { Driver, Race, ResultRow, Team } from '../season/types';

const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

function randomRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function simulateRace(
    roundIndex: number,
    drivers: Driver[],
    teams: Team[],
    calendar: Race[]
): ResultRow[] {
    const race = calendar[roundIndex];

    return drivers
        .map((driver) => {
            const team = teams.find((t) => t.id === driver.teamId);
            const aero = team?.aero ?? 70;
            const power = team?.power ?? 70;
            const reliability = team?.reliability ?? 70;

            const trackBonus =
                race?.trackBias === 'aero'
                    ? aero * 0.5
                    : race?.trackBias === 'power'
                        ? power * 0.5
                        : (aero + power) * 0.25;

            const weatherBonus =
                race?.weather === 'wet' ? driver.wetSkill * 0.2 : driver.consistency * 0.1;

            const dnfChance = Math.max(
                0.03,
                0.22 - reliability / 500 - (race?.chaos ?? 0) * 0.1
            );

            const dnf = Math.random() < dnfChance;

            return {
                driverId: driver.id,
                driverName: driver.name,
                score: dnf
                    ? -999
                    : driver.overall +
                    driver.racecraft * 0.35 +
                    trackBonus +
                    weatherBonus +
                    randomRange(-8, 8),
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