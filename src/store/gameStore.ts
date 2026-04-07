import { create } from 'zustand';
import { calendar as defaultCalendar } from '../data/calendar';
import { drivers as defaultDrivers } from '../data/drivers';
import { teams as defaultTeams } from '../data/teams';
import { simulateRace } from '../features/race/simulation';
import type {
    CustomDatabaseFile,
    Driver,
    Race,
    RaceHistoryEntry,
    SaveFile,
    Team,
} from '../features/season/types';
import {
    downloadJson,
    readBrowserSave,
    writeBrowserSave,
} from '../lib/persistence';

type GameState = {
    teams: Team[];
    drivers: Driver[];
    calendar: Race[];
    playerTeamId: string;

    currentRound: number;
    history: RaceHistoryEntry[];

    activeSaveId: string | null;
    activeSaveName: string | null;
    hasLoadedCareer: boolean;
    lastSavedAt: string | null;

    createNewCareer: (
        saveId: string,
        saveName: string,
        customDb?: CustomDatabaseFile
    ) => void;
    loadCareer: (saveId: string) => void;
    saveCurrentCareer: () => void;
    exportCurrentCareer: () => void;
    exitToStartScreen: () => void;

    runNextRace: () => void;
    upgradeCar: (part: 'aero' | 'power' | 'reliability') => void;
};

function cloneWorld(world?: {
    teams: Team[];
    drivers: Driver[];
    calendar: Race[];
}) {
    return {
        teams: structuredClone(world?.teams ?? defaultTeams),
        drivers: structuredClone(world?.drivers ?? defaultDrivers),
        calendar: structuredClone(world?.calendar ?? defaultCalendar),
    };
}

function getPlayerTeam(state: Pick<GameState, 'teams' | 'playerTeamId'>) {
    return state.teams.find((team) => team.id === state.playerTeamId) ?? state.teams[0];
}

function buildSaveFile(
    state: Pick<
        GameState,
        | 'teams'
        | 'drivers'
        | 'calendar'
        | 'playerTeamId'
        | 'currentRound'
        | 'history'
        | 'activeSaveId'
        | 'activeSaveName'
    >
): SaveFile | null {
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
            calendar: state.calendar,
        },
        game: {
            currentRound: state.currentRound,
            playerTeamId: state.playerTeamId,
            history: state.history,
        },
    };
}

function createInitialSave(
    saveId: string,
    saveName: string,
    customDb?: CustomDatabaseFile
): SaveFile {
    const now = new Date().toISOString();

    const world = customDb
        ? {
            teams: structuredClone(customDb.world.teams),
            drivers: structuredClone(customDb.world.drivers),
            calendar:
                customDb.world.calendar && customDb.world.calendar.length > 0
                    ? structuredClone(customDb.world.calendar)
                    : structuredClone(defaultCalendar),
        }
        : cloneWorld();

    const playerTeamId = customDb?.playerTeamId ?? world.teams[0].id;
    const playerTeam =
        world.teams.find((team) => team.id === playerTeamId) ?? world.teams[0];

    return {
        version: 1,
        meta: {
            id: saveId,
            saveName,
            createdAt: now,
            updatedAt: now,
            currentRound: 0,
            teamName: playerTeam.name,
            teamPoints: playerTeam.points,
            budget: playerTeam.budget,
        },
        world,
        game: {
            currentRound: 0,
            playerTeamId,
            history: [],
        },
    };
}

function persistFromState(state: GameState) {
    const save = buildSaveFile(state);
    if (!save) return null;

    const existing = readBrowserSave(save.meta.id);
    if (existing) {
        save.meta.createdAt = existing.meta.createdAt;
    }

    writeBrowserSave(save);
    return save;
}

export const useGameStore = create<GameState>((set, get) => ({
    ...cloneWorld(),
    playerTeamId: defaultTeams[0].id,

    currentRound: 0,
    history: [],

    activeSaveId: null,
    activeSaveName: null,
    hasLoadedCareer: false,
    lastSavedAt: null,

    createNewCareer: (saveId, saveName, customDb) => {
        const save = createInitialSave(saveId, saveName, customDb);
        writeBrowserSave(save);

        set({
            teams: save.world.teams,
            drivers: save.world.drivers,
            calendar: save.world.calendar,
            playerTeamId: save.game.playerTeamId,
            currentRound: save.game.currentRound,
            history: save.game.history,
            activeSaveId: save.meta.id,
            activeSaveName: save.meta.saveName,
            hasLoadedCareer: true,
            lastSavedAt: save.meta.updatedAt,
        });
    },

    loadCareer: (saveId) => {
        const save = readBrowserSave(saveId);
        if (!save) return;

        set({
            teams: save.world.teams,
            drivers: save.world.drivers,
            calendar: save.world.calendar,
            playerTeamId: save.game.playerTeamId,
            currentRound: save.game.currentRound,
            history: save.game.history,
            activeSaveId: save.meta.id,
            activeSaveName: save.meta.saveName,
            hasLoadedCareer: true,
            lastSavedAt: save.meta.updatedAt,
        });
    },

    saveCurrentCareer: () => {
        const state = get();
        const save = persistFromState(state);
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
            const race = state.calendar[state.currentRound];
            if (!race) return state;

            const results = simulateRace(
                state.currentRound,
                state.drivers,
                state.teams,
                state.calendar
            );

            const pointsByTeamId = new Map<string, number>();

            for (const result of results) {
                const driver = state.drivers.find((item) => item.id === result.driverId);
                if (!driver) continue;

                pointsByTeamId.set(
                    driver.teamId,
                    (pointsByTeamId.get(driver.teamId) ?? 0) + result.points
                );
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

            const nextState: GameState = {
                ...state,
                teams: updatedTeams,
                currentRound: state.currentRound + 1,
                history: [
                    ...state.history,
                    {
                        raceName: race.name,
                        results: results.map((r) => ({
                            driverId: r.driverId,
                            driverName: r.driverName,
                            position: r.position,
                            points: r.points,
                            dnf: r.dnf,
                        })),
                    },
                ],
            };

            const save = persistFromState(nextState);
            if (save) {
                nextState.lastSavedAt = save.meta.updatedAt;
            }

            return nextState;
        }),

    upgradeCar: (part) =>
        set((state) => {
            const playerTeam = getPlayerTeam(state);
            const cost = 2000000;

            if (!playerTeam || playerTeam.budget < cost) return state;

            const updatedTeams = state.teams.map((team) =>
                team.id === state.playerTeamId
                    ? {
                        ...team,
                        budget: team.budget - cost,
                        [part]: Math.min(99, team[part] + 3),
                    }
                    : team
            );

            const nextState: GameState = {
                ...state,
                teams: updatedTeams,
            };

            const save = persistFromState(nextState);
            if (save) {
                nextState.lastSavedAt = save.meta.updatedAt;
            }

            return nextState;
        }),
}));