import { Card } from '../../components/ui/Card';
import { Pill } from '../../components/ui/Pill';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { drivers } from '../../data/drivers';
import { useGameStore } from '../../store/gameStore';

export function TeamPage() {
    const team = useGameStore((state) => state.team);
    const teamDrivers = drivers.filter((driver) => team.drivers.includes(driver.id));

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader eyebrow="Garage" title={team.name} description="Review your current drivers and the core strength of the car package." />

            <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                <Card title="Car Package">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Aero</div>
                            <div className="mt-2 text-2xl font-bold text-white">{team.aero}</div>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Power</div>
                            <div className="mt-2 text-2xl font-bold text-white">{team.power}</div>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Reliability</div>
                            <div className="mt-2 text-2xl font-bold text-white">{team.reliability}</div>
                        </div>
                    </div>
                </Card>

                <Card title="Driver Lineup">
                    <div className="space-y-3">
                        {teamDrivers.map((driver) => (
                            <div key={driver.id} className="rounded-2xl bg-white/5 p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="text-lg font-semibold text-white">{driver.name}</div>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            <Pill>OVR {driver.overall}</Pill>
                                            <Pill>QUALI {driver.qualifying}</Pill>
                                            <Pill>RACE {driver.racecraft}</Pill>
                                        </div>
                                    </div>
                                    <div className="text-sm text-zinc-400">Value: ${driver.marketValue.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}