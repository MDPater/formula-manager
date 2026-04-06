import { create } from 'zustand';
import { calendar } from '../data/calendar';
import { teams } from '../data/teams';
import { simulateRace } from '../features/race/simulation';

type RaceHistoryEntry = {
    raceName: string;
    results: Array<{
        driverId: string;
        driverName: string;
        position: number;
        points: number;
        dnf: boolean;
    }>;
};

type GameState = {
    currentRound: number;
    team: (typeof teams)[number];
    history: RaceHistoryEntry[];
    runNextRace: () => void;
    upgradeCar: (part: 'aero' | 'power' | 'reliability') => void;
};

export const useGameStore = create<GameState>((set) => ({
    currentRound: 0,
    team: { ...teams[0] },
    history: [],
    runNextRace: () =>
        set((state) => {
            const race = calendar[state.currentRound];
            if (!race) return state;

            const results = simulateRace(state.currentRound);
            const playerPoints = results
                .filter((r) => state.team.drivers.includes(r.driverId))
                .reduce((sum, r) => sum + r.points, 0);

            return {
                currentRound: state.currentRound + 1,
                team: {
                    ...state.team,
                    points: state.team.points + playerPoints,
                    budget: state.team.budget + 1500000 + playerPoints * 50000,
                },
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
        }),
    upgradeCar: (part) =>
        set((state) => {
            const cost = 2000000;
            if (state.team.budget < cost) return state;

            return {
                team: {
                    ...state.team,
                    budget: state.team.budget - cost,
                    [part]: Math.min(99, state.team[part] + 3),
                },
            };
        }),
}));