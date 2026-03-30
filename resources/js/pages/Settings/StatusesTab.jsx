import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, AlertCircle, Loader2 } from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal.jsx'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import StatusItem from './Shared/StatusItem.jsx'

export default function StatusesTab() {
    const qc = useQueryClient()
    const [modal, setModal] = useState({ open: false, status: null })
    const [form, setForm] = useState({ name: '', color: '#3b82f6', order: 0 })
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const { data: statuses = [] } = useQuery({
        queryKey: ['job-statuses'],
        queryFn: () => api.get('/settings/statuses').then(r => r.data)
    })

    const saveMutation = useMutation({
        mutationFn: () => modal.status ? api.put(`/settings/statuses/${modal.status.id}`, form) : api.post('/settings/statuses', form),
        onSuccess: () => { qc.invalidateQueries(['job-statuses']); toast.success('Durum kaydedildi.'); setModal({ open: false, status: null }) },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/statuses/${id}`),
        onSuccess: () => { qc.invalidateQueries(['job-statuses']); toast.success('Durum silindi.'); setDeleteConfirm(null) },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.')
    })

    const reorderMutation = useMutation({
        mutationFn: (newOrder) => api.post('/settings/statuses/reorder', { statuses: newOrder }),
        onSuccess: () => qc.invalidateQueries(['job-statuses']),
        onError: () => toast.error('Sıralama güncellenemedi.')
    })

    const handleDragEnd = (event) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = statuses.findIndex(x => x.id === active.id)
        const newIndex = statuses.findIndex(x => x.id === over.id)
        const newOrder = arrayMove(statuses, oldIndex, newIndex)
        const payload = newOrder.map((s, idx) => ({ id: s.id, order: idx }))
        reorderMutation.mutate(payload)
    }

    const openModal = (status = null) => {
        setForm(status ? { name: status.name, color: status.color || '#3b82f6', order: status.order || 0 } : { name: '', color: '#3b82f6', order: statuses.length })
        setModal({ open: true, status })
    }

    const defaultStatus = statuses.find(s => s.name === 'Varsayılan')
    const otherStatuses = statuses.filter(s => s.name !== 'Varsayılan')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold theme-text-primary">İş Akış Durumları</h2>
                    <p className="text-sm theme-text-secondary">İş süreçlerindeki aşamaları ve sıralamayı yönetin.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Durum Ekle
                </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20 flex items-center gap-3">
                <AlertCircle className="text-blue-600 dark:text-blue-400" size={18} />
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    Sürükle-bırak yöntemini kullanarak durumların uygulama içindeki öncelik sırasını değiştirebilirsiniz.
                </p>
            </div>

            <div className="space-y-2">
                {statuses.length === 0 ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin theme-text-secondary" size={32} /></div>
                ) : (
                    <>
                        {defaultStatus && (
                            <StatusItem s={defaultStatus} openModal={openModal} setDeleteConfirm={setDeleteConfirm} isLocked={true} />
                        )}

                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={otherStatuses.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {otherStatuses.map(s => (
                                        <StatusItem key={s.id} s={s} openModal={openModal} setDeleteConfirm={setDeleteConfirm} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </>
                )}
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false, status: null })} title={modal.status ? 'Durumu Düzenle' : 'Durum Ekle'}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium theme-text-primary mb-1">Adı *</label>
                        <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required disabled={modal.status?.name === 'Varsayılan'} className="theme-input disabled:opacity-50" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div>
                            <label className="block text-sm font-medium text-[#1A1A2E] dark:text-white mb-1">Renk</label>
                            <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="h-10 w-20 rounded-lg border border-[#E5E9F0] dark:border-white/10 cursor-pointer" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-[#1A1A2E] dark:text-white mb-1">Sıra</label>
                            <input type="number" value={form.order} readOnly className="w-full px-3 py-2 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-sm bg-[#F4F5F7] dark:bg-white/5 text-[#9097A6] focus:outline-none" />
                            <p className="text-[10px] text-[#9097A6] mt-1">Sıralamayı listeden sürükleyerek değiştirebilirsiniz.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, status: null })} className="flex-1 px-4 py-2.5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm font-medium transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">Kaydet</button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Durumu Sil">
                <div className="space-y-4">
                    <p className="text-[#9097A6] dark:text-[#9097A6]"><span className="font-semibold">{deleteConfirm?.name}</span> durumunu silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm font-medium transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
