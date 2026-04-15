import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { DriverLink } from '../../components/ui/DriverLink';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { TeamLink } from '../../components/ui/TeamLink';
import { useGameStore } from '../../store/gameStore';

function getPodiumMedal(position: number) {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
}

export function RaceWeekendPage() {
    const [showSeasonRecapModal, setShowSeasonRecapModal] = useState(false);
    const currentRound = useGameStore((state) => state.currentRound);
    const runNextRace = useGameStore((state) => state.runNextRace);
    const history = useGameStore((state) => state.history);
    const calendar = useGameStore((state) => state.calendar);
    const isSeasonComplete = useGameStore((state) => state.isSeasonComplete);
    const seasonNumber = useGameStore((state) => state.seasonNumber);
    const teams = useGameStore((state) => state.teams);
    const drivers = useGameStore((state) => state.drivers);
    const playerTeamId = useGameStore((state) => state.playerTeamId);
    const seasonSummaries = useGameStore((state) => state.seasonSummaries);
    const pendingPrizeMoney = useGameStore((state) => state.pendingPrizeMoney);

    const nextRace = calendar[currentRound];
    const latest = history[history.length - 1];
    const latestRaceData = latest
        ? calendar.find((race) => race.name === latest.raceName)
        : null;
    const latestSummary = seasonSummaries[seasonSummaries.length - 1];

    const seasonHistory = useMemo(
        () => history.filter((entry) => entry.seasonNumber === seasonNumber),
        [history, seasonNumber]
    );

    const constructorStandings = useMemo(() => {
        const teamPoints = new Map<string, number>();
        for (const team of teams) teamPoints.set(team.id, 0);

        for (const race of seasonHistory) {
            for (const result of race.results) {
                if (!result.teamId) continue;
                teamPoints.set(result.teamId, (teamPoints.get(result.teamId) ?? 0) + result.points);
            }
        }

        return teams
            .map((team) => ({
                teamId: team.id,
                teamName: team.name,
                teamCountry: team.country,
                points: teamPoints.get(team.id) ?? 0,
            }))
            .sort((a, b) => b.points - a.points);
    }, [seasonHistory, teams]);

    const driverStandings = useMemo(() => {
        const totals = new Map<string, { points: number; wins: number; podiums: number }>();

        for (const race of seasonHistory) {
            for (const result of race.results) {
                const current = totals.get(result.driverId) ?? { points: 0, wins: 0, podiums: 0 };
                current.points += result.points;
                if (!result.dnf && result.position === 1) current.wins += 1;
                if (!result.dnf && result.position <= 3) current.podiums += 1;
                totals.set(result.driverId, current);
            }
        }

        return [...totals.entries()]
            .map(([driverId, value]) => {
                const driver = drivers.find((item) => item.id === driverId);

                return {
                    driverId,
                    name: driver?.name ?? 'Unknown Driver',
                    country: driver?.country ?? '',
                    points: value.points,
                    wins: value.wins,
                    podiums: value.podiums,
                };
            })
            .sort((a, b) => b.points - a.points);
    }, [drivers, seasonHistory]);

    const seasonRecords = useMemo(() => {
        const topWins = [...driverStandings].sort((a, b) => b.wins - a.wins)[0] ?? null;
        const topPodiums = [...driverStandings].sort((a, b) => b.podiums - a.podiums)[0] ?? null;

        return {
            topWins,
            topPodiums,
        };
    }, [driverStandings]);

    useEffect(() => {
        if (isSeasonComplete) {
            setShowSeasonRecapModal(true);
        }
    }, [isSeasonComplete]);

    if (isSeasonComplete) {
        return (
            <div className="space-y-6 md:space-y-8">
                {showSeasonRecapModal ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                        <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
                            <div className="mb-4 flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-xs uppercase tracking-[0.28em] text-red-300">
                                        Championship Complete
                                    </div>
                                    <h2 className="mt-1 text-2xl font-bold text-white md:text-3xl">
                                        {seasonNumber} Season Recap
                                    </h2>
                                    <p className="mt-1 text-sm text-zinc-400">
                                        Drivers, teams, final prize payout, and season records.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowSeasonRecapModal(false)}
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300 hover:bg-white/10"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <Card title="Drivers' Champion">
                                    <div className="text-white">
                                        {latestSummary?.championDriverId ? (
                                            (() => {
                                                const champion = drivers.find((d) => d.id === latestSummary.championDriverId);
                                                return champion ? (
                                                    <DriverLink
                                                        driverId={champion.id}
                                                        driverName={champion.name}
                                                        country={champion.country}
                                                    />
                                                ) : '—';
                                            })()
                                        ) : '—'}
                                    </div>
                                </Card>

                                <Card title="Constructors' Champion">
                                    <div className="text-white">
                                        {latestSummary?.championTeamId ? (
                                            (() => {
                                                const champion = teams.find((t) => t.id === latestSummary.championTeamId);
                                                return champion ? (
                                                    <TeamLink
                                                        teamId={champion.id}
                                                        teamName={champion.name}
                                                        country={champion.country}
                                                    />
                                                ) : '—';
                                            })()
                                        ) : '—'}
                                    </div>
                                </Card>

                                <Card title="Player Prize Money">
                                    <div className="text-sm text-zinc-400">Awarded after the final race</div>
                                    <div className="mt-1 text-2xl font-bold text-emerald-400">
                                        ${pendingPrizeMoney.toLocaleString()}
                                    </div>
                                </Card>
                            </div>

                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                <Card title="Constructors' Final Standings & Prize">
                                    <div className="space-y-2">
                                        {constructorStandings.map((entry, index) => {
                                            const prizeByPosition = [45000000, 36000000, 30000000, 24000000, 20000000, 16000000, 12000000, 9000000, 7000000];
                                            const prize = prizeByPosition[index] ?? 5000000;
                                            const isPlayerTeam = entry.teamId === playerTeamId;

                                            return (
                                                <div key={entry.teamId} className={`grid grid-cols-[50px_1fr_90px_120px] items-center rounded-2xl px-4 py-3 ${isPlayerTeam ? 'bg-red-500/15' : 'bg-white/5'}`}>
                                                    <div className="text-sm font-semibold text-zinc-300">P{index + 1}</div>
                                                    <div className="text-white">
                                                        <TeamLink
                                                            teamId={entry.teamId}
                                                            teamName={entry.teamName}
                                                            country={entry.teamCountry}
                                                        />
                                                    </div>
                                                    <div className="text-right text-sm text-zinc-200">{entry.points} pts</div>
                                                    <div className="text-right text-sm font-semibold text-emerald-400">
                                                        ${prize.toLocaleString()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>

                                <Card title="Drivers' Championship Top 5">
                                    <div className="space-y-2">
                                        {driverStandings.slice(0, 5).map((entry, index) => (
                                            <div key={entry.driverId} className="grid grid-cols-[50px_1fr_70px] items-center rounded-2xl bg-white/5 px-4 py-3">
                                                <div className="text-sm font-semibold text-zinc-300">P{index + 1}</div>
                                                <div className="text-white">
                                                    <DriverLink
                                                        driverId={entry.driverId}
                                                        driverName={entry.name}
                                                        country={entry.country}
                                                    />
                                                </div>
                                                <div className="text-right text-sm text-zinc-200">{entry.points} pts</div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            <div className="mt-4">
                                <Card title="Season Records">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="rounded-2xl bg-white/5 p-4">
                                            <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Most Wins</div>
                                            <div className="mt-2 text-white">
                                                {seasonRecords.topWins ? (
                                                    <DriverLink
                                                        driverId={seasonRecords.topWins.driverId}
                                                        driverName={seasonRecords.topWins.name}
                                                        country={seasonRecords.topWins.country}
                                                    />
                                                ) : '—'}
                                            </div>
                                            <div className="text-sm text-emerald-300">
                                                {seasonRecords.topWins?.wins ?? 0} wins
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-white/5 p-4">
                                            <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Most Podiums</div>
                                            <div className="mt-2 text-white">
                                                {seasonRecords.topPodiums ? (
                                                    <DriverLink
                                                        driverId={seasonRecords.topPodiums.driverId}
                                                        driverName={seasonRecords.topPodiums.name}
                                                        country={seasonRecords.topPodiums.country}
                                                    />
                                                ) : '—'}
                                            </div>
                                            <div className="text-sm text-amber-300">
                                                {seasonRecords.topPodiums?.podiums ?? 0} podiums
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                ) : null}

                <SectionHeader
                    eyebrow="Season Complete"
                    title={`Season ${seasonNumber} Finished`}
                    description="The championship is complete. View the full season review to continue."
                />

                <Card title="Season End">
                    <div className="space-y-4">
                        <div className="text-sm text-zinc-400">
                            All races for this season have been completed.
                        </div>

                        <Link
                            to="/season-overview"
                            className="inline-flex rounded-2xl bg-red-500 px-5 py-3 font-semibold text-white hover:opacity-90"
                        >
                            View Season Overview
                        </Link>
                    </div>
                </Card>

                {latest && (
                    <Card
                        title={`Last Results · ${latestRaceData ? `${latestRaceData.flag} ${latest.raceName}` : latest.raceName
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
