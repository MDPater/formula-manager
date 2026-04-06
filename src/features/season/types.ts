export type Driver = {
    id: string;
    name: string;
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