import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { drivers } from '../../data/drivers';

export function MarketPage() {
    return (
        <div className="space-y-6 md:space-y-8">
            <SectionHeader
                eyebrow="Contracts"
                title="Driver Market"
                description="Starter view for future transfer, buyout, and contract systems."
            />

            <Card title="Available Drivers">
                <div className="space-y-2">
                    {drivers.map((driver) => (
                        <div key={driver.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                            <span className="text-sm text-zinc-300 md:text-base">{driver.name}</span>
                            <span className="text-sm font-medium text-white">${driver.marketValue.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}