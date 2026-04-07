export function SectionHeader({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description?: string;
}) {
    return (
        <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-red-400">{eyebrow}</div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h1>
            {description ? <p className="mt-2 max-w-2xl text-sm text-zinc-400 md:text-base">{description}</p> : null}
        </div>
    );
}