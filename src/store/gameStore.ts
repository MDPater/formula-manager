import { create } from 'zustand';
import { calendar as providerCalendarSeed } from '../data/calendar';
import { drivers as defaultDrivers } from '../data/drivers';
import { engineers as defaultEngineers } from '../data/engineers';
import { pitCrewChiefs as defaultPitCrewChiefs } from '../data/pitCrewChief';
import { teams as defaultTeams } from '../data/teams';
import { progressDriversForSeason } from '../lib/driverProgression';
import {
    applyOffseasonDriverChanges,
    previewOffseasonDriverChanges,
} from '../lib/offseason';
import {
    getAiUpgradeableTeams,
    getDriverDemandPrice,
    getEngineerDemandPrice,
    getFreeAgentDrivers,
    getOpenSeatTeams,
    getPitCrewChiefDemandPrice,
    scoreDriverForTeam,
} from '../lib/offseasonMarket';
import { downloadJson, readBrowserSave, writeBrowserSave } from '../lib/persistence';
import {
    buildFreshRostersFromSetup,
    createDefaultTeamRosters,
    getActiveDrivers,
    getDriverTeamId,
    getTeamDriverIds,
} from '../lib/roster';
import { generateSeasonCalendar } from '../lib/seasonGenerator';
import { simulateRace } from '../features/race/simulation';
import { useCareerSetupStore } from './careerSetupStore';
import type {
    Driver,
    Engineer,
    PitCrewChief,
    Race,
    RaceHistoryEntry,
    SaveFile,
    SeasonSummary,
    Team,
    TeamRoster,
} from '../features/season/types';

const INITIAL_SEASON_YEAR = new Date().getFullYear();
const TEAM_BUDGET_CAP = 150000000;

type CareerSetupPayload = {
    saveId: string;
    saveName: string;
    teamId: string;
    driverIds: string[];
    engineerId: string;
    pitCrewChiefId: string;
    seasonLength: number;
};

type GameState = {
    teams: Team[];
    drivers: Driver[];
    engineers: Engineer[];
    pitCrewChiefs: PitCrewChief[];
    providerCalendar: Race[];
    calendar: Race[];
    teamRosters: TeamRoster;

    playerTeamId: string;
    playerEngineerId: string | null;
    playerPitCrewChiefId: string | null;

    currentRound: number;
    history: RaceHistoryEntry[];
    seasonNumber: number;
    seasonLength: number;
    isSeasonComplete: boolean;
    seasonSummaries: SeasonSummary[];

    activeSaveId: string | null;
    activeSaveName: string | null;
    hasLoadedCareer: boolean;
    lastSavedAt: string | null;

    createNewCareerFromSetup: (payload: CareerSetupPayload) => void;
    loadCareer: (saveId: string) => void;
    saveCurrentCareer: () => void;
    exportCurrentCareer: () => void;
    exitToStartScreen: () => void;
    signDriverForPlayer: (driverId: string) => { ok: boolean; message: string };
    hireEngineerForPlayer: (engineerId: string) => { ok: boolean; message: string };
    hirePitCrewChiefForPlayer: (chiefId: string) => { ok: boolean; message: string };
    resolveAiOffseasonMoves: () => void;
    replacePlayerDriver: (
        outDriverId: string,
        inDriverId: string
    ) => { ok: boolean; message: string };

    pendingPrizeMoney: number;
    offseasonReady: boolean;
    prepareOffseason: () => void;

    runNextRace: () => void;
    upgradeCar: (part: 'aero' | 'power' | 'reliability') => void;
    startNextSeason: () => void;
};

function cloneInitialWorld() {
    const teams = structuredClone(defaultTeams).map((team) => ({
        ...team,
        budget: Math.min(team.budget, TEAM_BUDGET_CAP),
    }));
    const drivers = structuredClone(defaultDrivers);
    const engineers = structuredClone(defaultEngineers);
    const pitCrewChiefs = structuredClone(defaultPitCrewChiefs);
    const providerCalendar = structuredClone(providerCalendarSeed);

    return {
        teams,
        drivers,
        engineers,
        pitCrewChiefs,
        providerCalendar,
        teamRosters: createDefaultTeamRosters(teams, drivers),
    };
}

function clampTeamBudget(budget: number) {
    return Math.min(Math.max(0, budget), TEAM_BUDGET_CAP);
}

function getPrizeMoneyForPosition(position: number | null) {
    if (position === 1) return 45000000;
    if (position === 2) return 36000000;
    if (position === 3) return 30000000;
    if (position === 4) return 24000000;
    if (position === 5) return 20000000;
    if (position === 6) return 16000000;
    if (position === 7) return 12000000;
    if (position === 8) return 9000000;
    if (position === 9) return 7000000;
    return 5000000;
}

