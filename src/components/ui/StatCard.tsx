export function StatCard({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
            <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">{label}</div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">{value}</div>
            {hint ? <div className="mt-2 text-sm text-zinc-400">{hint}</div> : null}
        </div>
    );
}