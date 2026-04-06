import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useGameStore } from '../../store/gameStore';

export function FactoryPage() {
    const upgradeCar = useGameStore((state) => state.upgradeCar);

    const buttonClass =
        'rounded-2xl border border-red-500/30 bg-red-500/15 px-4 py-3 font-medium text-white transition hover:bg-red-500/25';

    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Development"
                title="Factory"
                description="Spend budget to improve core performance areas of the car."
            />

            <Card title="Available Upgrades">
                <div className="grid gap-3 md:grid-cols-3">
                    <button className={buttonClass} onClick={() => upgradeCar('aero')}>
                        Upgrade Aero
                    </button>
                    <button className={buttonClass} onClick={() => upgradeCar('power')}>
                        Upgrade Power
                    </button>
                    <button className={buttonClass} onClick={() => upgradeCar('reliability')}>
                        Upgrade Reliability
                    </button>
                </div>
            </Card>
        </div>
    );
}