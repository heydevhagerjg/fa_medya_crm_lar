import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight } from 'lucide-react'

export default function SettingsSidebar({ menuItems, activeTab }) {
    return (
        <div className="md:w-72 flex-shrink-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl md:h-[calc(100vh-140px)] flex flex-col shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden transition-all duration-300">
            <div className="p-6 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Sistem Ayarları</h1>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium uppercase tracking-widest opacity-80">Konfigürasyon Merkezi</p>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {menuItems.map(item => {
                    if (item.hidden) return null
                    const isActive = activeTab === (item.to.split('=').pop())
                    return (
                        <Link
                            key={item.id}
                            to={item.to}
                            className={`
                                group flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-300 relative overflow-hidden
                                ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/10'
                                    : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3.5 relative z-10">
                                <div className={`
                                    p-2 rounded-xl transition-all duration-300 transform group-hover:scale-110
                                    ${isActive ? 'bg-white/10' : 'bg-gray-50 dark:bg-gray-800 group-hover:bg-indigo-500/10'}
                                `}>
                                    <item.icon size={18} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'} />
                                </div>
                                <span>{item.label}</span>
                            </div>

                            <div className="relative z-10">
                                {isActive ? (
                                    <CheckCircle2 size={16} className="text-white opacity-80" />
                                ) : (
                                    <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-500 transition-transform duration-300 group-hover:translate-x-1" />
                                )}
                            </div>

                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-90" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-transparent">
                <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-green-500/20">OK</div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">Sistem Durumu</div>
                        <div className="text-[9px] text-green-500 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Tüm Servisler Aktif
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
