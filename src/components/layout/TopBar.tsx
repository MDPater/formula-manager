import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export function TopBar() {
    const currentRound = useGameStore((state) => state.currentRound);
    const calendar = useGameStore((state) => state.calendar);
    const teams = useGameStore((state) => state.teams);
    const playerTeamId = useGameStore((state) => state.playerTeamId);

    const activeSaveName = useGameStore((state) => state.activeSaveName);
    const lastSavedAt = useGameStore((state) => state.lastSavedAt);
    const saveCurrentCareer = useGameStore((state) => state.saveCurrentCareer);
    const exportCurrentCareer = useGameStore((state) => state.exportCurrentCareer);
    const exitToStartScreen = useGameStore((state) => state.exitToStartScreen);

    const nextRace = calendar[currentRound];
    const playerTeam = teams.find((team) => team.id === playerTeamId) ?? teams[0];

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 30);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'
                }`}
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 md:flex-row md:items-center md:justify-between md:px-6">
                <div className={`${scrolled ? 'hidden md:block' : 'block'}`}>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                        Control Wall
                    </div>
                    <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white md:text-2xl">
                        <span>{nextRace?.flag ?? '🏁'}</span>
                        <span>{nextRace ? nextRace.name : 'Season Complete'}</span>
                    </h1>
                    {activeSaveName ? (
                        <div className="mt-1 text-xs text-zinc-400">{activeSaveName}</div>
                    ) : null}
                </div>

                <div className="grid grid-cols-3 gap-2 md:flex md:items-center">
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">RND</div>
                        <div className="text-sm font-semibold text-white">
                            {Math.min(currentRound + 1, calendar.length)}
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">$</div>
                        <div className="text-sm font-semibold text-white">
                            {Math.round(playerTeam.budget / 1000000)}M
                        </div>
                    </div>

                    <button
                        className="rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-2 text-xs font-medium text-white"
                        onClick={saveCurrentCareer}
                    >
                        Save
                    </button>

                    {!scrolled && (
                        <>
                            <button
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300"
                                onClick={exportCurrentCareer}
                            >
                                Export
                            </button>

                            <button
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300"
                                onClick={exitToStartScreen}
                            >
                                Back
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}