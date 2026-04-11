import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { getCountryFlag } from '../../lib/countryFlags';
import { getDriverTeamId, getFreeAgents } from '../../lib/roster';
import { useGameStore } from '../../store/gameStore';

export function MarketPage() {
    const drivers = useGameStore((state) => state.drivers);
    const teams = useGameStore((state) => state.teams);
    const playerTeamId = useGameStore((state) => state.playerTeamId);
    const teamRosters = useGameStore((state) => state.teamRosters);

    const contractedDrivers = drivers
        .map((driver) => {
            const teamId = getDriverTeamId(teamRosters, driver.id);
            if (!teamId || teamId === playerTeamId) return null;

            const team = teams.find((item) => item.id === teamId);

            return {
                ...driver,
                teamName: team?.name ?? 'Unknown Team',
            };
        })
        .filter((driver): driver is NonNullable<typeof driver> => Boolean(driver))
        .sort((a, b) => b.marketValue - a.marketValue);

    const freeAgents = getFreeAgents(drivers, teamRosters).sort((a, b) => b.overall - a.overall);
    const prospects = freeAgents.filter((driver) => driver.age <= 21);
    const veterans = freeAgents.filter((driver) => driver.age >= 30);

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Contracts"
                title="Driver Market"
                description="Browse rival team drivers, free agents, young prospects, and experienced veterans."
            />

            <div className="grid gap-4 md:grid-cols-3">
                <Card title="Contracted Drivers">
                    <div className="text-3xl font-bold text-white">{contractedDrivers.length}</div>
                    <div className="mt-2 text-sm text-zinc-400">Currently signed by rival teams.</div>
                </Card>

                <Card title="Free Agents">
                    <div className="text-3xl font-bold text-white">{freeAgents.length}</div>
                    <div className="mt-2 text-sm text-zinc-400">Available outside the current grid.</div>
                </Card>

                <Card title="Prospects">
                    <div className="text-3xl font-bold text-white">{prospects.length}</div>
                    <div className="mt-2 text-sm text-zinc-400">Young drivers with development upside.</div>
                </Card>
            </div>

            <Card title="Rival Team Drivers">
                <div className="space-y-2">
                    {contractedDrivers.map((driver) => (
                        <div
                            key={driver.id}
                            className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                        >
                            <div>
                                <Link
                                    to={`/drivers/${driver.id}`}
                                    className="text-sm text-zinc-300 underline-offset-4 hover:text-red-300 hover:underline md:text-base"
                                >
                                    {getCountryFlag(driver.country)} {driver.name}
                                </Link>
                                <div className="text-xs text-zinc-500">
                                    {driver.country} · {driver.age} · {driver.teamName}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-sm font-medium text-white">
                                    ${driver.marketValue.toLocaleString()}
                                </div>
                                <div className="text-xs text-zinc-500">OVR {driver.overall}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
                <Card title="Top Free Agents">
                    <div className="space-y-2">
                        {freeAgents.slice(0, 8).map((driver) => (
                            <div
                                key={driver.id}
                                className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                            >
                                <div>
                                    <Link
                                        to={`/drivers/${driver.id}`}
                                        className="text-sm text-zinc-300 underline-offset-4 hover:text-red-300 hover:underline md:text-base"
                                    >
                                        {getCountryFlag(driver.country)} {driver.name}
                                    </Link>
                                    <div className="text-xs text-zinc-500">
                                        {driver.country} · {driver.age}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-sm font-medium text-white">OVR {driver.overall}</div>
                                    <div className="text-xs text-zinc-500">${driver.marketValue.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Young Prospects">
                    <div className="space-y-2">
                        {prospects.length === 0 ? (
                            <div className="text-sm text-zinc-400">No prospects available.</div>
                        ) : (
                            prospects.map((driver) => (
                                <div
                                    key={driver.id}
                                    className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                                >
                                    <div>
                                        <Link
                                            to={`/drivers/${driver.id}`}
                                            className="text-sm text-zinc-300 underline-offset-4 hover:text-red-300 hover:underline md:text-base"
                                        >
                                            {getCountryFlag(driver.country)} {driver.name}
                                        </Link>
                                        <div className="text-xs text-zinc-500">
                                            {driver.country} · {driver.age}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm font-medium text-white">OVR {driver.overall}</div>
                                        <div className="text-xs text-zinc-500">${driver.marketValue.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            <Card title="Experienced Veterans">
                <div className="space-y-2">
                    {veterans.length === 0 ? (
                        <div className="text-sm text-zinc-400">No veterans available.</div>
                    ) : (
                        veterans.map((driver) => (
                            <div
                                key={driver.id}
                                className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                            >
                                <div>
                                    <Link
                                        to={`/drivers/${driver.id}`}
                                        className="text-sm text-zinc-300 underline-offset-4 hover:text-red-300 hover:underline md:text-base"
                                    >
                                        {getCountryFlag(driver.country)} {driver.name}
                                    </Link>
                                    <div className="text-xs text-zinc-500">
                                        {driver.country} · {driver.age}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-sm font-medium text-white">OVR {driver.overall}</div>
                                    <div className="text-xs text-zinc-500">${driver.marketValue.toLocaleString()}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}