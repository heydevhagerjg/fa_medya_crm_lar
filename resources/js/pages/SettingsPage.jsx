import { useState } from 'react'
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { Settings, Layers, Tag, List, Wallet, FolderOpen, Key, Plus, Trash2, Edit2, GripVertical, ChevronRight } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'

export default function SettingsPage() {
    const location = useLocation()

    const tabs = [
        { path: '/settings', label: 'Hizmetler', icon: Layers, exact: true },
        { path: '/settings/statuses', label: 'Durumlar', icon: Tag },
        { path: '/settings/templates', label: 'Adım Şablonları', icon: List },
        { path: '/settings/cash-registers', label: 'Kasalar', icon: Wallet },
        { path: '/settings/expense-categories', label: 'Masraf Kategorileri', icon: FolderOpen },
        { path: '/settings/api-keys', label: 'API Anahtarları', icon: Key },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Settings size={24} className="text-indigo-500" />
                    Ayarlar
                </h1>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-800">
                {tabs.map(({ path, label, icon: Icon, exact }) => {
                    const isActive = exact ? location.pathname === path : location.pathname.startsWith(path) && path !== '/settings'
                    const isExactActive = location.pathname === '/settings' && exact
                    return (
                        <NavLink key={path} to={path} end={exact}
                            className={({ isActive: navIsActive }) => `
                                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
                                ${(exact ? isExactActive || (navIsActive && location.pathname === '/settings') : navIsActive)
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                            `}
                        >
                            <Icon size={14} />
                            {label}
                        </NavLink>
                    )
                })}
            </div>

            <Routes>
                <Route index element={<ServicesTab />} />
                <Route path="statuses" element={<StatusesTab />} />
                <Route path="templates" element={<TemplatesTab />} />
                <Route path="cash-registers" element={<CashRegistersTab />} />
                <Route path="expense-categories" element={<ExpenseCategoriesTab />} />
                <Route path="api-keys" element={<ApiKeysTab />} />
            </Routes>
        </div>
    )
}

