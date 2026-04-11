import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { getActiveDrivers, getDriverTeamId } from '../../lib/roster';
import { getCountryFlag } from '../../lib/countryFlags';
import { useGameStore } from '../../store/gameStore';

function getStandingRowClass(position: number) {
    if (position === 1) return 'bg-yellow-500/10';
    if (position === 2) return 'bg-zinc-300/10';
    if (position === 3) return 'bg-amber-700/10';
    return '';
}

function getStandingBadge(position: number) {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
}

export function StandingsPage() {
    const teams = useGameStore((state) => state.teams);
    const drivers = useGameStore((state) => state.drivers);
    const teamRosters = useGameStore((state) => state.teamRosters);
    const history = useGameStore((state) => state.history);
    const currentSeason = useGameStore((state) => state.seasonNumber);

    const [selectedYear, setSelectedYear] = useState<number>(currentSeason);

    const availableYears = useMemo(() => {
        const years = Array.from(new Set(history.map((race) => race.seasonNumber))).sort(
            (a, b) => b - a
        );

        if (!years.includes(currentSeason)) {
            years.unshift(currentSeason);
        }

        return years;
    }, [history, currentSeason]);

    const filteredHistory = history.filter((race) => race.seasonNumber === selectedYear);

    const teamPointsMap = new Map<string, number>();
    const activeDrivers = getActiveDrivers(drivers, teamRosters);

    for (const team of teams) {
        teamPointsMap.set(team.id, 0);
    }

    for (const race of filteredHistory) {
        for (const result of race.results) {
            const teamId = getDriverTeamId(teamRosters, result.driverId);
            if (!teamId) continue;

            teamPointsMap.set(teamId, (teamPointsMap.get(teamId) ?? 0) + result.points);
        }
    }

    const sortedTeams = [...teams]
        .map((team) => ({
            ...team,
            computedPoints: teamPointsMap.get(team.id) ?? 0,
        }))
        .sort((a, b) => b.computedPoints - a.computedPoints);

    const driverPoints = activeDrivers.map((driver) => {
        const points = filteredHistory.reduce((total, race) => {
            const result = race.results.find((entry) => entry.driverId === driver.id);
            return total + (result?.points ?? 0);
        }, 0);

        const teamId = getDriverTeamId(teamRosters, driver.id);
        const team = teams.find((item) => item.id === teamId);

        return {
            ...driver,
            teamName: team?.name ?? 'Unknown Team',
            points,
        };
    });

    const sortedDrivers = [...driverPoints].sort((a, b) => b.points - a.points);

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Championship"
                title="Standings"
                description="Compare constructor and driver standings for any season."
            />

            <Card title="Season Filter">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm text-zinc-400" htmlFor="standings-year">
                        Select season
                    </label>
                    <select
                        id="standings-year"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    >
                        {availableYears.map((year) => (
                            <option key={year} value={year} className="bg-zinc-950">
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
                <Card title="Constructors">
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                        <div className="grid grid-cols-[70px_1fr_100px] bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.25em] text-zinc-500">
                            <span>Pos</span>
                            <span>Team</span>
                            <span className="text-right">Pts</span>
                        </div>

                        {sortedTeams.map((team, index) => {
                            const position = index + 1;
                            const badge = getStandingBadge(position);

                            return (
                                <div
                                    key={team.id}
                                    className={`grid grid-cols-[70px_1fr_100px] border-t border-white/10 px-4 py-4 text-sm text-white ${getStandingRowClass(position)}`}
                                >
                                    <span className="flex items-center gap-2">
                                        {badge ? <span>{badge}</span> : null}
                                        <span>{position}</span>
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span>{getCountryFlag(team.country)}</span>
                                            <span>{team.name}</span>
                                        </div>
                                        <div className="text-xs text-zinc-400">{team.country}</div>
                                    </div>
                                    <span className="text-right font-semibold">{team.computedPoints}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <Card title="Drivers">
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                        <div className="grid grid-cols-[70px_1.2fr_1fr_80px] bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.25em] text-zinc-500">
                            <span>Pos</span>
                            <span>Driver</span>
                            <span>Team</span>
                            <span className="text-right">Pts</span>
                        </div>

                        {sortedDrivers.map((driver, index) => {
                            const position = index + 1;
                            const badge = getStandingBadge(position);

                            return (
                                <div
                                    key={driver.id}
                                    className={`grid grid-cols-[70px_1.2fr_1fr_80px] border-t border-white/10 px-4 py-4 text-sm text-white ${getStandingRowClass(position)}`}
                                >
                                    <span className="flex items-center gap-2">
                                        {badge ? <span>{badge}</span> : null}
                                        <span>{position}</span>
                                    </span>
                                    <div>
                                        <Link
                                            to={`/drivers/${driver.id}`}
                                            className="font-medium text-white underline-offset-4 hover:text-red-300 hover:underline"
                                        >
                                            <span className="mr-2">{getCountryFlag(driver.country)}</span>
                                            {driver.name}
                                        </Link>
                                        <div className="text-xs text-zinc-400">
                                            {driver.country} · {driver.age}
                                        </div>
                                    </div>
                                    <span className="text-zinc-400">{driver.teamName}</span>
                                    <span className="text-right font-semibold">{driver.points}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}