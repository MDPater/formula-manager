import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatCard } from '../../components/ui/StatCard';
import { useGameStore } from '../../store/gameStore';

function getPodiumMedal(position: number) {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
}

export function DashboardPage() {
    const currentRound = useGameStore((state) => state.currentRound);
    const teams = useGameStore((state) => state.teams);
    const calendar = useGameStore((state) => state.calendar);
    const playerTeamId = useGameStore((state) => state.playerTeamId);
    const history = useGameStore((state) => state.history);

    const nextRace = calendar[currentRound];
    const latest = history[history.length - 1];
    const latestRaceData = latest
        ? calendar.find((race) => race.name === latest.raceName)
        : null;

    const playerTeam = teams.find((team) => team.id === playerTeamId) ?? teams[0];

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Race Control"
                title="Team Dashboard"
                description="A clean F1-inspired control wall for running your team through the season."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Team Points"
                    value={`${playerTeam.points}`}
                    hint="Constructor total so far"
                />
                <StatCard
                    label="Budget"
                    value={`$${playerTeam.budget.toLocaleString()}`}
                    hint="Available for upgrades and contracts"
                />
                <StatCard
                    label="Next Race"
                    value={nextRace ? `${nextRace.flag} ${nextRace.name}` : 'Complete'}
                    hint={nextRace ? `${nextRace.weather} conditions` : 'No races left'}
                />
                <StatCard
                    label="Car Rating"
                    value={`${Math.round(
                        (playerTeam.aero + playerTeam.power + playerTeam.reliability) / 3
                    )}`}
                    hint="Average of current car departments"
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Card title="Performance Overview">
                    <div className="space-y-4">
                        <div>
                            <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
                                <span>Aerodynamics</span>
                                <span>{playerTeam.aero}</span>
                            </div>
                            <div className="h-3 rounded-full bg-white/10">
                                <div
                                    className="h-3 rounded-full bg-red-500"
                                    style={{ width: `${playerTeam.aero}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
                                <span>Power Unit</span>
                                <span>{playerTeam.power}</span>
                            </div>
                            <div className="h-3 rounded-full bg-white/10">
                                <div
                                    className="h-3 rounded-full bg-red-500"
                                    style={{ width: `${playerTeam.power}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
                                <span>Reliability</span>
                                <span>{playerTeam.reliability}</span>
                            </div>
                            <div className="h-3 rounded-full bg-white/10">
                                <div
                                    className="h-3 rounded-full bg-red-500"
                                    style={{ width: `${playerTeam.reliability}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Latest Result">
                    {latest ? (
                        <div className="space-y-3">
                            <div className="text-lg font-semibold text-white">
                                {latestRaceData ? `${latestRaceData.flag} ${latest.raceName}` : latest.raceName}
                            </div>
                            {latest.results.slice(0, 4).map((result) => {
                                const medal = !result.dnf ? getPodiumMedal(result.position) : null;

                                return (
                                    <div
                                        key={result.driverId}
                                        className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            {medal ? <span className="text-lg">{medal}</span> : null}
                                            <span className="text-sm text-zinc-300">{result.driverName}</span>
                                        </div>

                                        <span className="text-sm font-medium text-white">
                                            {result.dnf ? 'DNF' : `P${result.position} · ${result.points} pts`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-sm text-zinc-400">No race has been simulated yet.</div>
                    )}
                </Card>
            </div>
        </div>
    );
}