export type Driver = {
    id: string;
    name: string;
    age: number;
    country: string;
    overall: number;
    qualifying: number;
    racecraft: number;
    consistency: number;
    wetSkill: number;
    marketValue: number;
    retired?: boolean;
    retiredSeason?: number | null;
};

export type Team = {
    id: string;
    name: string;
    country: string;
    budget: number;
    aero: number;
    power: number;
    reliability: number;
    points: number;
};

export type TeamRoster = Record<string, string[]>;

export type Engineer = {
    id: string;
    name: string;
    age: number;
    country: string;
    salary: number;
    developmentSkill: number;
    consistency: number;
};

export type PitCrewChief = {
    id: string;
    name: string;
    age: number;
    country: string;
    salary: number;
    reliabilitySkill: number;
    consistencySkill: number;
};

export type UpdatePlanMode = 'safe' | 'medium' | 'aggressive';

export type Race = {
    id: string;
    name: string;
    country: string;
    flag: string;
    isIconic: boolean;
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
    seasonNumber: number;
    roundNumber: number;
    raceName: string;
    results: Array<{
        driverId: string;
        driverName: string;
        teamId: string | null;
        teamName: string | null;
        teamCountry: string | null;
        position: number;
        points: number;
        dnf: boolean;
    }>;
};

export type DriverProgressionSummary = {
    driverId: string;
    oldOverall: number;
    newOverall: number;
    deltaOverall: number;
    oldAge: number;
    newAge: number;
};

export type RetirementRecord = {
    driverId: string;
    name: string;
    country: string;
    age: number;
    overall: number;
    reason: string;
    teamId: string | null;
};

export type NewDriverRecord = {
    driverId: string;
    name: string;
    country: string;
    age: number;
    overall: number;
    archetype: 'wonderkid' | 'experienced' | 'veteran';
    teamId: string | null;
};

export type SaveMeta = {
    id: string;
    saveName: string;
    createdAt: string;
    updatedAt: string;
    seasonNumber: number;
    currentRound: number;
    teamName: string;
    teamPoints: number;
    budget: number;
};

export type SeasonSummary = {
    seasonNumber: number;
    championDriverId: string | null;
    championTeamId: string | null;
    playerTeamPosition: number | null;
    playerDriverResults: Array<{
        driverId: string;
        points: number;
        wins: number;
        podiums: number;
    }>;
    driverProgressions: DriverProgressionSummary[];
    retirements: RetirementRecord[];
    newDrivers: NewDriverRecord[];
};

export type SaveFile = {
    version: 1;
    meta: SaveMeta;
    world: {
        teams: Team[];
        drivers: Driver[];
        engineers: Engineer[];
        pitCrewChiefs: PitCrewChief[];
        providerCalendar: Race[];
        calendar: Race[];
    };
    game: {
        teamRosters: TeamRoster;
        currentRound: number;
        playerTeamId: string;
        playerEngineerId: string | null;
        playerPitCrewChiefId: string | null;
        updatePlan: UpdatePlanMode;
        updatesRemaining: number;
        updatesUsedThisSeason: number;
        seasonNumber: number;
        seasonLength: number;
        isSeasonComplete: boolean;
        history: RaceHistoryEntry[];
        seasonSummaries: SeasonSummary[];
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
