import { useState, lazy, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuthStore } from '../stores/index.js'
import toast from 'react-hot-toast'
import {
    ArrowLeft, Briefcase, CheckSquare, Square, Plus, Trash2, CreditCard, FileText, Upload, File, Download, Edit2, TrendingDown, LayoutList, X, Check, Calendar, Eye,
    LayoutPanelLeft, ListCheck, ListTodo, MoreVertical, Search, Sheet, SquareCheck, Star, TrendingUp, Users, Wallet, FolderOpen, Image as ImageIcon
} from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
const ThreeDViewer = lazy(() => import('../components/ui/ThreeDViewer.jsx'))
const DicomViewer = lazy(() => import('../components/ui/DicomViewer.jsx'))

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'

const parseFileValue = (val) => {
    if (!val) return null
    try {
        const parsed = JSON.parse(val)
        if (parsed && parsed.url) return parsed
        return null
    } catch {
        return null
    }
}

function CustomFieldFileInput({ value, onChange, required }) {
    const [uploading, setUploading] = useState(false)
    const fileData = parseFileValue(value)

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        e.target.value = ''

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await api.post('/custom-field-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            onChange(JSON.stringify(res.data))
            toast.success(`"${file.name}" yüklendi.`)
        } catch {
            toast.error('Dosya yüklenemedi.')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-2">
            {fileData ? (
                <div className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <File size={16} className="text-blue-500 shrink-0" />
                    <a href={fileData.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate flex-1">
                        {fileData.name}
                    </a>
                    {fileData.size && <span className="text-[10px] text-gray-400 shrink-0">{(fileData.size / 1024).toFixed(1)} KB</span>}
                    <button type="button" onClick={() => onChange('')} className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                        <X size={14} />
                    </button>
                </div>
            ) : null}
            <label className={`flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {uploading ? 'Yükleniyor...' : fileData ? 'Dosyayı Değiştir' : 'Dosya Seç'}
                </span>
                <input type="file" className="hidden" onChange={handleFileSelect} required={required && !fileData} />
            </label>
        </div>
    )
}

function CustomField3DInput({ value, onChange, required }) {
    const [uploading, setUploading] = useState(false)
    const [showViewer, setShowViewer] = useState(false)
    const fileData = parseFileValue(value)
    const isDcm = fileData && /\.dcm$/i.test(fileData.name || '')
    const is3DModel = fileData && /\.(stl|obj|ply)$/i.test(fileData.name || '')
    const is3DFile = isDcm || is3DModel

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        e.target.value = ''

        const ext = file.name.split('.').pop().toLowerCase()
        if (!['stl', 'obj', 'ply', 'dcm'].includes(ext)) {
            toast.error('Desteklenen formatlar: STL, OBJ, PLY, DCM')
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await api.post('/custom-field-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            onChange(JSON.stringify(res.data))
            toast.success(`"${file.name}" yüklendi.`)
            setShowViewer(true)
        } catch {
            toast.error('Dosya yüklenemedi.')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-3">
            {fileData ? (
                <>
                    <div className="flex items-center gap-2 p-2 border border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <span className="text-base shrink-0">🦷</span>
                        <span className="text-sm text-purple-700 dark:text-purple-300 truncate flex-1 font-medium">{fileData.name}</span>
                        {fileData.size && <span className="text-[10px] text-gray-400 shrink-0">{(fileData.size / 1024 / 1024).toFixed(2)} MB</span>}
                        <button type="button" onClick={() => setShowViewer(!showViewer)} className="px-2 py-0.5 text-[11px] font-bold bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shrink-0">
                            {showViewer ? 'Gizle' : isDcm ? 'Röntgen Görüntüle' : '3D Görüntüle'}
                        </button>
                        <button type="button" onClick={() => { onChange(''); setShowViewer(false) }} className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                            <X size={14} />
                        </button>
                    </div>
                    {showViewer && is3DFile && (
                        <Suspense fallback={<div className="h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl"><div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>}>
                            {isDcm
                                ? <DicomViewer fileUrl={fileData.url} fileName={fileData.name} />
                                : <ThreeDViewer fileUrl={fileData.url} fileName={fileData.name} />
                            }
                        </Suspense>
                    )}
                </>
            ) : null}
            <label className={`flex items-center gap-2 px-3 py-3 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="text-lg">🦷</span>
                <div className="flex-1">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300 block">
                        {uploading ? 'Yükleniyor...' : fileData ? '3D Dosyayı Değiştir' : '3D Röntgen Dosyası Seç'}
                    </span>
                    <span className="text-[10px] text-gray-400">STL, OBJ, PLY, DCM formatları desteklenir</span>
                </div>
                <Upload size={18} className="text-purple-400" />
                <input type="file" className="hidden" accept=".stl,.obj,.ply,.dcm" onChange={handleFileSelect} required={required && !fileData} />
            </label>
        </div>
    )
}

export default function JobDetailPage() {
    const { id } = useParams()
    const { user } = useAuthStore()
    const qc = useQueryClient()
    const [addStepTitle, setAddStepTitle] = useState('')
    const [paymentModal, setPaymentModal] = useState(false)
    const [editingPayment, setEditingPayment] = useState(null)
    const [paymentForm, setPaymentForm] = useState({ amount: '', paymentDate: new Date().toISOString().substring(0, 10), paymentType: 'FINAL', description: '', cashRegisterId: '', receipt: null })

    const [expenseModal, setExpenseModal] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', date: new Date().toISOString().substring(0, 10), description: '', categoryId: '', cashRegisterId: '', receipt: null })

    const [selectedTemplate, setSelectedTemplate] = useState('')

    const [editModal, setEditModal] = useState(false)
    const [editForm, setEditForm] = useState({})

    const [customFieldSidebar, setCustomFieldSidebar] = useState(false)
    const [customFieldForm, setCustomFieldForm] = useState({})

    // Not düzenleme State
    const [editField, setEditField] = useState(null)
    const [editValue, setEditValue] = useState('')
    const [isDragging, setIsDragging] = useState(false)
    const [dragCounter, setDragCounter] = useState(0)
    const [uploadingFiles, setUploadingFiles] = useState([])
    const [preview, setPreview] = useState({ open: false, url: null, type: null, fileName: null })
    const [selectedFileIds, setSelectedFileIds] = useState([])
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

    const { data: job, isLoading } = useQuery({
        queryKey: ['job', id],
        queryFn: () => api.get(`/jobs/${id}`).then(r => r.data),
    })

    const { data: cashRegisters = [] } = useQuery({
        queryKey: ['cash-registers'],
        queryFn: () => api.get('/settings/cash-registers').then(r => r.data),
    })

    const { data: expenseCategories = [] } = useQuery({
        queryKey: ['expense-categories'],
        queryFn: () => api.get('/settings/expense-categories').then(r => r.data),
    })

    const { data: stepTemplates = [] } = useQuery({
        queryKey: ['step-templates'],
        queryFn: () => api.get('/settings/templates').then(r => r.data),
    })

    const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => api.get('/customers').then(r => r.data) })
    const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: () => api.get('/settings/services').then(r => r.data) })
    const { data: statuses = [] } = useQuery({ queryKey: ['statuses'], queryFn: () => api.get('/settings/statuses').then(r => r.data) })

    const toggleStep = useMutation({
        mutationFn: ({ stepId, isCompleted }) => api.patch(`/steps/${stepId}`, { isCompleted }),
        onSuccess: () => qc.invalidateQueries(['job', id]),
    })

    const addStep = useMutation({
        mutationFn: () => api.post('/steps', { jobId: parseInt(id), title: addStepTitle }),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            setAddStepTitle('')
            toast.success('Aşama eklendi.')
        },
    })

    const deleteStep = useMutation({
        mutationFn: (stepId) => api.delete(`/steps/${stepId}`),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            toast.success('Aşama silindi.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Aşama silinemedi.'),
    })

    const applyTemplate = useMutation({
        mutationFn: () => api.post(`/jobs/${id}/steps/template`, { templateId: selectedTemplate }),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            setSelectedTemplate('')
            toast.success('Şablon eklendi.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Şablon eklenemedi.'),
    })

    const savePayment = useMutation({
        mutationFn: () => {
            const formData = new FormData();
            Object.keys(paymentForm).forEach(key => {
                if (paymentForm[key] !== null && paymentForm[key] !== undefined) {
                    formData.append(key, paymentForm[key]);
                }
            });
            formData.append('jobId', parseInt(id));

            if (editingPayment) {
                formData.append('_method', 'PUT');
                return api.post(`/payments/${editingPayment}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            }
            return api.post('/payments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            toast.success(editingPayment ? 'Ödeme güncellendi.' : 'Ödeme eklendi.')
            setPaymentModal(false)
            setPaymentForm({ amount: '', paymentDate: new Date().toISOString().substring(0, 10), paymentType: 'FINAL', description: '', cashRegisterId: '', receipt: null })
            setEditingPayment(null)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })

    const deletePayment = useMutation({
        mutationFn: (pid) => api.delete(`/payments/${pid}`),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            toast.success('Ödeme silindi.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Ödeme silinemedi.'),
    })

    const saveExpense = useMutation({
        mutationFn: () => {
            const formData = new FormData();
            Object.keys(expenseForm).forEach(key => {
                if (expenseForm[key] !== null && expenseForm[key] !== undefined) {
                    formData.append(key, expenseForm[key]);
                }
            });
            formData.append('jobId', parseInt(id));

            if (editingExpense) {
                formData.append('_method', 'PUT');
                return api.post(`/expenses/${editingExpense}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            return api.post('/expenses', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            toast.success(editingExpense ? 'Masraf güncellendi.' : 'Masraf eklendi.')
            setExpenseModal(false)
            setExpenseForm({ title: '', amount: '', date: new Date().toISOString().substring(0, 10), description: '', categoryId: '', cashRegisterId: '', receipt: null })
            setEditingExpense(null)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })

    const deleteExpense = useMutation({
        mutationFn: (eid) => api.delete(`/expenses/${eid}`),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            toast.success('Masraf silindi.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Masraf silinemedi.'),
    })

    const toggleInstallmentPaidMutation = useMutation({
        mutationFn: (insId) => api.patch(`/proposals/installments/${insId}/toggle-paid`),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            toast.success('Teklif ödeme takvimi güncellendi.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Güncellenemedi.'),
    })

    const openPaymentModal = (p = null) => {
        if (p) {
            setPaymentForm({
                amount: p.amount,
                paymentDate: (p.paymentDate || p.payment_date).toString().substring(0, 10),
                paymentType: p.paymentType || p.payment_type || 'FINAL',
                description: p.description || '',
                cashRegisterId: p.cashRegisterId || p.cash_register_id || '',
                receipt: null
            })
            setEditingPayment(p.id)
        } else {
            const defaultCash = cashRegisters.find(c => c.is_default);
            setPaymentForm({
                amount: '',
                paymentDate: new Date().toISOString().substring(0, 10),
                paymentType: 'FINAL',
                description: '',
                cashRegisterId: defaultCash ? defaultCash.id : '',
                receipt: null
            })
            setEditingPayment(null)
        }
        setPaymentModal(true)
    }

    const openExpenseModal = (e = null) => {
        if (e) {
            setExpenseForm({
                title: e.title,
                amount: e.amount,
                date: (e.date || '').toString().substring(0, 10),
                description: e.description || '',
                categoryId: e.categoryId || e.category_id || '',
                cashRegisterId: e.cashRegisterId || e.cash_register_id || '',
                receipt: null
            })
            setEditingExpense(e.id)
        } else {
            const defaultCash = cashRegisters.find(c => c.is_default);
            setExpenseForm({
                title: '',
                amount: '',
                date: new Date().toISOString().substring(0, 10),
                description: '',
                categoryId: '',
                cashRegisterId: defaultCash ? defaultCash.id : '',
                receipt: null
            })
            setEditingExpense(null)
        }
        setExpenseModal(true)
    }

    const uploadFiles = async (filesToUpload) => {
        if (!filesToUpload || filesToUpload.length === 0) return

        let currentUsed = user?.tenant?.storage_used || 0
        const limit = (user?.tenant?.storage_limit || 0) * 1024 * 1024
        const singleLimit = (user?.tenant?.single_file_limit || 50) * 1024 * 1024

        const newUploads = []
        const skippedFiles = []

        for (const f of Array.from(filesToUpload)) {
            if (f.size > singleLimit) {
                skippedFiles.push(`${f.name} (Tek dosya limitini aşıyor: ${user?.tenant?.single_file_limit || 50} MB)`)
                continue
            }
            if (limit > 0 && (currentUsed + f.size) > limit) {
                skippedFiles.push(`${f.name} (Toplam kota yetersiz)`)
                continue
            }
            newUploads.push({
                id: Math.random().toString(36).substring(7),
                file: f,
                name: f.name,
                size: f.size,
                progress: 0
            })
            currentUsed += f.size
        }

        if (skippedFiles.length > 0) {
            toast.error(
                <div>
                    <strong>Kota Yetersiz:</strong>
                    <ul className="mt-1 ml-4 list-disc text-xs">
                        {skippedFiles.map(name => <li key={name}>{name}</li>)}
                    </ul>
                    <p className="mt-1 text-[10px]">Bu dosyalar disk limitinizi aşıyor.</p>
                </div>,
                { duration: 4000 }
            )
        }

        if (newUploads.length === 0) return

        setUploadingFiles(prev => [...prev, ...newUploads])

        for (const uf of newUploads) {
            const formData = new FormData()
            formData.append('file', uf.file)
            formData.append('jobId', id)

            try {
                await api.post('/files', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        setUploadingFiles(prev => prev.map(p => p.id === uf.id ? { ...p, progress: percentCompleted } : p))
                    }
                })
                qc.invalidateQueries(['job', id])
                qc.invalidateQueries(['files'])
                toast.success(`"${uf.name}" yüklendi.`)
            } catch {
                toast.error(`"${uf.name}" yüklenemedi.`)
            }

            setUploadingFiles(prev => prev.filter(p => p.id !== uf.id))
        }
    }

    const handleDragEnter = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragCounter(prev => prev + 1)
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragCounter(prev => prev - 1)
        if (dragCounter - 1 === 0) {
            setIsDragging(false)
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        setDragCounter(0)

        const files = e.dataTransfer.files
        if (files && files.length > 0) uploadFiles(files)
    }

    const handleDownload = async (file) => {
        const toastId = toast.loading('İndiriliyor...')
        try {
            const response = await api.get(`/files/${file.id}/download`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const a = document.createElement('a')
            a.href = url
            let fileName = file.file_name || file.fileName || 'dosya'
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

    const deleteFile = useMutation({
        mutationFn: (fid) => api.delete(`/files/${fid}`),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            toast.success('Dosya çöp kutusuna taşındı.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Dosya silinemedi.'),
    })

    const bulkDeleteFiles = useMutation({
        mutationFn: (ids) => api.post('/files/bulk-delete', { ids }),
        onSuccess: (res) => {
            qc.invalidateQueries(['job', id])
            qc.invalidateQueries(['files'])
            setSelectedFileIds([])
            toast.success(res.data.message)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Silinemedi.'),
    })

    const updateJob = useMutation({
        mutationFn: (data) => api.put(`/jobs/${id}`, { ...data, customerId: data.customerId || null, serviceId: data.serviceId || null, jobStatusId: data.jobStatusId || null }),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            toast.success('İş güncellendi.')
            setEditModal(false)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'İş güncellenemedi.'),
    })

    const handlePreviewReceipt = async (transaction) => {
        if (!transaction?.receipt_path) return
        const toastId = toast.loading('Dekont yükleniyor...')
        try {
            const endpoint = transaction._type === 'PAYMENT' ? 'payments' : 'expenses';
            const response = await api.get(`/${endpoint}/${transaction.id}/receipt`, { responseType: 'blob' })
            const contentType = response.headers['content-type']
            const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }))

            let ext = 'jpg'
            if (contentType === 'application/pdf') ext = 'pdf'
            else if (contentType === 'image/png') ext = 'png'

            setPreview({
                open: true,
                url,
                type: contentType,
                fileName: `dekont-${transaction.id}.${ext}`,
                transactionData: transaction
            })
            toast.dismiss(toastId)
        } catch (error) {
            console.error('Preview error:', error)
            toast.error('Dekont yüklenemedi.', { id: toastId })
        }
    }

    const handlePreviewFile = async (file) => {
        const toastId = toast.loading('Dosya yükleniyor...')
        try {
            const response = await api.get(`/files/${file.id}/download`, { responseType: 'blob' })
            const contentType = response.headers['content-type']
            const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }))
            setPreview({
                open: true,
                url,
                type: contentType,
                fileName: file.file_name || file.fileName,
                fileData: file
            })
            toast.dismiss(toastId)
        } catch (error) {
            console.error('File preview error:', error)
            toast.error('Dosya yüklenemedi.', { id: toastId })
        }
    }

    const handleDownloadReceipt = async (transaction = null) => {
        // If we have a preview open, download that URL
        if (preview.open && preview.url) {
            const a = document.createElement('a')
            a.href = preview.url
            a.download = preview.fileName
            document.body.appendChild(a)
            a.click()
            a.remove()
            return;
        }

        if (!transaction) {
            if (preview.open && preview.transactionData) {
                transaction = preview.transactionData;
            } else {
                return;
            }
        }

        const toastId = toast.loading('Dekont indiriliyor...')
        try {
            const endpoint = transaction._type === 'PAYMENT' ? 'payments' : 'expenses';
            const response = await api.get(`/${endpoint}/${transaction.id}/receipt`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const a = document.createElement('a')
            a.href = url
            const contentType = response.headers['content-type']
            let ext = 'jpg'
            if (contentType === 'application/pdf') ext = 'pdf'
            else if (contentType === 'image/png') ext = 'png'
            a.download = `dekont-${transaction.id}.${ext}`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
            toast.success('İndirme başarılı.', { id: toastId })
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Dekont indirilemedi.', { id: toastId })
        }
    }

    const openEditModal = () => {
        setEditForm({
            title: job.title,
            customerId: job.customerId || job.customer_id || '',
            serviceId: job.serviceId || job.service_id || '',
            jobStatusId: job.jobStatusId || job.job_status_id || '',
            totalPrice: job.totalPrice || job.total_price || '',
            startDate: (job.startDate || job.start_date || '').toString().substring(0, 10),
            endDate: (job.endDate || job.end_date || '').toString().substring(0, 10),
            customFields: job.customfieldvalue ? Object.fromEntries(job.customfieldvalue.map(cf => [cf.custom_field_id, cf.value])) : {}
        })
        setEditModal(true)
    }

    const saveNotes = useMutation({
        mutationFn: (data) => api.put(`/jobs/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            setEditField(null)
            toast.success('Kaydedildi.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })

    const saveCustomFields = useMutation({
        mutationFn: () => api.put(`/jobs/${id}`, {
            customerId: job.customerId || job.customer_id,
            customFields: customFieldForm
        }),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            toast.success('Özel alanlar güncellendi.')
            setCustomFieldSidebar(false)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })

    const hasPermission = (p) => {
        if (!p) return true;
        if (user?.role === 'ADMIN') return true;
        return user?.permissions?.includes(p) || false;
    }

    if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Yükleniyor...</div>
    if (!job) return <div className="text-center text-gray-400 py-12">İş bulunamadı.</div>

    const matchedService = services.find(s => s.id === (job.serviceId || job.service_id))
    const definedCustomFields = matchedService?.customfield || []

    const jobPrice = parseFloat(job.totalPrice || job.total_price || 0)
    const installments = job.installments || []

    // Total price from installments is the Project Total
    const totalInstallmentsPrice = installments.reduce((s, i) => s + parseFloat(i.amount || 0), 0)
    const displayTotalPrice = (job.proposalId && jobPrice > 0) ? jobPrice : (totalInstallmentsPrice > 0 ? totalInstallmentsPrice : jobPrice)

    const steps = job.jobstep || []
    const payments = job.payment || []
    const expenses = job.expense || []
    const files = job.jobfile || []

    const financialTransactions = [
        ...payments.map(p => ({
            ...p,
            _type: 'PAYMENT',
            _date: new Date(p.paymentDate || p.payment_date).getTime(),
            receiptUrl: (p.receipt_path || p.receiptUrl) ? `/api/payments/${p.id}/receipt` : null
        })),
        ...expenses.map(e => ({
            ...e,
            _type: 'EXPENSE',
            _date: new Date(e.date).getTime(),
            receiptUrl: (e.receipt_path || e.receiptUrl) ? `/api/expenses/${e.id}/receipt` : null
        }))
    ].sort((a, b) => b._date - a._date)

    const completedSteps = steps.filter(s => s.is_completed).length
    const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)

    const remaining = displayTotalPrice - totalPaid
    const paymentPerformance = displayTotalPrice > 0 ? Math.round((totalPaid / displayTotalPrice) * 100) : Math.round((totalPaid > 0 ? 100 : 0))
    const completionProgress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0
    // const statusConf = statusConfig[job.status] || statusConfig.PENDING // Removed

    const filledCustomFieldsCount = job.customfieldvalue?.filter(cf => cf.value && cf.value.trim() !== '').length || 0
    const emptyCustomFieldsCount = definedCustomFields.length - filledCustomFieldsCount

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/jobs" className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ArrowLeft size={18} />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{job.title}</h1>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <Link to={`/customers/${job.customerId || job.customer_id}`} className="text-sm text-indigo-500 hover:underline">{job.customer?.name}</Link>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: job.jobStatus?.color || '#94a3b8' }} />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {job.jobStatus?.name || 'Aşama Belirtilmemiş'}
                            </span>
                        </div>
                    </div>
                </div>
                {job.proposalId && (
                    <Link to={`/proposals?id=${job.proposalId}`} className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors" title="Teklifi Görüntüle">
                        <FileText size={18} />
                    </Link>
                )}
                <button onClick={openEditModal} className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors" title="İşi Düzenle">
                    <Edit2 size={18} />
                </button>
                <div className="relative">
                    <button onClick={() => {
                        setCustomFieldForm(job.customfieldvalue ? Object.fromEntries(job.customfieldvalue.map(cf => [cf.custom_field_id, cf.value])) : {})
                        setCustomFieldSidebar(true)
                    }} className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors" title="Özel Alanlar">
                        <LayoutList size={18} />
                    </button>
                    {emptyCustomFieldsCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900 border border-transparent">
                            {emptyCustomFieldsCount}
                        </span>
                    )}
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: job.proposalId ? 'Proje Toplamı' : 'İş Bedeli', value: formatCurrency(displayTotalPrice), color: 'text-gray-900 dark:text-white' },
                    { label: `Toplam KDV Tutarı ${job.vatRate ? `(%${job.vatRate})` : ''}`, value: formatCurrency(job.vatAmount), color: 'text-purple-500' },
                    { label: 'Toplam Tahsilat', value: formatCurrency(totalPaid), color: 'text-emerald-500', permission: 'payments.view' },
                    { label: 'Kalan Tutar', value: formatCurrency(remaining), color: remaining > 0 ? 'text-red-500' : 'text-blue-500', permission: 'payments.view' },
                    { label: 'İş Aşamaları', value: steps.length ? `${completedSteps}/${steps.length}` : '-', color: 'text-indigo-500' },
                    { label: 'Ödeme Performansı', value: `%${paymentPerformance}`, color: 'text-blue-500', permission: 'payments.view' },
                ].filter(card => hasPermission(card.permission)).map(({ label, value, color }) => (
                    <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center transition-all hover:border-gray-300 dark:hover:border-gray-700">
                        <div className={`text-lg font-bold ${color}`}>{value}</div>
                        <div className="text-xs text-gray-500">{label}</div>
                    </div>
                ))}
            </div>

            {/* Sections in Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">

                {/* Notes Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-orange-500" />
                        Notlar & Bilgiler
                    </h2>
                    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Müşteri Talepleri</div>
                                <button onClick={() => { setEditField('customer_requests'); setEditValue(job.jobdetail?.customer_requests || '') }} className="text-gray-400 hover:text-blue-500 transition-colors">
                                    <Edit2 size={14} />
                                </button>
                            </div>
                            {editField === 'customer_requests' ? (
                                <div className="space-y-2">
                                    <textarea autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} rows={4} className="w-full px-3 py-2 border border-blue-500 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none resize-none" />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditField(null)} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">İptal</button>
                                        <button onClick={() => saveNotes.mutate({ customerRequests: editValue })} disabled={saveNotes.isPending} className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors">Kaydet</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl whitespace-pre-wrap leading-relaxed min-h-[60px]">{job.jobdetail?.customer_requests || 'Girilen bir talep yok.'}</p>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Genel Notlar (Sadece Siz Görürsünüz)</div>
                                <button onClick={() => { setEditField('notes'); setEditValue(job.jobdetail?.notes || '') }} className="text-gray-400 hover:text-blue-500 transition-colors">
                                    <Edit2 size={14} />
                                </button>
                            </div>
                            {editField === 'notes' ? (
                                <div className="space-y-2">
                                    <textarea autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} rows={4} className="w-full px-3 py-2 border border-blue-500 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none resize-none" />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditField(null)} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">İptal</button>
                                        <button onClick={() => saveNotes.mutate({ notes: editValue })} disabled={saveNotes.isPending} className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors">Kaydet</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl whitespace-pre-wrap leading-relaxed min-h-[60px]">{job.jobdetail?.notes || 'Girilen bir not yok.'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Steps Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CheckSquare size={18} className="text-indigo-500" />
                        Aşamalar ({steps.length})
                    </h2>
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                        {steps.map(step => (
                            <div key={step.id} className="flex items-center gap-3 group">
                                <button
                                    onClick={() => toggleStep.mutate({ stepId: step.id, isCompleted: !step.is_completed })}
                                    className={`flex-shrink-0 transition-colors ${step.is_completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-500'}`}
                                >
                                    {step.is_completed ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                                <span className={`flex-1 text-sm transition-colors ${step.is_completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>{step.title}</span>
                                <button onClick={() => deleteStep.mutate(step.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {steps.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">Henüz aşama yok.</p>}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                        <div className="flex gap-2">
                            <input
                                value={addStepTitle}
                                onChange={e => setAddStepTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addStepTitle.trim() && addStep.mutate()}
                                placeholder="Aşama ekle..."
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 min-w-0"
                            />
                            <button onClick={() => addStepTitle.trim() && addStep.mutate()} disabled={!addStepTitle.trim() || addStep.isPending}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex-shrink-0">
                                <Plus size={18} />
                            </button>
                        </div>
                        {stepTemplates.length > 0 && (
                            <div className="flex gap-2 items-center flex-wrap">
                                <select
                                    value={selectedTemplate}
                                    onChange={e => setSelectedTemplate(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent text-gray-900 dark:text-gray-200 focus:outline-none focus:border-indigo-500 min-w-0"
                                >
                                    <option value="">Şablon Seç...</option>
                                    {stepTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <button onClick={() => selectedTemplate && applyTemplate.mutate()} disabled={!selectedTemplate || applyTemplate.isPending}
                                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0">
                                    {applyTemplate.isPending ? 'Ekleniyor...' : 'Şablon Ekle'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payments & Expenses Section */}
                {(hasPermission('payments.view') || hasPermission('expenses.view')) && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CreditCard size={18} className="text-emerald-500" />
                                Ödemeler ({financialTransactions.length})
                            </h2>
                            <div className="flex gap-2">
                                {hasPermission('payments.create') && (
                                    <button onClick={() => openPaymentModal()} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors">
                                        <Plus size={14} /> Tahsilat Ekle
                                    </button>
                                )}
                                {hasPermission('expenses.create') && (
                                    <button onClick={() => openExpenseModal()} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors">
                                        <Plus size={14} /> Masraf Ekle
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                            {financialTransactions.map(t => (
                                <div key={`${t._type}-${t.id}`} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl group relative">
                                    <div>
                                        <div className={`font-semibold ${t._type === 'PAYMENT' ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {t._type === 'EXPENSE' ? '-' : ''}{formatCurrency(t.amount)}
                                        </div>
                                        <div className="text-[11px] text-gray-500 mt-0.5">
                                            {formatDate(t._type === 'PAYMENT' ? (t.paymentDate || t.payment_date) : t.date)} •
                                            {t._type === 'PAYMENT' ?
                                                ((t.paymentType || t.payment_type) === 'ADVANCE' ? 'Avans' : (t.paymentType || t.payment_type) === 'PARTIAL' ? 'Taksit' : 'Final')
                                                : t.title
                                            }
                                        </div>
                                        {t.description && <div className="text-xs text-gray-400 mt-1">{t.description}</div>}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {t.receiptUrl && (
                                            <>
                                                <button onClick={() => handlePreviewReceipt(t)} className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors relative z-20" title="Dekontu Önizle">
                                                    <Eye size={14} />
                                                </button>
                                                <button onClick={() => handleDownloadReceipt(t)} className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors relative z-20" title="Dekontu İndir">
                                                    <FileText size={14} />
                                                </button>
                                            </>
                                        )}
                                        {(t._type === 'PAYMENT' ? hasPermission('payments.edit') : hasPermission('expenses.edit')) && (
                                            <button onClick={() => t._type === 'PAYMENT' ? openPaymentModal(t) : openExpenseModal(t)} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors relative z-20">
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                        {(t._type === 'PAYMENT' ? hasPermission('payments.delete') : hasPermission('expenses.delete')) && (
                                            <button onClick={() => t._type === 'PAYMENT' ? deletePayment.mutate(t.id) : deleteExpense.mutate(t.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors relative z-20">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {financialTransactions.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">Henüz işlem yok.</p>}
                        </div>
                    </div>
                )}

                {/* Files Section */}
                <div
                    className={`bg-white dark:bg-gray-900 border ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-inner' : 'border-gray-200 dark:border-gray-800'} rounded-2xl p-5 flex flex-col relative transition-all duration-200 overflow-hidden min-h-[300px]`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {isDragging && (
                        <div className="absolute inset-0 z-30 bg-blue-50/90 dark:bg-gray-900/90 flex flex-col items-center justify-center backdrop-blur-[2px]" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-3 animate-bounce pointer-events-none">
                                <Upload size={28} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 pointer-events-none">Dosyaları Buraya Bırakın</h3>
                            <p className="text-sm text-blue-500/70 dark:text-blue-400/70 mt-1 pointer-events-none">Çoklu yükleme başlatılacak</p>
                        </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                        <Link to={`/files/folder/${job.id}`} className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <File size={18} className="text-blue-500" />
                            Dosyalar ({files.length})
                        </Link>
                        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors relative z-20" onClick={e => e.stopPropagation()}>
                            <Upload size={14} /> Yükle
                            <input type="file" multiple className="hidden" onChange={e => {
                                if (e.target.files.length > 0) uploadFiles(e.target.files);
                                e.target.value = '';
                            }} />
                        </label>
                    </div>

                    {files.length > 0 && (
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800 mb-2 rounded-t-xl transition-all">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    checked={files.length > 0 && selectedFileIds.length === files.length}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedFileIds(files.map(f => f.id))
                                        } else {
                                            setSelectedFileIds([])
                                        }
                                    }}
                                />
                                <span className="text-xs font-medium text-gray-500">Hepsini Seç</span>
                            </div>

                            {selectedFileIds.length > 0 && (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                    <span className="text-xs font-bold text-indigo-500">{selectedFileIds.length} Seçili</span>
                                    <button
                                        onClick={() => setShowBulkDeleteConfirm(true)}
                                        disabled={bulkDeleteFiles.isPending}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-[10px] font-bold transition-all border border-red-200 dark:border-red-500/30"
                                    >
                                        <Trash2 size={12} /> Seçilenleri Sil
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 max-h-[650px] custom-scrollbar">
                        {uploadingFiles.map(uf => (
                            <div key={uf.id} className="flex flex-col gap-2 p-3 border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <File size={20} className="text-blue-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-blue-700 dark:text-blue-300 truncate">{uf.name}</div>
                                        <div className="text-[11px] text-blue-400 mt-0.5">{(uf.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        {uf.progress === 100 ? 'S3\'e Aktarılıyor...' : `${uf.progress}%`}
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
                                    <div className={`h-full bg-blue-500 transition-all duration-300 ${uf.progress === 100 ? 'animate-pulse' : ''}`} style={{ width: `${uf.progress}%` }}></div>
                                </div>
                            </div>
                        ))}
                        {files.map(f => (
                            <div key={f.id} className={`flex items-center gap-3 p-3 border ${selectedFileIds.includes(f.id) ? 'border-indigo-200 dark:border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-500/5' : 'border-gray-100 dark:border-gray-800'} rounded-xl group relative transition-all`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer relative z-20"
                                    checked={selectedFileIds.includes(f.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedFileIds(prev => [...prev, f.id])
                                        } else {
                                            setSelectedFileIds(prev => prev.filter(id => id !== f.id))
                                        }
                                    }}
                                />
                                <File size={18} className={`${selectedFileIds.includes(f.id) ? 'text-indigo-500' : 'text-gray-400'} flex-shrink-0`} />
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm ${selectedFileIds.includes(f.id) ? 'text-indigo-700 dark:text-indigo-300 font-medium' : 'text-gray-700 dark:text-gray-300'} truncate`}>{f.file_name || f.fileName}</div>
                                    <div className="text-[11px] text-gray-400 mt-0.5">{((f.file_size || f.fileSize || 0) / 1024).toFixed(1)} KB</div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {(f.file_type || f.fileType || '').includes('image') || (f.file_type || f.fileType || '').includes('pdf') ? (
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePreviewFile(f); }} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors relative z-20" title="Önizle">
                                            <Eye size={14} />
                                        </button>
                                    ) : null}
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownload(f); }} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors relative z-20" title="İndir">
                                        <Download size={14} />
                                    </button>
                                    <button onClick={() => deleteFile.mutate(f.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors relative z-20">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {files.length === 0 && (
                            <div className="text-center py-8">
                                <File size={32} className="text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">Henüz dosya yok.</p>
                                <p className="text-gray-400 text-xs mt-1">Dosyaları buraya sürükleyebilirsiniz</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Schedule Section */}
                {installments.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar size={18} className="text-blue-500" />
                            Teklif Ödeme Takvimi ({installments.length})
                        </h2>
                        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                            {installments.map(ins => (
                                <div key={ins.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${ins.is_paid ? 'bg-green-50/50 dark:bg-green-500/5 border-green-100 dark:border-green-500/20' : 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className={`font-bold text-sm ${ins.is_paid ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                                {formatCurrency(ins.amount)}
                                            </div>
                                            <div className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                                                %{ins.percentage}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                            <Calendar size={12} />
                                            {formatDate(ins.payment_date)}
                                        </div>
                                        {ins.description && (
                                            <div className="text-[11px] text-gray-400 mt-1 truncate">{ins.description}</div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => toggleInstallmentPaidMutation.mutate(ins.id)}
                                        disabled={toggleInstallmentPaidMutation.isPending}
                                        className={`flex-shrink-0 p-2 rounded-lg border transition-all ${ins.is_paid ? 'bg-green-500 border-green-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 hover:border-indigo-500 hover:text-indigo-500'}`}
                                        title={ins.is_paid ? 'Ödendi Olarak İşaretli' : 'Ödeme Bekliyor'}
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title={editingPayment ? 'Tahsilatı Düzenle' : 'Tahsilat Ekle'}>
                <form onSubmit={e => { e.preventDefault(); savePayment.mutate() }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tutar (₺) *</label>
                        <input type="number" min="0" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarih *</label>
                        <input type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm(p => ({ ...p, paymentDate: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ödeme Tipi</label>
                        <select value={paymentForm.paymentType} onChange={e => setPaymentForm(p => ({ ...p, paymentType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                            <option value="ADVANCE">Avans</option>
                            <option value="PARTIAL">Taksit</option>
                            <option value="FINAL">Final</option>
                        </select>
                    </div>
                    {cashRegisters.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kasa</label>
                            <select value={paymentForm.cashRegisterId || ''} onChange={e => setPaymentForm(p => ({ ...p, cashRegisterId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                                <option value="">Kasa Seçin...</option>
                                {cashRegisters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                        <input type="text" value={paymentForm.description} onChange={e => setPaymentForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dekont (Opsiyonel)</label>
                        <input type="file" accept="image/*,application/pdf" onChange={e => setPaymentForm(p => ({ ...p, receipt: e.target.files[0] }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setPaymentModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button type="submit" disabled={savePayment.isPending} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {savePayment.isPending ? (paymentForm.receipt ? 'S3\'e Yükleniyor...' : 'Kaydediliyor...') : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Expense Modal */}
            <Modal open={expenseModal} onClose={() => setExpenseModal(false)} title={editingExpense ? 'Masrafı Düzenle' : 'Masraf Ekle'}>
                <form onSubmit={e => { e.preventDefault(); saveExpense.mutate() }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlık *</label>
                        <input type="text" value={expenseForm.title} onChange={e => setExpenseForm(p => ({ ...p, title: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tutar (₺) *</label>
                            <input type="number" min="0" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarih *</label>
                            <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>
                    {expenseCategories.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                            <select value={expenseForm.categoryId || ''} onChange={e => setExpenseForm(p => ({ ...p, categoryId: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                                <option value="">Kategori Seçin...</option>
                                {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    {cashRegisters.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kasa</label>
                            <select value={expenseForm.cashRegisterId || ''} onChange={e => setExpenseForm(p => ({ ...p, cashRegisterId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                                <option value="">Kasa Seçin...</option>
                                {cashRegisters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                        <input type="text" value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dekont (Opsiyonel)</label>
                        <input type="file" accept="image/*,application/pdf" onChange={e => setExpenseForm(p => ({ ...p, receipt: e.target.files[0] }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setExpenseModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button type="submit" disabled={saveExpense.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveExpense.isPending ? (expenseForm.receipt ? 'S3\'e Yükleniyor...' : 'Kaydediliyor...') : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Job Modal */}
            <Modal open={editModal} onClose={() => setEditModal(false)} title="İş Bilgilerini Düzenle" size="lg">
                <form onSubmit={e => { e.preventDefault(); updateJob.mutate(editForm) }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlık *</label>
                            <input type="text" value={editForm.title || ''} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Müşteri *</label>
                            <select value={editForm.customerId || ''} onChange={e => setEditForm(p => ({ ...p, customerId: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                                <option value="">Seçin...</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hizmet</label>
                            <select value={editForm.serviceId || ''} onChange={e => setEditForm(p => ({ ...p, serviceId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500">
                                <option value="">Seçin...</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">İş Durumu / Aşama</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {statuses.map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setEditForm(f => ({ ...f, jobStatusId: s.id }))}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${editForm.jobStatusId === s.id
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                            : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                            {s.name}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Toplam Fiyat (₺) *</label>
                            <input type="number" min="0" step="0.01" value={editForm.totalPrice || ''} onChange={e => setEditForm(p => ({ ...p, totalPrice: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlangıç Tarihi</label>
                            <input type="date" value={editForm.startDate || ''} onChange={e => setEditForm(p => ({ ...p, startDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bitiş Tarihi</label>
                            <input type="date" value={editForm.endDate || ''} onChange={e => setEditForm(p => ({ ...p, endDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        {services.find(s => s.id == editForm.serviceId)?.customfield?.map(cf => (
                            <div key={cf.id} className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{cf.label} {cf.required ? '*' : ''}</label>
                                {cf.type === '3d_viewer' ? (
                                    <CustomField3DInput
                                        value={editForm.customFields?.[cf.id] || ''}
                                        onChange={(val) => setEditForm(p => ({ ...p, customFields: { ...p.customFields, [cf.id]: val } }))}
                                        required={cf.required}
                                    />
                                ) : cf.type === 'file' ? (
                                    <CustomFieldFileInput
                                        value={editForm.customFields?.[cf.id] || ''}
                                        onChange={(val) => setEditForm(p => ({ ...p, customFields: { ...p.customFields, [cf.id]: val } }))}
                                        required={cf.required}
                                    />
                                ) : cf.type === 'textarea' ? (
                                    <textarea value={editForm.customFields?.[cf.id] || ''} onChange={e => setEditForm(p => ({ ...p, customFields: { ...p.customFields, [cf.id]: e.target.value } }))} required={cf.required} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none" />
                                ) : (
                                    <input type={cf.type || 'text'} value={editForm.customFields?.[cf.id] || ''} onChange={e => setEditForm(p => ({ ...p, customFields: { ...p.customFields, [cf.id]: e.target.value } }))} required={cf.required} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setEditModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button type="submit" disabled={updateJob.isPending} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {updateJob.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Custom Fields Sidebar */}
            {customFieldSidebar && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setCustomFieldSidebar(false)} />
                    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out font-sans border-l border-gray-200 dark:border-gray-800">
                        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <LayoutList size={20} className="text-purple-500" />
                                Özel Alanlar
                            </h2>
                            <button onClick={() => setCustomFieldSidebar(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 flex-1 overflow-y-auto space-y-4">
                            {services.find(s => s.id === (job.serviceId || job.service_id))?.customfield?.map(cf => (
                                <div key={cf.id}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{cf.label} {cf.required ? '*' : ''}</label>
                                    {cf.type === '3d_viewer' ? (
                                        <CustomField3DInput
                                            value={customFieldForm[cf.id] || ''}
                                            onChange={(val) => setCustomFieldForm(p => ({ ...p, [cf.id]: val }))}
                                            required={cf.required}
                                        />
                                    ) : cf.type === 'file' ? (
                                        <CustomFieldFileInput
                                            value={customFieldForm[cf.id] || ''}
                                            onChange={(val) => setCustomFieldForm(p => ({ ...p, [cf.id]: val }))}
                                            required={cf.required}
                                        />
                                    ) : cf.type === 'textarea' ? (
                                        <textarea value={customFieldForm[cf.id] || ''} onChange={e => setCustomFieldForm(p => ({ ...p, [cf.id]: e.target.value }))} required={cf.required} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none" />
                                    ) : (
                                        <input type={cf.type || 'text'} value={customFieldForm[cf.id] || ''} onChange={e => setCustomFieldForm(p => ({ ...p, [cf.id]: e.target.value }))} required={cf.required} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                                    )}
                                </div>
                            ))}
                            {(!services.find(s => s.id === (job.serviceId || job.service_id))?.customfield || services.find(s => s.id === (job.serviceId || job.service_id))?.customfield.length === 0) && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">Bu iş için hizmet seçimi yapılmamış.</p>
                            )}
                        </div>
                        <div className="p-5 border-t border-gray-200 dark:border-gray-800">
                            <button onClick={() => saveCustomFields.mutate()} disabled={saveCustomFields.isPending} className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                                {saveCustomFields.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </>
            )}
            {/* Receipt Preview Modal */}
            <Modal open={preview.open} onClose={() => { window.URL.revokeObjectURL(preview.url); setPreview({ open: false, url: null, type: null, fileName: null }) }} title="Dosya Önizleme" size="xl">
                <div className="flex flex-col h-[70vh]">
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center relative border border-gray-200 dark:border-gray-700">
                        {preview.type?.includes('pdf') ? (
                            <iframe src={preview.url} className="w-full h-full border-none" title="PDF Preview" />
                        ) : preview.type?.includes('image') ? (
                            <img src={preview.url} className="max-w-full max-h-full object-contain shadow-2xl" alt="Preview" />
                        ) : (
                            <div className="text-center p-12 text-gray-400">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Bu dosya önizlenemiyor.</p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <button
                            onClick={() => { window.URL.revokeObjectURL(preview.url); setPreview({ open: false, url: null, type: null, fileName: null }) }}
                            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Kapat
                        </button>
                        <button
                            onClick={() => handleDownloadReceipt()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <Download size={18} /> İndir
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Bulk Delete File Confirmation Modal */}
            <Modal open={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)} title="Seçilenleri Sil" size="sm">
                <div className="space-y-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-full mx-auto text-red-600 dark:text-red-400">
                        <Trash2 size={24} />
                    </div>
                    <div className="text-center">
                        <p className="text-gray-900 dark:text-white font-medium mb-1">
                            Seçilen dosyaları çöp kutusuna taşımak istediğinize emin misiniz?
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 px-4">
                            Toplam <span className="font-bold text-red-500">{selectedFileIds.length} adet</span> dosya çöp kutusuna aktarılacak. Daha sonra isterseniz geri yükleyebilirsiniz.
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setShowBulkDeleteConfirm(false)}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={() => {
                                bulkDeleteFiles.mutate(selectedFileIds);
                                setShowBulkDeleteConfirm(false);
                            }}
                            disabled={bulkDeleteFiles.isPending}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                            {bulkDeleteFiles.isPending ? 'Siliniyor...' : 'Onayla'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
