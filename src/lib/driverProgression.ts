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

/**
 * More season impact than the last version, but still not enough
 * to let every top driver climb endlessly.
 */
function calculatePerformanceScore(driver: Driver, history: RaceHistoryEntry[]) {
    const stats = getDriverSeasonStats(history, driver.id);

    let score = 0;

    if (stats.points >= 220) score += 1.45;
    else if (stats.points >= 160) score += 1.1;
    else if (stats.points >= 110) score += 0.8;
    else if (stats.points >= 70) score += 0.45;
    else if (stats.points <= 5 && stats.races > 0) score -= 0.6;

    if (stats.wins >= 6) score += 0.55;
    else if (stats.wins >= 3) score += 0.35;
    else if (stats.wins >= 1) score += 0.15;

    if (stats.podiums >= 10) score += 0.45;
    else if (stats.podiums >= 6) score += 0.25;
    else if (stats.podiums >= 3) score += 0.1;

    if (stats.topTens >= Math.max(8, Math.floor(stats.races * 0.75))) score += 0.2;

    if (stats.averageFinish <= 4) score += 0.45;
    else if (stats.averageFinish <= 7) score += 0.15;
    else if (stats.averageFinish >= 14) score -= 0.45;

    if (stats.dnfs >= 4) score -= 0.4;

    // Elite drivers still improve less easily.
    if (driver.overall >= 96) score -= 0.85;
    else if (driver.overall >= 93) score -= 0.55;
    else if (driver.overall >= 90) score -= 0.25;

    score += (Math.random() - 0.5) * 0.4;

    return score;
}

/**
 * Age still matters a lot, especially after 35.
 */
function getAgeAdjustment(age: number, overall: number) {
    if (age <= 20) return 1.0;
    if (age <= 23) return 0.55;
    if (age <= 28) return 0;
    if (age <= 31) return -0.15;
    if (age <= 34) return -0.45;
    if (age === 35) return -0.95;
    if (age === 36) return -1.35;
    if (age === 37) return -1.8;
    if (age === 38) return -2.25;
    if (age >= 39) return -2.9;

    return overall >= 90 ? -0.25 : 0;
}

function scoreToOverallDelta(totalScore: number, age: number, overall: number) {
    if (age >= 39) return -3;
    if (age >= 37 && totalScore <= -0.8) return -2;
    if (age >= 35 && totalScore <= -0.25) return -1;

    if (totalScore >= 2.15 && age <= 22 && overall <= 88) return 2;
    if (totalScore >= 1.15 && age <= 28 && overall <= 93) return 1;

    if (totalScore <= -2.3) return -3;
    if (totalScore <= -1.35) return -2;
    if (totalScore <= -0.45) return -1;

    return 0;
}

function getAgeMarketMultiplier(age: number) {
    if (age <= 22) return 1.12;
    if (age <= 27) return 1.06;
    if (age <= 31) return 1.0;
    if (age <= 34) return 0.92;
    if (age <= 36) return 0.82;
    if (age <= 38) return 0.68;
    return 0.54;
}

function getOverallMarketMultiplier(overall: number) {
    if (overall >= 97) return 0.97;
    if (overall >= 94) return 0.985;
    return 1;
}

function calculateMarketValue(
    driver: Driver,
    deltaOverall: number,
    points: number,
    newAge: number,
    newOverall: number
) {
    let performanceMultiplier = 1;

    performanceMultiplier += deltaOverall * 0.06;
    performanceMultiplier += Math.min(points / 800, 0.14);

    const performanceValue = driver.marketValue * performanceMultiplier;
    const agedValue = performanceValue * getAgeMarketMultiplier(newAge);
    const eliteAdjusted = agedValue * getOverallMarketMultiplier(newOverall);

    return Math.max(1000000, Math.round(eliteAdjusted));
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
        const performanceScore = calculatePerformanceScore(driver, history);
        const ageAdjustment = getAgeAdjustment(driver.age, driver.overall);
        const totalScore = performanceScore + ageAdjustment;

        let deltaOverall = scoreToOverallDelta(totalScore, driver.age, driver.overall);

        // 96+ drivers can still gain, but only very rarely and only when not old.
        if (driver.overall >= 96 && deltaOverall > 0) {
            deltaOverall = driver.age <= 30 ? Math.min(deltaOverall, 1) : 0;
        }

        // 35+ drivers should not gain overall anymore.
        if (driver.age >= 35) {
            deltaOverall = Math.min(deltaOverall, 0);
        }

        const newAge = driver.age + 1;
        const newOverall = clamp(driver.overall + deltaOverall);

        const qualifyingDelta =
            driver.age >= 35
                ? Math.min(deltaOverall, 0)
                : deltaOverall > 0
                    ? Math.min(deltaOverall, 1)
                    : deltaOverall;

        const racecraftDelta =
            driver.age >= 37
                ? Math.min(deltaOverall, 0)
                : driver.age >= 35
                    ? Math.min(deltaOverall, 0)
                    : deltaOverall > 0
                        ? Math.min(deltaOverall, 1)
                        : deltaOverall;

        const consistencyDelta =
            driver.age >= 36
                ? deltaOverall > 0
                    ? 0
                    : -1
                : deltaOverall >= 2
                    ? 1
                    : deltaOverall <= -2
                        ? -1
                        : 0;

        const wetSkillDelta =
            driver.age >= 37
                ? -1
                : deltaOverall >= 2
                    ? 1
                    : deltaOverall <= -2
                        ? -1
                        : 0;

        const updated: Driver = {
            ...driver,
            age: newAge,
            overall: newOverall,
            qualifying: clamp(driver.qualifying + qualifyingDelta),
            racecraft: clamp(driver.racecraft + racecraftDelta),
            consistency: clamp(driver.consistency + consistencyDelta),
            wetSkill: clamp(driver.wetSkill + wetSkillDelta),
            marketValue: calculateMarketValue(
                driver,
                deltaOverall,
                stats.points,
                newAge,
                newOverall
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