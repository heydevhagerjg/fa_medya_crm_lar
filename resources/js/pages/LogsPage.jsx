import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../lib/api.js'
import { FileText, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import Pagination from '../components/ui/Pagination.jsx'

const actionColors = {
    CREATE: 'text-green-500 bg-green-500/10',
    UPDATE: 'text-blue-500 bg-blue-500/10',
    DELETE: 'text-red-500 bg-red-500/10',
}

export default function LogsPage() {
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const { data, isLoading } = useQuery({
        queryKey: ['logs'],
        // Fetch up to 500 logs to allow reasonable client-side pagination
        queryFn: () => api.get('/logs?limit=500').then(r => r.data),
    })

    const logs = data?.logs || []
    const totalPages = Math.ceil(logs.length / itemsPerPage)
    const paginatedData = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText size={24} className="text-indigo-500" />
                    Aktivite Logları
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Son {logs.length} aktivite</p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Activity size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Henüz aktivite yok.</p>
                    </div>
                ) : (
                    <div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedData.map(log => (
                                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                    <div className='min-w-24'>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${actionColors[log.action] || 'text-gray-500 bg-gray-500/10'}`}>
                                            {
                                                log.action === "CREATE" ? "Oluşturuldu" : log.action === "UPDATE" ? "Güncellendi" : log.action === "DELETE" ? "Silindi" : ""
                                            }
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-wrap">
                                            {log.user && (
                                                <Link to={`/settings/users?highlight=${log.user_id}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                                                    {log.user.name}
                                                </Link>
                                            )}
                                            <span className="text-gray-500">tarafından</span>
                                            {(log.entity_name || log.entityName) && (
                                                <>
                                                    <span className="text-gray-800 dark:text-gray-200 font-medium">"{log.entity_name || log.entityName}"</span>
                                                    <span className="text-gray-500">üzerinde</span>
                                                </>
                                            )}
                                            <span className="font-medium bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">{log.entity_type || log.entityType}</span>
                                            <span className="text-gray-500">işlemi yapıldı.</span>
                                        </div>
                                        {log.details && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{log.details}</div>}
                                    </div>
                                    <div className="text-xs text-gray-400 flex-shrink-0">
                                        {(log.created_at || log.createdAt) ? new Date(log.created_at || log.createdAt).toLocaleString('tr-TR') : '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={logs.length}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
