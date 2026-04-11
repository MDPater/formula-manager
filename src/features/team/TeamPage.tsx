import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Pill } from '../../components/ui/Pill';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { getCountryFlag } from '../../lib/countryFlags';
import { getTeamDrivers } from '../../lib/roster';
import { useGameStore } from '../../store/gameStore';

export function TeamPage() {
    const teams = useGameStore((state) => state.teams);
    const drivers = useGameStore((state) => state.drivers);
    const teamRosters = useGameStore((state) => state.teamRosters);
    const playerTeamId = useGameStore((state) => state.playerTeamId);
    const engineers = useGameStore((state) => state.engineers);
    const pitCrewChiefs = useGameStore((state) => state.pitCrewChiefs);
    const playerEngineerId = useGameStore((state) => state.playerEngineerId);
    const playerPitCrewChiefId = useGameStore((state) => state.playerPitCrewChiefId);

    const playerTeam = teams.find((team) => team.id === playerTeamId) ?? teams[0];
    const teamDrivers = getTeamDrivers(drivers, teamRosters, playerTeamId);
    const engineer = engineers.find((item) => item.id === playerEngineerId) ?? null;
    const pitCrewChief = pitCrewChiefs.find((item) => item.id === playerPitCrewChiefId) ?? null;

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Garage"
                title={`${getCountryFlag(playerTeam.country)} ${playerTeam.name}`}
                description={`Base country: ${playerTeam.country}. Review your drivers, staff, and car package.`}
            />

            <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                <Card title="Car Package">
                    <div className="mb-4 rounded-2xl bg-white/5 p-4">
                        <div className="text-sm text-zinc-400">Team Country</div>
                        <div className="mt-2 text-xl font-bold text-white">
                            {getCountryFlag(playerTeam.country)} {playerTeam.country}
                        </div>
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
                            <div className="mt-2 text-2xl font-bold text-white">{playerTeam.reliability}</div>
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
                                            {getCountryFlag(driver.country)} {driver.name}
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

            <div className="grid gap-4 xl:grid-cols-2">
                <Card title="Engineer">
                    {engineer ? (
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-lg font-semibold text-white">
                                {getCountryFlag(engineer.country)} {engineer.name}
                            </div>
                            <div className="mt-1 text-sm text-zinc-400">
                                {engineer.country} · {engineer.age}
                            </div>
                            <div className="mt-3 text-sm text-zinc-300">
                                Development {engineer.developmentSkill} · Consistency {engineer.consistency}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-zinc-400">No engineer selected.</div>
                    )}
                </Card>

                <Card title="Pit Crew Chief">
                    {pitCrewChief ? (
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-lg font-semibold text-white">
                                {getCountryFlag(pitCrewChief.country)} {pitCrewChief.name}
                            </div>
                            <div className="mt-1 text-sm text-zinc-400">
                                {pitCrewChief.country} · {pitCrewChief.age}
                            </div>
                            <div className="mt-3 text-sm text-zinc-300">
                                Reliability {pitCrewChief.reliabilitySkill} · Consistency {pitCrewChief.consistencySkill}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-zinc-400">No pit crew chief selected.</div>
                    )}
                </Card>
            </div>
        </div>
    );
}