function getPlayerTeam(state: Pick<GameState, 'teams' | 'playerTeamId'>) {
    return state.teams.find((team) => team.id === state.playerTeamId) ?? state.teams[0];
}

function getPlayerEngineer(state: Pick<GameState, 'engineers' | 'playerEngineerId'>) {
    return state.engineers.find((engineer) => engineer.id === state.playerEngineerId) ?? null;
}

function getPlayerPitCrewChief(
    state: Pick<GameState, 'pitCrewChiefs' | 'playerPitCrewChiefId'>
) {
    return state.pitCrewChiefs.find((chief) => chief.id === state.playerPitCrewChiefId) ?? null;
}

function buildSeasonSummary(state: GameState): SeasonSummary {
    const seasonHistory = state.history.filter((race) => race.seasonNumber === state.seasonNumber);

    const teamPointsMap = new Map<string, number>();
    for (const team of state.teams) teamPointsMap.set(team.id, 0);

    for (const race of seasonHistory) {
        for (const result of race.results) {
            const teamId = getDriverTeamId(state.teamRosters, result.driverId);
            if (!teamId) continue;
            teamPointsMap.set(teamId, (teamPointsMap.get(teamId) ?? 0) + result.points);
        }
    }

    const sortedTeams = [...state.teams]
        .map((team) => ({
            ...team,
            computedPoints: teamPointsMap.get(team.id) ?? 0,
        }))
        .sort((a, b) => b.computedPoints - a.computedPoints);

    const championTeamId = sortedTeams[0]?.id ?? null;
    const playerTeamPosition =
        sortedTeams.findIndex((team) => team.id === state.playerTeamId) + 1 || null;

    const activeDrivers = getActiveDrivers(state.drivers, state.teamRosters);

    const driverStats = activeDrivers.map((driver) => {
        const results = seasonHistory
            .map((race) => race.results.find((entry) => entry.driverId === driver.id))
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

        const points = results.reduce((sum, result) => sum + result.points, 0);
        const wins = results.filter((result) => !result.dnf && result.position === 1).length;
        const podiums = results.filter((result) => !result.dnf && result.position <= 3).length;

        return {
            driverId: driver.id,
            points,
            wins,
            podiums,
        };
    });

    const sortedDrivers = [...driverStats].sort((a, b) => b.points - a.points);
    const championDriverId = sortedDrivers[0]?.driverId ?? null;

    const playerDriverResults = getTeamDriverIds(state.teamRosters, state.playerTeamId).map(
        (driverId) => {
            const entry = driverStats.find((item) => item.driverId === driverId);

            return {
                driverId,
                points: entry?.points ?? 0,
                wins: entry?.wins ?? 0,
                podiums: entry?.podiums ?? 0,
            };
        }
    );

    return {
        seasonNumber: state.seasonNumber,
        championDriverId,
        championTeamId,
        playerTeamPosition,
        playerDriverResults,
        driverProgressions: [],
        retirements: [],
        newDrivers: [],
    };
}

function buildSaveFile(state: GameState): SaveFile | null {
    if (!state.activeSaveId || !state.activeSaveName) return null;

    const now = new Date().toISOString();
    const playerTeam = getPlayerTeam(state);

    return {
        version: 1,
        meta: {
            id: state.activeSaveId,
            saveName: state.activeSaveName,
            createdAt: now,
            updatedAt: now,
            seasonNumber: state.seasonNumber,
            currentRound: state.currentRound,
            teamName: playerTeam.name,
            teamPoints: playerTeam.points,
            budget: playerTeam.budget,
        },
        world: {
            teams: state.teams,
            drivers: state.drivers,
            engineers: state.engineers,
            pitCrewChiefs: state.pitCrewChiefs,
            providerCalendar: state.providerCalendar,
            calendar: state.calendar,
        },
        game: {
            teamRosters: state.teamRosters,
            currentRound: state.currentRound,
            playerTeamId: state.playerTeamId,
            playerEngineerId: state.playerEngineerId,
            playerPitCrewChiefId: state.playerPitCrewChiefId,
            seasonNumber: state.seasonNumber,
            seasonLength: state.seasonLength,
            isSeasonComplete: state.isSeasonComplete,
            history: state.history,
            seasonSummaries: state.seasonSummaries,
        },
    };
}

