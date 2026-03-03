import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { ArrowLeft, Briefcase, CheckSquare, Square, Plus, Trash2, CreditCard, FileText, Upload, File, Download, Edit2, TrendingDown } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'

const statusConfig = {
    PENDING: { label: 'Bekliyor', color: 'text-yellow-500 bg-yellow-500/10' },
    IN_PROGRESS: { label: 'Devam Ediyor', color: 'text-blue-500 bg-blue-500/10' },
    COMPLETED: { label: 'Tamamlandı', color: 'text-green-500 bg-green-500/10' },
    CANCELLED: { label: 'İptal', color: 'text-red-500 bg-red-500/10' },
}

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'

export default function JobDetailPage() {
    const { id } = useParams()
    const qc = useQueryClient()
    const [addStepTitle, setAddStepTitle] = useState('')
    const [paymentModal, setPaymentModal] = useState(false)
    const [paymentForm, setPaymentForm] = useState({ amount: '', paymentDate: new Date().toISOString().substring(0, 10), paymentType: 'FINAL', description: '' })
    const [activeTab, setActiveTab] = useState('steps')

    const { data: job, isLoading } = useQuery({
        queryKey: ['job', id],
        queryFn: () => api.get(`/jobs/${id}`).then(r => r.data),
    })

    const { data: cashRegisters = [] } = useQuery({
        queryKey: ['cash-registers'],
        queryFn: () => api.get('/settings/cash-registers').then(r => r.data),
    })

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
    })

    const addPayment = useMutation({
        mutationFn: () => api.post('/payments', { ...paymentForm, jobId: parseInt(id) }),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            toast.success('Ödeme eklendi.')
            setPaymentModal(false)
            setPaymentForm({ amount: '', paymentDate: new Date().toISOString().substring(0, 10), paymentType: 'FINAL', description: '' })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })

    const deletePayment = useMutation({
        mutationFn: (pid) => api.delete(`/payments/${pid}`),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            toast.success('Ödeme silindi.')
        },
    })

    const uploadFile = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        const formData = new FormData()
        formData.append('file', file)
        formData.append('jobId', id)
        try {
            await api.post('/files', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            qc.invalidateQueries(['job', id])
            toast.success('Dosya yüklendi.')
        } catch {
            toast.error('Dosya yüklenemedi.')
        }
        e.target.value = ''
    }

    const deleteFile = useMutation({
        mutationFn: (fid) => api.delete(`/files/${fid}`),
        onSuccess: () => {
            qc.invalidateQueries(['job', id])
            toast.success('Dosya silindi.')
        },
    })

    if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Yükleniyor...</div>
    if (!job) return <div className="text-center text-gray-400 py-12">İş bulunamadı.</div>

    const steps = job.jobstep || []
    const payments = job.payment || []
    const files = job.jobfile || []
    const completedSteps = steps.filter(s => s.is_completed).length
    const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
    const remaining = parseFloat(job.totalPrice || job.total_price || 0) - totalPaid
    const statusConf = statusConfig[job.status] || statusConfig.PENDING
    const tabs = [
        { key: 'steps', label: `Aşamalar (${steps.length})` },
        { key: 'payments', label: `Ödemeler (${payments.length})` },
        { key: 'files', label: `Dosyalar (${files.length})` },
        { key: 'notes', label: 'Notlar' },
    ]

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
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${statusConf.color}`}>{statusConf.label}</span>
                        {job.jobStatus && (
                            <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: job.jobStatus.color + '20', color: job.jobStatus.color, border: `1px solid ${job.jobStatus.color}40` }}>{job.jobStatus.name}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Toplam Fiyat', value: formatCurrency(job.totalPrice || job.total_price), color: 'text-gray-900 dark:text-white' },
                    { label: 'Tahsilat', value: formatCurrency(totalPaid), color: 'text-emerald-500' },
                    { label: 'Kalan', value: formatCurrency(remaining), color: remaining > 0 ? 'text-red-500' : 'text-emerald-500' },
                    { label: 'İlerleme', value: steps.length ? `${completedSteps}/${steps.length}` : '-', color: 'text-indigo-500' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center">
                        <div className={`text-lg font-bold ${color}`}>{value}</div>
                        <div className="text-xs text-gray-500">{label}</div>
                    </div>
                ))}
            </div>

            {/* Progress */}
            {steps.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Tamamlanma</span>
                        <span className="font-medium text-gray-900 dark:text-white">%{Math.round((completedSteps / steps.length) * 100)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(completedSteps / steps.length) * 100}%` }} />
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t.key ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >{t.label}</button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Steps Tab */}
                    {activeTab === 'steps' && (
                        <div className="space-y-3">
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
                            {steps.length === 0 && <p className="text-center text-gray-400 py-4">Henüz aşama yok.</p>}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <input
                                    value={addStepTitle}
                                    onChange={e => setAddStepTitle(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addStepTitle.trim() && addStep.mutate()}
                                    placeholder="Yeni aşama ekle..."
                                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                                />
                                <button onClick={() => addStepTitle.trim() && addStep.mutate()} disabled={!addStepTitle.trim() || addStep.isPending}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50">
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <div className="space-y-3">
                            <button onClick={() => setPaymentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors mb-4">
                                <Plus size={16} /> Ödeme Ekle
                            </button>
                            {payments.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl group">
                                    <div>
                                        <div className="font-semibold text-emerald-500">{formatCurrency(p.amount)}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{formatDate(p.paymentDate || p.payment_date)} • {p.paymentType === 'ADVANCE' ? 'Avans' : p.paymentType === 'PARTIAL' ? 'Taksit' : 'Final'}</div>
                                        {p.description && <div className="text-xs text-gray-400">{p.description}</div>}
                                    </div>
                                    <button onClick={() => deletePayment.mutate(p.id)} className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-300 hover:text-red-500 transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {payments.length === 0 && <p className="text-center text-gray-400 py-4">Henüz ödeme yok.</p>}
                        </div>
                    )}

                    {/* Files Tab */}
                    {activeTab === 'files' && (
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium cursor-pointer transition-colors w-fit mb-4">
                                <Upload size={16} /> Dosya Yükle
                                <input type="file" className="hidden" onChange={uploadFile} />
                            </label>
                            {files.map(f => (
                                <div key={f.id} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-800 rounded-xl group">
                                    <File size={20} className="text-gray-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{f.file_name || f.fileName}</div>
                                        <div className="text-xs text-gray-400">{((f.file_size || f.fileSize || 0) / 1024).toFixed(1)} KB</div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={f.file_path || f.filePath} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                                            <Download size={14} />
                                        </a>
                                        <button onClick={() => deleteFile.mutate(f.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {files.length === 0 && <p className="text-center text-gray-400 py-4">Henüz dosya yok.</p>}
                        </div>
                    )}

                    {/* Notes Tab */}
                    {activeTab === 'notes' && (
                        <div className="space-y-4">
                            {job.jobdetail?.customer_requests && (
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Müşteri Talepleri</div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">{job.jobdetail.customer_requests}</p>
                                </div>
                            )}
                            {job.jobdetail?.notes && (
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notlar</div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">{job.jobdetail.notes}</p>
                                </div>
                            )}
                            {!job.jobdetail?.notes && !job.jobdetail?.customer_requests && (
                                <p className="text-center text-gray-400 py-4">Not bulunamadı.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Ödeme Ekle">
                <form onSubmit={e => { e.preventDefault(); addPayment.mutate() }} className="space-y-4">
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
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setPaymentModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
                        <button type="submit" disabled={addPayment.isPending} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {addPayment.isPending ? 'Ekleniyor...' : 'Ödeme Ekle'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
