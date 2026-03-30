import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight } from 'lucide-react'

export default function SettingsSidebar({ menuItems, activeTab }) {
    return (
        <div className="md:w-64 flex-shrink-0 theme-surface border theme-divider rounded-xl md:h-[calc(100vh-100px)] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b theme-divider">
                <h1 className="text-sm font-black theme-text-primary tracking-tight">Sistem Ayarları</h1>
                <p className="text-[10px] theme-text-secondary mt-0.5 font-semibold uppercase tracking-widest">Konfigürasyon Merkezi</p>
            </div>

            <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
                {menuItems.map(item => {
                    if (item.hidden) return null
                    const isActive = activeTab === (item.to.split('=').pop())
                    return (
                        <Link
                            key={item.id}
                            to={item.to}
                            className={`
                                group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200
                                ${isActive
                                    ? 'bg-[#1A1A2E] dark:bg-white text-white dark:text-[#1A1A2E] shadow-md'
                                    : 'theme-text-secondary hover:bg-[#E5E9F0] dark:hover:bg-white/10 hover:theme-text-primary'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={16} strokeWidth={isActive ? 2.5 : 1.8} className="shrink-0" />
                                <span>{item.label}</span>
                            </div>
                            {isActive
                                ? <CheckCircle2 size={14} className="text-white dark:text-[#1A1A2E] opacity-70 shrink-0" />
                                : <ChevronRight size={13} className="theme-text-secondary group-hover:translate-x-0.5 transition-transform shrink-0" />
                            }
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
