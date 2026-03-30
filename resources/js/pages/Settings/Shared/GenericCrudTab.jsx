import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Settings, Loader2 } from 'lucide-react'
import api from '../../../lib/api.js'
import toast from 'react-hot-toast'
import Modal from '../../../components/ui/Modal.jsx'

export default function GenericCrudTab({ queryKey, apiPath, label, renderForm, emptyForm, formToPayload = f => f, icon: Icon = Settings }) {
    const qc = useQueryClient()
    const [modal, setModal] = useState({ open: false, item: null })
    const [form, setForm] = useState(emptyForm)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { data: items = [], isLoading } = useQuery({ queryKey: [queryKey], queryFn: () => api.get(apiPath).then(r => r.data) })

    const saveMutation = useMutation({
        mutationFn: () => modal.item ? api.put(`${apiPath}/${modal.item.id}`, formToPayload(form)) : api.post(apiPath, formToPayload(form)),
        onSuccess: () => { qc.invalidateQueries([queryKey]); toast.success('Kaydedildi.'); setModal({ open: false, item: null }) },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`${apiPath}/${id}`),
        onSuccess: () => { qc.invalidateQueries([queryKey]); toast.success('Silindi.'); setDeleteConfirm(null) },
    })

    const openModal = (item = null) => {
        setForm(item ? { ...emptyForm, ...item } : emptyForm)
        setModal({ open: true, item })
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-black theme-text-primary">{label}</h2>
                    <p className="text-xs theme-text-secondary mt-0.5">Mevcut tanımlamaları yönetin veya yenisini ekleyin.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-sm font-bold shadow-md shadow-[#905EFC]/20 transition-all active:scale-95"
                >
                    <Plus size={16} />
                    {label} Ekle
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin theme-text-secondary" size={28} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {items.map(item => (
                        <div key={item.id} className="group theme-surface border theme-divider rounded-xl p-4 flex items-center justify-between transition-all hover:border-[#905EFC]/30 hover:shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#F4F5F7] dark:bg-white/5 rounded-lg theme-text-secondary group-hover:text-[#905EFC] group-hover:bg-[#905EFC]/10 transition-colors">
                                    <Icon size={16} strokeWidth={1.8} />
                                </div>
                                <div>
                                    <div className="font-bold theme-text-primary text-sm">{item.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] theme-text-secondary font-medium">#{item.id}</span>
                                        {item.is_default && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-[#905EFC]/10 text-[#905EFC] rounded font-bold uppercase tracking-wider">
                                                Varsayılan
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-0.5">
                                <button onClick={() => openModal(item)} className="p-2 rounded-lg theme-text-secondary hover:text-[#905EFC] hover:bg-[#905EFC]/10 transition-colors"><Edit2 size={15} /></button>
                                <button onClick={() => setDeleteConfirm(item)} className="p-2 rounded-lg theme-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={15} /></button>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="border-2 border-dashed theme-divider rounded-xl py-12 text-center col-span-full">
                            <Icon size={36} className="mx-auto theme-text-secondary mb-3" strokeWidth={1.5} />
                            <p className="theme-text-secondary text-sm font-medium">Henüz kayıt bulunamadı.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title={`${label} ${modal.item ? 'Düzenle' : 'Ekle'}`}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    {renderForm(form, setForm)}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, item: null })} className="flex-1 px-4 py-2.5 border theme-divider rounded-xl text-sm font-semibold theme-text-secondary hover:theme-text-primary transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={`${label} Sil`}>
                <div className="space-y-4">
                    <p className="theme-text-secondary text-sm"><span className="font-semibold theme-text-primary">{deleteConfirm?.name}</span> öğesini silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border theme-divider rounded-xl text-sm font-semibold theme-text-secondary hover:theme-text-primary transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
