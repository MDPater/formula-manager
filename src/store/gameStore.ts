import { create } from 'zustand';
import { calendar as providerCalendarSeed } from '../data/calendar';
import { drivers as defaultDrivers } from '../data/drivers';
import { engineers as defaultEngineers } from '../data/engineers';
import { pitCrewChiefs as defaultPitCrewChiefs } from '../data/pitCrewChief';
import { teams as defaultTeams } from '../data/teams';
import { progressDriversForSeason } from '../lib/driverProgression';
import { downloadJson, readBrowserSave, writeBrowserSave } from '../lib/persistence';
import {
    buildFreshRostersFromSetup,
    createDefaultTeamRosters,
    getActiveDrivers,
    getDriverTeamId,
    getFreeAgents,
    getTeamDriverIds,
} from '../lib/roster';
import { generateSeasonCalendar } from '../lib/seasonGenerator';
import { simulateRace } from '../features/race/simulation';
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

    runNextRace: () => void;
    upgradeCar: (part: 'aero' | 'power' | 'reliability') => void;
    startNextSeason: () => void;
};

function cloneInitialWorld() {
    const teams = structuredClone(defaultTeams);
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
    const sortedTeams = [...state.teams].sort((a, b) => b.points - a.points);
    const championTeamId = sortedTeams[0]?.id ?? null;
    const playerTeamPosition =
        sortedTeams.findIndex((team) => team.id === state.playerTeamId) + 1 || null;

    const activeDrivers = getActiveDrivers(state.drivers, state.teamRosters);

    const driverStats = activeDrivers.map((driver) => {
        const results = state.history
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

    const driverProgressions = state.drivers.map((driver) => ({
        driverId: driver.id,
        oldOverall: driver.overall,
        newOverall: driver.overall,
        deltaOverall: 0,
        oldAge: driver.age,
        newAge: driver.age,
    }));

    return {
        seasonNumber: state.seasonNumber,
        championDriverId,
        championTeamId,
        playerTeamPosition,
        playerDriverResults,
        driverProgressions,
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
        calendar: generateSeasonCalendar(initial.providerCalendar, 1, 15),

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
                    ? { ...team, budget: remainingBudget, points: 0 }
                    : { ...team, points: 0 }
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

        loadCareer: (saveId) => {
            const save = readBrowserSave(saveId);
            if (!save) return;

            set({
                teams: save.world.teams,
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
                            budget: team.budget + 1500000 + earnedPoints * 50000,
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
                        results: results.map((r) => ({
                            driverId: r.driverId,
                            driverName: r.driverName,
                            position: r.position,
                            points: r.points,
                            dnf: r.dnf,
                        })),
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
                    const summary = buildSeasonSummary(nextStateBase);
                    nextSeasonSummaries = [...state.seasonSummaries, summary];
                }

                const nextState: GameState = {
                    ...nextStateBase,
                    seasonSummaries: nextSeasonSummaries,

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

                const { drivers: progressedDrivers, progressions } = progressDriversForSeason(
                    state.drivers,
                    state.history
                );

                const progressedEngineers = state.engineers.map((engineer) => ({
                    ...engineer,
                    age: engineer.age + 1,
                }));

                const progressedPitCrewChiefs = state.pitCrewChiefs.map((chief) => ({
                    ...chief,
                    age: chief.age + 1,
                }));

                const baseTeamsById = new Map(defaultTeams.map((team) => [team.id, team]));

                const resetTeams = state.teams.map((team) => {
                    const base = baseTeamsById.get(team.id);

                    return {
                        ...team,
                        aero: base?.aero ?? team.aero,
                        power: base?.power ?? team.power,
                        reliability: base?.reliability ?? team.reliability,
                        points: 0,
                    };
                });

                const updatedSummaries = [...state.seasonSummaries];
                const latestSummary = updatedSummaries[updatedSummaries.length - 1];

                if (latestSummary) {
                    updatedSummaries[updatedSummaries.length - 1] = {
                        ...latestSummary,
                        driverProgressions: progressions,
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
                    drivers: progressedDrivers,
                    engineers: progressedEngineers,
                    pitCrewChiefs: progressedPitCrewChiefs,
                    teams: resetTeams,
                    calendar: newCalendar,
                    currentRound: 0,
                    history: state.history,
                    seasonNumber: nextSeasonNumber,
                    isSeasonComplete: false,
                    seasonSummaries: updatedSummaries,

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