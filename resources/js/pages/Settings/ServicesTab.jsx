import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Layers, Loader2 } from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal.jsx'
import PlanRestrictionView from '../../components/ui/PlanRestrictionView.jsx'
import { useAuthStore } from '../../stores/index.js'

export default function ServicesTab() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_services_section_feature === false || user?.tenant?.plan_services_section_feature === 0

    if (isFeatureDisabled) {
        return <PlanRestrictionView featureName="Hizmetler" />
    }
    const qc = useQueryClient()
    const [modal, setModal] = useState({ open: false, service: null })
    const [form, setForm] = useState({ name: '', customFields: [] })
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { data: services = [], isLoading } = useQuery({ queryKey: ['services'], queryFn: () => api.get('/settings/services').then(r => r.data) })

    const addField = () => setForm(p => ({ ...p, customFields: [...p.customFields, { label: '', type: 'text', required: false, order: p.customFields.length }] }))
    const removeField = (idx) => setForm(p => ({ ...p, customFields: p.customFields.filter((_, i) => i !== idx) }))
    const updateField = (idx, key, val) => setForm(p => ({ ...p, customFields: p.customFields.map((f, i) => i === idx ? { ...f, [key]: val } : f) }))

    const saveMutation = useMutation({
        mutationFn: () => modal.service ? api.put(`/settings/services/${modal.service.id}`, form) : api.post('/settings/services', form),
        onSuccess: () => { qc.invalidateQueries(['services']); toast.success('Hizmet kaydedildi.'); setModal({ open: false, service: null }) },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata.'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/services/${id}`),
        onSuccess: () => { qc.invalidateQueries(['services']); toast.success('Hizmet silindi.'); setDeleteConfirm(null) },
    })

    const openModal = (service = null) => {
        setForm(service ? { name: service.name, customFields: (service.customfield || []).map(cf => ({ label: cf.label, type: cf.type, required: cf.required, order: cf.order })) } : { name: '', customFields: [] })
        setModal({ open: true, service })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white">Hizmet Tanımları</h2>
                    <p className="text-sm text-[#9097A6]">Müşterilerinize sunduğunuz hizmetleri ve özel alanları yönetin.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Hizmet Ekle
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#9097A6]" size={32} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {services.map(s => (
                        <div key={s.id} className="group bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-xl p-5 transition-all hover:border-[#905EFC]/30 hover:shadow-md relative">
                            <div className="flex items-start justify-between">
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-[#905EFC]/10 dark:bg-[#905EFC]/10 rounded-lg flex items-center justify-center text-[#905EFC]">
                                        <Layers size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#1A1A2E] dark:text-white">{s.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] px-2 py-0.5 bg-[#E5E9F0] dark:bg-white/10 text-[#9097A6] dark:text-[#9097A6] rounded-md font-bold uppercase tracking-wider transition-colors group-hover:bg-[#905EFC]/10 dark:group-hover:bg-[#905EFC]/10 group-hover:text-[#905EFC]">
                                                {(s.customfield || []).length} Özel Alan
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openModal(s)} className="p-2 rounded-lg text-[#9097A6] hover:text-[#905EFC] hover:bg-[#905EFC]/10 dark:hover:bg-[#905EFC]/10 transition-colors"><Edit2 size={16} /></button>
                                    <button onClick={() => setDeleteConfirm(s)} className="p-2 rounded-lg text-[#9097A6] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {services.length === 0 && (
                        <div className="col-span-full border-2 border-dashed border-[#E5E9F0] dark:border-white/5 rounded-xl py-12 text-center">
                            <Layers size={40} className="mx-auto text-[#9097A6] mb-3" />
                            <p className="text-[#9097A6] font-medium italic">Henüz hizmet tanımlanmamış.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal open={modal.open} onClose={() => setModal({ open: false, service: null })} title={modal.service ? 'Hizmet Düzenle' : 'Hizmet Ekle'} size="lg">
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A2E] dark:text-white mb-1">Hizmet Adı *</label>
                        <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 text-[#1A1A2E] dark:text-white focus:outline-none focus:border-[#905EFC]" />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-[#1A1A2E] dark:text-white">Özel Alanlar</label>
                            <button type="button" onClick={addField} className="text-xs text-[#905EFC] hover:text-[#905EFC] flex items-center gap-1"><Plus size={12} /> Alan Ekle</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {form.customFields.map((field, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input type="text" value={field.label} onChange={e => updateField(idx, 'label', e.target.value)} placeholder="Alan adı" className="flex-1 px-3 py-1.5 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-sm bg-transparent text-[#1A1A2E] dark:text-white placeholder-[#9097A6] focus:outline-none focus:border-[#905EFC]" />
                                    <select value={field.type} onChange={e => updateField(idx, 'type', e.target.value)} className="px-2 py-1.5 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 text-[#1A1A2E] dark:text-white focus:outline-none">
                                        <option value="text">Metin</option>
                                        <option value="number">Sayı</option>
                                        <option value="date">Tarih</option>
                                        <option value="textarea">Çok Satırlı</option>
                                        <option value="select">Seçim</option>
                                    </select>
                                    <label className="flex items-center gap-1 text-xs text-[#9097A6]">
                                        <input type="checkbox" checked={field.required} onChange={e => updateField(idx, 'required', e.target.checked)} />
                                        Zorunlu
                                    </label>
                                    <button type="button" onClick={() => removeField(idx)} className="text-[#9097A6] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, service: null })} className="flex-1 px-4 py-2.5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm font-medium text-[#1A1A2E] dark:text-white transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hizmet Sil">
                <div className="space-y-4">
                    <p className="text-[#9097A6] dark:text-[#9097A6]"><span className="font-semibold text-[#1A1A2E] dark:text-white">{deleteConfirm?.name}</span> hizmetini silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm font-medium transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
