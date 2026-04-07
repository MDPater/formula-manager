export type Driver = {
    id: string;
    name: string;
    age: number;
    country: string;
    teamId: string;
    overall: number;
    qualifying: number;
    racecraft: number;
    consistency: number;
    wetSkill: number;
    marketValue: number;
};

export type Team = {
    id: string;
    name: string;
    country: string;
    budget: number;
    aero: number;
    power: number;
    reliability: number;
    drivers: string[];
    points: number;
};

export type Race = {
    id: string;
    name: string;
    country: string;
    flag: string;
    trackBias: 'power' | 'aero' | 'balanced';
    chaos: number;
    weather: 'dry' | 'mixed' | 'wet';
};

export type ResultRow = {
    driverId: string;
    driverName: string;
    score: number;
    position: number;
    dnf: boolean;
    points: number;
};

export type RaceHistoryEntry = {
    raceName: string;
    results: Array<{
        driverId: string;
        driverName: string;
        position: number;
        points: number;
        dnf: boolean;
    }>;
};

export type SaveMeta = {
    id: string;
    saveName: string;
    createdAt: string;
    updatedAt: string;
    currentRound: number;
    teamName: string;
    teamPoints: number;
    budget: number;
};

export type SaveFile = {
    version: 1;
    meta: SaveMeta;
    world: {
        teams: Team[];
        drivers: Driver[];
        calendar: Race[];
    };
    game: {
        currentRound: number;
        playerTeamId: string;
        history: RaceHistoryEntry[];
    };
};

export type CustomDatabaseFile = {
    version: 1;
    type: 'database';
    meta?: {
        name?: string;
        description?: string;
    };
    playerTeamId?: string;
    world: {
        teams: Team[];
        drivers: Driver[];
        calendar?: Race[];
    };
};