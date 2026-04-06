import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useGameStore } from '../../store/gameStore';

export function StandingsPage() {
    const team = useGameStore((state) => state.team);

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader eyebrow="Championship" title="Standings" description="Start with your team table, then expand to full drivers and constructors standings next." />

            <Card title="Constructors">
                <div className="overflow-hidden rounded-2xl border border-white/10">
                    <div className="grid grid-cols-[80px_1fr_100px] bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.25em] text-zinc-500">
                        <span>Pos</span>
                        <span>Team</span>
                        <span className="text-right">Pts</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr_100px] px-4 py-4 text-sm text-white">
                        <span>1</span>
                        <span>{team.name}</span>
                        <span className="text-right font-semibold">{team.points}</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}