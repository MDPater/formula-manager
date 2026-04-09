import { create } from 'zustand';

type CareerSetupState = {
    saveName: string;
    teamId: string;
    driverIds: string[];
    engineerId: string;
    pitCrewChiefId: string;
    seasonLength: number;

    setSaveName: (value: string) => void;
    setTeamId: (value: string) => void;
    setDriverIds: (value: string[]) => void;
    setEngineerId: (value: string) => void;
    setPitCrewChiefId: (value: string) => void;
    setSeasonLength: (value: number) => void;
    reset: () => void;
};

export const useCareerSetupStore = create<CareerSetupState>((set) => ({
    saveName: 'My Career',
    teamId: '',
    driverIds: [],
    engineerId: '',
    pitCrewChiefId: '',
    seasonLength: 15,

    setSaveName: (value) => set({ saveName: value }),
    setTeamId: (value) => set({ teamId: value }),
    setDriverIds: (value) => set({ driverIds: value }),
    setEngineerId: (value) => set({ engineerId: value }),
    setPitCrewChiefId: (value) => set({ pitCrewChiefId: value }),
    setSeasonLength: (value) => set({ seasonLength: value }),

    reset: () =>
        set({
            saveName: 'My Career',
            teamId: '',
            driverIds: [],
            engineerId: '',
            pitCrewChiefId: '',
            seasonLength: 15,
        }),
}));