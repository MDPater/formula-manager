import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Pill } from '../../components/ui/Pill';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useGameStore } from '../../store/gameStore';

export function TeamPage() {
    const teams = useGameStore((state) => state.teams);
    const drivers = useGameStore((state) => state.drivers);
    const playerTeamId = useGameStore((state) => state.playerTeamId);

    const playerTeam = teams.find((team) => team.id === playerTeamId) ?? teams[0];
    const teamDrivers = drivers.filter((driver) => playerTeam.drivers.includes(driver.id));

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Garage"
                title={playerTeam.name}
                description={`Base country: ${playerTeam.country}. Review your current drivers and the core strength of the car package.`}
            />

            <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                <Card title="Car Package">
                    <div className="mb-4 rounded-2xl bg-white/5 p-4">
                        <div className="text-sm text-zinc-400">Team Country</div>
                        <div className="mt-2 text-xl font-bold text-white">{playerTeam.country}</div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Aero</div>
                            <div className="mt-2 text-2xl font-bold text-white">{playerTeam.aero}</div>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Power</div>
                            <div className="mt-2 text-2xl font-bold text-white">{playerTeam.power}</div>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Reliability</div>
                            <div className="mt-2 text-2xl font-bold text-white">
                                {playerTeam.reliability}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Driver Lineup">
                    <div className="space-y-3">
                        {teamDrivers.map((driver) => (
                            <div key={driver.id} className="rounded-2xl bg-white/5 p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <Link
                                            to={`/drivers/${driver.id}`}
                                            className="text-lg font-semibold text-white underline-offset-4 hover:text-red-300 hover:underline"
                                        >
                                            {driver.name}
                                        </Link>
                                        <div className="mt-1 text-sm text-zinc-400">
                                            {driver.country} · {driver.age} years old
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <Pill>OVR {driver.overall}</Pill>
                                            <Pill>QUALI {driver.qualifying}</Pill>
                                            <Pill>RACE {driver.racecraft}</Pill>
                                        </div>
                                    </div>
                                    <div className="text-sm text-zinc-400">
                                        Value: ${driver.marketValue.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}