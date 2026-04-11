import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { getCountryFlag } from '../../lib/countryFlags';
import { createSaveId } from '../../lib/persistence';
import { useCareerSetupStore } from '../../store/careerSetupStore';
import { useGameStore } from '../../store/gameStore';

export function CareerSetupPage() {
    const navigate = useNavigate();

    const teams = useGameStore((state) => state.teams);
    const drivers = useGameStore((state) => state.drivers);
    const engineers = useGameStore((state) => state.engineers);
    const pitCrewChiefs = useGameStore((state) => state.pitCrewChiefs);
    const createNewCareerFromSetup = useGameStore((state) => state.createNewCareerFromSetup);

    const saveName = useCareerSetupStore((state) => state.saveName);
    const teamId = useCareerSetupStore((state) => state.teamId);
    const driverIds = useCareerSetupStore((state) => state.driverIds);
    const engineerId = useCareerSetupStore((state) => state.engineerId);
    const pitCrewChiefId = useCareerSetupStore((state) => state.pitCrewChiefId);
    const seasonLength = useCareerSetupStore((state) => state.seasonLength);

    const setSaveName = useCareerSetupStore((state) => state.setSaveName);
    const setTeamId = useCareerSetupStore((state) => state.setTeamId);
    const setDriverIds = useCareerSetupStore((state) => state.setDriverIds);
    const setEngineerId = useCareerSetupStore((state) => state.setEngineerId);
    const setPitCrewChiefId = useCareerSetupStore((state) => state.setPitCrewChiefId);
    const setSeasonLength = useCareerSetupStore((state) => state.setSeasonLength);
    const resetSetup = useCareerSetupStore((state) => state.reset);

    useEffect(() => {
        if (!teamId && teams[0]) {
            setTeamId(teams[0].id);
        }
    }, [teamId, teams, setTeamId]);

    const selectedTeam = teams.find((team) => team.id === teamId) ?? teams[0];

    const availableDrivers = useMemo(
        () => [...drivers].sort((a, b) => b.marketValue - a.marketValue),
        [drivers]
    );

    const selectedDrivers = drivers.filter((driver) => driverIds.includes(driver.id));
    const selectedEngineer = engineers.find((item) => item.id === engineerId) ?? null;
    const selectedPitCrewChief =
        pitCrewChiefs.find((item) => item.id === pitCrewChiefId) ?? null;

    const spent =
        selectedDrivers.reduce((sum, driver) => sum + driver.marketValue, 0) +
        (selectedEngineer?.salary ?? 0) +
        (selectedPitCrewChief?.salary ?? 0);

    const remainingBudget = (selectedTeam?.budget ?? 0) - spent;

    const canStart =
        Boolean(selectedTeam) &&
        driverIds.length === 2 &&
        Boolean(engineerId) &&
        Boolean(pitCrewChiefId) &&
        remainingBudget >= 0 &&
        saveName.trim().length > 0;

    function toggleDriver(driverIdToToggle: string) {
        if (driverIds.includes(driverIdToToggle)) {
            setDriverIds(driverIds.filter((id) => id !== driverIdToToggle));
            return;
        }

        if (driverIds.length >= 2) return;
        setDriverIds([...driverIds, driverIdToToggle]);
    }

    function getTeamTier(teamBudget: number) {
        if (teamBudget >= 60000000) return 'Top Team';
        if (teamBudget >= 47000000) return 'Midfield';
        return 'Backmarker';
    }

    function handleStartCareer() {
        if (!selectedTeam || !canStart) return;

        createNewCareerFromSetup({
            saveId: createSaveId(),
            saveName: saveName.trim(),
            teamId: selectedTeam.id,
            driverIds,
            engineerId,
            pitCrewChiefId,
            seasonLength,
        });

        resetSetup();
        navigate('/');
    }

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Career Setup"
                title="Build Your First Season"
                description="Pick a team, sign two drivers, hire staff, choose the season length, and begin."
            />

            <Card title="Career Name">
                <input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    placeholder="Career name"
                />
            </Card>

            <Card title="1. Select Team">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {teams.map((team) => {
                        const isSelected = team.id === teamId;

                        return (
                            <button
                                key={team.id}
                                onClick={() => setTeamId(team.id)}
                                className={`rounded-2xl border p-4 text-left transition ${isSelected
                                        ? 'border-red-500/40 bg-red-500/10'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className="text-lg font-semibold text-white">
                                    {getCountryFlag(team.country)} {team.name}
                                </div>
                                <div className="mt-1 text-sm text-zinc-400">
                                    {team.country} · {getTeamTier(team.budget)}
                                </div>
                                <div className="mt-3 text-sm text-zinc-300">
                                    Budget: ${team.budget.toLocaleString()}
                                </div>
                                <div className="mt-2 text-xs text-zinc-500">
                                    Aero {team.aero} · Power {team.power} · Reliability {team.reliability}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Card>

            <Card title="2. Select Two Drivers">
                <div className="mb-4 text-sm text-zinc-400">Selected: {driverIds.length}/2</div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {availableDrivers.map((driver) => {
                        const selected = driverIds.includes(driver.id);
                        const disabled = !selected && driverIds.length >= 2;

                        return (
                            <button
                                key={driver.id}
                                disabled={disabled}
                                onClick={() => toggleDriver(driver.id)}
                                className={`rounded-2xl border p-4 text-left transition ${selected
                                        ? 'border-red-500/40 bg-red-500/10'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                    } ${disabled ? 'opacity-50' : ''}`}
                            >
                                <div className="text-lg font-semibold text-white">
                                    {getCountryFlag(driver.country)} {driver.name}
                                </div>
                                <div className="mt-1 text-sm text-zinc-400">
                                    {driver.country} · {driver.age}
                                </div>
                                <div className="mt-2 text-sm text-zinc-300">
                                    Value: ${driver.marketValue.toLocaleString()}
                                </div>
                                <div className="mt-2 text-xs text-zinc-500">
                                    OVR {driver.overall} · QUALI {driver.qualifying} · RACE {driver.racecraft}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Card>

            <Card title="3. Select Engineer">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {engineers.map((engineer) => (
                        <button
                            key={engineer.id}
                            onClick={() => setEngineerId(engineer.id)}
                            className={`rounded-2xl border p-4 text-left transition ${engineerId === engineer.id
                                    ? 'border-red-500/40 bg-red-500/10'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                                }`}
                        >
                            <div className="text-lg font-semibold text-white">
                                {getCountryFlag(engineer.country)} {engineer.name}
                            </div>
                            <div className="mt-1 text-sm text-zinc-400">
                                {engineer.country} · {engineer.age}
                            </div>
                            <div className="mt-2 text-sm text-zinc-300">
                                Salary: ${engineer.salary.toLocaleString()}
                            </div>
                            <div className="mt-2 text-xs text-zinc-500">
                                Dev {engineer.developmentSkill} · Consistency {engineer.consistency}
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            <Card title="4. Select Pit Crew Chief">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {pitCrewChiefs.map((chief) => (
                        <button
                            key={chief.id}
                            onClick={() => setPitCrewChiefId(chief.id)}
                            className={`rounded-2xl border p-4 text-left transition ${pitCrewChiefId === chief.id
                                    ? 'border-red-500/40 bg-red-500/10'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                                }`}
                        >
                            <div className="text-lg font-semibold text-white">
                                {getCountryFlag(chief.country)} {chief.name}
                            </div>
                            <div className="mt-1 text-sm text-zinc-400">
                                {chief.country} · {chief.age}
                            </div>
                            <div className="mt-2 text-sm text-zinc-300">
                                Salary: ${chief.salary.toLocaleString()}
                            </div>
                            <div className="mt-2 text-xs text-zinc-500">
                                Reliability {chief.reliabilitySkill} · Consistency {chief.consistencySkill}
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            <Card title="5. Season Length">
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'Short', value: 10 },
                        { label: 'Medium', value: 15 },
                        { label: 'Long', value: 20 },
                    ].map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setSeasonLength(option.value)}
                            className={`rounded-2xl px-5 py-3 transition ${seasonLength === option.value
                                    ? 'bg-red-500 text-white'
                                    : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                                }`}
                        >
                            {option.label} · {option.value} races
                        </button>
                    ))}
                </div>
            </Card>

            <Card title="Summary">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-sm text-zinc-400">Team</div>
                        <div className="mt-1 text-lg font-semibold text-white">{selectedTeam?.name}</div>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-sm text-zinc-400">Drivers Cost</div>
                        <div className="mt-1 text-lg font-semibold text-white">
                            ${selectedDrivers.reduce((sum, d) => sum + d.marketValue, 0).toLocaleString()}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-sm text-zinc-400">Staff Cost</div>
                        <div className="mt-1 text-lg font-semibold text-white">
                            ${(
                                (selectedEngineer?.salary ?? 0) + (selectedPitCrewChief?.salary ?? 0)
                            ).toLocaleString()}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-sm text-zinc-400">Season Length</div>
                        <div className="mt-1 text-lg font-semibold text-white">{seasonLength} races</div>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-sm text-zinc-400">Remaining Budget</div>
                        <div
                            className={`mt-1 text-lg font-semibold ${remainingBudget >= 0 ? 'text-white' : 'text-red-400'
                                }`}
                        >
                            ${remainingBudget.toLocaleString()}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleStartCareer}
                    disabled={!canStart}
                    className={`mt-6 rounded-2xl px-5 py-3 font-semibold transition ${canStart ? 'bg-red-500 text-white hover:opacity-90' : 'bg-white/10 text-zinc-500'
                        }`}
                >
                    Start Career
                </button>
            </Card>
        </div>
    );
}