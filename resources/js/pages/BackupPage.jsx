import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import { useAuthStore } from '../stores/index.js'
import toast from 'react-hot-toast'
import { Database, Download, Upload, CheckCircle, AlertCircle, XCircle, RefreshCcw, Loader2, Info, Clock } from 'lucide-react'
import PlanRestrictionView from '../components/ui/PlanRestrictionView.jsx'
import { useState } from 'react'

export default function BackupPage() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_backup_feature === false || user?.tenant?.plan_backup_feature === 0

    if (isFeatureDisabled) {
        return <PlanRestrictionView featureName="Yedekleme" />
    }

    const [importing, setImporting] = useState(false)
    const [resetting, setResetting] = useState(false)
    const [importFile, setImportFile] = useState(null)
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)
    const [tempImportPassword, setTempImportPassword] = useState('')
    const qc = useQueryClient()

    // 1. Admin'in aldığı yedekleri listele
    const { data: appBackupsData, refetch: refetchAppBackups, isLoading: loadingApp } = useQuery({
        queryKey: ['app-backups'],
        queryFn: () => api.get('/settings/backup/list').then(r => r.data)
    })
    const appBackups = Array.isArray(appBackupsData?.backups) ? appBackupsData.backups : []
    const isRequested = appBackupsData?.backup_requested || false

    // 2. Yedekleme Talebi
    const requestMutation = useMutation({
        mutationFn: () => api.post('/settings/backup/request'),
        onSuccess: (data) => {
            toast.success(data.data.message || 'Yedekleme talebi iletildi.')
            qc.invalidateQueries(['app-backups'])
        },
        onError: () => toast.error('Talep iletilemedi.')
    })

    const cancelRequestMutation = useMutation({
        mutationFn: () => api.post('/settings/backup/cancel-request'),
        onSuccess: () => {
            toast.success('Talep iptal edildi.')
            qc.invalidateQueries(['app-backups'])
        }
    })

    const handleExport = () => requestMutation.mutate()

    const handleImport = async (e, providedPassword = null) => {
        if (e) e.preventDefault()
        if (!importFile) { toast.error('Lütfen bir dosya seçin.'); return }
        setImporting(true)
        const formData = new FormData()
        formData.append('file', importFile)
        if (providedPassword) {
            formData.append('password', providedPassword)
            setPasswordModalOpen(false)
        }
        try {
            await api.post('/settings/backup/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

            // Hemen is_restoring moduna geçmesini sağlıyoruz ki ekran kapansın
            const currentUser = useAuthStore.getState().user
            if (currentUser && currentUser.tenant) {
                useAuthStore.getState().updateUser({
                    ...currentUser,
                    tenant: { ...currentUser.tenant, is_restoring: true }
                })
            }

            toast.success('Yedek aktarma işlemi arka planda başlatıldı.')
            setImportFile(null)
            setTempImportPassword('')
        } catch (err) {
            if (err.response?.status === 403) {
                setPasswordModalOpen(true)
                toast('Yedek şifreli. Lütfen şifreyi girin.', { icon: '🔑' })
            } else {
                toast.error(err.response?.data?.message || 'İçe aktarma başarısız.')
            }
        } finally {
            setImporting(false)
        }
    }

    const handleReset = async () => {
        if (!window.confirm('TÜM VERİLERİNİSİZ KALICI OLARAK SİLİNECEKTİR! Bu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?')) return

        setResetting(true)
        try {
            await api.post('/settings/backup/reset')
            toast.success('Tüm verileriniz başarıyla temizlendi.')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sıfırlama işlemi başarısız.')
        } finally {
            setResetting(false)
        }
    }


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold theme-text-primary flex items-center gap-2">
                    <Database size={24} className="text-indigo-500" />
                    Yedek Yönetimi
                </h1>
                <p className="theme-text-secondary text-sm mt-1">Verilerinizi dışa ve içe aktarın</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export */}
                <div className="theme-surface border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Download size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold theme-text-primary">Firma Tam Yedek Talebi</h2>
                            <p className="text-sm theme-text-secondary text-xs font-medium">Admin panelinden tam paket yedeği talep edin</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 mb-6">
                        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                            Butona tıkladığınızda admin paneline bir yedekleme talebi düşer. Admin talebi onayladığında tam yedeğiniz hazırlanır ve aşağıda listelenir.
                        </p>
                    </div>

                    {isRequested ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-500/20 animate-pulse uppercase">
                                <AlertCircle size={16} /> Aktif Bir Yedek Talebiniz Bulunuyor
                            </div>
                            <button
                                onClick={() => cancelRequestMutation.mutate()}
                                disabled={cancelRequestMutation.isLoading}
                                className="w-full py-2.5 px-4 theme-button-secondary rounded-xl text-sm font-bold transition-all"
                            >
                                {cancelRequestMutation.isLoading ? 'İptal ediliyor...' : 'Talebi İptal Et'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleExport}
                            disabled={requestMutation.isLoading}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {requestMutation.isLoading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                            {requestMutation.isLoading ? 'Gönderiliyor...' : 'Şimdi Yedek Talep Et'}
                        </button>
                    )}
                </div>

                {/* Import */}
                <div className="theme-surface border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                            <Upload size={20} className="text-orange-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold theme-text-primary">Yedek Yükle (Import)</h2>
                            <p className="text-sm theme-text-secondary">ZIP dosyasından tüm sistemi geri yükle</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 mb-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl">
                        <AlertCircle size={16} className="text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-orange-700 dark:text-orange-400">
                            <b>Dikkat:</b> Yedek yükleme işlemi mevcut tüm verilerinizi silecek ve yedeği yükleyecektir. İşlem öncesi güncel yedek almayı unutmayın.
                        </p>
                    </div>

                    <form onSubmit={handleImport} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium theme-text-primary mb-2">ZIP Dosyası Seçin</label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed theme-divider rounded-xl cursor-pointer hover:bg-[var(--theme-bg-surface-alt)] transition-colors">
                                <div className="flex flex-col items-center text-center">
                                    <Upload size={24} className="theme-text-secondary mb-2" />
                                    {importFile ? (
                                        <span className="text-sm font-medium text-indigo-500">{importFile.name}</span>
                                    ) : (
                                        <>
                                            <span className="text-sm theme-text-secondary">Dosya seçmek için tıklayın</span>
                                            <span className="text-xs theme-text-secondary mt-1">Sadece .zip</span>
                                        </>
                                    )}
                                </div>
                                <input type="file" accept=".zip" className="hidden" onChange={e => setImportFile(e.target.files[0])} />
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={importing || !importFile}
                            className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {importing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={16} />}
                            {importing ? 'İçe Aktarılıyor...' : 'Yedek Yükle'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Admin Backups Table */}
            <div className="theme-surface border rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b theme-divider flex items-center justify-between theme-surface-alt">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Database size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold theme-text-primary">Hazır Yedekler</h2>
                            <p className="text-xs theme-text-secondary">Admin tarafından sizin için hazırlanan yedekler</p>
                        </div>
                    </div>
                    <button onClick={() => refetchAppBackups()} className="p-2 theme-text-secondary theme-button-secondary rounded-xl transition-all">
                        <RefreshCcw size={18} className={loadingApp ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="theme-surface-alt theme-text-secondary text-[10px] font-black uppercase tracking-widest border-b theme-divider">
                                <th className="px-6 py-4">Dosya Adı</th>
                                <th className="px-6 py-4">Boyut</th>
                                <th className="px-6 py-4">Tarih</th>
                                <th className="px-6 py-4 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y theme-divider">
                            {loadingApp && appBackups.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center theme-text-secondary">
                                        <Loader2 className="mx-auto animate-spin mb-2" size={24} />
                                        Yedekler yükleniyor...
                                    </td>
                                </tr>
                            ) : appBackups.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center theme-text-secondary italic text-sm">
                                        Henüz admin tarafından hazırlanan bir yedek bulunmuyor.
                                    </td>
                                </tr>
                            ) : (
                                appBackups.map((bak) => (
                                    <tr key={bak.id} className="hover:bg-[var(--theme-bg-surface-alt)] transition-colors group">
                                        <td className="px-6 py-4 font-bold text-sm theme-text-primary">
                                            {bak.filename}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium theme-text-secondary">
                                            {(bak.size / 1024 / 1024).toFixed(2)} MB
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold theme-text-primary">
                                                    {new Date(bak.created_at).toLocaleDateString('tr-TR')}
                                                </span>
                                                <span className="text-[10px] theme-text-secondary">
                                                    {new Date(bak.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={async () => {
                                                    const toastId = toast.loading('İndirme hazırlanıyor...');
                                                    try {
                                                        const res = await api.get(`/settings/backup/${bak.id}/signed-url`);
                                                        if (res.data.url) {
                                                            window.open(res.data.url, '_blank');
                                                            toast.success('İndirme başladı.', { id: toastId });
                                                        }
                                                    } catch (err) {
                                                        toast.error('İndirme bağlantısı oluşturulamadı.', { id: toastId });
                                                    }
                                                }}
                                                className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                                            >
                                                Yedeği İndir
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reset Data Section */}
            <div className="theme-surface border border-red-200 dark:border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <AlertCircle size={20} className="text-red-500" />
                    </div>
                    <div>
                        <h2 className="font-semibold theme-text-primary">Verileri Sıfırla</h2>
                        <p className="text-sm theme-text-secondary">Hesabınıza ait tüm verileri kalıcı olarak siler</p>
                    </div>
                </div>

                <div className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-xl p-4 mb-6">
                    <p className="text-sm text-red-700 dark:text-red-400">
                        <strong>Dikkat:</strong> Bu işlem müşterilerinizi, işlerinizi, ödemelerinizi ve tüm ayarlarınızı <strong>geri döndürülemez</strong> şekilde silecektir. İşleme devam etmeden önce bir yedek almanız şiddetle önerilir.
                    </p>
                </div>

                <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="py-2.5 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {resetting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <AlertCircle size={16} />}
                    {resetting ? 'Sıfırlanıyor...' : 'Tüm Verileri Şimdi Sil'}
                </button>
            </div>
            {/* Password Modal for Import */}
            {passwordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="theme-surface rounded-2xl p-6 w-full max-w-sm shadow-2xl border theme-divider animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold theme-text-primary mb-2">Yedek Şifresi Gerekli</h3>
                        <p className="text-sm theme-text-secondary mb-4">Bu yedek dosyası şifrelenmiş. Lütfen devam etmek için şifreyi girin.</p>

                        <div className="space-y-4">
                            <input
                                type="password"
                                value={tempImportPassword}
                                onChange={(e) => setTempImportPassword(e.target.value)}
                                placeholder="Backup Şifresi"
                                autoFocus
                                className="w-full px-4 py-2.5 border rounded-xl text-sm theme-input"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setPasswordModalOpen(false); setImporting(false); }}
                                    className="flex-1 py-2 text-sm font-medium theme-text-secondary hover:theme-text-primary transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={() => handleImport(null, tempImportPassword)}
                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
                                >
                                    Onayla ve Yükle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
