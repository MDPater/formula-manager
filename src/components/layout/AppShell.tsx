import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';

export function AppShell({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-black text-zinc-100">
            <div className="flex min-h-screen">
                <div className="hidden md:block md:w-[250px] md:shrink-0">
                    <SideNav />
                </div>

                <div className="flex min-h-screen flex-1 flex-col">
                    <TopBar />
                    <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
                        <div className="mx-auto max-w-7xl">{children}</div>
                    </main>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}