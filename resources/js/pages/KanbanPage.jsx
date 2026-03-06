import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects, rectIntersection, closestCorners } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, User, Calendar, Plus, MoreVertical, GripVertical, CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import JobDetailDrawer from '../components/JobDetailDrawer.jsx'

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)

// --- Sortable Item (Job Card) ---
function SortableJobCard({ job, onOpenDetail }) {
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
                <button
                    onClick={() => onOpenDetail(job.id)}
                    className="text-left text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2 pr-4"
                    onPointerDown={e => e.stopPropagation()}
                >
                    {job.title}
                </button>
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
function KanbanColumn({ status, onOpenDetail, isCollapsed, onToggle }) {
    const { setNodeRef } = useSortable({
        id: status.id,
        data: { type: 'Column', status }
    })

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['jobs', 'column', status.id],
        queryFn: ({ pageParam = 1 }) =>
            api.get(`/jobs?jobStatusId=${status.id}&page=${pageParam}&limit=10`).then(r => r.data),
        getNextPageParam: (lastPage) => lastPage.meta.current_page < lastPage.meta.last_page ? lastPage.meta.current_page + 1 : undefined,
    })

    const jobs = data?.pages.flatMap(page => page.data) || []
    const totalCount = data?.pages[0]?.meta?.total || 0

    return (
        <div
            ref={setNodeRef}
            onClick={() => isCollapsed && onToggle(status.id)}
            className={`flex flex-col h-full bg-gray-100/50 dark:bg-gray-900/40 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16 cursor-pointer hover:bg-gray-200/60 dark:hover:bg-gray-800/60' : 'w-80'}`}
        >
            {/* Column Header */}
            <div className={`p-4 flex items-center justify-between ${isCollapsed ? 'flex-col gap-4 h-full' : ''}`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'flex-col mt-2' : ''}`}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: status.color || '#6366f1' }} />
                    {!isCollapsed ? (
                        <>
                            <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[140px]">{status.name}</h3>
                            <span className="px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-500 rounded-full text-[11px] font-bold shadow-sm border border-gray-100 dark:border-gray-700">
                                {totalCount}
                            </span>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <span className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl text-lg font-black text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-gray-700">
                                {totalCount}
                            </span>
                            <span className="[writing-mode:vertical-lr] rotate-180 font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap uppercase tracking-widest text-md py-2">
                                {status.name}
                            </span>
                        </div>
                    )}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(status.id); }}
                    className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Scrollable List */}
            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar min-h-[150px] flex flex-col">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-50">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-gray-400">Yükleniyor...</span>
                        </div>
                    ) : (
                        <>
                            <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
                                <AnimatePresence>
                                    {jobs.map(job => (
                                        <SortableJobCard key={job.id} job={job} onOpenDetail={onOpenDetail} />
                                    ))}
                                </AnimatePresence>
                            </SortableContext>

                            {hasNextPage && (
                                <button
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    className="w-full py-3 mt-2 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-[11px] font-black text-gray-400 hover:text-indigo-600 hover:border-indigo-500 hover:bg-white dark:hover:bg-gray-900 transition-all mb-4 disabled:opacity-50"
                                >
                                    {isFetchingNextPage ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
                                </button>
                            )}

                            {jobs.length === 0 && (
                                <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-center text-gray-400 text-xs italic text-center px-4">
                                    İş bulunamadı
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default function KanbanPage() {
    const qc = useQueryClient()
    const [activeJob, setActiveJob] = useState(null)
    const [selectedJobId, setSelectedJobId] = useState(null)
    const [collapsedColumns, setCollapsedColumns] = useState(() => {
        const saved = localStorage.getItem('kanban_collapsed_columns')
        try {
            return saved ? JSON.parse(saved) : []
        } catch (e) {
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem('kanban_collapsed_columns', JSON.stringify(collapsedColumns))
    }, [collapsedColumns])

    const toggleColumn = (id) => {
        setCollapsedColumns(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Avoid accidental drags when clicking links
            },
        })
    )

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
        mutationFn: ({ jobId, statusId }) => {
            const apiStatusId = statusId === 'unassigned' ? null : statusId;
            return api.patch(`/jobs/${jobId}/status`, { jobStatusId: apiStatusId });
        },
        onMutate: async ({ jobId, statusId, oldStatusId }) => {
            // Cancel outgoing refetches
            await qc.cancelQueries({ queryKey: ['jobs', 'column', statusId] })
            await qc.cancelQueries({ queryKey: ['jobs', 'column', oldStatusId] })

            // Snapshot the previous value
            const previousSource = qc.getQueryData(['jobs', 'column', oldStatusId])
            const previousTarget = qc.getQueryData(['jobs', 'column', statusId])

            // Optimistically update
            let movedJob = null;

            if (previousSource) {
                qc.setQueryData(['jobs', 'column', oldStatusId], old => {
                    if (!old) return old;
                    let found = false;
                    const newPages = old.pages.map(page => {
                        const filteredData = page.data.filter(j => j.id !== jobId);
                        if (filteredData.length !== page.data.length) {
                            found = true;
                            const foundJob = page.data.find(j => j.id === jobId);
                            if (foundJob) movedJob = { ...foundJob, jobStatusId: statusId === 'unassigned' ? null : statusId };
                            return { ...page, data: filteredData };
                        }
                        return page;
                    });
                    if (!found) return old;
                    return {
                        ...old,
                        pages: newPages.map((page, i) => i === 0 ? { ...page, meta: { ...page.meta, total: Math.max(0, (page.meta?.total || 0) - 1) } } : page)
                    };
                });
            }

            if (movedJob) {
                qc.setQueryData(['jobs', 'column', statusId], old => {
                    if (!old) return {
                        pages: [{ data: [movedJob], meta: { total: 1, current_page: 1, last_page: 1 } }],
                        pageParams: [1]
                    };
                    const newPages = [...old.pages];
                    newPages[0] = {
                        ...newPages[0],
                        data: [movedJob, ...newPages[0].data],
                        meta: { ...newPages[0].meta, total: (newPages[0].meta?.total || 0) + 1 }
                    };
                    return { ...old, pages: newPages };
                });
            }

            return { previousSource, previousTarget }
        },
        onSuccess: () => {
            toast.success('İş durumu güncellendi.', { position: 'bottom-center' })
        },
        onError: (err, variables, context) => {
            if (context?.previousSource) {
                qc.setQueryData(['jobs', 'column', variables.oldStatusId], context.previousSource)
            }
            if (context?.previousTarget) {
                qc.setQueryData(['jobs', 'column', variables.statusId], context.previousTarget)
            }
            toast.error('Durum güncellenemedi.')
        },
        onSettled: (data, error, variables) => {
            qc.invalidateQueries({ queryKey: ['jobs', 'column', variables.statusId] })
            qc.invalidateQueries({ queryKey: ['jobs', 'column', variables.oldStatusId] })
        }
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
        const job = active.data.current?.job

        if (!job) return

        // Check if dropped over a column or another job card
        let targetStatusId = null

        if (over.data.current?.type === 'Column') {
            targetStatusId = overId // overId is status.id
        } else if (over.data.current?.type === 'Job') {
            targetStatusId = over.data.current.job.jobStatusId
        }

        // Only update if the status actually changed
        // Use String() for safe comparison of numeric IDs vs potentially null/unassigned
        const currentJobStatusId = job.jobStatusId === null ? 'unassigned' : job.jobStatusId;

        if (targetStatusId !== null && String(targetStatusId) !== String(currentJobStatusId)) {
            updateJobStatus.mutate({
                jobId: activeId,
                statusId: targetStatusId,
                oldStatusId: currentJobStatusId
            })
        }
    }

    if (statusesLoading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Yükleniyor...</div>

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
                    <p className="text-gray-500 text-sm mt-1">İşlerinizi sürükleyerek durumlarını yönetin</p>
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
                    collisionDetection={rectIntersection} // Using rectIntersection for better target accuracy
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="inline-flex gap-6 h-full min-w-full pb-2">
                        {sortedStatuses.map(status => (
                            <KanbanColumn
                                key={status.id}
                                status={status}
                                onOpenDetail={setSelectedJobId}
                                isCollapsed={collapsedColumns.includes(status.id)}
                                onToggle={toggleColumn}
                            />
                        ))}

                        {/* Fallback column for unassigned jobs if they exist */}
                        <KanbanColumn
                            status={{ id: 'unassigned', name: 'Tanımsız', color: '#94a3b8' }}
                            onOpenDetail={setSelectedJobId}
                            isCollapsed={collapsedColumns.includes('unassigned')}
                            onToggle={toggleColumn}
                        />

                        {/* Add Another List (Redirect to Settings) */}
                        <Link
                            to="/settings/statuses"
                            className="flex-shrink-0 w-64 h-14 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50/10 dark:hover:bg-indigo-500/5 transition-all group"
                        >
                            <Plus size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold">Yeni Liste Ekle</span>
                        </Link>

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

            <JobDetailDrawer jobId={selectedJobId} isOpen={!!selectedJobId} onClose={() => setSelectedJobId(null)} />

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
