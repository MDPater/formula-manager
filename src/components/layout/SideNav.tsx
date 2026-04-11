import { NavLink } from 'react-router-dom';

const links = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/team', label: 'Team' },
    { to: '/market', label: 'Market' },
    { to: '/factory', label: 'Factory' },
    { to: '/race', label: 'Race' },
    { to: '/results', label: 'Results' },
    { to: '/standings', label: 'Standings' },
];

export function SideNav({
    mobileOpen,
    onCloseMobile,
}: {
    mobileOpen: boolean;
    onCloseMobile: () => void;
}) {
    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity md:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                    }`}
                onClick={onCloseMobile}
            />

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[272px] flex-col border-r border-white/5 bg-[#2b2d31]/95 px-4 py-5 backdrop-blur transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                <div className="mb-8 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-4">
                    <div className="text-xs uppercase tracking-[0.35em] text-zinc-500">Garage</div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-white">Apex GP</div>
                    <div className="mt-1 text-sm text-zinc-400">F1 Team Manager</div>
                </div>

                <nav className="space-y-2">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            onClick={onCloseMobile}
                            className={({ isActive }) =>
                                `block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive
                                    ? 'border border-red-500/30 bg-red-500/15 text-white shadow-[0_0_30px_rgba(239,68,68,0.08)]'
                                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Status</div>
                    <div className="mt-2 text-sm text-zinc-300">
                        Unified sidebar for desktop and mobile.
                    </div>
                </div>
            </aside>
        </>
    );
}