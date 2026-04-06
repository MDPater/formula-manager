import type { Race } from '../features/season/types';

export const calendar: Race[] = [
    { id: 'r1', name: 'Sahara Grand Prix', trackBias: 'power', chaos: 0.2, weather: 'dry' },
    { id: 'r2', name: 'Harbor Street Grand Prix', trackBias: 'aero', chaos: 0.35, weather: 'mixed' },
    { id: 'r3', name: 'Alpine Grand Prix', trackBias: 'balanced', chaos: 0.25, weather: 'wet' },
    { id: 'r4', name: 'Midnight Marina Grand Prix', trackBias: 'power', chaos: 0.28, weather: 'dry' },
];