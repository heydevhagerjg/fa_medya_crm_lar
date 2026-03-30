import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Trash2,
    Download,
    Database,
    Loader2,
    Play,
    Calendar,
    AlertCircle,
    Clock,
    ShieldCheck,
    HardDrive,
    Archive,
    RefreshCw,
} from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal.jsx'
import PlanRestrictionView from '../../components/ui/PlanRestrictionView.jsx'
import { useAuthStore } from '../../stores/index.js'
import SettingsPageHeader from './Shared/SettingsPageHeader.jsx'

export default function BackupTab() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_backup_feature === false || user?.tenant?.plan_backup_feature === 0
    if (isFeatureDisabled) return <PlanRestrictionView featureName="Yedekleme" />

    const qc = useQueryClient()
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { data: backupData, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['backups'],
        queryFn: () => api.get('/settings/backup/list').then(r => r.data)
    })

    const backups = backupData?.backups || []
    const backupRequested = !!backupData?.backup_requested

    const createMutation = useMutation({
        mutationFn: () => api.post('/settings/backup/export'),
        onSuccess: () => {
            qc.invalidateQueries(['backups'])
            toast.success('Yedekleme işlemi başlatıldı. Birazdan listede görünecektir.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Yedek oluşturulamadı.')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/backup/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['backups'])
            toast.success('Yedek silindi.')
            setDeleteConfirm(null)
        }
    })

    const downloadBackup = async (id) => {
        try {
            const { data } = await api.get(`/settings/backup/${id}/signed-url`)
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

    const formatDateTime = (value) => {
        if (!value) return '-'
        const date = new Date(value)
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const totalSize = useMemo(
        () => backups.reduce((acc, item) => acc + (Number(item.size) || 0), 0),
        [backups]
    )

    const lastBackup = backups[0] || null

    const requestBackup = () => {
        if (backupRequested) {
            toast('Yedek talebiniz zaten sırada. Hazır olunca burada listelenecek.')
            return
        }
        createMutation.mutate()
    }

    return (
        <div className="space-y-5">
            <SettingsPageHeader
                title="Veri Yedekleme"
                actions={[
                    {
                        label: backupRequested ? 'Talep Bekliyor' : createMutation.isPending ? 'Gönderiliyor...' : 'Yedek Talep Et',
                        onClick: requestBackup,
                        icon: Play,
                        variant: 'primary',
                    },
                    {
                        label: isFetching ? 'Yenileniyor...' : 'Yenile',
                        onClick: () => refetch(),
                        icon: RefreshCw,
                        variant: 'outline',
                    },
                ]}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="theme-surface border theme-divider rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-widest theme-text-secondary">Talep Durumu</span>
                        <Clock size={16} className={backupRequested ? 'text-amber-500' : 'text-green-500'} />
                    </div>
                    <div className="text-lg font-black theme-text-primary">
                        {backupRequested ? 'İşlem Sırada' : 'Hazır'}
                    </div>
                    <p className="text-xs mt-2 theme-text-secondary">
                        {backupRequested
                            ? 'Admin tarafında yedek üretimi bekleniyor.'
                            : 'Yeni yedek talebi oluşturabilirsiniz.'}
                    </p>
                </div>

                <div className="theme-surface border theme-divider rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-widest theme-text-secondary">Son Başarılı Yedek</span>
                        <ShieldCheck size={16} className="text-emerald-500" />
                    </div>
                    <div className="text-base font-black theme-text-primary truncate">
                        {lastBackup ? formatDateTime(lastBackup.created_at) : 'Kayıt Yok'}
                    </div>
                    <p className="text-xs mt-2 theme-text-secondary">
                        {lastBackup ? `Dosya: ${lastBackup.filename}` : 'Henüz tamamlanmış yedek bulunmuyor.'}
                    </p>
                </div>

                <div className="theme-surface border theme-divider rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-widest theme-text-secondary">Arşiv Boyutu</span>
                        <HardDrive size={16} className="text-indigo-500" />
                    </div>
                    <div className="text-2xl font-black theme-text-primary">{formatSize(totalSize)}</div>
                    <p className="text-xs mt-2 theme-text-secondary">Toplam {backups.length} yedek dosyası saklanıyor.</p>
                </div>
            </div>

            {backupRequested && (
                <div className="theme-surface border theme-divider rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <Clock size={16} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold theme-text-primary">Yedek talebiniz işleme alındı</p>
                        <p className="text-xs theme-text-secondary mt-1">
                            Talep tamamlandığında kayıt, aşağıdaki Yedekleme Geçmişi listesine otomatik düşecektir.
                        </p>
                    </div>
                </div>
            )}

            <div className="theme-surface border theme-divider rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b theme-divider flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Archive size={16} className="theme-text-secondary" />
                        <span className="text-xs font-bold theme-text-secondary uppercase tracking-widest">Yedekleme Geçmişi</span>
                    </div>
                    <span className="text-[11px] theme-text-secondary">Toplam {backups.length} kayıt</span>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center theme-text-secondary">
                        <Loader2 className="animate-spin mx-auto" size={32} />
                    </div>
                ) : (
                    <div className="divide-y theme-divider">
                        {backups.map(b => (
                            <div key={b.id} className="group px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:theme-surface-alt transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 theme-surface-alt rounded-xl flex items-center justify-center theme-text-secondary group-hover:text-indigo-500 transition-colors">
                                        <Database size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold theme-text-primary">{b.filename}</div>
                                        <div className="text-[11px] theme-text-secondary mt-1 flex items-center gap-3 flex-wrap">
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {formatDateTime(b.created_at)}</span>
                                            <span className="w-1 h-1 bg-[#E5E9F0] rounded-full" />
                                            <span className="font-semibold">{formatSize(b.size)}</span>
                                            <span className="w-1 h-1 bg-[#E5E9F0] rounded-full" />
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${b.has_file ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                                                {b.has_file ? 'Hazır' : 'Dosya Eksik'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        disabled={!b.has_file}
                                        onClick={() => downloadBackup(b.id)}
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 theme-surface-alt hover:theme-surface border theme-divider theme-text-primary rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Download size={14} /> İndir
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(b)}
                                        className="p-2.5 theme-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
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
                    <div className="p-12 text-center theme-text-secondary">
                        <Database size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium italic">Henüz tamamlanmış yedek kaydı bulunmuyor.</p>
                    </div>
                )}
            </div>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Yedeği Sil">
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-xl flex gap-3 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-500/20">
                        <AlertCircle size={20} className="shrink-0" />
                        <p>Bu yedek dosyasını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 border theme-divider rounded-xl text-sm font-semibold hover:bg-[#F4F5F7] dark:hover:bg-white/10 transition-colors">Vazgeç</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-500/20">
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Kalıcı Olarak Sil'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