// ---- Services Tab ----
function ServicesTab() {
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
        onError: () => toast.error('Hata.'),
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
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                    <Plus size={16} /> Hizmet Ekle
                </button>
            </div>
            {isLoading ? <div className="text-center py-8 text-gray-400">Yükleniyor...</div> : (
                <div className="space-y-3">
                    {services.map(s => (
                        <div key={s.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white">{s.name}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{(s.customfield || []).length} özel alan</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openModal(s)} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => setDeleteConfirm(s)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                    {services.length === 0 && <p className="text-center text-gray-400 py-8">Henüz hizmet yok.</p>}
                </div>
            )}

            <Modal open={modal.open} onClose={() => setModal({ open: false, service: null })} title={modal.service ? 'Hizmet Düzenle' : 'Hizmet Ekle'} size="lg">
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hizmet Adı *</label>
                        <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Özel Alanlar</label>
                            <button type="button" onClick={addField} className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1"><Plus size={12} /> Alan Ekle</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {form.customFields.map((field, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input type="text" value={field.label} onChange={e => updateField(idx, 'label', e.target.value)} placeholder="Alan adı" className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500" />
                                    <select value={field.type} onChange={e => updateField(idx, 'type', e.target.value)} className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none">
                                        <option value="text">Metin</option>
                                        <option value="number">Sayı</option>
                                        <option value="date">Tarih</option>
                                        <option value="textarea">Çok Satırlı</option>
                                        <option value="select">Seçim</option>
                                    </select>
                                    <label className="flex items-center gap-1 text-xs text-gray-500">
                                        <input type="checkbox" checked={field.required} onChange={e => updateField(idx, 'required', e.target.checked)} />
                                        Zorunlu
                                    </label>
                                    <button type="button" onClick={() => removeField(idx)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, service: null })} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hizmet Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-900 dark:text-white">{deleteConfirm?.name}</span> hizmetini silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

// ---- Statuses Tab ----
function StatusesTab() {
    const qc = useQueryClient()
    const [modal, setModal] = useState({ open: false, status: null })
    const [form, setForm] = useState({ name: '', color: '#3b82f6', order: 0 })
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { data: statuses = [] } = useQuery({ queryKey: ['job-statuses'], queryFn: () => api.get('/settings/statuses').then(r => r.data) })

    const saveMutation = useMutation({
        mutationFn: () => modal.status ? api.put(`/settings/statuses/${modal.status.id}`, form) : api.post('/settings/statuses', form),
        onSuccess: () => { qc.invalidateQueries(['job-statuses']); toast.success('Durum kaydedildi.'); setModal({ open: false, status: null }) },
    })
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/statuses/${id}`),
        onSuccess: () => { qc.invalidateQueries(['job-statuses']); toast.success('Durum silindi.'); setDeleteConfirm(null) },
    })

    const openModal = (status = null) => {
        setForm(status ? { name: status.name, color: status.color || '#3b82f6', order: status.order || 0 } : { name: '', color: '#3b82f6', order: statuses.length })
        setModal({ open: true, status })
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                    <Plus size={16} /> Durum Ekle
                </button>
            </div>
            <div className="space-y-3">
                {statuses.map(s => (
                    <div key={s.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="flex-1 font-medium text-gray-900 dark:text-white">{s.name}</span>
                        <button onClick={() => openModal(s)} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => setDeleteConfirm(s)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                    </div>
                ))}
                {statuses.length === 0 && <p className="text-center text-gray-400 py-8">Henüz durum yok.</p>}
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false, status: null })} title={modal.status ? 'Durumu Düzenle' : 'Durum Ekle'}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adı *</label>
                        <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Renk</label>
                            <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="h-10 w-20 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sıra</label>
                            <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, status: null })} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">Kaydet</button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Durumu Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400"><span className="font-semibold">{deleteConfirm?.name}</span> durumunu silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

// ---- Generic CRUD list for simple entities ----
function GenericCrudTab({ queryKey, apiPath, label, renderForm, emptyForm, formToPayload = f => f }) {
    const qc = useQueryClient()
    const [modal, setModal] = useState({ open: false, item: null })
    const [form, setForm] = useState(emptyForm)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { data: items = [] } = useQuery({ queryKey: [queryKey], queryFn: () => api.get(apiPath).then(r => r.data) })

    const saveMutation = useMutation({
        mutationFn: () => modal.item ? api.put(`${apiPath}/${modal.item.id}`, formToPayload(form)) : api.post(apiPath, formToPayload(form)),
        onSuccess: () => { qc.invalidateQueries([queryKey]); toast.success('Kaydedildi.'); setModal({ open: false, item: null }) },
        onError: () => toast.error('Hata.'),
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
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                    <Plus size={16} /> {label} Ekle
                </button>
            </div>
            <div className="space-y-3">
                {items.map(item => (
                    <div key={item.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                            {item.is_default && <span className="text-xs text-indigo-500">Varsayılan</span>}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => openModal(item)} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => setDeleteConfirm(item)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-center text-gray-400 py-8">Henüz {label.toLowerCase()} yok.</p>}
            </div>

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
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

function TemplatesTab() {
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
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"><Plus size={16} /> Şablon Ekle</button>
            </div>
            <div className="space-y-3">
                {templates.map(t => (
                    <div key={t.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white">{t.name}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{(t.defaultstep || []).length} aşama</div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {(t.defaultstep || []).map((step, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">{step.title}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => openModal(t)} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => setDeleteConfirm(t)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
                {templates.length === 0 && <p className="text-center text-gray-400 py-8">Henüz şablon yok.</p>}
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false, template: null })} title={modal.template ? 'Şablon Düzenle' : 'Şablon Ekle'}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şablon Adı *</label>
                        <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Aşamalar</label>
                            <button type="button" onClick={addStepInput} className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1"><Plus size={12} /> Ekle</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {form.steps.map((step, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input type="text" value={step} onChange={e => updateStep(idx, e.target.value)} placeholder={`Aşama ${idx + 1}`} className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500" />
                                    <button type="button" onClick={() => removeStep(idx)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, template: null })} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">Kaydet</button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Şablon Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400"><span className="font-semibold">{deleteConfirm?.name}</span> şablonunu silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

function CashRegistersTab() {
    return <GenericCrudTab
        queryKey="cash-registers" apiPath="/settings/cash-registers" label="Kasa"
        emptyForm={{ name: '', is_default: false }}
        renderForm={(form, setForm) => (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kasa Adı *</label>
                    <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_default || false} onChange={e => setForm(p => ({ ...p, is_default: e.target.checked }))} className="rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Varsayılan kasa</span>
                </label>
            </>
        )}
    />
}

function ExpenseCategoriesTab() {
    return <GenericCrudTab
        queryKey="expense-categories" apiPath="/settings/expense-categories" label="Kategori"
        emptyForm={{ name: '' }}
        renderForm={(form, setForm) => (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori Adı *</label>
                <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
            </div>
        )}
    />
}

function ApiKeysTab() {
    const qc = useQueryClient()
    const [name, setName] = useState('')
    const [showConfirm, setShowConfirm] = useState(null)

    const { data: keys = [] } = useQuery({ queryKey: ['api-keys'], queryFn: () => api.get('/settings/api-keys').then(r => r.data) })

    const createMutation = useMutation({
        mutationFn: () => api.post('/settings/api-keys', { name }),
        onSuccess: () => { qc.invalidateQueries(['api-keys']); toast.success('API anahtarı oluşturuldu.'); setName('') },
    })
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/api-keys/${id}`),
        onSuccess: () => { qc.invalidateQueries(['api-keys']); toast.success('Anahtar silindi.'); setShowConfirm(null) },
    })

    const copyKey = (key) => {
        navigator.clipboard.writeText(key)
        toast.success('Kopyalandı!')
    }

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Yeni API Anahtarı Oluştur</h3>
                <div className="flex gap-3">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Anahtar adı (isteğe bağlı)" className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Oluştur</button>
                </div>
            </div>
            <div className="space-y-3">
                {keys.map(k => (
                    <div key={k.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{k.name || 'Adsız Anahtar'}</div>
                                <button onClick={() => copyKey(k.key)} className="font-mono text-xs text-gray-400 hover:text-indigo-500 transition-colors truncate max-w-xs block mt-1" title="Kopyalamak için tıklayın">
                                    {k.key.substring(0, 24)}...
                                </button>
                            </div>
                            <button onClick={() => setShowConfirm(k)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
                {keys.length === 0 && <p className="text-center text-gray-400 py-8">Henüz API anahtarı yok.</p>}
            </div>

            <Modal open={!!showConfirm} onClose={() => setShowConfirm(null)} title="API Anahtarını Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">Bu API anahtarını silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(showConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
