import { useState, useEffect } from 'react'
import { 
    Database, Download, Trash2, Plus, 
    RefreshCcw, HardDrive, Cloud, AlertCircle, 
    CheckCircle2, Loader2, Info
} from 'lucide-react'
import api from '../../../lib/api.js'
import toast from 'react-hot-toast'

export default function SystemBackupPage() {
    const [backups, setBackups] = useState({ local: [], s3: [] })
    const [loading, setLoading] = useState(true)
    const [activeDisk, setActiveDisk] = useState('local')
    const [isBackingUp, setIsBackingUp] = useState(false)

    const fetchBackups = async () => {
        setLoading(true)
        try {
            const response = await api.get('/admin/backups')
            setBackups(response.data)
        } catch (error) {
            toast.error('Yedekler listelenirken bir hata oluÅŸtu.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBackups()
    }, [])

    const handleCreateBackup = async () => {
        setIsBackingUp(true)
        try {
            const response = await api.post('/admin/backups')
            toast.success(response.data.message)
            // It runs in the background, so we won't see it immediately
        } catch (error) {
            toast.error('Yedekleme baÅŸlatÄ±lamadÄ±.')
        } finally {
            setIsBackingUp(false)
        }
    }

    const handleDelete = async (disk, path) => {
        if (!confirm('Bu yedeÄŸi silmek istediÄŸinize emin misiniz?')) return

        try {
            await api.post('/admin/backups/destroy', { disk, path })
            toast.success('Yedek baÅŸarÄ±yla silindi.')
            fetchBackups()
        } catch (error) {
            toast.error('Yedek silinirken bir hata oluÅŸtu.')
        }
    }

    const handleDownload = async (disk, path, filename) => {
        try {
            const response = await api.get(`/admin/backups/download?disk=${disk}&path=${path}`, {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            toast.error('Dosya indirilemedi.')
        }
    }

    const currentBackups = backups[activeDisk] || []

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sistem Yedekleri</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Sistemin tÃ¼m veritabanÄ± ve temel dosya yedeÄŸini yÃ¶netin.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchBackups}
                        className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        title="Yenile"
                    >
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleCreateBackup}
                        disabled={isBackingUp}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isBackingUp ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Plus size={18} />
                        )}
                        <span>Åimdi Yedek Al</span>
                    </button>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4 flex gap-3 text-blue-700 dark:text-blue-400">
                <Info className="shrink-0" size={20} />
                <div className="text-sm leading-relaxed">
                    <strong>Bilgi:</strong> "Åimdi Yedek Al" butonu iÅŸlemi arka planda baÅŸlatÄ±r. 
                    VeritabanÄ± boyutuna gÃ¶re iÅŸlemin tamamlanmasÄ± birkaÃ§ dakika sÃ¼rebilir. 
                    Yedekler hem yerel sunucuya hem de bulut (S3) Ã¼zerine kaydedilir.
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[32px] overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setActiveDisk('local')}
                        className={`flex items-center justify-center gap-2 flex-1 py-4 text-sm font-bold border-b-2 transition-all ${
                            activeDisk === 'local' 
                            ? 'border-red-600 text-red-600 bg-red-50/10' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <HardDrive size={18} />
                        Yerel Depolama (Local)
                    </button>
                    <button
                        onClick={() => setActiveDisk('s3')}
                        className={`flex items-center justify-center gap-2 flex-1 py-4 text-sm font-bold border-b-2 transition-all ${
                            activeDisk === 's3' 
                            ? 'border-red-600 text-red-600 bg-red-50/10' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Cloud size={18} />
                        Bulut Depolama (S3)
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left theme-table">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-200 dark:border-gray-800">
                                <th className="px-6 py-4">Dosya AdÄ±</th>
                                <th className="px-6 py-4">Boyut</th>
                                <th className="px-6 py-4 text-right">Tarih</th>
                                <th className="px-6 py-4 text-right">Ä°ÅŸlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <Loader2 className="mx-auto animate-spin text-red-600 mb-4" size={32} />
                                        <div className="text-gray-500 font-medium">Yedekler taranÄ±yor...</div>
                                    </td>
                                </tr>
                            ) : currentBackups.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium italic">
                                        Bu disk Ã¼zerinde henÃ¼z yedek bulunmuyor.
                                    </td>
                                </tr>
                            ) : (
                                currentBackups.map((bk, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                                    <Database size={18} />
                                                </div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-xs" title={bk.name}>
                                                    {bk.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">
                                                {bk.size}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {bk.last_modified}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleDownload(activeDisk, bk.path, bk.name)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-600/10 rounded-lg transition-colors"
                                                    title="Ä°ndir"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(activeDisk, bk.path)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-600/10 rounded-lg transition-colors"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
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

