import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

const NAV_ITEMS = [
    { key: 'landing', label: 'Anasayfa', to: '/' },
    { key: 'pricing', label: 'Paketler', to: '/pricing' },
    { key: 'terms', label: 'Koşullar', to: '/tos' },
    { key: 'privacy', label: 'Gizlilik', to: '/privacy' },
]

const FOOTER_LINKS = [
    { label: 'Paketler', to: '/pricing' },
    { label: 'Kullanım Koşulları', to: '/tos' },
    { label: 'İade Politikası', to: '/refund' },
    { label: 'Gizlilik Politikası', to: '/privacy' },
]

export default function PublicSiteShell({ children, activePage = 'landing', contentClassName = '' }) {
    const appName = (import.meta.env.VITE_APP_NAME || 'CRM').toUpperCase()

    return (
        <div className="min-h-screen bg-[#f2efe8] text-[#1f2937] selection:bg-[#0f766e] selection:text-white">
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute -top-24 -left-30 h-72 w-72 rounded-full bg-[#0f766e]/15 blur-3xl" />
                <div className="absolute top-[35%] -right-35 h-80 w-80 rounded-full bg-[#b45309]/15 blur-3xl" />
                <div className="absolute -bottom-40 left-[25%] h-96 w-96 rounded-full bg-[#334155]/10 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.07)_1px,transparent_0)] bg-size-[20px_20px] opacity-40" />
            </div>

            <nav className="fixed top-0 z-50 w-full border-b border-[#d8d2c7] bg-[#f2efe8]/85 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-[#0f766e] to-[#14532d] shadow-lg shadow-[#0f766e]/25">
                            <img src="/logo/small-logo.png" alt="Logo" className="h-7 w-7 object-contain" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#64748b]">Famedya CRM</p>
                            <p className="text-lg font-black tracking-tight text-[#0f172a]">{appName}</p>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-7 text-sm font-bold text-[#475569] md:flex">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.key}
                                to={item.to}
                                className={`transition-colors ${activePage === item.key ? 'text-[#0f766e]' : 'hover:text-[#0f766e]'}`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Link to="/login" className="hidden rounded-xl border border-[#c9c1b3] px-4 py-2 text-sm font-bold text-[#334155] transition-colors hover:border-[#0f766e] hover:text-[#0f766e] sm:inline-flex">
                            Giriş
                        </Link>
                        <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-black text-white shadow-lg shadow-[#0f766e]/30 transition-colors hover:bg-[#115e59] sm:px-5">
                            Ücretsiz Başla <ArrowUpRight size={14} />
                        </Link>
                    </div>
                </div>
            </nav>

            <main className={`mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-36 lg:px-8 ${contentClassName}`}>
                {children}
            </main>

            <footer className="border-t border-[#d8d2c7] bg-[#ebe6dc]">
                <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-8">
                    <div>
                        <p className="text-lg font-black text-[#0f172a]">{appName}</p>
                        <p className="text-sm font-medium text-[#64748b]">Isletmeler icin saha, ekip ve finans operasyon platformu.</p>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-[#475569]">
                        {FOOTER_LINKS.map((item) => (
                            <Link key={item.to} to={item.to} className="transition-colors hover:text-[#0f766e]">
                                {item.label}
                            </Link>
                        ))}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">
                        {new Date().getFullYear()} {appName}
                    </p>
                </div>
            </footer>
        </div>
    )
}
