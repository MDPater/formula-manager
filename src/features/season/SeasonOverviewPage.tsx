import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { getCountryFlag } from '../../lib/countryFlags';
import { useGameStore } from '../../store/gameStore';

function getDriverSeasonPosition(
    history: ReturnType<typeof useGameStore.getState>['history'],
    seasonNumber: number,
    driverId: string
) {
    const pointsByDriver = new Map<string, number>();

    for (const race of history.filter((entry) => entry.seasonNumber === seasonNumber)) {
        for (const result of race.results) {
            pointsByDriver.set(
                result.driverId,
                (pointsByDriver.get(result.driverId) ?? 0) + result.points
            );
        }
    }

    const sorted = [...pointsByDriver.entries()].sort((a, b) => b[1] - a[1]);
    return sorted.findIndex(([id]) => id === driverId) + 1;
}

export function SeasonOverviewPage() {
    const navigate = useNavigate();

    const currentSeasonNumber = useGameStore((state) => state.seasonNumber);
    const seasonSummaries = useGameStore((state) => state.seasonSummaries);
    const drivers = useGameStore((state) => state.drivers);
    const teams = useGameStore((state) => state.teams);
    const engineers = useGameStore((state) => state.engineers);
    const pitCrewChiefs = useGameStore((state) => state.pitCrewChiefs);
    const playerEngineerId = useGameStore((state) => state.playerEngineerId);
    const playerPitCrewChiefId = useGameStore((state) => state.playerPitCrewChiefId);
    const playerTeamId = useGameStore((state) => state.playerTeamId);
    const history = useGameStore((state) => state.history);
    const startNextSeason = useGameStore((state) => state.startNextSeason);

    const latest = seasonSummaries[seasonSummaries.length - 1];
    const engineer = engineers.find((item) => item.id === playerEngineerId) ?? null;
    const pitCrewChief = pitCrewChiefs.find((item) => item.id === playerPitCrewChiefId) ?? null;
    const playerTeam = teams.find((team) => team.id === playerTeamId) ?? null;

    if (!latest) {
        return (
            <div className="space-y-6">
                <SectionHeader
                    eyebrow="Season Review"
                    title="No Season Summary"
                    description="Finish a season to unlock the season overview."
                />
            </div>
        );
    }

    const championDriver = drivers.find((d) => d.id === latest.championDriverId);
    const championTeam = teams.find((t) => t.id === latest.championTeamId);

    const mostImproved = latest.driverProgressions.filter((entry) => entry.deltaOverall > 0);
    const mostDeclined = latest.driverProgressions.filter((entry) => entry.deltaOverall < 0);

    function handleStartNextSeason() {
        startNextSeason();
        navigate('/');
    }

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Season Review"
                title={`${latest.seasonNumber} Championship Complete`}
                description="Review the final standings, driver development, retirements, and incoming talent before starting the next season."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card title="Drivers' Champion">
                    <div className="text-sm text-zinc-400">Best driver this season</div>
                    <div className="mt-2 text-xl font-semibold text-white">
                        {championDriver ? `${getCountryFlag(championDriver.country)} ${championDriver.name}` : '—'}
                    </div>
                </Card>

                <Card title="Constructors' Champion">
                    <div className="text-sm text-zinc-400">Best team this season</div>
                    <div className="mt-2 text-xl font-semibold text-white">
                        {championTeam ? `${getCountryFlag(championTeam.country)} ${championTeam.name}` : '—'}
                    </div>
                </Card>

                <Card title="Your Final Position">
                    <div className="text-sm text-zinc-400">Where your team finished</div>
                    <div className="mt-2 text-xl font-semibold text-white">
                        {latest.playerTeamPosition ? `P${latest.playerTeamPosition}` : '—'}
                    </div>
                </Card>

                <Card title="Next Season Year">
                    <div className="text-sm text-zinc-400">Calendar year</div>
                    <div className="mt-2 text-xl font-semibold text-white">{currentSeasonNumber + 1}</div>
                </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <Card title="Your Team Summary">
                    <div className="space-y-3">
                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Team</div>
                            <div className="mt-1 text-lg font-semibold text-white">
                                {playerTeam ? `${getCountryFlag(playerTeam.country)} ${playerTeam.name}` : '—'}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Engineer</div>
                            <div className="mt-1 text-lg font-semibold text-white">
                                {engineer ? `${getCountryFlag(engineer.country)} ${engineer.name} · Age ${engineer.age}` : '—'}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white/5 p-4">
                            <div className="text-sm text-zinc-400">Pit Crew Chief</div>
                            <div className="mt-1 text-lg font-semibold text-white">
                                {pitCrewChief ? `${getCountryFlag(pitCrewChief.country)} ${pitCrewChief.name} · Age ${pitCrewChief.age}` : '—'}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Your Drivers">
                    <div className="mb-3 grid grid-cols-[1.2fr_80px_80px_90px_80px] px-2 text-xs uppercase tracking-[0.25em] text-zinc-500">
                        <span>Driver</span>
                        <span className="text-right">Pos</span>
                        <span className="text-right">Pts</span>
                        <span className="text-right">Wins</span>
                        <span className="text-right">Pods</span>
                    </div>

                    <div className="space-y-3">
                        {latest.playerDriverResults.map((entry) => {
                            const driver = drivers.find((d) => d.id === entry.driverId);
                            const position = getDriverSeasonPosition(history, latest.seasonNumber, entry.driverId);

                            return (
                                <div
                                    key={entry.driverId}
                                    className="grid grid-cols-[1.2fr_80px_80px_90px_80px] items-center rounded-2xl bg-white/5 px-4 py-3"
                                >
                                    <div>
                                        <div className="text-white">
                                            {driver ? `${getCountryFlag(driver.country)} ${driver.name}` : entry.driverId}
                                        </div>
                                        <div className="text-xs text-zinc-400">{driver?.country ?? ''}</div>
                                    </div>
                                    <div className="text-right text-white">{position ? `P${position}` : '—'}</div>
                                    <div className="text-right text-white">{entry.points}</div>
                                    <div className="text-right text-white">{entry.wins}</div>
                                    <div className="text-right text-white">{entry.podiums}</div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <Card title="Most Improved Drivers">
                    {mostImproved.length === 0 ? (
                        <div className="text-sm text-zinc-400">No drivers improved overall this season.</div>
                    ) : (
                        <div className="space-y-2">
                            {mostImproved.slice(0, 8).map((entry) => {
                                const driver = drivers.find((d) => d.id === entry.driverId);

                                return (
                                    <div
                                        key={entry.driverId}
                                        className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                                    >
                                        <div>
                                            <div className="text-white">
                                                {driver ? `${getCountryFlag(driver.country)} ${driver.name}` : entry.driverId}
                                            </div>
                                            <div className="text-xs text-zinc-400">
                                                Age {entry.oldAge} → {entry.newAge}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-white">
                                                {entry.oldOverall} → {entry.newOverall}
                                            </div>
                                            <div className="text-xs text-emerald-400">+{entry.deltaOverall}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                <Card title="Biggest Declines">
                    {mostDeclined.length === 0 ? (
                        <div className="text-sm text-zinc-400">No drivers declined overall this season.</div>
                    ) : (
                        <div className="space-y-2">
                            {mostDeclined.slice(0, 8).map((entry) => {
                                const driver = drivers.find((d) => d.id === entry.driverId);

                                return (
                                    <div
                                        key={entry.driverId}
                                        className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                                    >
                                        <div>
                                            <div className="text-white">
                                                {driver ? `${getCountryFlag(driver.country)} ${driver.name}` : entry.driverId}
                                            </div>
                                            <div className="text-xs text-zinc-400">
                                                Age {entry.oldAge} → {entry.newAge}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-white">
                                                {entry.oldOverall} → {entry.newOverall}
                                            </div>
                                            <div className="text-xs text-red-400">{entry.deltaOverall}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <Card title="Retirements">
                    {latest.retirements.length === 0 ? (
                        <div className="text-sm text-zinc-400">No retirements this offseason.</div>
                    ) : (
                        <div className="space-y-2">
                            {latest.retirements.map((entry) => (
                                <div
                                    key={entry.driverId}
                                    className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                                >
                                    <div>
                                        <div className="text-white">
                                            {getCountryFlag(entry.country)} {entry.name}
                                        </div>
                                        <div className="text-xs text-zinc-400">
                                            Age {entry.age} · OVR {entry.overall}
                                        </div>
                                    </div>

                                    <div className="text-right text-xs text-zinc-400">{entry.reason}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card title="New Drivers Entering The Grid">
                    {latest.newDrivers.length === 0 ? (
                        <div className="text-sm text-zinc-400">No new drivers generated.</div>
                    ) : (
                        <div className="space-y-2">
                            {latest.newDrivers.map((entry) => (
                                <div
                                    key={entry.driverId}
                                    className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                                >
                                    <div>
                                        <div className="text-white">
                                            {getCountryFlag(entry.country)} {entry.name}
                                        </div>
                                        <div className="text-xs text-zinc-400">
                                            Age {entry.age} · OVR {entry.overall}
                                        </div>
                                    </div>

                                    <div className="text-right text-xs uppercase tracking-[0.2em] text-zinc-400">
                                        {entry.archetype}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            <div className="flex flex-wrap gap-3">
                <Link
                    to="/offseason"
                    className="rounded-2xl bg-red-500 px-5 py-3 font-semibold text-white hover:opacity-90"
                >
                    Enter Offseason Market
                </Link>

                <button
                    onClick={handleStartNextSeason}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-zinc-300 hover:bg-white/10"
                >
                    Skip Market & Start Next Season
                </button>

                <Link
                    to="/results"
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-zinc-300 hover:bg-white/10"
                >
                    View Results
                </Link>
            </div>
        </div>
    );
}