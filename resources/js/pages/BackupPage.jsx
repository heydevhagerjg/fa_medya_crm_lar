import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api.js'
import { useAuthStore } from '../stores/index.js'
import toast from 'react-hot-toast'
import { Database, Download, Upload, CheckCircle, AlertCircle, Cloud, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import PlanRestrictionView from '../components/ui/PlanRestrictionView.jsx'

export default function BackupPage() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_backup_feature === false || user?.tenant?.plan_backup_feature === 0

    if (isFeatureDisabled) {
        return <PlanRestrictionView featureName="Yedekleme" />
    }

    const [importing, setImporting] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [resetting, setResetting] = useState(false)
    const [importFile, setImportFile] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [exportPassword, setExportPassword] = useState('')
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)
    const [tempImportPassword, setTempImportPassword] = useState('')

    const handleExport = async () => {
        setExporting(true)
        try {
            const response = await api.get(`/settings/backup/export${exportPassword ? `?password=${encodeURIComponent(exportPassword)}` : ''}`, { responseType: 'blob' })
            const url = URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }))
            const a = document.createElement('a')
            a.href = url

            // Try to extract filename from content-disposition header
            let filename = `backup_${new Date().toISOString().substring(0, 10)}.zip`
            const disposition = response.headers['content-disposition']
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
                const matches = filenameRegex.exec(disposition)
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '')
                }
            }

            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast.success('Tam yedek (ZIP) başarıyla indirildi.')
            setExportPassword('')
            s3BackupsRefetch()
        } catch {
            toast.error('Yedek alınamadı.')
        } finally {
            setExporting(false)
        }
    }

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

    const { data: s3Backups = [], isLoading: isLoadingS3, error, isError, refetch: s3BackupsRefetch } = useQuery({
        queryKey: ['s3-backups'],
        queryFn: () => api.get('/settings/backup/s3/list').then(r => r.data),
        retry: false, // In case S3 isn't set up, it will just fail gracefully
    })

    const handleS3Download = async (filename) => {
        try {
            const toastId = toast.loading('İndiriliyor...')
            const response = await api.get(`/settings/backup/s3/download?filename=${encodeURIComponent(filename)}`, { responseType: 'blob' })
            const url = URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }))
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast.success('Yedek indirildi.', { id: toastId })
        } catch {
            toast.error('Buluttan indirme başarısız.')
        }
    }

    const itemsPerPage = 5
    const totalPages = Math.ceil((s3Backups?.length || 0) / itemsPerPage)
    const paginatedBackups = s3Backups?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || []

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white dark:bg-transparent rounded-3xl border border-gray-100 dark:border-gray-800">
                <XCircle size={48} className="text-red-500 mb-4 opacity-20" />
                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Erişim Kısıtlandı</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                    {error.response?.data?.message || 'Yedekleme özelliği paketinizde bulunmamaktadır.'}
                </p>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                    Ana Sayfaya Dön
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Database size={24} className="text-indigo-500" />
                    Yedek Yönetimi
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Verilerinizi dışa ve içe aktarın</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Download size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Tam Yedek Al (Full Export)</h2>
                            <p className="text-sm text-gray-500">Veri ve Dosyaları ZIP formatında indir</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        {['Müşteriler ve iş geçmişi', 'Randevular ve Takvim', 'Tahsilatlar ve masraflar', 'Hizmetler ve ayarlar', 'Aktivite logları'].map(item => (
                            <div key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Opsiyonel Yedek Şifresi</label>
                        <input 
                            type="password"
                            value={exportPassword}
                            onChange={(e) => setExportPassword(e.target.value)}
                            placeholder="Şifresiz için boş bırakın"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {exporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={16} />}
                        {exporting ? 'Hazırlanıyor...' : 'Yedek İndir'}
                    </button>
                </div>

                {/* Import */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                            <Upload size={20} className="text-orange-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Yedek Yükle (Import)</h2>
                            <p className="text-sm text-gray-500">ZIP dosyasından tüm sistemi geri yükle</p>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ZIP Dosyası Seçin</label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex flex-col items-center text-center">
                                    <Upload size={24} className="text-gray-400 mb-2" />
                                    {importFile ? (
                                        <span className="text-sm font-medium text-indigo-500">{importFile.name}</span>
                                    ) : (
                                        <>
                                            <span className="text-sm text-gray-500">Dosya seçmek için tıklayın</span>
                                            <span className="text-xs text-gray-400 mt-1">Sadece .zip</span>
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

            {/* Reset Data Section */}
            <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <AlertCircle size={20} className="text-red-500" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">Verileri Sıfırla</h2>
                        <p className="text-sm text-gray-500">Hesabınıza ait tüm verileri kalıcı olarak siler</p>
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

            {/* S3 Backups Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Cloud size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Bulut Yedekleri (AWS S3)</h2>
                            <p className="text-sm text-gray-500">Geçmişte dışa aktarılan yedeklemeler</p>
                        </div>
                    </div>
                    <button onClick={() => s3BackupsRefetch()} className="text-sm text-indigo-500 hover:text-indigo-600 transition-colors">Yenile</button>
                </div>

                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mt-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-left">
                                <th className="px-5 py-3 font-semibold text-gray-500">Dosya Adı</th>
                                <th className="px-5 py-3 font-semibold text-gray-500">Yedek Türü</th>
                                <th className="px-5 py-3 font-semibold text-gray-500">Boyut</th>
                                <th className="px-5 py-3 font-semibold text-gray-500">Tarih</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {isLoadingS3 ? (
                                <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400">Yedekler yükleniyor...</td></tr>
                            ) : paginatedBackups.length > 0 ? (
                                paginatedBackups.map((backup, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                        <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-300 flex items-center gap-2">
                                            <Database size={14} className="text-gray-400" />
                                            {backup.name.replace('_auto_', '_')}
                                        </td>
                                        <td className="px-5 py-4">
                                            {backup.type === 'Otomatik' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                    Otomatik
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                                                    Manuel
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-gray-500">{(backup.size / 1024).toFixed(2)} KB</td>
                                        <td className="px-5 py-4 text-gray-500">{new Date(backup.last_modified * 1000).toLocaleString('tr-TR')}</td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => handleS3Download(backup.name)}
                                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                                            >
                                                İndir
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-5 py-8 text-center text-gray-500">
                                        Herhangi bir bulut yedeği bulunamadı. AWS S3 ayarlarınız eksik olabilir veya hiç yedek almamış olabilirsiniz.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Toplam <strong>{s3Backups.length}</strong> yedekten <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>-<strong>{Math.min(currentPage * itemsPerPage, s3Backups.length)}</strong> arası gösteriliyor
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Password Modal for Import */}
            {passwordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Yedek Şifresi Gerekli</h3>
                        <p className="text-sm text-gray-500 mb-4">Bu yedek dosyası şifrelenmiş. Lütfen devam etmek için şifreyi girin.</p>
                        
                        <div className="space-y-4">
                            <input 
                                type="password"
                                value={tempImportPassword}
                                onChange={(e) => setTempImportPassword(e.target.value)}
                                placeholder="Backup Şifresi"
                                autoFocus
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                            />
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setPasswordModalOpen(false); setImporting(false); }} 
                                    className="flex-1 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
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
