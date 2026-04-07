export function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            {children}
        </span>
    );
}