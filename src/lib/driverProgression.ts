import type {
    Driver,
    DriverProgressionSummary,
    RaceHistoryEntry,
} from '../features/season/types';

function clamp(value: number, min = 60, max = 99) {
    return Math.max(min, Math.min(max, value));
}

function getDriverSeasonStats(history: RaceHistoryEntry[], driverId: string) {
    const results = history
        .map((race) => race.results.find((entry) => entry.driverId === driverId))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    const races = results.length;
    const points = results.reduce((sum, result) => sum + result.points, 0);
    const wins = results.filter((result) => !result.dnf && result.position === 1).length;
    const podiums = results.filter((result) => !result.dnf && result.position <= 3).length;
    const dnfs = results.filter((result) => result.dnf).length;

    const classified = results.filter((result) => !result.dnf);
    const averageFinish =
        classified.length > 0
            ? classified.reduce((sum, result) => sum + result.position, 0) / classified.length
            : 20;

    return {
        races,
        points,
        wins,
        podiums,
        dnfs,
        averageFinish,
    };
}

function calculatePerformanceDelta(driver: Driver, history: RaceHistoryEntry[]) {
    const stats = getDriverSeasonStats(history, driver.id);

    let score = 0;

    if (stats.points >= 120) score += 2;
    else if (stats.points >= 60) score += 1;

    if (stats.wins >= 3) score += 1;
    if (stats.podiums >= 5) score += 1;
    if (stats.averageFinish <= 5) score += 1;
    else if (stats.averageFinish >= 14) score -= 1;

    if (stats.dnfs >= 4) score -= 1;

    if (driver.age <= 21) score += 1;
    else if (driver.age <= 24) score += 0.5;
    else if (driver.age >= 34) score -= 1;
    else if (driver.age >= 30) score -= 0.5;

    const randomness = Math.random() - 0.5;
    score += randomness * 0.8;

    if (score >= 2.5) return 2;
    if (score >= 1) return 1;
    if (score <= -2) return -2;
    if (score <= -0.8) return -1;
    return 0;
}

export function progressDriversForSeason(
    drivers: Driver[],
    history: RaceHistoryEntry[]
): {
    drivers: Driver[];
    progressions: DriverProgressionSummary[];
} {
    const updatedDrivers = drivers.map((driver) => {
        const deltaOverall = calculatePerformanceDelta(driver, history);
        const newAge = driver.age + 1;

        const qualiDelta = deltaOverall > 0 ? deltaOverall : deltaOverall < 0 ? deltaOverall : 0;
        const racecraftDelta = deltaOverall;
        const consistencyDelta = deltaOverall > 0 ? 0 : deltaOverall < 0 ? -1 : 0;
        const wetDelta = deltaOverall >= 2 ? 1 : deltaOverall <= -2 ? -1 : 0;

        const updated: Driver = {
            ...driver,
            age: newAge,
            overall: clamp(driver.overall + deltaOverall),
            qualifying: clamp(driver.qualifying + qualiDelta),
            racecraft: clamp(driver.racecraft + racecraftDelta),
            consistency: clamp(driver.consistency + consistencyDelta),
            wetSkill: clamp(driver.wetSkill + wetDelta),
            marketValue: Math.max(
                1000000,
                Math.round(driver.marketValue * (1 + deltaOverall * 0.08))
            ),
        };

        return updated;
    });

    const progressions = updatedDrivers
        .map((updated) => {
            const old = drivers.find((driver) => driver.id === updated.id)!;

            return {
                driverId: updated.id,
                oldOverall: old.overall,
                newOverall: updated.overall,
                deltaOverall: updated.overall - old.overall,
                oldAge: old.age,
                newAge: updated.age,
            };
        })
        .sort((a, b) => b.deltaOverall - a.deltaOverall);

    return {
        drivers: updatedDrivers,
        progressions,
    };
}