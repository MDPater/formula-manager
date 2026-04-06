import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { calendar } from '../../data/calendar';
import { useGameStore } from '../../store/gameStore';

export function RaceWeekendPage() {
    const currentRound = useGameStore((state) => state.currentRound);
    const runNextRace = useGameStore((state) => state.runNextRace);
    const history = useGameStore((state) => state.history);
    const nextRace = calendar[currentRound];
    const latest = history[history.length - 1];

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Weekend"
                title={nextRace ? nextRace.name : 'Season Complete'}
                description={nextRace ? `Track bias: ${nextRace.trackBias} · Weather: ${nextRace.weather}` : 'All races have been completed.'}
            />

            {nextRace && (
                <Card title="Simulation Control">
                    <button
                        className="rounded-2xl border border-red-500/30 bg-red-500 px-5 py-3 font-semibold text-white transition hover:opacity-90"
                        onClick={runNextRace}
                    >
                        Simulate Next Race
                    </button>
                </Card>
            )}

            {latest && (
                <Card title={`Results · ${latest.raceName}`}>
                    <div className="space-y-2">
                        {latest.results.map((result) => (
                            <div key={result.driverId} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                                <span className="text-sm text-zinc-300 md:text-base">{result.driverName}</span>
                                <span className="text-sm font-medium text-white md:text-base">
                                    {result.dnf ? 'DNF' : `P${result.position} · ${result.points} pts`}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}