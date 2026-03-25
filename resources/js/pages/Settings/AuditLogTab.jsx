import { useQuery } from '@tanstack/react-query'
import { Info, User, Clock, Loader2, Database, ShieldAlert, FileText, Smartphone, Laptop, Globe } from 'lucide-react'
import api from '../../lib/api.js'

export default function AuditLogTab() {
    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: () => api.get('/settings/logs').then(r => r.data)
    })

    const getActionColor = (action) => {
        if (action.includes('created')) return 'text-green-600 bg-green-50 dark:bg-green-500/10'
        if (action.includes('updated')) return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10'
        if (action.includes('deleted')) return 'text-red-600 bg-red-50 dark:bg-red-500/10'
        if (action.includes('login') || action.includes('auth')) return 'text-blue-600 bg-blue-50 dark:bg-blue-500/10'
        return 'text-gray-600 bg-gray-50 dark:bg-gray-500/10'
    }

    const getDeviceIcon = (ua) => {
        if (!ua) return <Globe size={14} />
        const u = ua.toLowerCase()
        if (u.includes('mobile') || u.includes('android') || u.includes('iphone')) return <Smartphone size={14} />
        if (u.includes('windows') || u.includes('macintosh') || u.includes('linux')) return <Laptop size={14} />
        return <Globe size={14} />
    }

    if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>

    return (
        <div className="space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-500/5 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 flex items-start gap-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600">
                    <ShieldAlert size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Güvenlik Logları</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sistem üzerindeki tüm kritik işlemler (ekleme, silme, güncelleme) denetim amaçlı kayıt altına alınır.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {logs.map(log => (
                        <div key={log.id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        <FileText size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-black ${getActionColor(log.description)}`}>
                                                {log.description.split(' ')[0]}
                                            </span>
                                            {log.description.split(' ').slice(1).join(' ')}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                                                <User size={12} className="text-indigo-400" /> {log.user?.name || 'Sistem'}
                                            </span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} className="text-amber-400" /> {new Date(log.created_at).toLocaleString('tr-TR')}
                                            </span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <span className="flex items-center gap-1 font-mono uppercase text-[10px] tracking-tight bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                                {log.ip_address}
                                            </span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <span className="flex items-center gap-1" title={log.user_agent}>
                                                {getDeviceIcon(log.user_agent)} {log.user_agent?.split(' ')[0]}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 md:self-center">
                                    <div className="hidden group-hover:flex items-center gap-2 animate-in fade-in duration-300">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-100/50 dark:border-indigo-500/10">Kayıt No: #{log.id}</span>
                                    </div>
                                    <button className="p-2 text-gray-300 hover:text-indigo-500 transition-colors bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm">
                                        <Info size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {logs.length === 0 && (
                    <div className="p-12 text-center text-gray-400 italic">
                        <Database size={32} className="mx-auto mb-2 opacity-20" />
                        Log kaydı bulunamadı.
                    </div>
                )}
            </div>
        </div>
    )
}
