import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Pill } from '../../components/ui/Pill';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { getCountryFlag } from '../../lib/countryFlags';
import { getDriverTeamId } from '../../lib/roster';
import { useGameStore } from '../../store/gameStore';

function getPodiumMedal(position: number) {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
}

export function DriverDetailPage() {
    const { driverId } = useParams();
    const drivers = useGameStore((state) => state.drivers);
    const teams = useGameStore((state) => state.teams);
    const teamRosters = useGameStore((state) => state.teamRosters);
    const history = useGameStore((state) => state.history);
    const calendar = useGameStore((state) => state.calendar);
    const seasonSummaries = useGameStore((state) => state.seasonSummaries);
    const currentSeason = useGameStore((state) => state.seasonNumber);

    const driver = drivers.find((item) => item.id === driverId);
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

    if (!driver) {
        return (
            <div className="space-y-6">
                <SectionHeader
                    eyebrow="Drivers"
                    title="Driver Not Found"
                    description="This driver does not exist in the current database."
                />
                <Link
                    to="/standings"
                    className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 hover:bg-white/10"
                >
                    Back to Standings
                </Link>
            </div>
        );
    }

    const currentTeamId = getDriverTeamId(teamRosters, driver.id);
    const currentTeam = teams.find((item) => item.id === currentTeamId);

    const availableYears = useMemo(() => {
        const years = Array.from(new Set(history.map((race) => race.seasonNumber))).sort(
            (a, b) => b - a
        );

        if (!years.includes(currentSeason)) {
            years.unshift(currentSeason);
        }

        return years;
    }, [history, currentSeason]);

    const filteredHistory = history.filter((race) =>
        selectedYear === 'all' ? true : race.seasonNumber === selectedYear
    );

    // Only keep races the driver actually participated in
    const raceEntries = filteredHistory
        .map((race) => {
            const result = race.results.find((entry) => entry.driverId === driver.id);
            if (!result) return null;

            const raceData = calendar.find((item) => item.name === race.raceName);

            return {
                seasonNumber: race.seasonNumber,
                roundNumber: race.roundNumber,
                raceName: race.raceName,
                flag: raceData?.flag ?? '🏁',
                country: raceData?.country ?? 'Unknown',
                result,
            };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    const classifiedResults = raceEntries.map((entry) => entry.result);

    const totalPoints = classifiedResults.reduce((sum, result) => sum + result.points, 0);
    const wins = classifiedResults.filter((result) => !result.dnf && result.position === 1).length;
    const podiums = classifiedResults.filter((result) => !result.dnf && result.position <= 3).length;
    const topTens = classifiedResults.filter((result) => !result.dnf && result.position <= 10).length;
    const dnfs = classifiedResults.filter((result) => result.dnf).length;

    const championships = seasonSummaries.filter((summary) => {
        if (selectedYear !== 'all' && summary.seasonNumber !== selectedYear) return false;
        return summary.championDriverId === driver.id;
    }).length;

    const seasonsParticipated = new Set(raceEntries.map((entry) => entry.seasonNumber)).size;

    const bestFinishResult = classifiedResults
        .filter((result) => !result.dnf)
        .sort((a, b) => a.position - b.position)[0];

    const averageFinishSource = classifiedResults.filter((result) => !result.dnf);
    const averageFinish =
        averageFinishSource.length > 0
            ? (
                averageFinishSource.reduce((sum, result) => sum + result.position, 0) /
                averageFinishSource.length
            ).toFixed(1)
            : '—';

    const teamStats = Array.from(
        raceEntries.reduce((map, entry) => {
            const key = entry.result.teamId ?? 'unknown-team';

            if (!map.has(key)) {
                map.set(key, {
                    teamId: entry.result.teamId,
                    teamName: entry.result.teamName ?? 'Unknown Team',
                    teamCountry: entry.result.teamCountry ?? '',
                    races: 0,
                    points: 0,
                    wins: 0,
                    podiums: 0,
                    dnfs: 0,
                    seasons: new Set<number>(),
                });
            }

            const stat = map.get(key)!;
            stat.races += 1;
            stat.points += entry.result.points;
            stat.seasons.add(entry.seasonNumber);

            if (entry.result.dnf) {
                stat.dnfs += 1;
            } else {
                if (entry.result.position === 1) stat.wins += 1;
                if (entry.result.position <= 3) stat.podiums += 1;
            }

            return map;
        }, new Map<string, {
            teamId: string | null;
            teamName: string;
            teamCountry: string;
            races: number;
            points: number;
            wins: number;
            podiums: number;
            dnfs: number;
            seasons: Set<number>;
        }>())
            .values()
    )
        .map((entry) => ({
            ...entry,
            seasonCount: entry.seasons.size,
        }))
        .sort((a, b) => b.points - a.points);

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="flex flex-wrap items-center gap-3">
                <Link
                    to="/standings"
                    className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 hover:bg-white/10"
                >
                    Back to Standings
                </Link>
                <Link
                    to="/results"
                    className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 hover:bg-white/10"
                >
                    View Results Archive
                </Link>
            </div>

            <SectionHeader
                eyebrow="Driver Profile"
                title={`${getCountryFlag(driver.country)} ${driver.name}`}
                description={`${driver.country} · ${driver.age} years old${currentTeam
                    ? ` · ${getCountryFlag(currentTeam.country)} ${currentTeam.name}`
                    : ' · Free Agent'
                    }`}
            />

            <Card title="Season Filter">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm text-zinc-400" htmlFor="driver-year">
                        Select season
                    </label>
                    <select
                        id="driver-year"
                        value={selectedYear}
                        onChange={(e) =>
                            setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))
                        }
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    >
                        <option value="all" className="bg-zinc-950">
                            All Seasons
                        </option>
                        {availableYears.map((year) => (
                            <option key={year} value={year} className="bg-zinc-950">
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card title="Championships">
                    <div className="text-3xl font-bold text-white">{championships}</div>
                </Card>
                <Card title="Seasons">
                    <div className="text-3xl font-bold text-white">{seasonsParticipated}</div>
                </Card>
                <Card title="Points">
                    <div className="text-3xl font-bold text-white">{totalPoints}</div>
                </Card>
                <Card title="Wins">
                    <div className="text-3xl font-bold text-white">{wins}</div>
                </Card>
                <Card title="Podiums">
                    <div className="text-3xl font-bold text-white">{podiums}</div>
                </Card>
                <Card title="Top 10s">
                    <div className="text-3xl font-bold text-white">{topTens}</div>
                </Card>
                <Card title="DNFs">
                    <div className="text-3xl font-bold text-white">{dnfs}</div>
                </Card>
                <Card title="Best Finish">
                    <div className="text-3xl font-bold text-white">
                        {bestFinishResult ? `P${bestFinishResult.position}` : '—'}
                    </div>
                </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                <Card title="Driver Info">
                    <div className="space-y-3">
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Country</div>
                            <div className="mt-1 text-lg font-semibold text-white">
                                {getCountryFlag(driver.country)} {driver.country}
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Age</div>
                            <div className="mt-1 text-lg font-semibold text-white">{driver.age}</div>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Current Team</div>
                            <div className="mt-1 text-lg font-semibold text-white">
                                {currentTeam
                                    ? `${getCountryFlag(currentTeam.country)} ${currentTeam.name}`
                                    : 'Free Agent'}
                            </div>
                            {currentTeam ? (
                                <div className="text-sm text-zinc-400">{currentTeam.country}</div>
                            ) : null}
                        </div>
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Market Value</div>
                            <div className="mt-1 text-lg font-semibold text-white">
                                ${driver.marketValue.toLocaleString()}
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Average Finish</div>
                            <div className="mt-1 text-lg font-semibold text-white">{averageFinish}</div>
                        </div>
                    </div>
                </Card>

                <Card title="Performance Profile">
                    <div className="space-y-4">
                        {[
                            ['Overall', driver.overall],
                            ['Qualifying', driver.qualifying],
                            ['Racecraft', driver.racecraft],
                            ['Consistency', driver.consistency],
                            ['Wet Skill', driver.wetSkill],
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

                        <div className="flex flex-wrap gap-2 pt-2">
                            <Pill>{championships} Titles</Pill>
                            <Pill>{seasonsParticipated} Seasons</Pill>
                            <Pill>{wins} Wins</Pill>
                            <Pill>{podiums} Podiums</Pill>
                        </div>
                    </div>
                </Card>
            </div>

            <Card title="Team History">
                {teamStats.length === 0 ? (
                    <div className="text-sm text-zinc-400">No team history available yet.</div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-[1.3fr_70px_80px_80px_80px_80px] px-2 text-xs uppercase tracking-[0.25em] text-zinc-500">
                            <span>Team</span>
                            <span className="text-right">Seasons</span>
                            <span className="text-right">Races</span>
                            <span className="text-right">Pts</span>
                            <span className="text-right">Wins</span>
                            <span className="text-right">Pods</span>
                        </div>

                        {teamStats.map((teamStat) => (
                            <div
                                key={`${teamStat.teamId ?? 'unknown'}-${teamStat.teamName}`}
                                className="grid grid-cols-[1.3fr_70px_80px_80px_80px_80px] items-center rounded-2xl bg-white/5 px-4 py-3"
                            >
                                <div>
                                    <div className="text-white">
                                        {teamStat.teamCountry
                                            ? `${getCountryFlag(teamStat.teamCountry)} ${teamStat.teamName}`
                                            : teamStat.teamName}
                                    </div>
                                    <div className="text-xs text-zinc-400">
                                        {teamStat.teamCountry || 'Unknown country'}
                                    </div>
                                </div>
                                <div className="text-right text-white">{teamStat.seasonCount}</div>
                                <div className="text-right text-white">{teamStat.races}</div>
                                <div className="text-right text-white">{teamStat.points}</div>
                                <div className="text-right text-white">{teamStat.wins}</div>
                                <div className="text-right text-white">{teamStat.podiums}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card title="Race-by-Race Results">
                {raceEntries.length === 0 ? (
                    <div className="text-sm text-zinc-400">No race data for this selection.</div>
                ) : (
                    <div className="space-y-2">
                        {[...raceEntries]
                            .sort((a, b) => {
                                if (a.seasonNumber !== b.seasonNumber) return b.seasonNumber - a.seasonNumber;
                                return b.roundNumber - a.roundNumber;
                            })
                            .map((entry, index) => {
                                const result = entry.result;
                                const medal = !result.dnf ? getPodiumMedal(result.position) : null;

                                return (
                                    <div
                                        key={`${entry.seasonNumber}-${entry.roundNumber}-${entry.raceName}-${index}`}
                                        className="grid grid-cols-[1fr_140px_90px_90px] items-center rounded-2xl bg-white/5 px-4 py-3"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span>{entry.flag}</span>
                                                <span className="truncate text-sm font-medium text-white md:text-base">
                                                    {entry.seasonNumber} · {entry.raceName}
                                                </span>
                                            </div>
                                            <div className="text-xs text-zinc-400">
                                                {entry.country} · Round {entry.roundNumber}
                                            </div>
                                        </div>

                                        <div className="text-sm text-zinc-300">
                                            {result.teamName
                                                ? `${result.teamCountry ? getCountryFlag(result.teamCountry) : ''} ${result.teamName}`
                                                : 'Unknown Team'}
                                        </div>

                                        <div className="text-center text-sm text-white">
                                            {result.dnf ? (
                                                'DNF'
                                            ) : (
                                                <span className="inline-flex items-center gap-2">
                                                    {medal ? <span>{medal}</span> : null}
                                                    <span>P{result.position}</span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-right text-sm font-semibold text-white">
                                            {result.points}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </Card>
        </div>
    );
}