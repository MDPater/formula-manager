import { NavLink } from 'react-router-dom';

const links = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/team', label: 'Team' },
    { to: '/market', label: 'Market' },
    { to: '/factory', label: 'Factory' },
    { to: '/race', label: 'Race' },
    { to: '/standings', label: 'Standings' },
];

export function SideNav() {
    return (
        <aside className="flex h-screen flex-col border-r border-white/10 bg-zinc-950/90 px-4 py-5 backdrop-blur">
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
                <div className="mt-2 text-sm text-zinc-300">Build a small but polished season sim first.</div>
            </div>
        </aside>
    );
}