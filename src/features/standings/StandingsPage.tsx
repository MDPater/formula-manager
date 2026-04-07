import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
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
    const history = useGameStore((state) => state.history);

    const sortedTeams = [...teams].sort((a, b) => b.points - a.points);

    const driverPoints = drivers.map((driver) => {
        const points = history.reduce((total, race) => {
            const result = race.results.find((entry) => entry.driverId === driver.id);
            return total + (result?.points ?? 0);
        }, 0);

        const team = teams.find((item) => item.id === driver.teamId);

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
                description="Constructor and driver standings for the current career."
            />

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
                                        <div>{team.name}</div>
                                        <div className="text-xs text-zinc-400">{team.country}</div>
                                    </div>
                                    <span className="text-right font-semibold">{team.points}</span>
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