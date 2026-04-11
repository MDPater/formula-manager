import type { Race } from '../features/season/types';

function shuffle<T>(items: T[]) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function generateSeasonCalendar(
    providerCalendar: Race[],
    seasonNumber: number,
    desiredLength: number
): Race[] {
    const count = Math.max(1, Math.min(desiredLength, providerCalendar.length));
    const iconic = providerCalendar.filter((race) => race.isIconic);
    const guaranteed = iconic.slice(0, Math.min(iconic.length, count));
    const guaranteedIds = new Set(guaranteed.map((race) => race.id));
    const remaining = providerCalendar.filter((race) => !guaranteedIds.has(race.id));
    const selected = [...guaranteed, ...shuffle(remaining)].slice(0, count);

    return selected.map((race, index) => ({
        ...race,
        id: `${race.id}-s${seasonNumber}-r${index + 1}`,
    }));
}