import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useGameStore } from '../../store/gameStore';
import type { UpdatePlanMode } from '../season/types';

export function FactoryPage() {
    const playerTeam = useGameStore((state) =>
        state.teams.find((team) => team.id === state.playerTeamId)
    );
    const playerEngineer = useGameStore((state) =>
        state.engineers.find((engineer) => engineer.id === state.playerEngineerId)
    );
    const playerChief = useGameStore((state) =>
        state.pitCrewChiefs.find((chief) => chief.id === state.playerPitCrewChiefId)
    );
    const updatePlan = useGameStore((state) => state.updatePlan);
    const updatesRemaining = useGameStore((state) => state.updatesRemaining);
    const updatesUsedThisSeason = useGameStore((state) => state.updatesUsedThisSeason);
    const setUpdatePlan = useGameStore((state) => state.setUpdatePlan);
    const getUpgradeQuote = useGameStore((state) => state.getUpgradeQuote);
    const confirmCarUpgrade = useGameStore((state) => state.confirmCarUpgrade);

    const [selectedPart, setSelectedPart] = useState<'aero' | 'power' | 'reliability' | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const selectedQuote = selectedPart ? getUpgradeQuote(selectedPart) : null;

    const partLabels = {
        aero: 'Aerodynamics',
        power: 'Power Unit',
        reliability: 'Reliability',
    };

    const planDescriptions: Record<UpdatePlanMode, string> = {
        safe: '2-3 updates most seasons, larger gains and best reliability.',
        medium: 'Balanced output with moderate risk and a healthy update cadence.',
        aggressive: 'About 5 updates possible, cheaper and faster but less reliable.',
    };

    const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Development"
                title="Factory"
                description="Shape your season development plan, then approve each car package with clear cost and expected gains."
            />

            <Card title="Factory Leadership">
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-red-200/80">Engineer</p>
                        <p className="mt-2 text-lg font-semibold text-white">{playerEngineer?.name ?? 'Unassigned'}</p>
                        <p className="mt-2 text-sm text-zinc-300">
                            Development {playerEngineer?.developmentSkill ?? 0} · Consistency {playerEngineer?.consistency ?? 0}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Pit Crew Chief</p>
                        <p className="mt-2 text-lg font-semibold text-white">{playerChief?.name ?? 'Unassigned'}</p>
                        <p className="mt-2 text-sm text-zinc-300">
                            Reliability {playerChief?.reliabilitySkill ?? 0} · Consistency {playerChief?.consistencySkill ?? 0}
                        </p>
                    </div>
                </div>
            </Card>

            <Card title="Season Update Plan">
                <div className="grid gap-3 md:grid-cols-3">
                    {(['safe', 'medium', 'aggressive'] as UpdatePlanMode[]).map((plan) => (
                        <button
                            key={plan}
                            className={`rounded-2xl border px-4 py-4 text-left transition ${
                                updatePlan === plan
                                    ? 'border-red-400/60 bg-red-500/20'
                                    : 'border-white/10 bg-white/5 hover:border-red-300/35 hover:bg-white/10'
                            }`}
                            onClick={() => {
                                const result = setUpdatePlan(plan);
                                setFeedbackMessage(result.message);
                            }}
                        >
                            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{plan}</p>
                            <p className="mt-2 text-sm text-zinc-200">{planDescriptions[plan]}</p>
                        </button>
                    ))}
                </div>
                <p className="mt-4 text-sm text-zinc-300">
                    Plan active: <span className="font-semibold text-white">{updatePlan}</span> · Updates left:{' '}
                    <span className="font-semibold text-white">{updatesRemaining}</span> · Used this season:{' '}
                    <span className="font-semibold text-white">{updatesUsedThisSeason}</span>
                </p>
            </Card>

            <Card title="Approve Factory Packages">
                <div className="grid gap-3 md:grid-cols-3">
                    {(Object.keys(partLabels) as Array<keyof typeof partLabels>).map((part) => (
                        <button
                            key={part}
                            className="rounded-2xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-left font-medium text-white transition hover:bg-red-500/25"
                            onClick={() => setSelectedPart(part)}
                        >
                            <p>{partLabels[part]}</p>
                            <p className="mt-1 text-xs text-red-100/80">Request quote and confirm update</p>
                        </button>
                    ))}
                </div>

                {selectedPart && selectedQuote ? (
                    <div className="mt-5 rounded-2xl border border-white/15 bg-black/20 p-4">
                        <p className="text-sm text-zinc-300">
                            {partLabels[selectedPart]} package · {selectedQuote.riskText}
                        </p>
                        <div className="mt-3 grid gap-2 text-sm text-zinc-200 md:grid-cols-2">
                            <p>Cost: <span className="font-semibold text-white">${selectedQuote.cost.toLocaleString()}</span></p>
                            <p>Expected gain: <span className="font-semibold text-white">+{selectedQuote.minGain} to +{selectedQuote.maxGain}</span></p>
                            <p>Low-impact chance: <span className="font-semibold text-white">{formatPercent(selectedQuote.dudChance)}</span></p>
                            <p>Setback chance: <span className="font-semibold text-white">{formatPercent(selectedQuote.setbackChance)}</span></p>
                            <p>Budget after update: <span className="font-semibold text-white">${Math.max(0, (playerTeam?.budget ?? 0) - selectedQuote.cost).toLocaleString()}</span></p>
                            <p>Updates remaining after purchase: <span className="font-semibold text-white">{selectedQuote.updatesRemainingAfterPurchase}</span></p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                className="rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500/35"
                                onClick={() => {
                                    const result = confirmCarUpgrade(selectedPart);
                                    setFeedbackMessage(result.message);
                                    if (result.ok) setSelectedPart(null);
                                }}
                            >
                                Approve Update
                            </button>
                            <button
                                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
                                onClick={() => setSelectedPart(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : null}
                {selectedPart && !selectedQuote ? (
                    <p className="mt-4 text-sm text-zinc-300">
                        No quote available. You have likely used all updates for this season.
                    </p>
                ) : null}
            </Card>

            <Card title="How updates work">
                <ul className="space-y-2 text-sm text-zinc-300">
                    <li>• Set your seasonal plan before Round 1: Safe, Medium, or Aggressive.</li>
                    <li>• Each update now has a dynamic cost based on part, plan, and how many updates you already produced.</li>
                    <li>• Your engineer boosts upside and can lower cost. Your pit crew chief reduces reliability risk and improves consistency.</li>
                    <li>• Safe plans usually give fewer updates with stronger gains; aggressive plans allow more updates with bigger failure risk.</li>
                </ul>
                {feedbackMessage ? <p className="mt-4 text-sm font-medium text-red-100">{feedbackMessage}</p> : null}
            </Card>
        </div>
    );
}
