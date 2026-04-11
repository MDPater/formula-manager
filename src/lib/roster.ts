import type { Driver, Team, TeamRoster } from '../features/season/types';

export function getTeamDriverIds(teamRosters: TeamRoster, teamId: string): string[] {
    return teamRosters[teamId] ?? [];
}

export function getTeamDrivers(
    drivers: Driver[],
    teamRosters: TeamRoster,
    teamId: string
): Driver[] {
    const ids = new Set(getTeamDriverIds(teamRosters, teamId));
    return drivers.filter((driver) => ids.has(driver.id));
}

export function getDriverTeamId(teamRosters: TeamRoster, driverId: string): string | null {
    for (const [teamId, driverIds] of Object.entries(teamRosters)) {
        if (driverIds.includes(driverId)) return teamId;
    }
    return null;
}

export function getFreeAgents(
    drivers: Driver[],
    teamRosters: TeamRoster
): Driver[] {
    const assigned = new Set(Object.values(teamRosters).flat());
    return drivers.filter((driver) => !assigned.has(driver.id));
}

export function getActiveDrivers(
    drivers: Driver[],
    teamRosters: TeamRoster
): Driver[] {
    const assigned = new Set(Object.values(teamRosters).flat());
    return drivers.filter((driver) => assigned.has(driver.id));
}

export function createDefaultTeamRosters(teams: Team[], drivers: Driver[]): TeamRoster {
    const sorted = [...drivers].sort((a, b) => b.overall - a.overall);
    const roster: TeamRoster = {};
    let cursor = 0;

    for (const team of teams) {
        roster[team.id] = [sorted[cursor].id, sorted[cursor + 1].id];
        cursor += 2;
    }

    return roster;
}

export function buildFreshRostersFromSetup(
    teams: Team[],
    drivers: Driver[],
    selectedTeamId: string,
    selectedDriverIds: string[]
): TeamRoster {
    const roster: TeamRoster = {};
    const selectedSet = new Set(selectedDriverIds);

    for (const team of teams) {
        roster[team.id] = [];
    }

    roster[selectedTeamId] = [...selectedDriverIds];

    const remainingDrivers = drivers
        .filter((driver) => !selectedSet.has(driver.id))
        .sort((a, b) => b.overall - a.overall);

    for (const team of teams) {
        if (team.id === selectedTeamId) continue;

        while (roster[team.id].length < 2 && remainingDrivers.length > 0) {
            const next = remainingDrivers.shift();
            if (!next) break;
            roster[team.id].push(next.id);
        }
    }

    return roster;
}