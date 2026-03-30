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
    List,
    HardDrive,
    File,
    UploadCloud,
    Trash2,
    Download,
    ChevronRight,
    Image,
    FileText,
    Eye,
    X
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal.jsx'
import PageHeader from '../components/layout/PageHeader.jsx'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// Loads image through the auth-protected download endpoint (works for both private AWS S3 and public R2)
function AuthImage({ fileId, alt, className }) {
    const { data: blobUrl, isLoading } = useQuery({
        queryKey: ['file-blob', fileId],
        queryFn: async () => {
            const response = await api.get(`/files/${fileId}/download`, { responseType: 'blob' })
            return window.URL.createObjectURL(response.data)
        },
        staleTime: 30 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })
    if (isLoading) return <div className="w-full h-full flex items-center justify-center"><Loader2 size={20} className="animate-spin theme-text-secondary" /></div>
    if (!blobUrl) return null
    return <img src={blobUrl} alt={alt} className={className} />
}

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

    const handlePreviewFile = async (file) => {
        const toastId = toast.loading('Yükleniyor...')
        try {
            const response = await api.get(`/files/${file.id}/download`, { responseType: 'blob' })
            const contentType = response.headers['content-type']
            const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }))
            setPreview({
                open: true,
                url,
                type: contentType,
                fileName: file.file_name || file.fileName
            })
            toast.dismiss(toastId)
        } catch (error) {
            console.error('File preview error:', error)
            toast.error('Dosya yüklenemedi.', { id: toastId })
        }
    }

    const [currentPage, setCurrentPage] = useState(1)
    const [fileSortMode, setFileSortMode] = useState('name')
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [showClearTrashConfirm, setShowClearTrashConfirm] = useState(false)
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
    const [selectedFileIds, setSelectedFileIds] = useState([])
    const [preview, setPreview] = useState({ open: false, url: null, type: null, fileName: null })
    const [downloadingZip, setDownloadingZip] = useState(false)

    const [showTrash, setShowTrash] = useState(false)
    const [trashSearch, setTrashSearch] = useState('')

    useEffect(() => {
        setCurrentPage(1)
        setSelectedFileIds([])
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

    const clearTrashMutation = useMutation({
        mutationFn: () => api.post('/files/trash/clear'),
        onSuccess: () => {
            qc.invalidateQueries(['trash-files'])
            qc.invalidateQueries(['files'])
            toast.success('Çöp kutusu temizlendi.')
        },
        onError: () => toast.error('Temizleme sırasında hata oluştu.')
    })

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => api.post('/files/bulk-delete', { ids }),
        onSuccess: (res) => {
            qc.invalidateQueries(['files'])
            qc.invalidateQueries(['trash-files'])
            setSelectedFileIds([])
            toast.success(res.data.message)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Silinemedi.'),
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
                    zip.file(file.file_name || file.fileName, response.data)
                } catch (err) {
                    console.error('Dosya indirilemedi:', file.file_name || file.fileName, err)
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
        jobsWithActualFiles = jobsWithActualFiles.sort((a, b) => (a.title || '').toString().localeCompare((b.title || '').toString(), 'tr'))

        if (!search) return jobsWithActualFiles

        const searchLower = (search || '').toString().toLowerCase()

        return jobsWithActualFiles.map(job => {
            const matchesJob = (job.title || '').toString().toLowerCase().includes(searchLower)
            const matchedFiles = job.jobfile.filter(f =>
                (f.file_name || f.fileName || '').toString().toLowerCase().includes(searchLower)
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
            return acc + (job.jobfile?.reduce((fAcc, f) => fAcc + (parseInt(f.file_size || f.fileSize) || 0), 0) || 0)
        }, 0)

        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }, [jobsWithFiles])

    const getFileIcon = (type) => {
        if (type?.includes('image')) return <Image className="text-blue-500" size={20} />
        if (type?.includes('pdf')) return <FileText className="text-red-500" size={20} />
        return <File className="theme-text-secondary" size={20} />
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="theme-text-secondary font-medium">Dosyalarınız yükleniyor...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Dosyalar"
                subtitle="AWS S3 üzerinde barındırılan tüm iş dosyalarınız"
                icon={FolderOpen}
                iconColor="text-indigo-500"
                search={{ icon: Search, value: search, onChange: e => setSearch(e.target.value), placeholder: 'Dosya veya iş ara...' }}
                breadcrumbs={['Dosyalar']}
            >
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center theme-surface-alt rounded-xl p-1 gap-1 border theme-divider">
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'text-indigo-600 dark:text-indigo-400 theme-surface shadow-sm border theme-divider' : 'theme-text-secondary hover:text-indigo-500'}`}><List size={16} /></button>
                        <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'text-indigo-600 dark:text-indigo-400 theme-surface shadow-sm border theme-divider' : 'theme-text-secondary hover:text-indigo-500'}`}><Grid size={16} /></button>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium theme-text-secondary theme-surface-alt px-3 py-1.5 rounded-lg">
                        <HardDrive size={16} /> {totalFiles} dosya â€¢ {totalSize}
                    </div>
                </div>
            </PageHeader>

                    <div className="flex items-center gap-1 theme-surface-alt p-1 rounded-xl">
                        <button
                            onClick={() => { setShowTrash(false); setActiveFolderId(null); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!showTrash ? 'theme-surface text-indigo-500 shadow-sm' : 'theme-text-secondary hover:text-indigo-500'}`}
                        >
                            <FolderOpen size={14} /> Dosyalar
                        </button>
                        <button
                            onClick={() => { setShowTrash(true); setActiveFolderId(null); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showTrash ? 'theme-surface text-red-500 shadow-sm' : 'theme-text-secondary hover:text-indigo-500'}`}
                        >
                            <Trash size={14} /> Çöp Kutusu
                        </button>
                    </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="theme-surface border rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <HardDrive size={24} />
                    </div>
                    <div>
                        <div className="text-xs theme-text-secondary uppercase tracking-wider font-semibold">Toplam Boyut</div>
                        <div className="text-lg font-bold theme-text-primary">{totalSize}</div>
                    </div>
                </div>
                <div className="theme-surface border rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <File size={24} />
                    </div>
                    <div>
                        <div className="text-xs theme-text-secondary uppercase tracking-wider font-semibold">Toplam Dosya</div>
                        <div className="text-lg font-bold theme-text-primary">{totalFiles} Adet</div>
                    </div>
                </div>
                <div className="theme-surface border rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <FolderOpen size={24} />
                    </div>
                    <div>
                        <div className="text-xs theme-text-secondary uppercase tracking-wider font-semibold">İş Sayısı</div>
                        <div className="text-lg font-bold theme-text-primary">{jobsWithFiles.length} Klasör</div>
                    </div>
                </div>
            </div>

            {/* Files Explorer */}
            <div className="space-y-4">
                {showTrash ? (
                    <div className="space-y-4">
                        <div className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Trash className="text-red-500" size={20} />
                                <p className="text-xs text-red-800 dark:text-red-300 font-medium">
                                    Çöp kutusundaki dosyalar 30 gün sonra otomatik olarak tamamen silinecektir. İstediğiniz zaman geri yükleyebilir veya kalıcı olarak silebilirsiniz.
                                </p>
                            </div>
                            {trashedFiles.length > 0 && (
                                <button
                                    onClick={() => setShowClearTrashConfirm(true)}
                                    disabled={clearTrashMutation.isLoading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
                                >
                                    <Trash2 size={14} /> Çöp Kutusunu Boşalt
                                </button>
                            )}
                        </div>

                        {trashedFiles.length === 0 ? (
                            <div className="text-center py-20 theme-surface rounded-3xl border theme-divider">
                                <Trash className="w-12 h-12 theme-text-secondary opacity-40 mx-auto mb-4" />
                                <h3 className="text-lg font-medium theme-text-secondary">Çöp Kutusu Boş</h3>
                            </div>
                        ) : (
                            <div className="theme-surface border rounded-2xl overflow-hidden">
                                <table className="w-full text-sm theme-table">
                                    <thead>
                                        <tr className="theme-surface-alt theme-text-secondary border-b theme-divider">
                                            <th className="px-4 py-3 text-left font-semibold">Dosya Adı / Ait Olduğu İş</th>
                                            <th className="px-4 py-3 text-left font-semibold">Silinme Tarihi</th>
                                            <th className="px-4 py-3 text-right font-semibold">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y theme-divider">
                                        {trashedFiles.map(file => (
                                            <tr key={file.id} className="hover:bg-[var(--theme-bg-surface-alt)] transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {getFileIcon(file.file_type)}
                                                        <div>
                                                            <div className="font-medium theme-text-primary">{file.file_name}</div>
                                                            <div className="text-[10px] theme-text-secondary">İş: {file.job?.title}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 theme-text-secondary text-xs">
                                                    {new Date(file.deleted_at).toLocaleString('tr-TR')}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => restoreMutation.mutate(file.id)}
                                                            className="p-1.5 theme-text-secondary hover:text-green-500 transition-colors"
                                                            title="Geri Yükle"
                                                            disabled={restoreMutation.isLoading}
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm({ fileId: file.id, fileName: file.file_name, isPermanent: true })}
                                                            className="p-1.5 theme-text-secondary hover:text-red-500 transition-colors"
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
                    <div className="text-center py-20 theme-surface rounded-3xl border border-dashed theme-divider">
                        <UploadCloud className="w-12 h-12 theme-text-secondary mx-auto mb-4" />
                        <h3 className="text-lg font-medium theme-text-primary mb-1">Dosya Bulunamadı</h3>
                        <p className="theme-text-secondary max-w-xs mx-auto">Henüz S3 üzerine yüklenmiş bir dosya bulunmuyor veya aramanızla eşleşen sonuç yok.</p>
                    </div>
                ) : !activeFolderId ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredJobs.slice((currentPage - 1) * 10, currentPage * 10).map(job => (
                                <button
                                    key={job.id}
                                    onClick={() => setActiveFolderId(job.id)}
                                    className="flex flex-col text-left p-4 theme-surface border rounded-2xl hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                                            <FolderOpen className="text-indigo-500" size={24} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold theme-text-primary truncate" title={job.title}>
                                                {job.title}
                                            </h3>
                                            <p className="text-xs theme-text-secondary truncate" title={job.customer?.name}>
                                                {job.customer?.name || 'Müşterisiz'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xs font-medium theme-text-secondary theme-surface-alt px-2 py-1 rounded">
                                            {(job.matchedFiles || job.jobfile).length} Dosya
                                        </span>
                                        <ChevronRight size={16} className="theme-text-secondary group-hover:text-indigo-400 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Pagination for Folders */}
                        {Math.ceil(filteredJobs.length / 10) > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border theme-divider rounded-2xl theme-surface">
                                <span className="text-sm theme-text-secondary">
                                    Toplam <strong>{filteredJobs.length}</strong> klasörden <strong>{(currentPage - 1) * 10 + 1}</strong>-<strong>{Math.min(currentPage * 10, filteredJobs.length)}</strong> arası gösteriliyor
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded theme-surface-alt border theme-divider theme-text-secondary hover:bg-[var(--theme-bg-surface-alt)] disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredJobs.length / 10), p + 1))}
                                        disabled={currentPage === Math.ceil(filteredJobs.length / 10)}
                                        className="p-1.5 rounded theme-surface-alt border theme-divider theme-text-secondary hover:bg-[var(--theme-bg-surface-alt)] disabled:opacity-50 transition-colors"
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
                            const nameA = a.file_name || a.fileName || ''
                            const nameB = b.file_name || b.fileName || ''
                            const sizeA = parseInt(a.file_size || a.fileSize) || 0
                            const sizeB = parseInt(b.file_size || b.fileSize) || 0

                            if (fileSortMode === 'name') {
                                return nameA.localeCompare(nameB, 'tr')
                            }
                            if (fileSortMode === 'size') {
                                return sizeB - sizeA
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
                                <div className="flex items-center justify-between theme-surface border rounded-2xl p-4 flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => { setActiveFolderId(null); setSearch(''); }}
                                            className="p-2 theme-surface-alt theme-text-secondary rounded-xl hover:bg-[var(--theme-bg-surface)] transition-colors"
                                        >
                                            <ArrowLeft size={18} />
                                        </button>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <FolderOpen className="text-indigo-500" size={20} />
                                                <h2 className="font-bold theme-text-primary uppercase tracking-wider">{activeJob.title}</h2>
                                            </div>
                                            <p className="text-xs theme-text-secondary flex items-center gap-2 mt-1">
                                                <span>Müşteri: {activeJob.customer?.name || '-'}</span>
                                                <span>â€¢</span>
                                                <Link to={`/jobs/${activeJob.id}`} className="text-indigo-500 hover:underline">İş Detayına Git</Link>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {selectedFileIds.length > 0 && (
                                            <button
                                                onClick={() => setShowBulkDeleteConfirm(true)}
                                                disabled={bulkDeleteMutation.isLoading || downloadingZip}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 size={16} />
                                                <span className="hidden sm:inline">Seçilenleri Sil ({selectedFileIds.length})</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDownloadAll(activeJob, files)}
                                            disabled={downloadingZip || files.length === 0}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {downloadingZip ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                            <span className="hidden sm:inline">{downloadingZip ? 'Hazırlanıyor...' : 'Toplu İndir'}</span>
                                        </button>

                                        {viewMode === 'grid' && files.length > 0 && (
                                            <div className="flex items-center gap-2 pl-3 border-l theme-divider">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded theme-divider text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    checked={selectedFileIds.length === files.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedFileIds(files.map(f => f.id))
                                                        } else {
                                                            setSelectedFileIds([])
                                                        }
                                                    }}
                                                />
                                                <span className="text-[10px] font-bold theme-text-secondary uppercase">Tümünü Seç</span>
                                            </div>
                                        )}

                                        <div className="h-6 w-px theme-divider hidden sm:block"></div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-xs theme-text-secondary font-medium hidden sm:block">Sırala:</span>
                                            <select
                                                value={fileSortMode}
                                                onChange={e => setFileSortMode(e.target.value)}
                                                className="px-3 py-1.5 theme-surface-alt border theme-divider rounded-lg text-sm theme-text-primary focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
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
                                                className={`group theme-surface border ${selectedFileIds.includes(file.id) ? 'border-indigo-500 ring-1 ring-indigo-500 ring-inset shadow-lg shadow-indigo-500/5' : 'theme-divider'} rounded-2xl p-3 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-default relative`}
                                            >
                                                <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: selectedFileIds.includes(file.id) ? 1 : undefined }}>
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded theme-divider text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-sm"
                                                        checked={selectedFileIds.includes(file.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedFileIds(prev => [...prev, file.id])
                                                            } else {
                                                                setSelectedFileIds(prev => prev.filter(id => id !== file.id))
                                                            }
                                                        }}
                                                    />
                                                </div>

                                                <div className="aspect-square theme-surface-alt rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                                                    {(file.file_type || file.fileType || '').includes('image') ? (
                                                        <AuthImage
                                                            fileId={file.id}
                                                            alt={file.file_name || file.fileName}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <File size={32} className="theme-text-secondary group-hover:text-indigo-400 transition-colors" />
                                                    )}

                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                                                        {(file.file_type || file.fileType || '').includes('image') || (file.file_type || file.fileType || '').includes('pdf') ? (
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePreviewFile(file); }}
                                                                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-md transition-colors"
                                                                title="Önizle"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        ) : null}
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadSingle(file); }}
                                                            className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-md transition-colors"
                                                            title="İndir"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm({ jobId: activeJob.id, fileId: file.id, fileName: file.file_name || file.fileName })}
                                                            className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg backdrop-blur-md transition-colors"
                                                            title="Sil"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium theme-text-primary truncate" title={file.file_name || file.fileName}>{file.file_name || file.fileName}</p>
                                                    <p className="text-[10px] theme-text-secondary mt-0.5 uppercase">
                                                        {(parseInt(file.file_size || file.file_size) / 1024).toFixed(1)} KB â€¢ {(file.file_type || file.fileType || '').split('/')[1]?.toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="theme-surface border rounded-2xl overflow-hidden">
                                        <table className="w-full text-sm theme-table">
                                            <thead>
                                                <tr className="theme-surface-alt theme-text-secondary border-b theme-divider">
                                                    <th className="px-4 py-3 w-10">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded theme-divider text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                            checked={files.length > 0 && selectedFileIds.length === files.length}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedFileIds(files.map(f => f.id))
                                                                } else {
                                                                    setSelectedFileIds([])
                                                                }
                                                            }}
                                                        />
                                                    </th>
                                                    <th className="px-4 py-3 text-left font-semibold">Dosya Adı</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Tür</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Boyut</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Tarih</th>
                                                    <th className="px-4 py-3 text-right font-semibold">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y theme-divider">
                                                {paginatedFiles.map(file => (
                                                    <tr key={file.id} className={`hover:bg-[var(--theme-bg-surface-alt)] transition-colors ${selectedFileIds.includes(file.id) ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}>
                                                        <td className="px-4 py-3 w-10">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded theme-divider text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                                checked={selectedFileIds.includes(file.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedFileIds(prev => [...prev, file.id])
                                                                    } else {
                                                                        setSelectedFileIds(prev => prev.filter(id => id !== file.id))
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                {getFileIcon(file.file_type || file.fileType)}
                                                                <span className="font-medium theme-text-primary">{file.file_name || file.fileName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 theme-text-secondary uppercase text-xs">{(file.file_type || file.fileType || '').split('/')[1]}</td>
                                                        <td className="px-4 py-3 theme-text-secondary">{(parseInt(file.file_size || file.fileSize) / 1024).toFixed(1)} KB</td>
                                                        <td className="px-4 py-3 theme-text-secondary text-xs">{file.uploaded_at || file.uploadedAt ? new Date(file.uploaded_at || file.uploadedAt).toLocaleString('tr-TR') : '-'}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {(file.file_type || file.fileType || '').includes('image') || (file.file_type || file.fileType || '').includes('pdf') ? (
                                                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePreviewFile(file); }} className="p-1.5 theme-text-secondary hover:text-indigo-500 transition-colors" title="Önizle">
                                                                        <Eye size={16} />
                                                                    </button>
                                                                ) : null}
                                                                <button onClick={(e) => { e.stopPropagation(); handleDownloadSingle(file); }} className="p-1.5 theme-text-secondary hover:text-indigo-500 transition-colors" title="İndir">
                                                                    <Download size={16} />
                                                                </button>
                                                                <button onClick={() => setDeleteConfirm({ jobId: activeJob.id, fileId: file.id, fileName: file.file_name || file.fileName })} className="p-1.5 theme-text-secondary hover:text-red-500 transition-colors" title="Sil">
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
                                    <div className="flex items-center justify-between px-5 py-3 border theme-divider rounded-2xl theme-surface mt-4">
                                        <span className="text-sm theme-text-secondary">
                                            Toplam <strong>{files.length}</strong> dosyadan <strong>{(currentPage - 1) * 10 + 1}</strong>-<strong>{Math.min(currentPage * 10, files.length)}</strong> arası gösteriliyor
                                        </span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="p-1.5 rounded theme-surface-alt border theme-divider theme-text-secondary hover:bg-[var(--theme-bg-surface-alt)] disabled:opacity-50 transition-colors"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-1.5 rounded theme-surface-alt border theme-divider theme-text-secondary hover:bg-[var(--theme-bg-surface-alt)] disabled:opacity-50 transition-colors"
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
                        <p className="theme-text-primary font-medium mb-1">
                            {deleteConfirm?.isPermanent ? 'Kalıcı olarak silmek istediğinize emin misiniz?' : 'Dosyayı çöp kutusuna taşıyorsunuz'}
                        </p>
                        <p className="text-sm theme-text-secondary px-4">
                            <span className="font-semibold theme-text-primary">"{deleteConfirm?.fileName}"</span> isimli dosya {deleteConfirm?.isPermanent ? 'KALICI olarak silinecek ve kota iade edilecek.' : 'çöp kutusuna aktarılacak.'}
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1 px-4 py-2 text-sm font-medium theme-text-primary theme-surface-alt hover:bg-[var(--theme-bg-surface)] rounded-xl transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={() => deleteConfirm?.isPermanent ? forceDeleteMutation.mutate(deleteConfirm.fileId) : deleteMutation.mutate(deleteConfirm)}
                            disabled={deleteMutation.isLoading || forceDeleteMutation.isLoading}
                            className={`flex-1 px-4 py-2 text-sm font-medium text-white ${deleteConfirm?.isPermanent ? 'bg-black hover:bg-black/90' : 'bg-red-600 hover:bg-red-700'} rounded-xl shadow-lg transition-all disabled:opacity-50`}
                        >
                            {deleteMutation.isLoading || forceDeleteMutation.isLoading ? 'Bekleyin...' : 'Onayla'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Clear Trash Confirmation Modal */}
            <Modal open={showClearTrashConfirm} onClose={() => setShowClearTrashConfirm(false)} title="Çöp Kutusunu Boşalt" size="sm">
                <div className="space-y-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-full mx-auto text-red-600 dark:text-red-400">
                        <Trash2 size={24} />
                    </div>
                    <div className="text-center">
                        <p className="theme-text-primary font-medium mb-1">
                            Kalıcı olarak silmek istediğinize emin misiniz?
                        </p>
                        <p className="text-sm theme-text-secondary px-4">
                            Çöp kutusundaki <span className="font-bold text-red-500">{trashedFiles.length} adet</span> dosya <span className="font-semibold theme-text-primary">KALICI</span> olarak silinecek ve kota iade edilecek. Bu işlem geri alınamaz.
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setShowClearTrashConfirm(false)}
                            className="flex-1 px-4 py-2 text-sm font-medium theme-text-primary theme-surface-alt hover:bg-[var(--theme-bg-surface)] rounded-xl transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={() => {
                                clearTrashMutation.mutate();
                                setShowClearTrashConfirm(false);
                            }}
                            disabled={clearTrashMutation.isLoading}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                            {clearTrashMutation.isLoading ? 'Temizleniyor...' : 'Çöpü Boşalt'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* File Preview Modal */}
            <Modal open={preview.open} onClose={() => { window.URL.revokeObjectURL(preview.url); setPreview({ open: false, url: null, type: null, fileName: null }) }} title="Dosya Önizleme" size="xl">
                <div className="flex flex-col h-[70vh]">
                    <div className="flex-1 theme-surface-alt rounded-xl overflow-hidden flex items-center justify-center relative border theme-divider">
                        {preview.type?.includes('pdf') ? (
                            <iframe src={preview.url} className="w-full h-full border-none" title="PDF Preview" />
                        ) : preview.type?.includes('image') ? (
                            <img src={preview.url} className="max-w-full max-h-full object-contain shadow-2xl" alt="Preview" />
                        ) : (
                            <div className="text-center p-12 theme-text-secondary">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Bu dosya önizlenemiyor.</p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <button
                            onClick={() => { window.URL.revokeObjectURL(preview.url); setPreview({ open: false, url: null, type: null, fileName: null }) }}
                            className="px-6 py-2.5 border theme-divider  rounded-xl text-sm font-medium theme-text-primary hover:bg-[var(--theme-bg-surface-alt)] transition-colors"
                        >
                            Kapat
                        </button>
                        <button
                            onClick={() => {
                                const a = document.createElement('a')
                                a.href = preview.url
                                a.download = preview.fileName
                                document.body.appendChild(a)
                                a.click()
                                a.remove()
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <Download size={18} /> İndir
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}




