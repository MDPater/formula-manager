import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { DriverLink } from '../../components/ui/DriverLink';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useGameStore } from '../../store/gameStore';

type TabKey = 'championships' | 'wins' | 'podiums' | 'points' | 'starts';

type HallEntry = {
    driverId: string;
    name: string;
    country: string;
    championships: number;
    wins: number;
    podiums: number;
    points: number;
    starts: number;
    retired: boolean;
};

export function HallOfFamePage() {
    const drivers = useGameStore((state) => state.drivers);
    const history = useGameStore((state) => state.history);
    const seasonSummaries = useGameStore((state) => state.seasonSummaries);

    const [tab, setTab] = useState<TabKey>('championships');

    const entries = useMemo<HallEntry[]>(() => {
        return drivers.map((driver) => {
            const results = history
                .flatMap((race) => race.results)
                .filter((result) => result.driverId === driver.id);

            const championships = seasonSummaries.filter(
                (summary) => summary.championDriverId === driver.id
            ).length;

            const wins = results.filter((result) => !result.dnf && result.position === 1).length;
            const podiums = results.filter((result) => !result.dnf && result.position <= 3).length;
            const points = results.reduce((sum, result) => sum + result.points, 0);
            const starts = results.length;

            return {
                driverId: driver.id,
                name: driver.name,
                country: driver.country,
                championships,
                wins,
                podiums,
                points,
                starts,
                retired: Boolean(driver.retired),
            };
        });
    }, [drivers, history, seasonSummaries]);

    const sortedEntries = useMemo(() => {
        const copy = [...entries];

        if (tab === 'championships') {
            copy.sort((a, b) => b.championships - a.championships || b.wins - a.wins || b.points - a.points);
        } else if (tab === 'wins') {
            copy.sort((a, b) => b.wins - a.wins || b.podiums - a.podiums || b.points - a.points);
        } else if (tab === 'podiums') {
            copy.sort((a, b) => b.podiums - a.podiums || b.wins - a.wins || b.points - a.points);
        } else if (tab === 'points') {
            copy.sort((a, b) => b.points - a.points || b.wins - a.wins || b.podiums - a.podiums);
        } else if (tab === 'starts') {
            copy.sort((a, b) => b.starts - a.starts || b.points - a.points);
        }

        return copy.filter(
            (entry) =>
                entry.starts > 0 ||
                entry.championships > 0 ||
                entry.wins > 0 ||
                entry.podiums > 0 ||
                entry.points > 0
        );
    }, [entries, tab]);

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Legacy"
                title="Hall of Fame"
                description="All-time records for active and retired drivers."
            />

            <div className="flex flex-wrap gap-3">
                {[
                    ['championships', 'Championships'],
                    ['wins', 'Wins'],
                    ['podiums', 'Podiums'],
                    ['points', 'Points'],
                    ['starts', 'Starts'],
                ].map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key as TabKey)}
                        className={`rounded-2xl px-4 py-3 text-sm font-medium ${tab === key
                                ? 'bg-red-500 text-white'
                                : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <Card title="All-Time Rankings">
                <div className="space-y-2">
                    <div className="grid grid-cols-[60px_1.4fr_90px_90px_90px_90px_90px] px-2 text-xs uppercase tracking-[0.25em] text-zinc-500">
                        <span>Pos</span>
                        <span>Driver</span>
                        <span className="text-right">Titles</span>
                        <span className="text-right">Wins</span>
                        <span className="text-right">Pods</span>
                        <span className="text-right">Pts</span>
                        <span className="text-right">Starts</span>
                    </div>

                    {sortedEntries.map((entry, index) => (
                        <div
                            key={entry.driverId}
                            className="grid grid-cols-[60px_1.4fr_90px_90px_90px_90px_90px] items-center rounded-2xl bg-white/5 px-4 py-3"
                        >
                            <div className="text-white">{index + 1}</div>

                            <div>
                                <div className="text-white">
                                    <DriverLink
                                        driverId={entry.driverId}
                                        driverName={entry.name}
                                        country={entry.country}
                                    />
                                    {entry.retired ? (
                                        <span className="ml-2 text-xs text-zinc-500">Retired</span>
                                    ) : null}
                                </div>
                                <div className="text-xs text-zinc-400">{entry.country}</div>
                            </div>

                            <div className="text-right text-white">{entry.championships}</div>
                            <div className="text-right text-white">{entry.wins}</div>
                            <div className="text-right text-white">{entry.podiums}</div>
                            <div className="text-right text-white">{entry.points}</div>
                            <div className="text-right text-white">{entry.starts}</div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
