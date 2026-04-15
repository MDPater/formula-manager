import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { DriverLink } from '../../components/ui/DriverLink';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatCard } from '../../components/ui/StatCard';
import { getActiveDrivers, getDriverTeamId, getTeamDrivers } from '../../lib/roster';
import { getCountryFlag } from '../../lib/countryFlags';
import { useGameStore } from '../../store/gameStore';

function getPodiumMedal(position: number) {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
}

function getDriverSeasonPoints(
    history: ReturnType<typeof useGameStore.getState>['history'],
    driverId: string,
    seasonNumber: number
) {
    return history
        .filter((race) => race.seasonNumber === seasonNumber)
        .reduce((total, race) => {
            const result = race.results.find((entry) => entry.driverId === driverId);
            return total + (result?.points ?? 0);
        }, 0);
}

function getDriverSeasonWins(
    history: ReturnType<typeof useGameStore.getState>['history'],
    driverId: string,
    seasonNumber: number
) {
    return history
        .filter((race) => race.seasonNumber === seasonNumber)
        .reduce((total, race) => {
            const result = race.results.find((entry) => entry.driverId === driverId);
            return total + (result && !result.dnf && result.position === 1 ? 1 : 0);
        }, 0);
}

function getDriverSeasonPodiums(
    history: ReturnType<typeof useGameStore.getState>['history'],
    driverId: string,
    seasonNumber: number
) {
    return history
        .filter((race) => race.seasonNumber === seasonNumber)
        .reduce((total, race) => {
            const result = race.results.find((entry) => entry.driverId === driverId);
            return total + (result && !result.dnf && result.position <= 3 ? 1 : 0);
        }, 0);
}

export function DashboardPage() {
    const currentRound = useGameStore((state) => state.currentRound);
    const teams = useGameStore((state) => state.teams);
    const calendar = useGameStore((state) => state.calendar);
    const playerTeamId = useGameStore((state) => state.playerTeamId);
    const history = useGameStore((state) => state.history);
    const drivers = useGameStore((state) => state.drivers);
    const teamRosters = useGameStore((state) => state.teamRosters);
    const seasonNumber = useGameStore((state) => state.seasonNumber);

    const nextRace = calendar[currentRound];
    const latest = history[history.length - 1];
    const latestRaceData = latest
        ? calendar.find((race) => race.name === latest.raceName)
        : null;

    const playerTeam = teams.find((team) => team.id === playerTeamId) ?? teams[0];
    const playerDrivers = getTeamDrivers(drivers, teamRosters, playerTeamId);

    const activeDrivers = getActiveDrivers(drivers, teamRosters).map((driver) => {
        const points = getDriverSeasonPoints(history, driver.id, seasonNumber);
        const teamId = getDriverTeamId(teamRosters, driver.id);
        const team = teams.find((item) => item.id === teamId);

        return {
            ...driver,
            points,
            teamName: team?.name ?? 'Unknown Team',
        };
    });

    const sortedDrivers = [...activeDrivers].sort((a, b) => b.points - a.points);

    const playerDriverCards = playerDrivers.map((driver) => {
        const standing = sortedDrivers.findIndex((item) => item.id === driver.id) + 1;
        const points = getDriverSeasonPoints(history, driver.id, seasonNumber);
        const wins = getDriverSeasonWins(history, driver.id, seasonNumber);
        const podiums = getDriverSeasonPodiums(history, driver.id, seasonNumber);

        const lastFive = [...history]
            .filter((race) => race.seasonNumber === seasonNumber)
            .reverse()
            .slice(0, 5)
            .map((race) => {
                const result = race.results.find((entry) => entry.driverId === driver.id);
                const raceData = calendar.find((entry) => entry.name === race.raceName);

                return {
                    raceName: race.raceName,
                    flag: raceData?.flag ?? '🏁',
                    result,
                };
            });

        return {
            ...driver,
            standing,
            points,
            wins,
            podiums,
            lastFive,
        };
    });

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Race Control"
                title="Team Dashboard"
                description="A clean F1-inspired control wall for running your team through the current season."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Team Points" value={`${playerTeam.points}`} hint="Constructor total this season" />
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
                    value={`${Math.round((playerTeam.aero + playerTeam.power + playerTeam.reliability) / 3)}`}
                    hint="Average of current car departments"
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                {playerDriverCards.map((driver) => (
                    <Card key={driver.id} title={driver.name}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <Link
                                    to={`/drivers/${driver.id}`}
                                    className="text-lg font-semibold text-white underline-offset-4 hover:text-red-300 hover:underline"
                                >
                                    {getCountryFlag(driver.country)} {driver.name}
                                </Link>
                                <div className="mt-1 text-sm text-zinc-400">
                                    {driver.country} · Age {driver.age}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-sm text-zinc-400">Standing</div>
                                <div className="text-xl font-bold text-white">P{driver.standing}</div>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="rounded-2xl bg-white/5 p-3">
                                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Points</div>
                                <div className="mt-1 text-lg font-semibold text-white">{driver.points}</div>
                            </div>
                            <div className="rounded-2xl bg-white/5 p-3">
                                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Wins</div>
                                <div className="mt-1 text-lg font-semibold text-white">{driver.wins}</div>
                            </div>
                            <div className="rounded-2xl bg-white/5 p-3">
                                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Podiums</div>
                                <div className="mt-1 text-lg font-semibold text-white">{driver.podiums}</div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                                Last 5 Results This Season
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {driver.lastFive.length === 0 ? (
                                    <span className="text-sm text-zinc-400">No results yet.</span>
                                ) : (
                                    driver.lastFive.map((entry, index) => (
                                        <div
                                            key={`${driver.id}-${entry.raceName}-${index}`}
                                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                                        >
                                            <span className="mr-2">{entry.flag}</span>
                                            {entry.result
                                                ? entry.result.dnf
                                                    ? 'DNF'
                                                    : `P${entry.result.position}`
                                                : '—'}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Card title="Performance Overview">
                    <div className="space-y-4">
                        {[
                            ['Aerodynamics', playerTeam.aero],
                            ['Power Unit', playerTeam.power],
                            ['Reliability', playerTeam.reliability],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
                                    <span>{label}</span>
                                    <span>{value}</span>
                                </div>
                                <div className="h-3 rounded-full bg-white/10">
                                    <div className="h-3 rounded-full bg-red-500" style={{ width: `${value}%` }} />
                                </div>
                            </div>
                        ))}
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
                                            <DriverLink
                                                driverId={result.driverId}
                                                driverName={result.driverName}
                                                className="text-sm text-zinc-300 underline-offset-4 hover:text-zinc-100 hover:underline"
                                            />
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
