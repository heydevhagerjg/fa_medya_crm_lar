import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal.jsx'
import PlanRestrictionView from '../../components/ui/PlanRestrictionView.jsx'
import { useAuthStore } from '../../stores/index.js'

export default function TemplatesTab() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_step_templates_feature === false || user?.tenant?.plan_step_templates_feature === 0

    if (isFeatureDisabled) {
        return <PlanRestrictionView featureName="Adım Şablonları" />
    }
    const qc = useQueryClient()
    const [modal, setModal] = useState({ open: false, template: null })
    const [form, setForm] = useState({ name: '', steps: [''] })
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { data: templates = [] } = useQuery({ queryKey: ['step-templates'], queryFn: () => api.get('/settings/templates').then(r => r.data) })

    const addStepInput = () => setForm(p => ({ ...p, steps: [...p.steps, ''] }))
    const updateStep = (idx, val) => setForm(p => ({ ...p, steps: p.steps.map((s, i) => i === idx ? val : s) }))
    const removeStep = (idx) => setForm(p => ({ ...p, steps: p.steps.filter((_, i) => i !== idx) }))

    const saveMutation = useMutation({
        mutationFn: () => {
            const payload = { name: form.name, steps: form.steps.filter(s => s.trim()) }
            return modal.template ? api.put(`/settings/templates/${modal.template.id}`, payload) : api.post('/settings/templates', payload)
        },
        onSuccess: () => { qc.invalidateQueries(['step-templates']); toast.success('Şablon kaydedildi.'); setModal({ open: false, template: null }) },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/templates/${id}`),
        onSuccess: () => { qc.invalidateQueries(['step-templates']); toast.success('Şablon silindi.'); setDeleteConfirm(null) },
    })

    const openModal = (template = null) => {
        setForm(template ? { name: template.name, steps: (template.defaultstep || []).map(s => s.title) } : { name: '', steps: [''] })
        setModal({ open: true, template })
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-sm font-medium transition-colors"><Plus size={16} /> Şablon Ekle</button>
            </div>
            <div className="space-y-3">
                {templates.map(t => (
                    <div key={t.id} className="theme-surface border theme-divider rounded-xl p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="font-medium theme-text-primary">{t.name}</div>
                                <div className="text-xs theme-text-secondary mt-0.5">{(t.defaultstep || []).length} aşama</div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {(t.defaultstep || []).map((step, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 bg-[#E5E9F0] dark:bg-white/5 theme-text-secondary rounded">{step.title}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => openModal(t)} className="p-2 rounded-lg theme-text-secondary hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => setDeleteConfirm(t)} className="p-2 rounded-lg theme-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false, template: null })} title={modal.template ? 'Şablon Düzenle' : 'Şablon Ekle'}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium theme-text-primary mb-1">Şablon Adı *</label>
                        <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="theme-input" />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium theme-text-primary">Aşamalar</label>
                            <button type="button" onClick={addStepInput} className="text-xs text-[#905EFC] hover:text-[#905EFC] flex items-center gap-1"><Plus size={12} /> Ekle</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {form.steps.map((step, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input type="text" value={step} onChange={e => updateStep(idx, e.target.value)} placeholder={`Aşama ${idx + 1}`} className="theme-input flex-1" />
                                    <button type="button" onClick={() => removeStep(idx)} className="theme-text-secondary hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, template: null })} className="flex-1 px-4 py-2.5 border theme-divider rounded-xl text-sm font-medium theme-text-primary transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">Kaydet</button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Şablon Sil">
                <div className="space-y-4">
                    <p className="theme-text-secondary"><span className="font-semibold">{deleteConfirm?.name}</span> şablonunu silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border theme-divider rounded-xl text-sm font-medium theme-text-primary transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
