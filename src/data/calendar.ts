import type { Race } from '../features/season/types';

export const calendar: Race[] = [
    {
        id: 'r1',
        name: 'Sahara Grand Prix',
        country: 'Bahrain',
        flag: '🇧🇭',
        trackBias: 'power',
        chaos: 0.2,
        weather: 'dry',
    },
    {
        id: 'r2',
        name: 'Harbor Street Grand Prix',
        country: 'Monaco',
        flag: '🇲🇨',
        trackBias: 'aero',
        chaos: 0.35,
        weather: 'mixed',
    },
    {
        id: 'r3',
        name: 'Alpine Grand Prix',
        country: 'Switzerland',
        flag: '🇨🇭',
        trackBias: 'balanced',
        chaos: 0.25,
        weather: 'wet',
    },
    {
        id: 'r4',
        name: 'Midnight Marina Grand Prix',
        country: 'Singapore',
        flag: '🇸🇬',
        trackBias: 'power',
        chaos: 0.28,
        weather: 'dry',
    },
];