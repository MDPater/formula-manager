import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useGameStore } from '../../store/gameStore';

function getPodiumMedal(position: number) {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
}

export function RaceWeekendPage() {
    const currentRound = useGameStore((state) => state.currentRound);
    const runNextRace = useGameStore((state) => state.runNextRace);
    const history = useGameStore((state) => state.history);
    const calendar = useGameStore((state) => state.calendar);

    const nextRace = calendar[currentRound];
    const latest = history[history.length - 1];
    const latestRaceData = latest
        ? calendar.find((race) => race.name === latest.raceName)
        : null;

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Weekend"
                title={nextRace ? `${nextRace.flag} ${nextRace.name}` : 'Season Complete'}
                description={
                    nextRace
                        ? `Track bias: ${nextRace.trackBias} · Weather: ${nextRace.weather}`
                        : 'All races have been completed.'
                }
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
                <Card
                    title={`Results · ${latestRaceData ? `${latestRaceData.flag} ${latest.raceName}` : latest.raceName
                        }`}
                >
                    <div className="space-y-2">
                        {latest.results.map((result) => {
                            const medal = !result.dnf ? getPodiumMedal(result.position) : null;

                            return (
                                <div
                                    key={result.driverId}
                                    className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        {medal ? <span className="text-lg">{medal}</span> : null}
                                        <span className="text-sm text-zinc-300 md:text-base">
                                            {result.driverName}
                                        </span>
                                    </div>

                                    <span className="text-sm font-medium text-white md:text-base">
                                        {result.dnf ? 'DNF' : `P${result.position} · ${result.points} pts`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
}