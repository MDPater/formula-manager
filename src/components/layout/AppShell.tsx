import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';

export function AppShell({ children }: { children: ReactNode }) {
    const location = useLocation();
    const isSetupRoute = location.pathname === '/career/setup';
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    function handleToggleNav() {
        setMobileNavOpen((value) => !value);
    }

    function handleCloseMobileNav() {
        setMobileNavOpen(false);
    }

    return (
        <div className="min-h-screen bg-[#1e1f22] text-zinc-100">
            {!isSetupRoute && (
                <SideNav mobileOpen={mobileNavOpen} onCloseMobile={handleCloseMobileNav} />
            )}

            <div className={`min-h-screen ${isSetupRoute ? '' : 'md:pl-[272px]'}`}>
                <TopBar
                    showNavToggle={!isSetupRoute}
                    mobileNavOpen={mobileNavOpen}
                    onToggleNav={handleToggleNav}
                />
                <main className="p-4 pb-8 md:p-6">
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>
        </div>
    );
}