function persistState(state: GameState) {
    const save = buildSaveFile(state);
    if (!save) return null;

    const existing = readBrowserSave(save.meta.id);
    if (existing) {
        save.meta.createdAt = existing.meta.createdAt;
    }

    writeBrowserSave(save);
    return save;
}

export const useGameStore = create<GameState>((set, get) => {
    const initial = cloneInitialWorld();

    return {
        ...initial,
        calendar: generateSeasonCalendar(initial.providerCalendar, INITIAL_SEASON_YEAR, 15),

        playerTeamId: defaultTeams[0].id,
        playerEngineerId: null,
        playerPitCrewChiefId: null,

        currentRound: 0,
        history: [],
        seasonNumber: INITIAL_SEASON_YEAR,
        seasonLength: 15,
        isSeasonComplete: false,
        seasonSummaries: [],

        activeSaveId: null,
        activeSaveName: null,
        hasLoadedCareer: false,
        lastSavedAt: null,
        pendingPrizeMoney: 0,
        offseasonReady: false,

        replacePlayerDriver: (outDriverId, inDriverId) => {
            const state = get();

            if (!state.isSeasonComplete) {
                return { ok: false, message: 'Driver moves are only available in the offseason.' };
            }

            const playerTeam = state.teams.find((team) => team.id === state.playerTeamId);
            const incomingDriver = state.drivers.find((driver) => driver.id === inDriverId);

            if (!playerTeam || !incomingDriver) {
                return { ok: false, message: 'Driver or player team not found.' };
            }

            const playerRoster = [...(state.teamRosters[state.playerTeamId] ?? [])];

            if (!playerRoster.includes(outDriverId)) {
                return { ok: false, message: 'The outgoing driver is not in your team.' };
            }

            if (playerRoster.includes(inDriverId)) {
                return { ok: false, message: 'That driver is already in your team.' };
            }

            const currentTeamId = getDriverTeamId(state.teamRosters, incomingDriver.id);
            const price = getDriverDemandPrice(incomingDriver, Boolean(currentTeamId));

            if (playerTeam.budget < price) {
                return { ok: false, message: 'Not enough budget.' };
            }

            const updatedRosters: TeamRoster = Object.fromEntries(
                Object.entries(state.teamRosters).map(([teamId, ids]) => [teamId, [...ids]])
            );

            updatedRosters[state.playerTeamId] = updatedRosters[state.playerTeamId].filter(
                (id) => id !== outDriverId
            );

            if (currentTeamId) {
                updatedRosters[currentTeamId] = updatedRosters[currentTeamId].filter(
                    (id) => id !== incomingDriver.id
                );
            }

            updatedRosters[state.playerTeamId].push(incomingDriver.id);

            const updatedTeams = state.teams.map((team) => {
                if (team.id === state.playerTeamId) {
                    return { ...team, budget: team.budget - price };
                }

                if (team.id === currentTeamId) {
                    return { ...team, budget: team.budget + Math.round(price * 0.75) };
                }

                return team;
            });

            const nextState = {
                ...state,
                teams: updatedTeams,
                teamRosters: updatedRosters,
            };

            const save = persistState(nextState as any);

            set({
                teams: updatedTeams,
                teamRosters: updatedRosters,
                lastSavedAt: save?.meta.updatedAt ?? state.lastSavedAt,
            });

            return {
                ok: true,
                message: `Replaced driver and signed ${incomingDriver.name} for $${price.toLocaleString()}.`,
            };
        },

        signDriverForPlayer: (driverId) => {
            const state = get();
            if (!state.isSeasonComplete) {
                return { ok: false, message: 'Driver moves are only available in the offseason.' };
            }

            const playerTeam = state.teams.find((team) => team.id === state.playerTeamId);
            const driver = state.drivers.find((item) => item.id === driverId);

            if (!playerTeam || !driver) {
                return { ok: false, message: 'Driver or player team not found.' };
            }

            const currentTeamId = getDriverTeamId(state.teamRosters, driver.id);
            const alreadyPlayerDriver = currentTeamId === state.playerTeamId;

            if (alreadyPlayerDriver) {
                return { ok: false, message: 'That driver is already in your team.' };
            }

            const price = getDriverDemandPrice(driver, Boolean(currentTeamId));
            if (playerTeam.budget < price) {
                return { ok: false, message: 'Not enough budget.' };
            }

            const playerRoster = [...(state.teamRosters[state.playerTeamId] ?? [])];
            if (playerRoster.length >= 2) {
                return { ok: false, message: 'Your team already has two drivers.' };
            }

            const updatedRosters = Object.fromEntries(
                Object.entries(state.teamRosters).map(([teamId, ids]) => [teamId, [...ids]])
            );

            if (currentTeamId) {
                updatedRosters[currentTeamId] = updatedRosters[currentTeamId].filter((id) => id !== driver.id);
            }

            updatedRosters[state.playerTeamId] = [...playerRoster, driver.id];

            const updatedTeams = state.teams.map((team) => {
                if (team.id === state.playerTeamId) {
                    return { ...team, budget: team.budget - price };
                }
                if (team.id === currentTeamId) {
                    return { ...team, budget: team.budget + Math.round(price * 0.75) };
                }
                return team;
            });

            const nextState = {
                ...state,
                teams: updatedTeams,
                teamRosters: updatedRosters,
            };

            const save = persistState(nextState as any);
            set({
                teams: updatedTeams,
                teamRosters: updatedRosters,
                lastSavedAt: save?.meta.updatedAt ?? state.lastSavedAt,
            });

            return { ok: true, message: `Signed ${driver.name} for $${price.toLocaleString()}.` };
        },

        hireEngineerForPlayer: (engineerId) => {
            const state = get();
            if (!state.isSeasonComplete) {
                return { ok: false, message: 'Staff changes are only available in the offseason.' };
            }

            const playerTeam = state.teams.find((team) => team.id === state.playerTeamId);
            const engineer = state.engineers.find((item) => item.id === engineerId);

            if (!playerTeam || !engineer) {
                return { ok: false, message: 'Engineer or player team not found.' };
            }

            const price = getEngineerDemandPrice(engineer);
            if (playerTeam.budget < price) {
                return { ok: false, message: 'Not enough budget.' };
            }

            const updatedTeams = state.teams.map((team) =>
                team.id === state.playerTeamId ? { ...team, budget: team.budget - price } : team
            );

            const nextState = {
                ...state,
                teams: updatedTeams,
                playerEngineerId: engineer.id,
            };

            const save = persistState(nextState as any);
            set({
                teams: updatedTeams,
                playerEngineerId: engineer.id,
                lastSavedAt: save?.meta.updatedAt ?? state.lastSavedAt,
            });

            return { ok: true, message: `Hired ${engineer.name}.` };
        },

        hirePitCrewChiefForPlayer: (chiefId) => {
            const state = get();
            if (!state.isSeasonComplete) {
                return { ok: false, message: 'Staff changes are only available in the offseason.' };
            }

            const playerTeam = state.teams.find((team) => team.id === state.playerTeamId);
            const chief = state.pitCrewChiefs.find((item) => item.id === chiefId);

            if (!playerTeam || !chief) {
                return { ok: false, message: 'Pit crew chief or player team not found.' };
            }

            const price = getPitCrewChiefDemandPrice(chief);
            if (playerTeam.budget < price) {
                return { ok: false, message: 'Not enough budget.' };
            }

            const updatedTeams = state.teams.map((team) =>
                team.id === state.playerTeamId ? { ...team, budget: team.budget - price } : team
            );

            const nextState = {
                ...state,
                teams: updatedTeams,
                playerPitCrewChiefId: chief.id,
            };

            const save = persistState(nextState as any);
            set({
                teams: updatedTeams,
                playerPitCrewChiefId: chief.id,
                lastSavedAt: save?.meta.updatedAt ?? state.lastSavedAt,
            });

            return { ok: true, message: `Hired ${chief.name}.` };
        },

        resolveAiOffseasonMoves: () =>
            set((state) => {
                if (!state.isSeasonComplete) return state;

                const updatedRosters: TeamRoster = Object.fromEntries(
                    Object.entries(state.teamRosters).map(([teamId, ids]) => [teamId, [...ids]])
                );
                let updatedTeams = [...state.teams];

                const activeDriverPool = state.drivers.filter((driver) => !driver.retired);

                // Step 1: fill open seats from free agents first
                let freeAgents = [...getFreeAgentDrivers(activeDriverPool, updatedRosters)];
                const openSeatTeams = getOpenSeatTeams(updatedTeams, updatedRosters, state.playerTeamId);

                const sortedOpenSeatTeams = [...openSeatTeams].sort((a, b) => {
                    const aScore = (a.aero + a.power + a.reliability) / 3 + a.budget / 1000000;
                    const bScore = (b.aero + b.power + b.reliability) / 3 + b.budget / 1000000;
                    return bScore - aScore;
                });

                for (const team of sortedOpenSeatTeams) {
                    while ((updatedRosters[team.id] ?? []).length < 2) {
                        if (freeAgents.length === 0) break;

                        const sortedCandidates = [...freeAgents].sort(
                            (a, b) => scoreDriverForTeam(b, team) - scoreDriverForTeam(a, team)
                        );

                        const best = sortedCandidates[0];
                        if (!best) break;

                        updatedRosters[team.id] = [...(updatedRosters[team.id] ?? []), best.id];

                        const index = freeAgents.findIndex((item) => item.id === best.id);
                        if (index >= 0) freeAgents.splice(index, 1);
                    }
                }

                // Step 2: AI top/midfield teams may upgrade weakest driver by poaching
                const upgradeableTeams = getAiUpgradeableTeams(updatedTeams, updatedRosters, state.playerTeamId);

                for (const team of upgradeableTeams) {
                    const currentDriverIds = updatedRosters[team.id] ?? [];
                    const currentDrivers = currentDriverIds
                        .map((id) => activeDriverPool.find((driver) => driver.id === id))
                        .filter((driver): driver is NonNullable<typeof driver> => Boolean(driver));

                    if (currentDrivers.length < 2) continue;

                    const weakestDriver = [...currentDrivers].sort((a, b) => a.overall - b.overall)[0];
                    if (!weakestDriver) continue;

                    const currentWeakScore = scoreDriverForTeam(weakestDriver, team);

                    const externalCandidates = activeDriverPool.filter((driver) => {
                        const teamId = getDriverTeamId(updatedRosters, driver.id);
                        if (!teamId) return true;
                        if (teamId === team.id) return false;
                        if (teamId === state.playerTeamId) return false;
                        return true;
                    });

                    const sortedCandidates = [...externalCandidates].sort(
                        (a, b) => scoreDriverForTeam(b, team) - scoreDriverForTeam(a, team)
                    );

                    const target = sortedCandidates.find((candidate) => {
                        const price = getDriverDemandPrice(
                            candidate,
                            Boolean(getDriverTeamId(updatedRosters, candidate.id))
                        );
                        const candidateScore = scoreDriverForTeam(candidate, team);
                        return candidateScore >= currentWeakScore + 8 && team.budget >= price;
                    });

                    if (!target) continue;

                    const sellerTeamId = getDriverTeamId(updatedRosters, target.id);
                    const price = getDriverDemandPrice(target, Boolean(sellerTeamId));

                    updatedRosters[team.id] = updatedRosters[team.id].filter((id) => id !== weakestDriver.id);
                    updatedRosters[team.id].push(target.id);

                    if (sellerTeamId) {
                        updatedRosters[sellerTeamId] = updatedRosters[sellerTeamId].filter((id) => id !== target.id);
                        updatedRosters[sellerTeamId].push(weakestDriver.id);
                    }

                    updatedTeams = updatedTeams.map((entry) => {
                        if (entry.id === team.id) {
                            return { ...entry, budget: Math.max(0, entry.budget - price) };
                        }
                        if (sellerTeamId && entry.id === sellerTeamId) {
                            return { ...entry, budget: entry.budget + Math.round(price * 0.75) };
                        }
                        return entry;
                    });
                }

                const nextState = {
                    ...state,
                    teamRosters: updatedRosters,
                    teams: updatedTeams,
                };

                const save = persistState(nextState as any);

                return {
                    ...nextState,
                    lastSavedAt: save?.meta.updatedAt ?? state.lastSavedAt,
                };
            }),

        createNewCareerFromSetup: (payload) => {

            const fresh = cloneInitialWorld();

            const selectedTeam = fresh.teams.find((team) => team.id === payload.teamId) ?? fresh.teams[0];
            const selectedEngineer =
                fresh.engineers.find((engineer) => engineer.id === payload.engineerId) ??
                fresh.engineers[0];
            const selectedPitCrewChief =
                fresh.pitCrewChiefs.find((chief) => chief.id === payload.pitCrewChiefId) ??
                fresh.pitCrewChiefs[0];

            const selectedDrivers = fresh.drivers.filter((driver) =>
                payload.driverIds.includes(driver.id)
            );

            const totalDriverCost = selectedDrivers.reduce(
                (sum, driver) => sum + driver.marketValue,
                0
            );
            const totalStaffCost = selectedEngineer.salary + selectedPitCrewChief.salary;
            const remainingBudget = Math.max(0, selectedTeam.budget - totalDriverCost - totalStaffCost);

            const teamRosters = buildFreshRostersFromSetup(
                fresh.teams,
                fresh.drivers,
                selectedTeam.id,
                payload.driverIds
            );

            const teams = fresh.teams.map((team) =>
                team.id === selectedTeam.id
                    ? { ...team, budget: clampTeamBudget(remainingBudget), points: 0 }
                    : { ...team, budget: clampTeamBudget(team.budget), points: 0 }
            );

            const nextState: GameState = {
                ...get(),
                teams,
                drivers: fresh.drivers,
                engineers: fresh.engineers,
                pitCrewChiefs: fresh.pitCrewChiefs,
                providerCalendar: fresh.providerCalendar,
                calendar: generateSeasonCalendar(
                    fresh.providerCalendar,
                    INITIAL_SEASON_YEAR,
                    payload.seasonLength
                ),
                teamRosters,

                playerTeamId: selectedTeam.id,
                playerEngineerId: selectedEngineer.id,
                playerPitCrewChiefId: selectedPitCrewChief.id,

                currentRound: 0,
                history: [],
                seasonNumber: INITIAL_SEASON_YEAR,
                seasonLength: payload.seasonLength,
                isSeasonComplete: false,
                seasonSummaries: [],

                activeSaveId: payload.saveId,
                activeSaveName: payload.saveName,
                hasLoadedCareer: true,
                lastSavedAt: null,
                pendingPrizeMoney: 0,
                offseasonReady: false,

                createNewCareerFromSetup: get().createNewCareerFromSetup,
                loadCareer: get().loadCareer,
                saveCurrentCareer: get().saveCurrentCareer,
                exportCurrentCareer: get().exportCurrentCareer,
                exitToStartScreen: get().exitToStartScreen,
                runNextRace: get().runNextRace,
                upgradeCar: get().upgradeCar,
                startNextSeason: get().startNextSeason,
            };

            const save = persistState(nextState);

            set({
                ...nextState,
                lastSavedAt: save?.meta.updatedAt ?? null,
            });
        },

        prepareOffseason: () =>
            set((state) => {
                if (!state.isSeasonComplete || state.offseasonReady) return state;

                const nextState = {
                    ...state,
                    offseasonReady: true,
                };

                const save = persistState(nextState as any);

                return {
                    ...nextState,
                    lastSavedAt: save?.meta.updatedAt ?? state.lastSavedAt,
                };
            }),

        loadCareer: (saveId) => {
            const save = readBrowserSave(saveId);
            if (!save) return;

            set({
                teams: save.world.teams.map((team) => ({
                    ...team,
                    budget: clampTeamBudget(team.budget),
                })),
                drivers: save.world.drivers,
                engineers: save.world.engineers,
                pitCrewChiefs: save.world.pitCrewChiefs,
                providerCalendar: save.world.providerCalendar,
                calendar: save.world.calendar,
                teamRosters: save.game.teamRosters,

                playerTeamId: save.game.playerTeamId,
                playerEngineerId: save.game.playerEngineerId,
                playerPitCrewChiefId: save.game.playerPitCrewChiefId,

                currentRound: save.game.currentRound,
                history: save.game.history,
                seasonNumber: save.game.seasonNumber,
                seasonLength: save.game.seasonLength,
                isSeasonComplete: save.game.isSeasonComplete,
                seasonSummaries: save.game.seasonSummaries,

                activeSaveId: save.meta.id,
                activeSaveName: save.meta.saveName,
                hasLoadedCareer: true,
                lastSavedAt: save.meta.updatedAt,
                pendingPrizeMoney: 0,
                offseasonReady: false,
            });
        },

        saveCurrentCareer: () => {
            const state = get();
            const save = persistState(state);
            if (!save) return;

            set({
                lastSavedAt: save.meta.updatedAt,
            });
        },

        exportCurrentCareer: () => {
            const state = get();
            const save = buildSaveFile(state);
            if (!save) return;

            const filename = `${save.meta.saveName.replace(/\s+/g, '-').toLowerCase()}.json`;
            downloadJson(filename, save);
        },

        exitToStartScreen: () => {
            useCareerSetupStore.getState().reset();
            set({
                activeSaveId: null,
                activeSaveName: null,
                hasLoadedCareer: false,
            });
        },

        runNextRace: () =>
            set((state) => {
                if (state.isSeasonComplete) return state;

                const race = state.calendar[state.currentRound];
                if (!race) return state;

                const playerPitCrewChief = getPlayerPitCrewChief(state);

                const results = simulateRace(
                    state.currentRound,
                    state.drivers,
                    state.teams,
                    state.teamRosters,
                    state.calendar,
                    state.playerTeamId,
                    playerPitCrewChief
                );

                const pointsByTeamId = new Map<string, number>();

                for (const result of results) {
                    const teamId = getDriverTeamId(state.teamRosters, result.driverId);
                    if (!teamId) continue;

                    pointsByTeamId.set(teamId, (pointsByTeamId.get(teamId) ?? 0) + result.points);
                }

                const updatedTeams = state.teams.map((team) => {
                    const earnedPoints = pointsByTeamId.get(team.id) ?? 0;

                    if (team.id === state.playerTeamId) {
                        return {
                            ...team,
                            points: team.points + earnedPoints,
                        };
                    }

                    return {
                        ...team,
                        points: team.points + earnedPoints,
                    };
                });

                const nextCurrentRound = state.currentRound + 1;
                const nextHistory = [
                    ...state.history,
                    {
                        seasonNumber: state.seasonNumber,
                        roundNumber: state.currentRound + 1,
                        raceName: race.name,
                        results: results.map((r) => {
                            const teamId = getDriverTeamId(state.teamRosters, r.driverId);
                            const team = state.teams.find((item) => item.id === teamId);

                            return {
                                driverId: r.driverId,
                                driverName: r.driverName,
                                teamId: teamId ?? null,
                                teamName: team?.name ?? null,
                                teamCountry: team?.country ?? null,
                                position: r.position,
                                points: r.points,
                                dnf: r.dnf,
                            };
                        }),
                    }
                ];

                const seasonComplete = nextCurrentRound >= state.calendar.length;

                let nextSeasonSummaries = state.seasonSummaries;

                const nextStateBase: GameState = {
                    ...state,
                    teams: updatedTeams,
                    currentRound: nextCurrentRound,
                    history: nextHistory,
                    isSeasonComplete: seasonComplete,
                };

                if (seasonComplete) {
                    const seasonHistory = nextHistory.filter(
                        (entry) => entry.seasonNumber === state.seasonNumber
                    );
                    const progressionPreview = progressDriversForSeason(state.drivers, seasonHistory);
                    const offseasonPreview = previewOffseasonDriverChanges(
                        progressionPreview.drivers,
                        state.teamRosters,
                        seasonHistory
                    );
                    const summary = buildSeasonSummary(nextStateBase);

                    nextSeasonSummaries = [
                        ...state.seasonSummaries,
                        {
                            ...summary,
                            driverProgressions: progressionPreview.progressions,
                            retirements: offseasonPreview.retirements,
                            newDrivers: offseasonPreview.newDrivers,
                        },
                    ];
                }

                let seasonPrizeMoney = state.pendingPrizeMoney;
                let teamsAfterPrize = updatedTeams;

                if (seasonComplete) {
                    const latestSummary = nextSeasonSummaries[nextSeasonSummaries.length - 1];
                    const playerEngineer =
                        state.engineers.find((item) => item.id === state.playerEngineerId) ?? null;
                    const playerChief =
                        state.pitCrewChiefs.find((item) => item.id === state.playerPitCrewChiefId) ?? null;

                    const prizeMoney = getPrizeMoneyForPosition(latestSummary?.playerTeamPosition ?? null);
                    const staffCost = (playerEngineer?.salary ?? 0) + (playerChief?.salary ?? 0);
                    const netPrize = Math.max(0, prizeMoney - staffCost);

                    seasonPrizeMoney = netPrize;
                    teamsAfterPrize = updatedTeams.map((team) =>
                        team.id === state.playerTeamId
                            ? { ...team, budget: clampTeamBudget(team.budget + netPrize) }
                            : team
                    );
                }

                const nextState: GameState = {
                    ...nextStateBase,
                    teams: teamsAfterPrize,
                    seasonSummaries: nextSeasonSummaries,
                    pendingPrizeMoney: seasonPrizeMoney,

                    createNewCareerFromSetup: state.createNewCareerFromSetup,
                    loadCareer: state.loadCareer,
                    saveCurrentCareer: state.saveCurrentCareer,
                    exportCurrentCareer: state.exportCurrentCareer,
                    exitToStartScreen: state.exitToStartScreen,
                    runNextRace: state.runNextRace,
                    upgradeCar: state.upgradeCar,
                    startNextSeason: state.startNextSeason,
                };

                const save = persistState(nextState);
                if (save) {
                    nextState.lastSavedAt = save.meta.updatedAt;
                }

                return nextState;
            }),

        upgradeCar: (part) =>
            set((state) => {
                const playerTeam = getPlayerTeam(state);
                const engineer = getPlayerEngineer(state);
                const cost = 2000000;

                if (!playerTeam || playerTeam.budget < cost) return state;

                const roll = Math.random();
                let gain = 2;
                const developmentSkill = engineer?.developmentSkill ?? 70;

                if (developmentSkill >= 90) gain = roll > 0.5 ? 5 : 4;
                else if (developmentSkill >= 84) gain = roll > 0.55 ? 4 : 3;
                else if (developmentSkill >= 76) gain = roll > 0.7 ? 3 : 2;
                else gain = roll > 0.8 ? 2 : 1;

                const updatedTeams = state.teams.map((team) =>
                    team.id === state.playerTeamId
                        ? {
                            ...team,
                            budget: team.budget - cost,
                            [part]: Math.min(99, team[part] + gain),
                        }
                        : team
                );

                const nextState: GameState = {
                    ...state,
                    teams: updatedTeams,

                    createNewCareerFromSetup: state.createNewCareerFromSetup,
                    loadCareer: state.loadCareer,
                    saveCurrentCareer: state.saveCurrentCareer,
                    exportCurrentCareer: state.exportCurrentCareer,
                    exitToStartScreen: state.exitToStartScreen,
                    runNextRace: state.runNextRace,
                    upgradeCar: state.upgradeCar,
                    startNextSeason: state.startNextSeason,
                };

                const save = persistState(nextState);
                if (save) {
                    nextState.lastSavedAt = save.meta.updatedAt;
                }

                return nextState;
            }),

        startNextSeason: () =>
            set((state) => {
                if (!state.isSeasonComplete) return state;

                const latestSummary = state.seasonSummaries[state.seasonSummaries.length - 1];

                const seasonHistory = state.history.filter(
                    (entry) => entry.seasonNumber === state.seasonNumber
                );

                const progressionResult = progressDriversForSeason(state.drivers, seasonHistory);

                const progressedEngineers = state.engineers.map((engineer) => ({
                    ...engineer,
                    age: engineer.age + 1,
                }));

                const progressedPitCrewChiefs = state.pitCrewChiefs.map((chief) => ({
                    ...chief,
                    age: chief.age + 1,
                }));

                const offseasonApplied = applyOffseasonDriverChanges(
                    progressionResult.drivers,
                    state.teamRosters,
                    latestSummary?.retirements ?? [],
                    latestSummary?.newDrivers ?? [],
                    state.seasonNumber
                );

                const baseTeamsById = new Map(defaultTeams.map((team) => [team.id, team]));

                const resetTeams = state.teams.map((team) => {
                    const base = baseTeamsById.get(team.id);

                    if (team.id === state.playerTeamId) {
                        return {
                            ...team,
                            aero: base?.aero ?? team.aero,
                            power: base?.power ?? team.power,
                            reliability: base?.reliability ?? team.reliability,
                            points: 0,
                            budget: clampTeamBudget(team.budget),
                        };
                    }

                    return {
                        ...team,
                        aero: base?.aero ?? team.aero,
                        power: base?.power ?? team.power,
                        reliability: base?.reliability ?? team.reliability,
                        points: 0,
                        budget: clampTeamBudget(team.budget),
                    };
                });

                const updatedSummaries = [...state.seasonSummaries];
                if (latestSummary) {
                    updatedSummaries[updatedSummaries.length - 1] = {
                        ...latestSummary,
                        driverProgressions: progressionResult.progressions,
                    };
                }

                const nextSeasonNumber = state.seasonNumber + 1;
                const newCalendar = generateSeasonCalendar(
                    state.providerCalendar,
                    nextSeasonNumber,
                    state.seasonLength
                );

                const nextState: GameState = {
                    ...state,
                    drivers: offseasonApplied.drivers,
                    engineers: progressedEngineers,
                    pitCrewChiefs: progressedPitCrewChiefs,
                    teams: resetTeams,
                    teamRosters: offseasonApplied.teamRosters,
                    calendar: newCalendar,
                    currentRound: 0,
                    history: state.history,
                    seasonNumber: nextSeasonNumber,
                    isSeasonComplete: false,
                    seasonSummaries: updatedSummaries,
                    pendingPrizeMoney: 0,
                    offseasonReady: false,

                    createNewCareerFromSetup: state.createNewCareerFromSetup,
                    loadCareer: state.loadCareer,
                    saveCurrentCareer: state.saveCurrentCareer,
                    exportCurrentCareer: state.exportCurrentCareer,
                    exitToStartScreen: state.exitToStartScreen,
                    runNextRace: state.runNextRace,
                    upgradeCar: state.upgradeCar,
                    startNextSeason: state.startNextSeason,
                };

                const save = persistState(nextState);
                if (save) {
                    nextState.lastSavedAt = save.meta.updatedAt;
                }

                return nextState;
            }),
    };
});
