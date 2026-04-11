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

    const enrichedDrivers = drivers
        .map((driver) => {
            const teamId = getDriverTeamId(teamRosters, driver.id);
            const team = teams.find((item) => item.id === teamId);

            return {
                ...driver,
                teamId,
                teamName: team?.name ?? null,
                teamCountry: team?.country ?? null,
            };
        })
        .sort((a, b) => b.marketValue - a.marketValue);

    const playerDrivers = enrichedDrivers.filter((driver) => driver.teamId === playerTeamId);
    const rivalDrivers = enrichedDrivers.filter(
        (driver) => driver.teamId && driver.teamId !== playerTeamId
    );
    const freeAgents = getFreeAgents(drivers, teamRosters)
        .map((driver) => ({
            ...driver,
            teamId: null,
            teamName: null,
            teamCountry: null,
        }))
        .sort((a, b) => b.overall - a.overall);

    const prospects = freeAgents.filter((driver) => driver.age <= 21);
    const veterans = freeAgents.filter((driver) => driver.age >= 30);

    function DriverRow({
        driver,
        subtitle,
    }: {
        driver: {
            id: string;
            name: string;
            country: string;
            age: number;
            overall: number;
            marketValue: number;
        };
        subtitle: string;
    }) {
        return (
            <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <div>
                    <Link
                        to={`/drivers/${driver.id}`}
                        className="text-sm text-zinc-300 underline-offset-4 hover:text-red-300 hover:underline md:text-base"
                    >
                        {getCountryFlag(driver.country)} {driver.name}
                    </Link>
                    <div className="text-xs text-zinc-500">{subtitle}</div>
                </div>

                <div className="text-right">
                    <div className="text-sm font-medium text-white">OVR {driver.overall}</div>
                    <div className="text-xs text-zinc-500">${driver.marketValue.toLocaleString()}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Contracts"
                title="Driver Market"
                description="Browse every driver in the database, including your own roster, rival teams, free agents, prospects, and veterans."
            />

            <div className="grid gap-4 md:grid-cols-4">
                <Card title="All Drivers">
                    <div className="text-3xl font-bold text-white">{drivers.length}</div>
                    <div className="mt-2 text-sm text-zinc-400">Complete driver pool.</div>
                </Card>

                <Card title="Your Drivers">
                    <div className="text-3xl font-bold text-white">{playerDrivers.length}</div>
                    <div className="mt-2 text-sm text-zinc-400">Currently signed to your team.</div>
                </Card>

                <Card title="Rival Drivers">
                    <div className="text-3xl font-bold text-white">{rivalDrivers.length}</div>
                    <div className="mt-2 text-sm text-zinc-400">Signed by other teams.</div>
                </Card>

                <Card title="Free Agents">
                    <div className="text-3xl font-bold text-white">{freeAgents.length}</div>
                    <div className="mt-2 text-sm text-zinc-400">Available without a contract.</div>
                </Card>
            </div>

            <Card title="Your Current Lineup">
                <div className="space-y-2">
                    {playerDrivers.length === 0 ? (
                        <div className="text-sm text-zinc-400">No drivers assigned to your team.</div>
                    ) : (
                        playerDrivers.map((driver) => (
                            <DriverRow
                                key={driver.id}
                                driver={driver}
                                subtitle={`${driver.country} · ${driver.age} · Your Team`}
                            />
                        ))
                    )}
                </div>
            </Card>

            <Card title="Rival Team Drivers">
                <div className="space-y-2">
                    {rivalDrivers.length === 0 ? (
                        <div className="text-sm text-zinc-400">No rival drivers found.</div>
                    ) : (
                        rivalDrivers.map((driver) => (
                            <DriverRow
                                key={driver.id}
                                driver={driver}
                                subtitle={`${driver.country} · ${driver.age} · ${driver.teamCountry ? `${getCountryFlag(driver.teamCountry)} ` : ''
                                    }${driver.teamName ?? 'Unknown Team'}`}
                            />
                        ))
                    )}
                </div>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
                <Card title="Top Free Agents">
                    <div className="space-y-2">
                        {freeAgents.length === 0 ? (
                            <div className="text-sm text-zinc-400">No free agents available.</div>
                        ) : (
                            freeAgents.slice(0, 10).map((driver) => (
                                <DriverRow
                                    key={driver.id}
                                    driver={driver}
                                    subtitle={`${driver.country} · ${driver.age} · Free Agent`}
                                />
                            ))
                        )}
                    </div>
                </Card>

                <Card title="Young Prospects">
                    <div className="space-y-2">
                        {prospects.length === 0 ? (
                            <div className="text-sm text-zinc-400">No prospects available.</div>
                        ) : (
                            prospects.map((driver) => (
                                <DriverRow
                                    key={driver.id}
                                    driver={driver}
                                    subtitle={`${driver.country} · ${driver.age} · Prospect`}
                                />
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
                            <DriverRow
                                key={driver.id}
                                driver={driver}
                                subtitle={`${driver.country} · ${driver.age} · Veteran`}
                            />
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}