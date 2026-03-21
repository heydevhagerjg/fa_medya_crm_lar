import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import {
    ChevronLeft, ArrowLeft, RotateCcw, Trash,
    Loader2,
    FolderOpen,
    Search,
    Grid,
    ListIcon,
    HardDrive,
    FileIcon,
    UploadCloud,
    Trash2,
    Download,
    ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal.jsx'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export default function FilesPage() {
    const qc = useQueryClient()
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState('list') // 'grid' or 'list'

    const navigate = useNavigate()
    const { folderId } = useParams()
    const activeFolderId = folderId ? Number(folderId) : null

    const setActiveFolderId = (id) => {
        if (id) {
            navigate(`/files/folder/${id}`)
        } else {
            navigate('/files')
        }
    }

    const [currentPage, setCurrentPage] = useState(1)
    const [fileSortMode, setFileSortMode] = useState('name')
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [downloadingZip, setDownloadingZip] = useState(false)

    const [showTrash, setShowTrash] = useState(false)
    const [trashSearch, setTrashSearch] = useState('')

    useEffect(() => {
        setCurrentPage(1)
    }, [search, activeFolderId, showTrash])

    const { data: jobsWithFiles = [], isLoading } = useQuery({
        queryKey: ['files'],
        queryFn: () => api.get('/files').then(r => r.data)
    })

    const deleteMutation = useMutation({
        mutationFn: ({ fileId }) => api.delete(`/files/${fileId}`),
        onSuccess: () => {
            qc.invalidateQueries(['files'])
            qc.invalidateQueries(['trash-files'])
            toast.success('Dosya çöp kutusuna taşındı.')
            setDeleteConfirm(null)
        },
        onError: () => toast.error('Hata oluştu.')
    })

    const restoreMutation = useMutation({
        mutationFn: (fileId) => api.post(`/files/${fileId}/restore`),
        onSuccess: () => {
            qc.invalidateQueries(['files'])
            qc.invalidateQueries(['trash-files'])
            toast.success('Dosya geri yüklendi.')
        },
        onError: () => toast.error('Geri yüklenemedi.')
    })

    const forceDeleteMutation = useMutation({
        mutationFn: (fileId) => api.delete(`/files/${fileId}/force`),
        onSuccess: () => {
            qc.invalidateQueries(['trash-files'])
            toast.success('Dosya kalıcı olarak silindi.')
            setDeleteConfirm(null)
        },
        onError: () => toast.error('Kalıcı silme hatası.')
    })

    const { data: trashedFiles = [], isLoading: isTrashLoading } = useQuery({
        queryKey: ['trash-files'],
        queryFn: () => api.get('/files/trash').then(r => r.data),
        enabled: showTrash
    })

    const handleDownloadSingle = async (file) => {
        const toastId = toast.loading('İndiriliyor...')
        try {
            const response = await api.get(`/files/${file.id}/download`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const a = document.createElement('a')
            a.href = url
            let fileName = file.fileName || file.file_name || 'dosya'
            const contentDisposition = response.headers['content-disposition']
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/)
                if (match && match[1]) {
                    fileName = match[1]
                }
            }
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
            toast.success('İndirme başarılı.', { id: toastId })
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Dosya indirilemedi.', { id: toastId })
        }
    }

    const handleDownloadAll = async (job, filesToDownload) => {
        if (!filesToDownload || filesToDownload.length === 0) {
            toast.error('İndirilecek dosya bulunamadı.')
            return
        }

        setDownloadingZip(true)
        const toastId = toast.loading('Dosyalar hazırlanıyor, lütfen bekleyin...')

        try {
            const zip = new JSZip()

            const promises = filesToDownload.map(async (file) => {
                try {
                    const response = await api.get(`/files/${file.id}/download`, { responseType: 'blob' })
                    if (!response.data) throw new Error('Ağ hatası')
                    zip.file(file.fileName, response.data)
                } catch (err) {
                    console.error('Dosya indirilemedi:', file.fileName, err)
                }
            })

            await Promise.all(promises)

            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `${job.title}_dosyalar.zip`)

            toast.success('İndirme başarılı.', { id: toastId })
        } catch (error) {
            console.error(error)
            toast.error('Toplu indirme sırasında bir hata oluştu.', { id: toastId })
        } finally {
            setDownloadingZip(false)
        }
    }

    // Filter logic
    const filteredJobs = useMemo(() => {
        // First filter out jobs that have no files
        let jobsWithActualFiles = jobsWithFiles.filter(job => job.jobfile && job.jobfile.length > 0)

        // Sınıfları alfabetik olarak isme göre A'dan Z'ye sırala
        jobsWithActualFiles = jobsWithActualFiles.sort((a, b) => a.title.localeCompare(b.title, 'tr'))

        if (!search) return jobsWithActualFiles

        return jobsWithActualFiles.map(job => {
            const matchesJob = job.title.toLowerCase().includes(search.toLowerCase())
            const matchedFiles = job.jobfile.filter(f =>
                f.fileName.toLowerCase().includes(search.toLowerCase())
            )

            if (matchesJob || matchedFiles.length > 0) {
                return { ...job, matchedFiles: matchedFiles.length > 0 ? matchedFiles : job.jobfile }
            }
            return null
        }).filter(Boolean)
    }, [jobsWithFiles, search])

    const totalFiles = useMemo(() => {
        return jobsWithFiles.reduce((acc, job) => acc + (job.jobfile?.length || 0), 0)
    }, [jobsWithFiles])

    const totalSize = useMemo(() => {
        const bytes = jobsWithFiles.reduce((acc, job) => {
            return acc + (job.jobfile?.reduce((fAcc, f) => fAcc + (parseInt(f.fileSize) || 0), 0) || 0)
        }, 0)

        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }, [jobsWithFiles])

    const getFileIcon = (type) => {
        if (type?.includes('image')) return <ImageIcon className="text-blue-500" size={20} />
        if (type?.includes('pdf')) return <FileText className="text-red-500" size={20} />
        return <FileIcon className="text-gray-500" size={20} />
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Dosyalarınız yükleniyor...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FolderOpen className="text-indigo-500" size={24} />
                        Dosyalar
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">AWS S3 üzerinde barındırılan tüm iş dosyalarınız</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Dosya veya iş ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all w-full md:w-64"
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                            onClick={() => { setShowTrash(false); setActiveFolderId(null); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!showTrash ? 'bg-white dark:bg-gray-700 text-indigo-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <FolderOpen size={14} /> Dosyalar
                        </button>
                        <button
                            onClick={() => { setShowTrash(true); setActiveFolderId(null); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showTrash ? 'bg-white dark:bg-gray-700 text-red-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Trash size={14} /> Çöp Kutusu
                        </button>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-indigo-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-indigo-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <HardDrive size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Toplam Boyut</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{totalSize}</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <FileIcon size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Toplam Dosya</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{totalFiles} Adet</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <FolderOpen size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">İş Sayısı</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{jobsWithFiles.length} Klasör</div>
                    </div>
                </div>
            </div>

            {/* Files Explorer */}
            <div className="space-y-4">
                {showTrash ? (
                    <div className="space-y-4">
                        <div className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 p-4 rounded-2xl flex items-center gap-3">
                            <Trash className="text-red-500" size={20} />
                            <p className="text-xs text-red-800 dark:text-red-300 font-medium">
                                Çöp kutusundaki dosyalar 30 gün sonra otomatik olarak tamamen silinecektir. İstediğiniz zaman geri yükleyebilir veya kalıcı olarak silebilirsiniz.
                            </p>
                        </div>

                        {trashedFiles.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
                                <Trash className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-400">Çöp Kutusu Boş</h3>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                                            <th className="px-4 py-3 text-left font-semibold">Dosya Adı / Ait Olduğu İş</th>
                                            <th className="px-4 py-3 text-left font-semibold">Silinme Tarihi</th>
                                            <th className="px-4 py-3 text-right font-semibold">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {trashedFiles.map(file => (
                                            <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {getFileIcon(file.file_type)}
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">{file.file_name}</div>
                                                            <div className="text-[10px] text-gray-400">İş: {file.job?.title}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">
                                                    {new Date(file.deleted_at).toLocaleString('tr-TR')}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => restoreMutation.mutate(file.id)}
                                                            className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                                                            title="Geri Yükle"
                                                            disabled={restoreMutation.isLoading}
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm({ fileId: file.id, fileName: file.file_name, isPermanent: true })}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                            title="Kalıcı Olarak Sil"
                                                        >
                                                            <Trash size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                        <UploadCloud className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Dosya Bulunamadı</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">Henüz S3 üzerine yüklenmiş bir dosya bulunmuyor veya aramanızla eşleşen sonuç yok.</p>
                    </div>
                ) : !activeFolderId ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredJobs.slice((currentPage - 1) * 10, currentPage * 10).map(job => (
                                <button
                                    key={job.id}
                                    onClick={() => setActiveFolderId(job.id)}
                                    className="flex flex-col text-left p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                                            <FolderOpen className="text-indigo-500" size={24} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white truncate" title={job.title}>
                                                {job.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 truncate" title={job.customer?.name}>
                                                {job.customer?.name || 'Müşterisiz'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                            {(job.matchedFiles || job.jobfile).length} Dosya
                                        </span>
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Pagination for Folders */}
                        {Math.ceil(filteredJobs.length / 10) > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Toplam <strong>{filteredJobs.length}</strong> klasörden <strong>{(currentPage - 1) * 10 + 1}</strong>-<strong>{Math.min(currentPage * 10, filteredJobs.length)}</strong> arası gösteriliyor
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredJobs.length / 10), p + 1))}
                                        disabled={currentPage === Math.ceil(filteredJobs.length / 10)}
                                        className="p-1.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    (() => {
                        const activeJob = filteredJobs.find(j => j.id === activeFolderId || String(j.id) === String(activeFolderId))
                        if (!activeJob) return <div className="text-center py-10">Klasör bulunamadı veya arama kriterlerine uymuyor.</div>

                        let files = [...(activeJob.matchedFiles || activeJob.jobfile)]

                        // Sort files based on selected mode
                        files.sort((a, b) => {
                            if (fileSortMode === 'name') {
                                return a.fileName.localeCompare(b.fileName, 'tr')
                            }
                            if (fileSortMode === 'size') {
                                return (parseInt(b.fileSize) || 0) - (parseInt(a.fileSize) || 0)
                            }
                            if (fileSortMode === 'date') {
                                const dateA = new Date(a.uploaded_at || a.uploadedAt || 0).getTime()
                                const dateB = new Date(b.uploaded_at || b.uploadedAt || 0).getTime()
                                return dateB - dateA
                            }
                            return 0
                        })

                        const totalPages = Math.ceil(files.length / 10)
                        const paginatedFiles = files.slice((currentPage - 1) * 10, currentPage * 10)

                        return (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => { setActiveFolderId(null); setSearch(''); }}
                                            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <ArrowLeft size={18} />
                                        </button>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <FolderOpen className="text-indigo-500" size={20} />
                                                <h2 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider">{activeJob.title}</h2>
                                            </div>
                                            <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                                <span>Müşteri: {activeJob.customer?.name || '-'}</span>
                                                <span>•</span>
                                                <Link to={`/jobs/${activeJob.id}`} className="text-indigo-500 hover:underline">İş Detayına Git</Link>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleDownloadAll(activeJob, files)}
                                            disabled={downloadingZip || files.length === 0}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {downloadingZip ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                            <span className="hidden sm:inline">{downloadingZip ? 'Hazırlanıyor...' : 'Toplu İndir'}</span>
                                        </button>

                                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 font-medium hidden sm:block">Sırala:</span>
                                            <select
                                                value={fileSortMode}
                                                onChange={e => setFileSortMode(e.target.value)}
                                                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                                            >
                                                <option value="name">Ad (A-Z)</option>
                                                <option value="date">Tarih (En Yeni)</option>
                                                <option value="size">Boyut (Büyükten Küçüğe)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {paginatedFiles.map(file => (
                                            <div
                                                key={file.id}
                                                className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-3 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-500/30 transition-all cursor-default"
                                            >
                                                <div className="aspect-square bg-gray-50 dark:bg-gray-800 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                                                    {file.fileType?.includes('image') ? (
                                                        <img
                                                            src={file.filePath}
                                                            alt={file.fileName}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <FileIcon size={32} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                                                    )}

                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDownloadSingle(file); }}
                                                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-colors"
                                                            title="İndir"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm({ jobId: activeJob.id, fileId: file.id, fileName: file.fileName })}
                                                            className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg backdrop-blur-md transition-colors"
                                                            title="Sil"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={file.fileName}>{file.fileName}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase">
                                                        {(parseInt(file.fileSize) / 1024).toFixed(1)} KB • {file.fileType.split('/')[1]?.toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                                                    <th className="px-4 py-3 text-left font-semibold">Dosya Adı</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Tür</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Boyut</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Tarih</th>
                                                    <th className="px-4 py-3 text-right font-semibold">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {paginatedFiles.map(file => (
                                                    <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                {getFileIcon(file.fileType)}
                                                                <span className="font-medium text-gray-900 dark:text-white">{file.fileName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-500 uppercase text-xs">{file.fileType.split('/')[1]}</td>
                                                        <td className="px-4 py-3 text-gray-500">{(parseInt(file.fileSize) / 1024).toFixed(1)} KB</td>
                                                        <td className="px-4 py-3 text-gray-500 text-xs">{file.uploaded_at || file.uploadedAt ? new Date(file.uploaded_at || file.uploadedAt).toLocaleString('tr-TR') : '-'}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button onClick={(e) => { e.stopPropagation(); handleDownloadSingle(file); }} className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors" title="İndir">
                                                                    <Download size={16} />
                                                                </button>
                                                                <button onClick={() => setDeleteConfirm({ jobId: activeJob.id, fileId: file.id, fileName: file.fileName })} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Pagination for Files */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-5 py-3 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 mt-4">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Toplam <strong>{files.length}</strong> dosyadan <strong>{(currentPage - 1) * 10 + 1}</strong>-<strong>{Math.min(currentPage * 10, files.length)}</strong> arası gösteriliyor
                                        </span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="p-1.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-1.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })()
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Dosyayı Sil" size="sm">
                <div className="space-y-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-full mx-auto text-red-600 dark:text-red-400">
                        <Trash2 size={24} />
                    </div>
                    <div className="text-center">
                        <p className="text-gray-900 dark:text-white font-medium mb-1">
                            {deleteConfirm?.isPermanent ? 'Kalıcı olarak silmek istediğinize emin misiniz?' : 'Dosyayı çöp kutusuna taşıyorsunuz'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 px-4">
                            <span className="font-semibold text-gray-700 dark:text-gray-200">"{deleteConfirm?.fileName}"</span> isimli dosya {deleteConfirm?.isPermanent ? 'KALICI olarak silinecek ve kota iade edilecek.' : 'çöp kutusuna aktarılacak.'}
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={() => deleteConfirm?.isPermanent ? forceDeleteMutation.mutate(deleteConfirm.fileId) : deleteMutation.mutate(deleteConfirm)}
                            disabled={deleteMutation.isLoading || forceDeleteMutation.isLoading}
                            className={`flex-1 px-4 py-2 text-sm font-medium text-white ${deleteConfirm?.isPermanent ? 'bg-black hover:bg-gray-900' : 'bg-red-600 hover:bg-red-700'} rounded-xl shadow-lg transition-all disabled:opacity-50`}
                        >
                            {deleteMutation.isLoading || forceDeleteMutation.isLoading ? 'Bekleyin...' : 'Onayla'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
