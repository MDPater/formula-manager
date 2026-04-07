import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useGameStore } from '../../store/gameStore';

export function MarketPage() {
    const drivers = useGameStore((state) => state.drivers);
    const playerTeamId = useGameStore((state) => state.playerTeamId);
    const teams = useGameStore((state) => state.teams);

    const availableDrivers = drivers
        .filter((driver) => driver.teamId !== playerTeamId)
        .map((driver) => {
            const team = teams.find((item) => item.id === driver.teamId);
            return {
                ...driver,
                teamName: team?.name ?? 'Unknown Team',
            };
        });

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Contracts"
                title="Driver Market"
                description="Starter view for future transfer, buyout, and contract systems."
            />

            <Card title="Available Drivers">
                <div className="space-y-2">
                    {availableDrivers.map((driver) => (
                        <div
                            key={driver.id}
                            className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                        >
                            <div>
                                <Link
                                    to={`/drivers/${driver.id}`}
                                    className="text-sm text-zinc-300 underline-offset-4 hover:text-red-300 hover:underline md:text-base"
                                >
                                    {driver.name}
                                </Link>
                                <div className="text-xs text-zinc-500">
                                    {driver.country} · {driver.age} · {driver.teamName}
                                </div>
                            </div>

                            <span className="text-sm font-medium text-white">
                                ${driver.marketValue.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}