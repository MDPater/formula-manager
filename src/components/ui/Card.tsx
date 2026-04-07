import type { ReactNode } from 'react';

export function Card({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/8 to-white/[0.03] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <h2 className="mb-4 text-base font-semibold text-white md:text-lg">{title}</h2>
            {children}
        </section>
    );
}