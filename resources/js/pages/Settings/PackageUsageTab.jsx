import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api.js'

export default function PackageUsageTab() {
    const { data: sub, isLoading } = useQuery({
        queryKey: ['subscription'],
        queryFn: () => api.get('/billing/subscription').then(r => r.data)
    })

    if (isLoading) return <div className="text-center py-8 text-gray-400 font-medium">Yükleniyor...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paket Kullanımları</h2>
                    <p className="text-sm text-gray-500">Paket özellikleriniz ve güncel kullanım limitleriniz.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
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
                                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{data.label}</div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                                            {isUnlimited ? 'Sınırsız' : `${data.used} / ${data.limit}`}
                                        </div>
                                    </div>
                                    {!isUnlimited && (
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${isHigh ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            %{Math.round(percentage)}
                                        </div>
                                    )}
                                </div>
                                {!isUnlimited && (
                                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
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
