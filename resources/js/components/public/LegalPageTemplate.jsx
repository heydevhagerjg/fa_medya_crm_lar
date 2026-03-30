import PublicSiteShell from './PublicSiteShell.jsx'

export default function LegalPageTemplate({ icon: Icon, title, updatedAt, activePage, children }) {
    return (
        <PublicSiteShell activePage={activePage} contentClassName="max-w-4xl">
            <section className="mb-10 rounded-[28px] border border-[#d8d2c7] bg-[#faf7f1] p-8 shadow-sm sm:p-10">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f766e]/10 text-[#0f766e]">
                    <Icon size={30} />
                </div>
                <h1 className="text-4xl font-black leading-tight text-[#0f172a] sm:text-5xl">{title}</h1>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#64748b]">Son Guncelleme: {updatedAt}</p>
            </section>

            <article className="space-y-8 rounded-[28px] border border-[#d8d2c7] bg-white/80 p-8 shadow-sm sm:p-10">
                {children}
            </article>
        </PublicSiteShell>
    )
}
