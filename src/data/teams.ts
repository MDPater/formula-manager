import type { Team } from '../features/season/types';

export const teams: Team[] = [
    {
        id: 'player',
        name: 'Apex Velocity',
        budget: 30000000,
        aero: 78,
        power: 76,
        reliability: 74,
        drivers: ['d1', 'd2'],
        points: 0,
    },
    {
        id: 'rival-1',
        name: 'Solaris GP',
        budget: 28000000,
        aero: 82,
        power: 84,
        reliability: 80,
        drivers: ['d3', 'd4'],
        points: 0,
    },
    {
        id: 'rival-2',
        name: 'Titan Works',
        budget: 25000000,
        aero: 77,
        power: 79,
        reliability: 82,
        drivers: ['d5', 'd6'],
        points: 0,
    },
];