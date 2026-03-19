import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import {
    X,
    Link,
    Edit2,
    Trash2,
    CheckSquare,
    Square,
    Plus,
    CreditCard,
    FileText,
    Upload,
    File,
    Download,
    LayoutList,
    TrendingDown,
    User,
    Calendar,
    Briefcase,
    ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from './ui/Modal.jsx'
import { Link as RouterLink } from 'react-router-dom'

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'

export default function JobDetailDrawer({ jobId, isOpen, onClose }) {
    const qc = useQueryClient()
    const [addStepTitle, setAddStepTitle] = useState('')
    const [paymentModal, setPaymentModal] = useState(false)
    const [expenseModal, setExpenseModal] = useState(false)
    const [editField, setEditField] = useState(null)
    const [editValue, setEditValue] = useState('')

    const { data: job, isLoading } = useQuery({
        queryKey: ['job', jobId],
        queryFn: () => api.get(`/jobs/${jobId}`).then(r => r.data),
        enabled: !!jobId && isOpen
    })

    const toggleStep = useMutation({
        mutationFn: ({ stepId, isCompleted }) => api.patch(`/steps/${stepId}`, { isCompleted }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['job', jobId] }),
    })

    const addStep = useMutation({
        mutationFn: () => api.post('/steps', { jobId: parseInt(jobId), title: addStepTitle }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['job', jobId] })
            setAddStepTitle('')
            toast.success('Aşama eklendi.')
        },
    })

    const deleteStep = useMutation({
        mutationFn: (stepId) => api.delete(`/steps/${stepId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['job', jobId] })
            toast.success('Aşama silindi.')
        },
    })

    const saveNotes = useMutation({
        mutationFn: (data) => api.put(`/jobs/${jobId}`, {
            customerId: job.customerId || job.customer_id,
            customerRequests: job.jobdetail?.customer_requests || '',
            notes: job.jobdetail?.notes || '',
            ...data
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['job', jobId] })
            setEditField(null)
            toast.success('Kaydedildi.')
        },
    })

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-gray-950 shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-10">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                                    #{jobId}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ background: job?.jobStatus?.color }} />
                                    <span className="text-xs font-bold text-gray-500">{job?.jobStatus?.name}</span>
                                </div>
                            </div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white truncate pr-4">{job?.title || 'Yükleniyor...'}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <RouterLink to={`/jobs/${jobId}`} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 transition-colors" title="Büyük Sayfada Aç">
                                <ExternalLink size={20} />
                            </RouterLink>
                            <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-gray-400 text-sm font-medium">İş detayları getiriliyor...</span>
                            </div>
                        ) : job ? (
                            <>
                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[24px]">
                                        <div className="text-sm font-bold text-gray-400 mb-1">Müşteri</div>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600">
                                                <User size={14} />
                                            </div>
                                            <RouterLink to={`/customers/${job.customerId || job.customer_id}`} className="text-gray-900 dark:text-white font-bold hover:text-indigo-600 transition-colors truncate">
                                                {job.customer?.name}
                                            </RouterLink>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[24px]">
                                        <div className="text-sm font-bold text-gray-400 mb-1">Sorumlu Personel</div>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-600">
                                                <User size={14} />
                                            </div>
                                            <div className="text-gray-900 dark:text-white font-bold truncate">
                                                {job.assignedTo?.name || 'Atanmamış'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Steps Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                            <CheckSquare size={20} className="text-indigo-600" />
                                            İş Aşamaları
                                        </h3>
                                        <span className="text-xs font-bold text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                                            {job.jobstep?.filter(s => s.is_completed).length}/{job.jobstep?.length} Tamamlandı
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {job.jobstep?.map(step => (
                                            <div key={step.id} className="group flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-indigo-500 transition-all shadow-sm">
                                                <button
                                                    onClick={() => toggleStep.mutate({ stepId: step.id, isCompleted: !step.is_completed })}
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${step.is_completed ? 'bg-emerald-500 text-white' : 'border-2 border-gray-200 dark:border-gray-700 text-transparent hover:border-indigo-500'}`}
                                                >
                                                    <CheckSquare size={14} />
                                                </button>
                                                <span className={`flex-1 text-sm font-bold ${step.is_completed ? 'text-gray-400 line-through decoration-2' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {step.title}
                                                </span>
                                                <button
                                                    onClick={() => deleteStep.mutate(step.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <input
                                                value={addStepTitle}
                                                onChange={e => setAddStepTitle(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addStepTitle.trim() && addStep.mutate()}
                                                placeholder="Yeni aşama ekle..."
                                                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all"
                                            />
                                            <button
                                                onClick={() => addStepTitle.trim() && addStep.mutate()}
                                                disabled={!addStepTitle.trim() || addStep.isPending}
                                                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                {/* Notes Section */}
                                <section>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FileText size={20} className="text-amber-500" />
                                        Notlar
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="group p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[28px] relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Müşteri Talebi</span>
                                                <button onClick={() => { setEditField('customer_requests'); setEditValue(job.jobdetail?.customer_requests || '') }} className="p-2 text-gray-300 hover:text-indigo-600 rounded-lg">
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                            {editField === 'customer_requests' ? (
                                                <div className="space-y-2">
                                                    <textarea autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} rows={3} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-indigo-500 rounded-[24px] text-sm focus:outline-none" />
                                                    <div className="flex justify-end gap-2 text-xs">
                                                        <button onClick={() => setEditField(null)} className="font-bold text-gray-500">İptal</button>
                                                        <button onClick={() => saveNotes.mutate({ customerRequests: editValue })} className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold">Kaydet</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic pr-4">
                                                    {job.jobdetail?.customer_requests || 'Girilen bir talep bulunmuyor.'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* Financial Summaries */}
                                <section>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <TrendingDown size={20} className="text-emerald-500" />
                                        Finansal Hareketler
                                    </h3>
                                    <div className="space-y-3">
                                        {[...(job.payment || []), ...(job.expense || [])]
                                            .sort((a, b) => new Date(b.paymentDate || b.date) - new Date(a.paymentDate || a.date))
                                            .slice(0, 5)
                                            .map((t, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-xl ${t.amount > 0 && !t.title ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-red-50 dark:bg-red-500/10 text-red-600'}`}>
                                                            <CreditCard size={14} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {t.description || t.title || 'İşlem'}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                                {formatDate(t.paymentDate || t.date)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`text-sm font-black ${t.amount > 0 && !t.title ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {t.amount > 0 && !t.title ? '+' : '-'}{formatCurrency(t.amount)}
                                                    </div>
                                                </div>
                                            ))}
                                        {(!job.payment?.length && !job.expense?.length) && (
                                            <div className="text-center py-6 text-gray-400 text-sm italic">Kayıtlı finansal hareket bulunmuyor.</div>
                                        )}
                                    </div>
                                </section>
                            </>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Başlangıç: {formatDate(job?.startDate)}</span>
                        </div>
                        <RouterLink to={`/jobs/${jobId}`} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
                            Detaylı İncele {'>'}
                        </RouterLink>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
