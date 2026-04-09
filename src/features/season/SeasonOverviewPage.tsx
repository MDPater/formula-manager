import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useGameStore } from '../../store/gameStore';

export function SeasonOverviewPage() {
    const navigate = useNavigate();

    const currentSeasonNumber = useGameStore((state) => state.seasonNumber);
    const seasonSummaries = useGameStore((state) => state.seasonSummaries);
    const drivers = useGameStore((state) => state.drivers);
    const teams = useGameStore((state) => state.teams);
    const engineers = useGameStore((state) => state.engineers);
    const pitCrewChiefs = useGameStore((state) => state.pitCrewChiefs);
    const playerEngineerId = useGameStore((state) => state.playerEngineerId);
    const playerPitCrewChiefId = useGameStore((state) => state.playerPitCrewChiefId);
    const playerTeamId = useGameStore((state) => state.playerTeamId);
    const startNextSeason = useGameStore((state) => state.startNextSeason);

    const latest = seasonSummaries[seasonSummaries.length - 1];
    const engineer = engineers.find((item) => item.id === playerEngineerId) ?? null;
    const pitCrewChief = pitCrewChiefs.find((item) => item.id === playerPitCrewChiefId) ?? null;
    const playerTeam = teams.find((team) => team.id === playerTeamId) ?? null;

    if (!latest) {
        return (
            <div className="space-y-6">
                <SectionHeader
                    eyebrow="Season Review"
                    title="No Season Summary"
                    description="Finish a season to unlock the season overview."
                />
            </div>
        );
    }

    const championDriver = drivers.find((d) => d.id === latest.championDriverId);
    const championTeam = teams.find((t) => t.id === latest.championTeamId);

    const mostImproved = latest.driverProgressions.filter((entry) => entry.deltaOverall > 0);
    const mostDeclined = latest.driverProgressions.filter((entry) => entry.deltaOverall < 0);

    function handleStartNextSeason() {
        startNextSeason();
        navigate('/');
    }

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Season Review"
                title={`${latest.seasonNumber} Championship Complete`}
                description="Review the final standings, key outcomes, and offseason development before beginning the next year."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card title="Drivers' Champion">
                    <div className="text-sm text-zinc-400">Best driver this season</div>
                    <div className="mt-2 text-xl font-semibold text-white">{championDriver?.name ?? '—'}</div>
                </Card>

                <Card title="Constructors' Champion">
                    <div className="text-sm text-zinc-400">Best team this season</div>
                    <div className="mt-2 text-xl font-semibold text-white">{championTeam?.name ?? '—'}</div>
                </Card>

                <Card title="Your Final Position">
                    <div className="text-sm text-zinc-400">Where your team finished</div>
                    <div className="mt-2 text-xl font-semibold text-white">
                        {latest.playerTeamPosition ? `P${latest.playerTeamPosition}` : '—'}
                    </div>
                </Card>

                <Card title="Next Season Year">
                    <div className="text-sm text-zinc-400">Calendar year</div>
                    <div className="mt-2 text-xl font-semibold text-white">{currentSeasonNumber + 1}</div>
                </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <Card title="Your Team Summary">
                    <div className="space-y-3">
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Team</div>
                            <div className="mt-1 text-lg font-semibold text-white">{playerTeam?.name ?? '—'}</div>
                        </div>

                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Engineer</div>
                            <div className="mt-1 text-lg font-semibold text-white">
                                {engineer ? `${engineer.name} · Age ${engineer.age}` : '—'}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Pit Crew Chief</div>
                            <div className="mt-1 text-lg font-semibold text-white">
                                {pitCrewChief ? `${pitCrewChief.name} · Age ${pitCrewChief.age}` : '—'}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Your Drivers">
                    <div className="space-y-3">
                        {latest.playerDriverResults.map((entry) => {
                            const driver = drivers.find((d) => d.id === entry.driverId);

                            return (
                                <div
                                    key={entry.driverId}
                                    className="grid grid-cols-[1.2fr_90px_90px_90px] items-center rounded-2xl bg-white/5 px-4 py-3"
                                >
                                    <div>
                                        <div className="text-white">{driver?.name ?? entry.driverId}</div>
                                        <div className="text-xs text-zinc-400">{driver?.country ?? ''}</div>
                                    </div>
                                    <div className="text-right text-white">{entry.points}</div>
                                    <div className="text-right text-white">{entry.wins}</div>
                                    <div className="text-right text-white">{entry.podiums}</div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <Card title="Most Improved Drivers">
                    {mostImproved.length === 0 ? (
                        <div className="text-sm text-zinc-400">No drivers improved overall this season.</div>
                    ) : (
                        <div className="space-y-2">
                            {mostImproved.slice(0, 8).map((entry) => {
                                const driver = drivers.find((d) => d.id === entry.driverId);

                                return (
                                    <div
                                        key={entry.driverId}
                                        className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                                    >
                                        <div>
                                            <div className="text-white">{driver?.name ?? entry.driverId}</div>
                                            <div className="text-xs text-zinc-400">
                                                Age {entry.oldAge} → {entry.newAge}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-white">
                                                {entry.oldOverall} → {entry.newOverall}
                                            </div>
                                            <div className="text-xs text-emerald-400">+{entry.deltaOverall}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                <Card title="Biggest Declines">
                    {mostDeclined.length === 0 ? (
                        <div className="text-sm text-zinc-400">No drivers declined overall this season.</div>
                    ) : (
                        <div className="space-y-2">
                            {mostDeclined.slice(0, 8).map((entry) => {
                                const driver = drivers.find((d) => d.id === entry.driverId);

                                return (
                                    <div
                                        key={entry.driverId}
                                        className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                                    >
                                        <div>
                                            <div className="text-white">{driver?.name ?? entry.driverId}</div>
                                            <div className="text-xs text-zinc-400">
                                                Age {entry.oldAge} → {entry.newAge}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-white">
                                                {entry.oldOverall} → {entry.newOverall}
                                            </div>
                                            <div className="text-xs text-red-400">{entry.deltaOverall}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleStartNextSeason}
                    className="rounded-2xl bg-red-500 px-5 py-3 font-semibold text-white hover:opacity-90"
                >
                    Start Next Season
                </button>

                <Link
                    to="/results"
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-zinc-300 hover:bg-white/10"
                >
                    View Results
                </Link>
            </div>
        </div>
    );
}