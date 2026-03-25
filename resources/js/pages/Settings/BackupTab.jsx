import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Download, Database, Loader2, Play, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal.jsx'
import PlanRestrictionView from '../../components/ui/PlanRestrictionView.jsx'
import { useAuthStore } from '../../stores/index.js'

export default function BackupTab() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_backup_feature === false || user?.tenant?.plan_backup_feature === 0
    if (isFeatureDisabled) return <PlanRestrictionView featureName="Yedekleme" />

    const qc = useQueryClient()
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { data: backups = [], isLoading } = useQuery({
        queryKey: ['backups'],
        queryFn: () => api.get('/settings/backups').then(r => r.data)
    })

    const createMutation = useMutation({
        mutationFn: () => api.post('/settings/backups'),
        onSuccess: () => {
            qc.invalidateQueries(['backups'])
            toast.success('Yedekleme işlemi başlatıldı. Birazdan listede görünecektir.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Yedek oluşturulamadı.')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/backups/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['backups'])
            toast.success('Yedek silindi.')
            setDeleteConfirm(null)
        }
    })

    const downloadBackup = async (id) => {
        try {
            const { data } = await api.get(`/settings/backups/${id}/download-url`)
            if (data?.url) window.location.href = data.url
            else toast.error('İndirme bağlantısı alınamadı.')
        } catch (err) {
            toast.error('Bağlantı oluşturulurken hata.')
        }
    }

    const formatSize = (bytes) => {
        if (!bytes) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Database size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Veri Yedekleme</h2>
                        <p className="text-indigo-100 text-sm opacity-80">Sistem verilerinizi dilediğiniz zaman yedekleyin.</p>
                    </div>
                </div>
                <button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                    {createMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                    Şimdi Yedekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest mb-2"><Clock size={14} /> Otomatik Yedekleme</div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">Her Gece</p>
                    <p className="text-xs text-gray-500">Sistem verileriniz her gece 03:00'te otomatik yedeklenir.</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
                    <div className="flex items-center gap-2 text-green-500 font-bold text-xs uppercase tracking-widest mb-2"><CheckCircle2 size={14} /> Durum</div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">Güvende</p>
                    <p className="text-xs text-gray-500">Son 30 günlük yedekleme geçmişiniz saklanmaktadır.</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
                    <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-2"><Database size={14} /> Saklama</div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">30 Gün</p>
                    <p className="text-xs text-gray-500">Eski yedekler otomatik olarak silinerek yer açılır.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Yedekleme Geçmişi</span>
                    <span className="text-[10px] text-gray-400 italic">Toplam {backups.length} dosya</span>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" size={32} /></div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {backups.map(b => (
                            <div key={b.id} className="group px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        <Database size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            {new Date(b.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            <span className="font-normal text-xs text-gray-400">{new Date(b.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-3">
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {formatSize(b.size)}</span>
                                            <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                            <span className="flex items-center gap-1 font-mono uppercase text-[9px]">{b.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => downloadBackup(b.id)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all"
                                    >
                                        <Download size={14} /> İndir
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(b)}
                                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                        title="Yedeği Sil"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {backups.length === 0 && !isLoading && (
                    <div className="p-12 text-center text-gray-400">
                        <Database size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium italic">Henüz bir yedek kaydı bulunmuyor.</p>
                    </div>
                )}
            </div>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Yedeği Sil">
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-2xl flex gap-3 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-500/20">
                        <AlertCircle size={20} className="shrink-0" />
                        <p>Bu yedek dosyasını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Vazgeç</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-500/20">
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Kalıcı Olarak Sil'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
