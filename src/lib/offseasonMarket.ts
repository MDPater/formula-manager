import type {
    Driver,
    Engineer,
    PitCrewChief,
    Team,
    TeamRoster,
} from '../features/season/types';
import { getDriverTeamId } from './roster';

type TeamTier = 'top' | 'midfield' | 'backmarker';

export function getTeamTier(team: Team): TeamTier {
    const carScore = (team.aero + team.power + team.reliability) / 3;

    if (carScore >= 85 || team.budget >= 58000000) return 'top';
    if (carScore >= 76 || team.budget >= 45000000) return 'midfield';
    return 'backmarker';
}

export function getTeamPrestigeScore(team: Team) {
    const carScore = (team.aero + team.power + team.reliability) / 3;
    return carScore + team.points * 0.04 + team.budget / 2000000;
}

export function getDriverDemandPrice(driver: Driver, fromAnotherTeam: boolean) {
    return fromAnotherTeam ? Math.round(driver.marketValue * 1.25) : 0;
}

export function getEngineerDemandPrice(engineer: Engineer) {
    return Math.round(engineer.salary * 1.15);
}

export function getPitCrewChiefDemandPrice(chief: PitCrewChief) {
    return Math.round(chief.salary * 1.15);
}

export function scoreDriverForTeam(driver: Driver, team: Team) {
    const tier = getTeamTier(team);

    const agePenalty =
        driver.age >= 37 ? 12 :
            driver.age >= 35 ? 7 :
                driver.age >= 32 ? 3 :
                    0;

    const youthBonus =
        driver.age <= 21 ? 8 :
            driver.age <= 24 ? 4 :
                0;

    const carFit =
        (team.aero * driver.qualifying +
            team.power * driver.racecraft +
            team.reliability * driver.consistency) / 300;

    const base =
        driver.overall * 2 +
        driver.qualifying * 0.45 +
        driver.racecraft * 0.55 +
        driver.consistency * 0.4 +
        driver.wetSkill * 0.2 +
        carFit;

    if (tier === 'top') {
        return base - agePenalty + Math.max(0, 28 - driver.age) * 0.4;
    }

    if (tier === 'midfield') {
        return base - agePenalty * 0.8 + youthBonus * 0.8;
    }

    return (
        base -
        agePenalty * 0.5 +
        youthBonus * 1.6 -
        Math.max(0, driver.marketValue / 1000000 - 12) * 1.2
    );
}

export function scoreEngineerForTeam(engineer: Engineer, team: Team) {
    const tier = getTeamTier(team);
    const base =
        engineer.developmentSkill * 1.6 +
        engineer.consistency * 0.8 -
        Math.max(0, engineer.age - 55) * 0.3;

    if (tier === 'top') return base;
    if (tier === 'midfield') return base - engineer.salary / 500000;
    return base - engineer.salary / 250000;
}

export function scorePitCrewChiefForTeam(chief: PitCrewChief, team: Team) {
    const tier = getTeamTier(team);
    const base =
        chief.reliabilitySkill * 1.3 +
        chief.consistencySkill * 1.1 -
        Math.max(0, chief.age - 58) * 0.25;

    if (tier === 'top') return base;
    if (tier === 'midfield') return base - chief.salary / 500000;
    return base - chief.salary / 250000;
}

export function getFreeAgentDrivers(drivers: Driver[], teamRosters: TeamRoster) {
    return drivers.filter((driver) => !getDriverTeamId(teamRosters, driver.id) && !driver.retired);
}

export function getOpenSeatTeams(teams: Team[], teamRosters: TeamRoster, playerTeamId: string) {
    return teams.filter((team) => {
        if (team.id === playerTeamId) return false;
        return (teamRosters[team.id] ?? []).length < 2;
    });
}

export function getAiUpgradeableTeams(
    teams: Team[],
    teamRosters: TeamRoster,
    playerTeamId: string
) {
    return teams.filter((team) => {
        if (team.id === playerTeamId) return false;
        return (teamRosters[team.id] ?? []).length >= 2;
    });
}

export function buildDriverPreferenceReason(driver: Driver, fromTeam: Team, toTeam: Team) {
    const fromPrestige = getTeamPrestigeScore(fromTeam);
    const toPrestige = getTeamPrestigeScore(toTeam);

    if (toPrestige - fromPrestige >= 8) return 'Moved for a more prestigious seat';
    if (toTeam.power + toTeam.aero - (fromTeam.power + fromTeam.aero) >= 6) {
        return 'Moved for a stronger car package';
    }
    if (driver.age <= 23) return 'Moved for better long-term development';
    if (driver.age >= 31) return 'Moved for a final competitive opportunity';
    return 'Moved for a new contract and project';
}