import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, User, Calendar, Plus, MoreVertical, GripVertical, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)

// --- Sortable Item (Job Card) ---
function SortableJobCard({ job }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: job.id,
        data: { type: 'Job', job }
    })

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="group relative bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-3">
            <div className="flex justify-between items-start mb-2">
                <Link to={`/jobs/${job.id}`} className="text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2 pr-4" onPointerDown={e => e.stopPropagation()}>
                    {job.title}
                </Link>
                <div className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={16} />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <User size={12} className="text-gray-400" />
                    <span className="truncate">{job.customer?.name || 'Müşteri Belirtilmemiş'}</span>
                </div>
                {job.service && (
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                        {job.service?.name}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <Calendar size={12} />
                    <span>{new Date(job.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {formatCurrency(job.totalPrice)}
                </div>
            </div>
        </div>
    )
}

// --- Kanban Column ---
function KanbanColumn({ status, jobs }) {
    const { setNodeRef } = useSortable({
        id: status.id,
        data: { type: 'Column', status }
    })

    return (
        <div className="flex flex-col w-80 h-full bg-gray-100/50 dark:bg-gray-900/40 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden flex-shrink-0">
            {/* Column Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color || '#6366f1' }} />
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{status.name}</h3>
                    <span className="px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-500 rounded-full text-[11px] font-bold shadow-sm border border-gray-100 dark:border-gray-700">
                        {jobs.length}
                    </span>
                </div>
                <button className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">
                    <Plus size={16} />
                </button>
            </div>

            {/* Scrollable List */}
            <div ref={setNodeRef} className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar min-h-[150px]">
                <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
                    <AnimatePresence>
                        {jobs.map(job => (
                            <SortableJobCard key={job.id} job={job} />
                        ))}
                    </AnimatePresence>
                </SortableContext>
                {jobs.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-center text-gray-400 text-xs italic">
                        İş bulunamadı
                    </div>
                )}
            </div>
        </div>
    )
}

export default function KanbanPage() {
    const qc = useQueryClient()
    const [activeJob, setActiveJob] = useState(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Avoid accidental drags when clicking links
            },
        })
    )

    const { data: jobs = [], isLoading: jobsLoading } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => api.get('/jobs').then(r => r.data)
    })

    const { data: statuses = [], isLoading: statusesLoading } = useQuery({
        queryKey: ['statuses'],
        queryFn: () => api.get('/settings/statuses').then(r => r.data)
    })

    // Sort statuses by their 'order' field if available
    const sortedStatuses = useMemo(() => {
        return [...statuses].sort((a, b) => (a.order || 0) - (b.order || 0))
    }, [statuses])

    // Update status mutation
    const updateJobStatus = useMutation({
        mutationFn: ({ jobId, statusId }) => api.patch(`/jobs/${jobId}/status`, { jobStatusId: statusId }),
        onSuccess: (updatedJob) => {
            // Optimistically update local cache is harder with dnd-kit auto-sorting, 
            // but we can just invalidate to get server state.
            qc.invalidateQueries(['jobs'])
            toast.success('İş durumu güncellendi.', { position: 'bottom-center' })
        },
        onError: () => toast.error('Durum güncellenemedi.')
    })

    const handleDragStart = (event) => {
        const { active } = event
        if (active.data.current?.type === 'Job') {
            setActiveJob(active.data.current.job)
        }
    }

    const handleDragEnd = (event) => {
        setActiveJob(null)
        const { active, over } = event

        if (!over) return

        const activeId = active.id
        const overId = over.id

        // Find the job that was dragged
        const job = jobs.find(j => j.id === activeId)
        if (!job) return

        // Check if dropped over a column or another job card
        let targetStatusId = null

        if (over.data.current?.type === 'Column') {
            targetStatusId = overId
        } else if (over.data.current?.type === 'Job') {
            targetStatusId = over.data.current.job.jobStatusId
        }

        // Only update if the status actually changed
        if (targetStatusId !== null && targetStatusId !== job.jobStatusId) {
            updateJobStatus.mutate({ jobId: activeId, statusId: targetStatusId })

            // Optimistic update
            qc.setQueryData(['jobs'], old => old.map(j => j.id === activeId ? { ...j, jobStatusId: targetStatusId } : j))
        }
    }

    if (jobsLoading || statusesLoading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Yükleniyor...</div>

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col overflow-hidden">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <Briefcase size={22} />
                        </div>
                        İş Takip (Kanban)
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">İşlerinizi sürükleyerek süreçlerini yönetin</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 border border-gray-200 dark:border-gray-700">
                        <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900 shadow-sm border border-gray-200/50 dark:border-gray-700">Kanban</button>
                        <Link to="/jobs" className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Liste</Link>
                    </div>
                    <Link to="/jobs" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2">
                        <Plus size={18} /> Yeni İş
                    </Link>
                </div>
            </div>

            {/* Kanban Board Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4 custom-scrollbar">
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="inline-flex gap-6 h-full min-w-full pb-2">
                        {sortedStatuses.map(status => (
                            <KanbanColumn
                                key={status.id}
                                status={status}
                                jobs={jobs.filter(j => j.jobStatusId === status.id)}
                            />
                        ))}

                        {/* Fallback column for jobs with no status */}
                        {jobs.some(j => !j.jobStatusId) && (
                            <KanbanColumn
                                status={{ id: 'unassigned', name: 'Tanımsız', color: '#94a3b8' }}
                                jobs={jobs.filter(j => !j.jobStatusId)}
                            />
                        )}

                        {sortedStatuses.length === 0 && (
                            <div className="w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-12 text-center text-gray-400">
                                <AlertCircle size={48} className="mb-4 text-gray-300" />
                                <h3 className="text-xl font-bold mb-2">Henüz Aşama Tanımlanmamış</h3>
                                <p className="mb-6 max-w-sm mx-auto">Kanban özelliğini kullanmak için Ayarlar {">"} İş Durumları bölümünden aşama eklemelisiniz.</p>
                                <Link to="/settings/statuses" className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 transition-all shadow-sm">
                                    Durum Ayarlarına Git
                                </Link>
                            </div>
                        )}
                    </div>

                    <DragOverlay dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: {
                                active: { opacity: '0.5' },
                            },
                        }),
                    }}>
                        {activeJob ? (
                            <div className="w-80 opacity-90 rotate-2 pointer-events-none">
                                <SortableJobCard job={activeJob} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: #e2e8f0; 
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    )
}
