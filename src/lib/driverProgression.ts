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
    const topTens = results.filter((result) => !result.dnf && result.position <= 10).length;
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
        topTens,
        dnfs,
        averageFinish,
    };
}

function calculatePerformanceDelta(driver: Driver, history: RaceHistoryEntry[]) {
    const stats = getDriverSeasonStats(history, driver.id);

    let score = 0;

    if (stats.points >= 140) score += 2;
    else if (stats.points >= 80) score += 1;
    else if (stats.points <= 5 && stats.races > 0) score -= 1;

    if (stats.wins >= 3) score += 1;
    if (stats.podiums >= 5) score += 1;
    if (stats.topTens >= Math.max(6, Math.floor(stats.races * 0.7))) score += 0.5;

    if (stats.averageFinish <= 5) score += 1;
    else if (stats.averageFinish >= 14) score -= 1;

    if (stats.dnfs >= 4) score -= 1;

    if (driver.age <= 20) score += 1;
    else if (driver.age <= 24) score += 0.5;
    else if (driver.age >= 35) score -= 1.25;
    else if (driver.age >= 31) score -= 0.5;

    score += (Math.random() - 0.5) * 0.7;

    if (score >= 2.6) return 2;
    if (score >= 1.0) return 1;
    if (score <= -2.0) return -2;
    if (score <= -0.8) return -1;
    return 0;
}

function calculateMarketValue(driver: Driver, deltaOverall: number, points: number, age: number) {
    let multiplier = 1;

    multiplier += deltaOverall * 0.08;
    multiplier += Math.min(points / 500, 0.18);

    if (age <= 22) multiplier += 0.12;
    else if (age >= 34) multiplier -= 0.12;

    const nextValue = Math.round(driver.marketValue * multiplier);
    return Math.max(1000000, nextValue);
}

export function progressDriversForSeason(
    drivers: Driver[],
    history: RaceHistoryEntry[]
): {
    drivers: Driver[];
    progressions: DriverProgressionSummary[];
} {
    const updatedDrivers = drivers.map((driver) => {
        const stats = getDriverSeasonStats(history, driver.id);
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
            marketValue: calculateMarketValue(driver, deltaOverall, stats.points, newAge),
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