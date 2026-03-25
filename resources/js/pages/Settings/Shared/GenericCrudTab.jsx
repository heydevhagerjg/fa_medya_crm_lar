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
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{label}</h2>
                    <p className="text-sm text-gray-500">Mevcut tanımlamaları yönetin veya yenisini ekleyin.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    {label} Ekle
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between transition-all hover:border-indigo-500/30 hover:shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-tight">{item.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-gray-400 font-medium">ID: #{item.id}</span>
                                        {item.is_default && (
                                            <span className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded text-[9px] font-bold uppercase tracking-wider">
                                                Varsayılan
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => openModal(item)} className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => setDeleteConfirm(item)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl py-12 text-center col-span-full">
                            <Icon size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-400 font-medium italic">Henüz kayıt bulunamadı.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title={`${label} ${modal.item ? 'Düzenle' : 'Ekle'}`}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    {renderForm(form, setForm)}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, item: null })} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={`${label} Sil`}>
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400"><span className="font-semibold">{deleteConfirm?.name}</span> öğesini silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
