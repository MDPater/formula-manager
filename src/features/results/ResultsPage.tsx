import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useGameStore } from '../../store/gameStore';

function getPodiumMedal(position: number) {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
}

function getPodiumRowClass(position: number, dnf: boolean) {
    if (dnf) return 'bg-white/5';
    if (position === 1) return 'bg-yellow-500/10';
    if (position === 2) return 'bg-zinc-300/10';
    if (position === 3) return 'bg-amber-700/10';
    return 'bg-white/5';
}

export function ResultsPage() {
    const history = useGameStore((state) => state.history);
    const calendar = useGameStore((state) => state.calendar);
    const [openRaceKey, setOpenRaceKey] = useState<string | null>(null);

    const races = useMemo(() => [...history].reverse(), [history]);

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Archive"
                title="Race Results"
                description="Browse all completed race weekends. Open a race card to inspect the full result table."
            />

            {history.length === 0 ? (
                <Card title="No Results Yet">
                    <div className="text-sm text-zinc-400">
                        Simulate a race weekend to start building your results archive.
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {races.map((race, reverseIndex) => {
                        const roundNumber = history.length - reverseIndex;
                        const raceKey = `${race.raceName}-${roundNumber}`;
                        const isOpen = openRaceKey === raceKey;

                        const sortedResults = [...race.results].sort((a, b) => {
                            if (a.dnf && !b.dnf) return 1;
                            if (!a.dnf && b.dnf) return -1;
                            return a.position - b.position;
                        });

                        const podium = sortedResults.filter((result) => !result.dnf).slice(0, 3);
                        const winner = podium[0];
                        const dnfs = sortedResults.filter((result) => result.dnf).length;
                        const raceData = calendar.find((entry) => entry.name === race.raceName);
                        const flag = raceData?.flag ?? '🏁';

                        return (
                            <div
                                key={raceKey}
                                className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
                            >
                                <button
                                    className="w-full text-left"
                                    onClick={() => setOpenRaceKey(isOpen ? null : raceKey)}
                                >
                                    <div className="p-4 md:p-6">
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                            <div className="min-w-0">
                                                <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                                                    Round {roundNumber}
                                                </div>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <span className="text-2xl">{flag}</span>
                                                    <h2 className="truncate text-xl font-bold tracking-tight text-white md:text-2xl">
                                                        {race.raceName}
                                                    </h2>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                                                        Winner: {winner ? winner.driverName : '—'}
                                                    </div>
                                                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                                                        Finishers: {sortedResults.length - dnfs}
                                                    </div>
                                                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                                                        DNFs: {dnfs}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 xl:items-end">
                                                <div className="flex flex-wrap gap-2">
                                                    {podium.map((result) => (
                                                        <div
                                                            key={result.driverId}
                                                            className={`
                                flex items-center gap-2 rounded-2xl px-3 py-2 text-sm
                                ${getPodiumRowClass(result.position, result.dnf)}
                              `}
                                                        >
                                                            <span>{getPodiumMedal(result.position)}</span>
                                                            <span className="font-medium text-white">{result.driverName}</span>
                                                            <span className="text-zinc-400">P{result.position}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="text-sm text-zinc-400">
                                                    {isOpen ? 'Hide full classification' : 'Show full classification'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {isOpen ? (
                                    <div className="border-t border-white/10 px-4 py-4 md:px-6 md:py-5">
                                        <div className="mb-3 grid grid-cols-[72px_1fr_90px] px-2 text-xs uppercase tracking-[0.25em] text-zinc-500">
                                            <span>Pos</span>
                                            <span>Driver</span>
                                            <span className="text-right">Pts</span>
                                        </div>

                                        <div className="space-y-2">
                                            {sortedResults.map((result) => {
                                                const medal = !result.dnf ? getPodiumMedal(result.position) : null;

                                                return (
                                                    <div
                                                        key={result.driverId}
                                                        className={`grid grid-cols-[72px_1fr_90px] items-center rounded-2xl px-4 py-3 ${getPodiumRowClass(
                                                            result.position,
                                                            result.dnf
                                                        )}`}
                                                    >
                                                        <div className="flex items-center gap-2 text-white">
                                                            {medal ? <span>{medal}</span> : null}
                                                            <span>{result.dnf ? 'DNF' : `P${result.position}`}</span>
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium text-white md:text-base">
                                                                {result.driverName}
                                                            </div>
                                                            <div className="text-xs text-zinc-400">
                                                                {result.dnf ? 'Did not finish' : 'Classified'}
                                                            </div>
                                                        </div>

                                                        <div className="text-right text-sm font-semibold text-white md:text-base">
                                                            {result.points}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}