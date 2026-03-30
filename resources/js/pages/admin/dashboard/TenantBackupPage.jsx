import { useState } from 'react'
import { 
    Database, Download, RefreshCcw, Loader2, Info, Search, Clock, CheckCircle2, AlertCircle, X, Trash2
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/api.js'
import toast from 'react-hot-toast'

export default function TenantBackupPage() {
    const [search, setSearch] = useState('')
    const qc = useQueryClient()

    const { data: backups = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['admin-all-tenant-backups'],
        queryFn: () => api.get('/admin/tenants/backups').then(r => r.data),
        refetchInterval: (query) => {
            const data = query?.state?.data;
            const isProcessing = Array.isArray(data) && data.some(b => b.status === 'processing' || b.status === 'pending');
            return isProcessing ? 2000 : 10000;
        }
    })

    const { mutate: cancelBackup } = useMutation({
        mutationFn: (id) => api.post(`/admin/tenants/backups/${id}/cancel`),
        onSuccess: () => {
            qc.invalidateQueries(['admin-all-tenant-backups'])
            toast.success('Yedekleme iptal edildi.')
        },
        onError: () => toast.error('İptal işlemi başarısız.')
    })

    const handleCancel = (id) => {
        if (window.confirm('Bu yedekleme işlemini iptal etmek istediğinize emin misiniz?')) {
            cancelBackup(id)
        }
    }

    const { mutate: deleteBackup } = useMutation({
        mutationFn: (id) => api.delete(`/admin/tenants/backups/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['admin-all-tenant-backups'])
            toast.success('Yedek kaydı silindi.')
        },
        onError: () => toast.error('Silme işlemi başarısız.')
    })

    const handleDelete = (id) => {
        if (window.confirm('Bu yedek kaydını (varsa dosyasını da) silmek istediğinize emin misiniz?')) {
            deleteBackup(id)
        }
    }

    const handleDownload = (backup) => {
        window.open(`${api.defaults.baseURL}/admin/tenants/backups/${backup.id}/download`, '_blank')
    }

    const formatSize = (bytes) => {
        if (!bytes) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const filteredBackups = backups.filter(b => {
        const searchLower = (search || '').toString().toLowerCase()
        const filenameMatch = (b.filename || '').toString().toLowerCase().includes(searchLower)
        const tenantMatch = (b.tenant?.name || '').toString().toLowerCase().includes(searchLower)
        return filenameMatch || tenantMatch
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Firma Yedekleri</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Tüm firmaların yerel yedeklerini tek bir yerden yönetin.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Firma veya dosya adı ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all w-64"
                        />
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                        title="Yenile"
                    >
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-2xl p-4 flex gap-3 text-purple-700 dark:text-purple-400">
                <Info className="shrink-0" size={20} />
                <div className="text-sm leading-relaxed">
                    <strong>Bilgi:</strong> Firma özelindeki yedekleri "Firmalar" sayfası üzerinden tetikleyebilirsiniz. Bu sayfada tamamlanan veya devam eden tüm firma yedeklerini görebilirsiniz.
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[32px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left theme-table">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-200 dark:border-gray-800">
                                <th className="px-6 py-4">Firma</th>
                                <th className="px-6 py-4">Dosya Adı</th>
                                <th className="px-6 py-4">Boyut</th>
                                <th className="px-6 py-4">Durum (İlerleme)</th>
                                <th className="px-6 py-4 text-right">Oluşturulma</th>
                                <th className="px-6 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading && backups.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <Loader2 className="mx-auto animate-spin text-purple-600 mb-4" size={32} />
                                        <div className="text-gray-500 font-medium font-bold uppercase tracking-wider text-xs">Yedekler yükleniyor...</div>
                                    </td>
                                </tr>
                            ) : filteredBackups.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium italic">
                                        Henüz bir yedek bulunmuyor.
                                    </td>
                                </tr>
                            ) : (
                                filteredBackups.map((bk) => (
                                    <tr key={bk.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 text-xs font-bold">
                                                    {bk.tenant?.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {bk.tenant?.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Database size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium truncate max-w-[150px] block" title={bk.filename}>
                                                    {bk.filename || 'Hazırlanıyor...'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">
                                                {formatSize(bk.size)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                                    bk.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                                                    bk.status === 'failed' ? 'bg-red-50 dark:bg-red-500/10 text-red-600' :
                                                    'bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                                                }`}>
                                                    {bk.status === 'processing' || bk.status === 'pending' ? (
                                                        <Loader2 size={10} className="animate-spin" />
                                                    ) : bk.status === 'completed' ? (
                                                        <CheckCircle2 size={10} />
                                                    ) : (
                                                        <AlertCircle size={10} />
                                                    )}
                                                    {bk.status === 'completed' ? 'TAMAMLANDI' :
                                                     bk.status === 'failed' ? 'HATA' :
                                                     bk.status === 'processing' ? `İÅLENİYOR (${bk.progress}%)` : 'BEKLENİYOR'}
                                                </span>
                                                {(bk.status === 'processing' || (bk.status === 'pending' && bk.progress > 0)) && (
                                                    <div className="space-y-1">
                                                        <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-blue-500 transition-all duration-500" 
                                                                style={{ width: `${bk.progress}%` }}
                                                            />
                                                        </div>
                                                        {bk.real_time_message && (
                                                            <div className="text-[9px] text-blue-500 font-medium truncate max-w-[140px] italic" title={bk.real_time_message}>
                                                                {bk.real_time_message}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col items-end">
                                                <span className="flex items-center gap-1 text-[11px] font-bold text-gray-900 dark:text-white">
                                                    <Clock size={12} /> {new Date(bk.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-[10px] font-medium">{new Date(bk.created_at).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {(bk.status === 'processing' || bk.status === 'pending') && (
                                                    <button onClick={() => handleCancel(bk.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl" title="İptal">
                                                        <X size={18} />
                                                    </button>
                                                )}
                                                {bk.status === 'completed' && bk.has_file && (
                                                    <button
                                                        onClick={() => handleDownload(bk)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-600/10 rounded-xl transition-all"
                                                        title="İndir"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                )}
                                                {bk.status !== 'processing' && bk.status !== 'pending' && (
                                                    <button
                                                        onClick={() => handleDelete(bk.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                                        title="Kaydı Sil"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

