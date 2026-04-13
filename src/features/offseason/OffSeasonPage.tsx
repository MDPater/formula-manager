import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { getCountryFlag } from '../../lib/countryFlags';
import {
    getDriverDemandPrice,
    getEngineerDemandPrice,
    getFreeAgentDrivers,
    getPitCrewChiefDemandPrice,
} from '../../lib/offseasonMarket';
import { getDriverTeamId } from '../../lib/roster';
import { useGameStore } from '../../store/gameStore';

type ActiveTab = 'drivers' | 'staff';

export function OffSeasonPage() {
    const navigate = useNavigate();

    const isSeasonComplete = useGameStore((state) => state.isSeasonComplete);
    const teams = useGameStore((state) => state.teams);
    const drivers = useGameStore((state) => state.drivers);
    const engineers = useGameStore((state) => state.engineers);
    const pitCrewChiefs = useGameStore((state) => state.pitCrewChiefs);
    const teamRosters = useGameStore((state) => state.teamRosters);
    const playerTeamId = useGameStore((state) => state.playerTeamId);
    const playerEngineerId = useGameStore((state) => state.playerEngineerId);
    const playerPitCrewChiefId = useGameStore((state) => state.playerPitCrewChiefId);

    const signDriverForPlayer = useGameStore((state) => state.signDriverForPlayer);
    const replacePlayerDriver = useGameStore((state) => state.replacePlayerDriver);
    const hireEngineerForPlayer = useGameStore((state) => state.hireEngineerForPlayer);
    const hirePitCrewChiefForPlayer = useGameStore((state) => state.hirePitCrewChiefForPlayer);
    const resolveAiOffseasonMoves = useGameStore((state) => state.resolveAiOffseasonMoves);
    const startNextSeason = useGameStore((state) => state.startNextSeason);

    const [tab, setTab] = useState<ActiveTab>('drivers');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [selectedOutgoingDriverId, setSelectedOutgoingDriverId] = useState<string | null>(null);
    const [busyDriverId, setBusyDriverId] = useState<string | null>(null);
    const [busyEngineerId, setBusyEngineerId] = useState<string | null>(null);
    const [busyChiefId, setBusyChiefId] = useState<string | null>(null);
    const [finalizing, setFinalizing] = useState(false);

    const playerDriverIds = teamRosters[playerTeamId] ?? [];
    const currentEngineer = engineers.find((item) => item.id === playerEngineerId) ?? null;
    const currentPitCrewChief =
        pitCrewChiefs.find((item) => item.id === playerPitCrewChiefId) ?? null;

    const latestSummary = useGameStore((state) => state.seasonSummaries[state.seasonSummaries.length - 1]);

    const playerTeam = teams.find((team) => team.id === playerTeamId) ?? teams[0];

    const pendingRetirementIds = new Set(
        (latestSummary?.retirements ?? [])
            .filter((entry) => entry.teamId === playerTeamId)
            .map((entry) => entry.driverId)
    );

    const pendingIncomingDrivers = (latestSummary?.newDrivers ?? []).filter(
        (entry) => entry.teamId === playerTeamId
    );

    const rawPlayerDriverIds = teamRosters[playerTeamId] ?? [];
    const visiblePlayerDriverIds = rawPlayerDriverIds.filter((id) => !pendingRetirementIds.has(id));

    const playerDrivers = drivers.filter((driver) => visiblePlayerDriverIds.includes(driver.id));

    const freeAgents = useMemo(
        () =>
            getFreeAgentDrivers(drivers, teamRosters)
                .slice()
                .sort((a, b) => b.overall - a.overall),
        [drivers, teamRosters]
    );

    const rivalDrivers = useMemo(
        () =>
            drivers
                .map((driver) => {
                    const teamId = getDriverTeamId(teamRosters, driver.id);
                    if (!teamId || teamId === playerTeamId) return null;

                    const team = teams.find((item) => item.id === teamId);

                    return {
                        ...driver,
                        currentTeamId: teamId,
                        currentTeamName: team?.name ?? 'Unknown Team',
                        currentTeamCountry: team?.country ?? '',
                    };
                })
                .filter(
                    (
                        driver
                    ): driver is NonNullable<typeof driver> => Boolean(driver)
                )
                .sort((a, b) => b.overall - a.overall),
        [drivers, teamRosters, playerTeamId, teams]
    );

    const availableEngineers = useMemo(
        () => [...engineers].sort((a, b) => b.developmentSkill - a.developmentSkill),
        [engineers]
    );

    const availableChiefs = useMemo(
        () =>
            [...pitCrewChiefs].sort(
                (a, b) =>
                    b.reliabilitySkill + b.consistencySkill - (a.reliabilitySkill + a.consistencySkill)
            ),
        [pitCrewChiefs]
    );

    if (!isSeasonComplete) {
        return (
            <div className="space-y-6">
                <SectionHeader
                    eyebrow="Offseason"
                    title="Offseason Locked"
                    description="Finish the season first to access offseason signings."
                />
            </div>
        );
    }

    async function handleAcquireDriver(driverId: string) {
        setBusyDriverId(driverId);

        let result;
        if (playerDriverIds.length < 2) {
            result = signDriverForPlayer(driverId);
        } else if (selectedOutgoingDriverId) {
            result = replacePlayerDriver(selectedOutgoingDriverId, driverId);
        } else {
            result = {
                ok: false,
                message: 'Select one of your current drivers to replace first.',
            };
        }

        setStatusMessage(result.message);
        setBusyDriverId(null);
    }

    async function handleHireEngineer(engineerId: string) {
        setBusyEngineerId(engineerId);
        const result = hireEngineerForPlayer(engineerId);
        setStatusMessage(result.message);
        setBusyEngineerId(null);
    }

    async function handleHireChief(chiefId: string) {
        setBusyChiefId(chiefId);
        const result = hirePitCrewChiefForPlayer(chiefId);
        setStatusMessage(result.message);
        setBusyChiefId(null);
    }

    function handleFinalizeOffseason() {
        setFinalizing(true);
        resolveAiOffseasonMoves();
        startNextSeason();
        navigate('/');
    }

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Offseason"
                title="Driver & Staff Market"
                description="Upgrade your lineup before the new season begins."
            />

            <div className="grid gap-4 md:grid-cols-4">
                <Card title="Team">
                    <div className="text-lg font-semibold text-white">
                        {getCountryFlag(playerTeam.country)} {playerTeam.name}
                    </div>
                    <div className="mt-2 text-sm text-zinc-400">{playerTeam.country}</div>
                </Card>

                <Card title="Budget">
                    <div className="text-3xl font-bold text-white">
                        ${playerTeam.budget.toLocaleString()}
                    </div>
                    <div className="mt-2 text-sm text-zinc-400">Available for offseason spending</div>
                </Card>

                <Card title="Drivers">
                    <div className="text-3xl font-bold text-white">
                        {playerDrivers.length + pendingIncomingDrivers.length}/2
                    </div>
                    <div className="mt-2 text-sm text-zinc-400">
                        Seats after pending retirements and replacements
                    </div>
                </Card>

                <Card title="Current Staff">
                    <div className="text-sm text-white">
                        {currentEngineer ? currentEngineer.name : 'No Engineer'}
                    </div>
                    <div className="mt-1 text-sm text-white">
                        {currentPitCrewChief ? currentPitCrewChief.name : 'No Pit Crew Chief'}
                    </div>
                </Card>
            </div>

            {statusMessage ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                    {statusMessage}
                </div>
            ) : null}

            {(latestSummary?.retirements?.length || latestSummary?.newDrivers?.length) ? (
                <Card title="Pending Offseason Changes">
                    <div className="grid gap-4 xl:grid-cols-2">
                        <div>
                            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-zinc-500">
                                Retiring From Your Team
                            </div>
                            <div className="space-y-2">
                                {(latestSummary?.retirements ?? [])
                                    .filter((entry) => entry.teamId === playerTeamId)
                                    .map((entry) => (
                                        <div key={entry.driverId} className="rounded-2xl bg-white/5 px-4 py-3">
                                            <div className="text-white">
                                                {getCountryFlag(entry.country)} {entry.name}
                                            </div>
                                            <div className="text-xs text-zinc-400">
                                                Age {entry.age} · OVR {entry.overall} · {entry.reason}
                                            </div>
                                        </div>
                                    ))}
                                {(latestSummary?.retirements ?? []).filter((entry) => entry.teamId === playerTeamId).length === 0 ? (
                                    <div className="text-sm text-zinc-400">No player-team retirements.</div>
                                ) : null}
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-zinc-500">
                                Incoming To Your Team
                            </div>
                            <div className="space-y-2">
                                {pendingIncomingDrivers.map((entry) => (
                                    <div key={entry.driverId} className="rounded-2xl bg-white/5 px-4 py-3">
                                        <div className="text-white">
                                            {getCountryFlag(entry.country)} {entry.name}
                                        </div>
                                        <div className="text-xs text-zinc-400">
                                            Age {entry.age} · OVR {entry.overall} · {entry.archetype}
                                        </div>
                                    </div>
                                ))}
                                {pendingIncomingDrivers.length === 0 ? (
                                    <div className="text-sm text-zinc-400">No incoming drivers.</div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </Card>
            ) : null}

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => setTab('drivers')}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium ${tab === 'drivers'
                        ? 'bg-red-500 text-white'
                        : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                        }`}
                >
                    Driver Market
                </button>

                <button
                    onClick={() => setTab('staff')}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium ${tab === 'staff'
                        ? 'bg-red-500 text-white'
                        : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                        }`}
                >
                    Staff Market
                </button>
            </div>

            {tab === 'drivers' ? (
                <div className="space-y-4">
                    <Card title="Your Current Drivers">
                        <div className="space-y-2">
                            {playerDrivers.map((driver) => {
                                const selected = selectedOutgoingDriverId === driver.id;

                                return (
                                    <button
                                        key={driver.id}
                                        onClick={() =>
                                            setSelectedOutgoingDriverId((current) =>
                                                current === driver.id ? null : driver.id
                                            )
                                        }
                                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${selected
                                            ? 'border-red-500/40 bg-red-500/10'
                                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div>
                                            <div className="text-white">
                                                {getCountryFlag(driver.country)} {driver.name}
                                            </div>
                                            <div className="text-xs text-zinc-400">
                                                {driver.country} · Age {driver.age} · OVR {driver.overall}
                                            </div>
                                        </div>

                                        <div className="text-xs text-zinc-400">
                                            {selected ? 'Selected for replacement' : 'Click to replace'}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    <Card title="Free Agents">
                        <div className="space-y-2">
                            {freeAgents.length === 0 ? (
                                <div className="text-sm text-zinc-400">No free agents available.</div>
                            ) : (
                                freeAgents.map((driver) => {
                                    const price = getDriverDemandPrice(driver, false);
                                    const needsReplacement = playerDriverIds.length >= 2 && !selectedOutgoingDriverId;

                                    const disabled =
                                        playerTeam.budget < price ||
                                        busyDriverId === driver.id ||
                                        needsReplacement;

                                    return (
                                        <div
                                            key={driver.id}
                                            className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                                        >
                                            <div>
                                                <div className="text-white">
                                                    {getCountryFlag(driver.country)} {driver.name}
                                                </div>
                                                <div className="text-xs text-zinc-400">
                                                    {driver.country} · Age {driver.age} · OVR {driver.overall}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-white">
                                                        ${price.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-zinc-500">Free agent deal</div>
                                                </div>

                                                <button
                                                    disabled={disabled}
                                                    onClick={() => handleAcquireDriver(driver.id)}
                                                    className={`rounded-xl px-3 py-2 text-sm font-medium ${disabled
                                                        ? 'bg-white/10 text-zinc-500'
                                                        : 'bg-red-500 text-white hover:opacity-90'
                                                        }`}
                                                >
                                                    {playerDriverIds.length < 2 ? 'Sign' : 'Replace'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>

                    <Card title="Drivers From Rival Teams">
                        <div className="space-y-2">
                            {rivalDrivers.length === 0 ? (
                                <div className="text-sm text-zinc-400">No rival drivers available.</div>
                            ) : (
                                rivalDrivers.map((driver) => {
                                    const price = getDriverDemandPrice(driver, true);
                                    const needsReplacement = playerDriverIds.length >= 2 && !selectedOutgoingDriverId;

                                    const disabled =
                                        playerTeam.budget < price ||
                                        busyDriverId === driver.id ||
                                        needsReplacement;

                                    return (
                                        <div
                                            key={driver.id}
                                            className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                                        >
                                            <div>
                                                <div className="text-white">
                                                    {getCountryFlag(driver.country)} {driver.name}
                                                </div>
                                                <div className="text-xs text-zinc-400">
                                                    {driver.country} · Age {driver.age} · OVR {driver.overall}
                                                </div>
                                                <div className="text-xs text-zinc-500">
                                                    Currently at {getCountryFlag(driver.currentTeamCountry)} {driver.currentTeamName}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-white">
                                                        ${price.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-zinc-500">Buyout</div>
                                                </div>

                                                <button
                                                    disabled={disabled}
                                                    onClick={() => handleAcquireDriver(driver.id)}
                                                    className={`rounded-xl px-3 py-2 text-sm font-medium ${disabled
                                                        ? 'bg-white/10 text-zinc-500'
                                                        : 'bg-red-500 text-white hover:opacity-90'
                                                        }`}
                                                >
                                                    {playerDriverIds.length < 2 ? 'Buy' : 'Replace'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    <Card title="Engineer Market">
                        <div className="space-y-2">
                            {availableEngineers.map((engineer) => {
                                const price = getEngineerDemandPrice(engineer);
                                const isCurrent = playerEngineerId === engineer.id;
                                const disabled =
                                    isCurrent || playerTeam.budget < price || busyEngineerId === engineer.id;

                                return (
                                    <div
                                        key={engineer.id}
                                        className={`flex items-center justify-between rounded-2xl px-4 py-3 ${isCurrent ? 'bg-white/10 opacity-60' : 'bg-white/5'
                                            }`}
                                    >
                                        <div>
                                            <div className="text-white">
                                                {getCountryFlag(engineer.country)} {engineer.name}
                                            </div>
                                            <div className="text-xs text-zinc-400">
                                                Dev {engineer.developmentSkill} · Consistency {engineer.consistency}
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                Age {engineer.age}
                                                {isCurrent ? ' · Current Engineer' : ''}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-white">
                                                    ${price.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-zinc-500">Season salary</div>
                                            </div>

                                            <button
                                                disabled={disabled}
                                                onClick={() => handleHireEngineer(engineer.id)}
                                                className={`rounded-xl px-3 py-2 text-sm font-medium ${disabled
                                                    ? 'bg-white/10 text-zinc-500'
                                                    : 'bg-red-500 text-white hover:opacity-90'
                                                    }`}
                                            >
                                                Hire
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <Card title="Pit Crew Chief Market">
                        <div className="space-y-2">
                            {availableChiefs.map((chief) => {
                                const price = getPitCrewChiefDemandPrice(chief);
                                const isCurrent = playerPitCrewChiefId === chief.id;
                                const disabled =
                                    isCurrent || playerTeam.budget < price || busyChiefId === chief.id;

                                return (
                                    <div
                                        key={chief.id}
                                        className={`flex items-center justify-between rounded-2xl px-4 py-3 ${isCurrent ? 'bg-white/10 opacity-60' : 'bg-white/5'
                                            }`}
                                    >
                                        <div>
                                            <div className="text-white">
                                                {getCountryFlag(chief.country)} {chief.name}
                                            </div>
                                            <div className="text-xs text-zinc-400">
                                                Reliability {chief.reliabilitySkill} · Consistency {chief.consistencySkill}
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                Age {chief.age}
                                                {isCurrent ? ' · Current Crew Chief' : ''}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-white">
                                                    ${price.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-zinc-500">Season salary</div>
                                            </div>

                                            <button
                                                disabled={disabled}
                                                onClick={() => handleHireChief(chief.id)}
                                                className={`rounded-xl px-3 py-2 text-sm font-medium ${disabled
                                                    ? 'bg-white/10 text-zinc-500'
                                                    : 'bg-red-500 text-white hover:opacity-90'
                                                    }`}
                                            >
                                                Hire
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            )}

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleFinalizeOffseason}
                    disabled={finalizing}
                    className={`rounded-2xl px-5 py-3 font-semibold ${finalizing
                        ? 'bg-white/10 text-zinc-500'
                        : 'bg-red-500 text-white hover:opacity-90'
                        }`}
                >
                    Finalize Offseason & Start Next Season
                </button>

                <button
                    onClick={() => navigate('/season-overview')}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-zinc-300 hover:bg-white/10"
                >
                    Back to Season Overview
                </button>
            </div>
        </div>
    );
}