import { calendar } from '../../data/calendar';
import { useGameStore } from '../../store/gameStore';

export function TopBar() {
    const currentRound = useGameStore((state) => state.currentRound);
    const team = useGameStore((state) => state.team);
    const nextRace = calendar[currentRound];

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
                <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Control Wall</div>
                    <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                        {nextRace ? nextRace.name : 'Season Complete'}
                    </h1>
                </div>

                <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Round</div>
                        <div className="mt-1 text-base font-semibold text-white">{Math.min(currentRound + 1, calendar.length)}/{calendar.length}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Budget</div>
                        <div className="mt-1 text-base font-semibold text-white">${team.budget.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </header>
    );
}