import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api.js'

export default function PackageUsageTab() {
    const { data: sub, isLoading } = useQuery({
        queryKey: ['subscription'],
        queryFn: () => api.get('/billing/subscription').then(r => r.data)
    })

    if (isLoading) return <div className="text-center py-8 theme-text-secondary font-medium">Yükleniyor...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold theme-text-primary">Paket Kullanımları</h2>
                    <p className="text-sm theme-text-secondary">Paket özellikleriniz ve güncel kullanım limitleriniz.</p>
                </div>
            </div>

            <div className="theme-surface border theme-divider rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {sub.usage && Object.entries(sub.usage).map(([key, data]) => {
                        const usedNum = parseFloat(data.used) || 0
                        const limitNum = parseFloat(data.limit) || 0
                        const isUnlimited = limitNum === 0
                        const percentage = isUnlimited || limitNum === 0 ? 0 : Math.min(100, (usedNum / limitNum) * 100)
                        const isHigh = percentage > 85

                        return (
                            <div key={key} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-0.5">
                                        <div className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider">{data.label}</div>
                                        <div className="text-sm font-bold theme-text-primary">
                                            {isUnlimited ? 'Sınırsız' : `${data.used} / ${data.limit}`}
                                        </div>
                                    </div>
                                    {!isUnlimited && (
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${isHigh ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'theme-muted-badge'}`}>
                                            %{Math.round(percentage)}
                                        </div>
                                    )}
                                </div>
                                {!isUnlimited && (
                                    <div className="h-1.5 w-full theme-progress-track rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ease-out ${isHigh ? 'bg-red-500' : 'bg-indigo-600'}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
