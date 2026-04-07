import { NavLink } from 'react-router-dom';

const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/team', label: 'Team' },
    { to: '/race', label: 'Race' },
    { to: '/results', label: 'Results' },
    { to: '/standings', label: 'Table' },
];

export function BottomNav() {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/95 px-2 py-2 backdrop-blur md:hidden">
            <div className="grid grid-cols-5 gap-2">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.end}
                        className={({ isActive }) =>
                            `rounded-2xl px-2 py-3 text-center text-xs font-medium transition ${isActive ? 'bg-red-500 text-white' : 'text-zinc-400'
                            }`
                        }
                    >
                        {link.label}
                    </NavLink>
                ))}
            </div>
        </div>
    );
}