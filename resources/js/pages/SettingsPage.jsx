import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { Settings, Layers, Tag, List, Wallet, FolderOpen, Key, Plus, Trash2, Edit2, GripVertical, ChevronRight, Cloud, Save, CheckCircle, AlertCircle, Loader2, Play, Lock, GripHorizontal, Type, FileCode, Activity, ChevronDown, ChevronUp, Users, Mail, Shield, ShieldCheck, User } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import { useAuthStore } from '../stores/index.js'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SettingsPage() {
    const location = useLocation()
    const { user } = useAuthStore()
    const hasPermission = (p) => {
        if (!p) return true;
        if (user?.role === "ADMIN") return true;
        return user?.permissions?.includes(p) || false;
    }

    const tabs = [
        // Core CRM / Jobs
        { path: '/settings', label: 'Hizmetler', icon: Layers, exact: true, permission: 'settings.view' },
        { path: '/settings/statuses', label: 'Durumlar', icon: Tag, permission: 'settings.view' },
        { path: '/settings/templates', label: 'Adım Şablonları', icon: List, permission: 'settings.view' },
        { path: '/settings/users', label: 'Kullanıcı Yönetimi', icon: Users, permission: 'users.manage' },
        { path: '/settings/roles', label: 'Rol Yönetimi', icon: Shield, permission: 'settings.manage' },
        { path: '/settings/appointment-titles', label: 'Randevu Başlıkları', icon: Type, permission: 'settings.view' },

        // Service Tracking
        { path: '/settings/service-tracking-categories', label: 'Hizmet Takip Kategorileri', icon: FolderOpen, permission: 'settings.view' },

        // Finance
        { path: '/settings/cash-registers', label: 'Kasalar', icon: Wallet, permission: 'settings.manage' },
        { path: '/settings/expense-categories', label: 'Masraf Kategorileri', icon: FolderOpen, permission: 'settings.view' },

        // Tech / System
        { path: '/settings/api-keys', label: 'API Anahtarları', icon: Key, permission: 'settings.manage' },
        { path: '/settings/import-keys', label: 'Özel İmport Keyler', icon: Lock, permission: 'settings.manage' },
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
                {tabs.filter(t => hasPermission(t.permission)).map(({ path, label, icon: Icon, exact }) => {
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
                <Route path="users" element={<UsersTab />} />
                <Route path="roles" element={<RolesTab />} />
                <Route path="cash-registers" element={<CashRegistersTab />} />
                <Route path="expense-categories" element={<ExpenseCategoriesTab />} />
                <Route path="appointment-titles" element={<AppointmentTitlesTab />} />
                <Route path="api-keys" element={<ApiKeysTab />} />
                <Route path="s3" element={<div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <Cloud size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Depolama Ayarları Taşındı</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Sistem depolama ayarları artık merkezi olarak yönetilmektedir. Kişisel S3 ayarlarınızı yapmanıza gerek yoktur.
                    </p>
                </div>} />
                <Route path="import-keys" element={<BackupKeysTab />} />
                <Route path="service-tracking-categories" element={<ServiceTrackingCategoriesTab />} />
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
function StatusItem({ s, openModal, setDeleteConfirm, isLocked = false }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: s.id,
        disabled: isLocked
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3 ${isDragging ? 'shadow-xl border-indigo-500' : ''}`}
        >
            {!isLocked ? (
                <button {...attributes} {...listeners} className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} />
                </button>
            ) : (
                <div className="w-6 flex items-center justify-center text-gray-300">
                    <Lock size={14} />
                </div>
            )}
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="flex-1 font-medium text-gray-900 dark:text-white">
                {s.name} <span className="text-gray-400 dark:text-gray-500 font-normal">| ID: {s.id}</span>
                {isLocked && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full font-normal italic">Varsayılan</span>}
            </span>
            <div className="flex gap-1">
                <button onClick={() => openModal(s)} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
                {!isLocked && (
                    <button onClick={() => setDeleteConfirm(s)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                )}
            </div>
        </div>
    )
}

function StatusesTab() {
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

        const defaultStatus = statuses.find(s => s.name === 'Varsayılan')
        const otherStatuses = statuses.filter(s => s.name !== 'Varsayılan')

        const oldIndex = otherStatuses.findIndex(i => i.id === active.id)
        const newIndex = otherStatuses.findIndex(i => i.id === over.id)

        const reorderedOthers = arrayMove(otherStatuses, oldIndex, newIndex)

        // Final array: Varsayılan (order 0) + others (starting from order 1)
        const finalArr = [defaultStatus, ...reorderedOthers]
        const payload = finalArr.map((s, idx) => ({ id: s.id, order: idx }))
        reorderMutation.mutate(payload)
    }

    const openModal = (status = null) => {
        setForm(status ? { name: status.name, color: status.color || '#3b82f6', order: status.order || 0 } : { name: '', color: '#3b82f6', order: statuses.length })
        setModal({ open: true, status })
    }

    const defaultStatus = statuses.find(s => s.name === 'Varsayılan')
    const otherStatuses = statuses.filter(s => s.name !== 'Varsayılan')

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                    <Plus size={16} /> Durum Ekle
                </button>
            </div>

            <div className="space-y-3">
                {/* Always render Varsayılan at the top, outside of DndContext for movement but inside for visual consistency if needed, 
                    actually best to just render it static and move context below it */}
                {defaultStatus && (
                    <StatusItem s={defaultStatus} openModal={openModal} setDeleteConfirm={setDeleteConfirm} isLocked={true} />
                )}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={otherStatuses.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {otherStatuses.map(s => (
                                <StatusItem key={s.id} s={s} openModal={openModal} setDeleteConfirm={setDeleteConfirm} />
                            ))}
                            {statuses.length === 0 && <p className="text-center text-gray-400 py-8">Henüz durum yok.</p>}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false, status: null })} title={modal.status ? 'Durumu Düzenle' : 'Durum Ekle'}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate() }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adı *</label>
                        <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required disabled={modal.status?.name === 'Varsayılan'} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Renk</label>
                            <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="h-10 w-20 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sıra</label>
                            <input type="number" value={form.order} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-800/50 text-gray-500 focus:outline-none" />
                            <p className="text-[10px] text-gray-400 mt-1">Sıralamayı listeden sürükleyerek değiştirebilirsiniz.</p>
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
    const { user } = useAuthStore()
    const qc = useQueryClient()
    const [name, setName] = useState('')
    const [expiresAt, setExpiresAt] = useState('')
    const [selectedPermissions, setSelectedPermissions] = useState([])
    const [showConfirm, setShowConfirm] = useState(null)
    const [editingKey, setEditingKey] = useState(null)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const modules = [
        { id: 'jobs', label: 'İşler (Jobs)' },
        { id: 'customers', label: 'Müşteriler (Customers)' },
        { id: 'appointments', label: 'Randevular (Appointments)' },
        { id: 'finance', label: 'Finans (Kasalar)' },
        { id: 'expenses', label: 'Giderler (Expenses)' },
        { id: 'files', label: 'Dosyalar (Files)' },
        { id: 'dashboard', label: 'Dashboard / İstatistik' },
        { id: 'auth', label: 'Kullanıcı İşlemleri (Auth)' },
        { id: 'settings', label: 'Ayarlar' },
        { id: 'logs', label: 'Loglar' },
    ]

    const actions = [
        { id: 'read', label: 'Oku', color: 'blue' },
        { id: 'write', label: 'Yaz (Ekle)', color: 'green' },
        { id: 'update', label: 'Güncelle', color: 'amber' },
        { id: 'delete', label: 'Sil', color: 'red' },
    ]

    const { data: keys = [] } = useQuery({ queryKey: ['api-keys'], queryFn: () => api.get('/settings/api-keys').then(r => r.data) })

    const saveMutation = useMutation({
        mutationFn: (data) => editingKey
            ? api.put(`/settings/api-keys/${editingKey.id}`, data)
            : api.post('/settings/api-keys', data),
        onSuccess: () => {
            qc.invalidateQueries(['api-keys'])
            toast.success(editingKey ? 'API anahtarı güncellendi.' : 'API anahtarı oluşturuldu.')
            resetForm()
        },
    })

    const resetForm = () => {
        setName('')
        setExpiresAt('')
        setSelectedPermissions([])
        setEditingKey(null)
        setIsFormOpen(false)
    }

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/api-keys/${id}`),
        onSuccess: () => { qc.invalidateQueries(['api-keys']); toast.success('Anahtar silindi.'); setShowConfirm(null) },
    })

    const copyKey = (key) => {
        navigator.clipboard.writeText(key)
        toast.success('Kopyalandı!')
    }

    const handleEdit = (k) => {
        setEditingKey(k)
        setName(k.name || '')
        setExpiresAt(k.expires_at ? k.expires_at.split('T')[0] : '')
        setSelectedPermissions(k.permissions || [])
        setIsFormOpen(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const togglePermission = (moduleId, actionId) => {
        const perm = `${moduleId}:${actionId}`
        setSelectedPermissions(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        )
    }

    const toggleAllModule = (moduleId) => {
        const modulePerms = actions.map(a => `${moduleId}:${a.id}`)
        const hasAll = modulePerms.every(p => selectedPermissions.includes(p))

        if (hasAll) {
            setSelectedPermissions(prev => prev.filter(p => !modulePerms.includes(p)))
        } else {
            setSelectedPermissions(prev => [...new Set([...prev, ...modulePerms])])
        }
    }

    return (
        <div className="space-y-4">
            <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-5 transition-all duration-300 ${isFormOpen ? 'ring-2 ring-indigo-500/20 shadow-lg' : ''}`}>
                <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setIsFormOpen(!isFormOpen)}
                >
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {editingKey ? <Edit2 size={16} className="text-amber-500" /> : <Plus size={16} className="text-indigo-500" />}
                            {editingKey ? 'API Anahtarını Düzenle' : 'Yeni Granüler API Anahtarı Oluştur'}
                        </h3>
                        {!isFormOpen && (
                            <p className="text-[10px] text-gray-400 mt-1">Granüler yetkilere sahip yeni bir anahtar tanımlamak için tıklayın.</p>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {user?.role === 'ADMIN' && (
                            <Link
                                to="/api-docs"
                                onClick={(e) => e.stopPropagation()}
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-[10px] font-bold transition-all"
                            >
                                <FileCode size={12} /> Dökümantasyon
                            </Link>
                        )}
                        <div className="p-1 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors">
                            {isFormOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                    </div>
                </div>

                {isFormOpen && (
                    <div className="space-y-5 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Anahtar Adı</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Mobil Entegrasyon" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Son Geçerlilik Tarihi (Opsiyonel)</label>
                                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                        </div>

                        <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[10px] uppercase font-bold">
                                    <tr>
                                        <th className="px-4 py-2">Modül</th>
                                        {actions.map(a => <th key={a.id} className="px-4 py-2 text-center">{a.label}</th>)}
                                        <th className="px-4 py-2 text-right">Tümü</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {modules.map(m => (
                                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-xs">{m.label}</td>
                                            {actions.map(a => (
                                                <td key={a.id} className="px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPermissions.includes(`${m.id}:${a.id}`)}
                                                        onChange={() => togglePermission(m.id, a.id)}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAllModule(m.id)}
                                                    className="text-[10px] text-indigo-500 hover:text-indigo-400 font-bold"
                                                >
                                                    {actions.every(a => selectedPermissions.includes(`${m.id}:${a.id}`)) ? 'Temizle' : 'Tümü'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            {editingKey && (
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                >
                                    İptal
                                </button>
                            )}
                            <button
                                onClick={() => saveMutation.mutate({ name, permissions: selectedPermissions, expires_at: expiresAt || null })}
                                disabled={saveMutation.isPending}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {editingKey ? 'Değişiklikleri Kaydet' : 'Anahtarı Oluştur'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {keys.map(k => (
                    <div key={k.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 transition-all hover:border-gray-300 dark:hover:border-gray-700 shadow-sm relative group">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{k.name || 'Adsız Anahtar'}</span>
                                    {k.expires_at && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${new Date(k.expires_at) < new Date()
                                            ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                            : 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                                            }`}>
                                            {new Date(k.expires_at) < new Date() ? 'Süresi Doldu' : `SKT: ${new Date(k.expires_at).toLocaleDateString('tr-TR')}`}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-stretch gap-2">
                                    <button onClick={() => copyKey(k.key)} className="flex-1 group/key flex items-center gap-2 font-mono text-[13px] text-gray-700 hover:text-indigo-500 transition-colors bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg" title="Kopyalamak için tıklayın">
                                        <span className="truncate flex-1">{k.key}</span>
                                        <Activity size={12} className="opacity-0 group-hover/key:opacity-100 transition-opacity" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {!k.permissions || k.permissions.length === 0 ? (
                                        <span className="text-[10px] px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg font-semibold border border-amber-100 dark:border-amber-500/20">Full Admin Access (Tüm Yetkiler)</span>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {modules.filter(m => k.permissions.some(p => p.startsWith(m.id + ':'))).map(m => (
                                                <div key={m.id} className="p-2 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-800/20">
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">{m.label}</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {actions.filter(a => k.permissions.includes(`${m.id}:${a.id}`)).map(a => (
                                                            <span key={a.id} className="text-[8px] px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded uppercase">{a.label}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="text-[10px] text-gray-400 flex items-center gap-3">
                                    <span>Son Kullanım: {k.last_used ? new Date(k.last_used).toLocaleString('tr-TR') : 'Henüz kullanılmadı'}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                    <span>ID: {k.id.split('-')[0]}...</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => handleEdit(k)}
                                    className="p-2.5 rounded-xl text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-100 dark:hover:border-amber-500/20"
                                    title="Düzenle"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => setShowConfirm(k)}
                                    className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                                    title="Sil"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {keys.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                        <Key className="mx-auto text-gray-300 dark:text-gray-700 mb-3" size={40} />
                        <p className="text-gray-400 text-sm">Henüz bir API anahtarı tanımlanmamış.</p>
                    </div>
                )}
            </div>

            <Modal open={!!showConfirm} onClose={() => setShowConfirm(null)} title="API Anahtarını Sil">
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-2xl flex gap-3 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-500/20">
                        <AlertCircle size={20} className="shrink-0" />
                        <p>Bu API anahtarını sildiğinizde, bu anahtarı kullanan tüm dış servislerin erişimi anında kesilecektir. Bu işlem geri alınamaz.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowConfirm(null)} className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Vazgeç</button>
                        <button onClick={() => deleteMutation.mutate(showConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-500/20">
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

function S3Tab() {
    const qc = useQueryClient()
    const [form, setForm] = useState({
        name: '',
        aws_access_key_id: '',
        aws_secret_access_key: '',
        aws_region: '',
        aws_bucket_name: '',
        import_key: ''
    })

    const { data: tenant, isLoading } = useQuery({
        queryKey: ['tenant-settings'],
        queryFn: () => api.get('/settings/tenant').then(r => r.data)
    })

    // Fallback if onSuccess doesn't fire as expected (v4 vs v5 behavior)
    useEffect(() => {
        if (tenant) {
            setForm({
                name: tenant.name || '',
                aws_access_key_id: tenant.aws_access_key_id || '',
                aws_secret_access_key: tenant.aws_secret_access_key || '',
                aws_region: tenant.aws_region || '',
                aws_bucket_name: tenant.aws_bucket_name || '',
                import_key: tenant.import_key || ''
            })
        }
    }, [tenant])

    const updateMutation = useMutation({
        mutationFn: (data) => api.put('/settings/tenant', data),
        onSuccess: () => {
            qc.invalidateQueries(['tenant-settings'])
            toast.success('S3 ayarları güncellendi.')
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'Ayarlar güncellenirken hata oluştu.'
            toast.error(msg)
        }
    })

    const testMutation = useMutation({
        mutationFn: () => api.post('/settings/tenant/test', form),
        onSuccess: (res) => {
            toast.success(res.data.message || 'Bağlantı başarılı!')
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'Bağlantı testi başarısız.'
            toast.error(msg, { duration: 5000 })
        }
    })

    if (isLoading) return <div className="text-center py-8 text-gray-400">Yükleniyor...</div>

    return (
        <div className="max-w-2xl space-y-6">
            <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-5 flex gap-4">
                <Cloud className="text-indigo-500 flex-shrink-0" size={24} />
                <div className="text-sm text-gray-700 dark:text-gray-300">
                    <h4 className="font-bold mb-1">AWS S3 Yapılandırması</h4>
                    <p className="opacity-80 leading-relaxed">
                        Dosyalarınızın güvenli bir şekilde saklanması için AWS S3 bilgilerinizi buraya girin.
                        Bu bilgiler sadece sizin dosyalarınızın yüklenmesi ve listelenmesi için kullanılacaktır.
                    </p>
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form) }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organizasyon Adı</label>
                        <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AWS Access Key ID</label>
                        <input type="text" value={form.aws_access_key_id} onChange={e => setForm(p => ({ ...p, aws_access_key_id: e.target.value }))} placeholder="AKIA..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AWS Secret Access Key</label>
                        <input type="password" value={form.aws_secret_access_key} onChange={e => setForm(p => ({ ...p, aws_secret_access_key: e.target.value }))} placeholder="••••••••••••••••" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AWS Region</label>
                        <input type="text" value={form.aws_region} onChange={e => setForm(p => ({ ...p, aws_region: e.target.value }))} placeholder="eu-central-1" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">S3 Bucket Name</label>
                        <input type="text" value={form.aws_bucket_name} onChange={e => setForm(p => ({ ...p, aws_bucket_name: e.target.value }))} placeholder="my-crm-files" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Özel İmport Key (Opsiyonel)</label>
                        <p className="text-xs text-gray-500 mb-2">Eğer bu alanı doldurursanız, yalnızca dışa aktarılan yedekleriniz bu key'i barındırırsa sisteme geri yüklenebilecektir. Ekstra güvenlik sağlar.</p>
                        <input type="text" value={form.import_key} onChange={e => setForm(p => ({ ...p, import_key: e.target.value }))} placeholder="GizliGüvenlikAnahtarım123" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => testMutation.mutate()}
                        disabled={testMutation.isPending || updateMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {testMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        Bağlantıyı Test Et
                    </button>

                    <button
                        type="submit"
                        disabled={updateMutation.isPending || testMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-50"
                    >
                        {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Ayarları Kaydet
                    </button>
                </div>
            </form>
        </div>
    )
}

function BackupKeysTab() {
    const qc = useQueryClient()
    const [nameForm, setNameForm] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const { data: keys = [], isLoading } = useQuery({
        queryKey: ['backup-keys'],
        queryFn: () => api.get('/settings/backup-keys').then(r => r.data)
    })

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/settings/backup-keys', data),
        onSuccess: () => {
            qc.invalidateQueries(['backup-keys'])
            toast.success('Yeni key oluşturuldu.')
            setIsCreating(false)
            setNameForm('')
        },
        onError: () => toast.error('Key oluşturulamadı')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/backup-keys/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['backup-keys'])
            toast.success('Yedek key silindi.')
        },
        onError: () => toast.error('Silinemedi')
    })

    const clearAllMutation = useMutation({
        mutationFn: () => api.post('/settings/backup-keys/clear'),
        onSuccess: () => {
            qc.invalidateQueries(['backup-keys'])
            toast.success('Tüm keyler temizlendi.')
        },
        onError: () => toast.error('Temizleme işlemi başarısız.')
    })

    if (isLoading) return <div className="text-center py-8 text-gray-400">Yükleniyor...</div>

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                    Sistemden aldığınız her yedek (.json) dosyası otomatik olarak benzersiz bir Özel İmport Key ile imzalanır ve buraya kaydedilir.<br />
                    Sistemi sıfırlayıp bir yedeği geri yüklemek istediğinizde (eğer S3 ayarlarında sabit bir Özel İmport Key belirlemediyseniz), sistem <strong>sadece bu listedeki key'lerden birine sahip olan</strong> yedek dosyalarını kabul edecektir.
                </p>
                <div className="shrink-0 flex items-center gap-2">
                    {keys.length > 0 && (
                        <button
                            onClick={() => { if (window.confirm('TÜM keyleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve önceden alınmış yedeklerin sisteme yüklenmesini çöpe atar.')) clearAllMutation.mutate() }}
                            disabled={clearAllMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <Trash2 size={16} /> Tümünü Temizle
                        </button>
                    )}
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Plus size={16} /> Yeni Key Oluştur
                    </button>
                </div>
            </div>

            {isCreating && (
                <form
                    onSubmit={e => { e.preventDefault(); createMutation.mutate({ name: nameForm }) }}
                    className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3"
                >
                    <input
                        autoFocus
                        value={nameForm}
                        onChange={e => setNameForm(e.target.value)}
                        placeholder="Key Adı (Opsiyonel, örn: Manuel Yedekleme)"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                        <button type="submit" disabled={createMutation.isPending} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex justify-center">Oluştur</button>
                        <button type="button" onClick={() => setIsCreating(false)} className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-center">İptal</button>
                    </div>
                </form>
            )}


            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {keys.map((k) => (
                        <div key={k.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                            <div>
                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white capitalize">{k.name}</h4>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-xs font-mono px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700 select-all">
                                        {k.key}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => { if (window.confirm('Bu keyi silmek istediğinize emin misiniz? Bu key ile üretilmiş yedekler artık yüklenemez.')) deleteMutation.mutate(k.id) }}
                                disabled={deleteMutation.isPending}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Keyi Sil"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {keys.length === 0 && (
                        <div className="p-12 text-center">
                            <Lock size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Henüz alınmış bir yedek ve oluşturulmuş bir key bulunmuyor.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function AppointmentTitlesTab() {
    const qc = useQueryClient()
    const [name, setName] = useState('')
    const [editing, setEditing] = useState(null)

    const { data: titles = [], isLoading } = useQuery({
        queryKey: ['appointment-titles'],
        queryFn: () => api.get('/settings/appointment-titles').then(r => r.data)
    })

    const saveMutation = useMutation({
        mutationFn: (data) => editing ? api.put(`/settings/appointment-titles/${editing.id}`, data) : api.post('/settings/appointment-titles', data),
        onSuccess: () => {
            qc.invalidateQueries(['appointment-titles'])
            toast.success('Başlık kaydedildi.')
            setName('')
            setEditing(null)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/appointment-titles/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['appointment-titles'])
            toast.success('Başlık silindi.')
        }
    })

    if (isLoading) return <div className="text-center py-8 text-gray-400">Yükleniyor...</div>

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {editing ? 'Başlığı Düzenle' : 'Yeni Randevu Başlığı Ekle'}
                </h3>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Örn: Telefon Araması, Yüz Yüze Görüşme"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                        onClick={() => saveMutation.mutate({ name })}
                        disabled={saveMutation.isPending || !name}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {editing ? 'Güncelle' : 'Ekle'}
                    </button>
                    {editing && (
                        <button
                            onClick={() => { setEditing(null); setName('') }}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            İptal
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {titles.map(t => (
                    <div key={t.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between group">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => { setEditing(t); setName(t.name) }}
                                className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-md transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => { if (window.confirm('Emin misiniz?')) deleteMutation.mutate(t.id) }}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {titles.length === 0 && <p className="text-center text-gray-400 py-8">Henüz randevu başlığı eklenmemiş.</p>}
        </div>
    )
}
function ServiceTrackingCategoriesTab() {
    return <GenericCrudTab
        queryKey="service-tracking-categories" apiPath="/settings/service-tracking-categories" label="Hizmet Takip Kategorisi"
        emptyForm={{ name: '' }}
        renderForm={(form, setForm) => (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori Adı *</label>
                <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
            </div>
        )}
    />
}


function RolesTab() {
    const qc = useQueryClient()
    const [modal, setModal] = useState({ open: false, role: null })
    const [form, setForm] = useState({ name: '', permissions: [] })
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { data: roles = [], isLoading: rolesLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => api.get('/settings/roles').then(r => r.data)
    })

    const { data: allPermissions = [], isLoading: permsLoading } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => api.get('/settings/permissions').then(r => r.data)
    })

    const saveMutation = useMutation({
        mutationFn: (data) => modal.role
            ? api.put(`/settings/roles/${modal.role.id}`, data)
            : api.post('/settings/roles', data),
        onSuccess: () => {
            qc.invalidateQueries(['roles'])
            toast.success('Rol kaydedildi.')
            setModal({ open: false, role: null })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/roles/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['roles'])
            toast.success('Rol silindi.')
            setDeleteConfirm(null)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Silinemedi.')
    })

    const openModal = (role = null) => {
        setForm({
            name: role?.name || '',
            permissions: role?.permissions?.map(p => p.name) || []
        })
        setModal({ open: true, role })
    }

    const togglePermission = (permName) => {
        setForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permName)
                ? prev.permissions.filter(p => p !== permName)
                : [...prev, permissions] // Error in logic here, should be permName
            // corrected below:
        }))
    }

    // Correcting toggle logic helper
    const handleToggle = (permName) => {
        setForm(p => {
            const exists = p.permissions.includes(permName)
            if (exists) return { ...p, permissions: p.permissions.filter(n => n !== permName) }
            return { ...p, permissions: [...p.permissions, permName] }
        })
    }

    const groupedPermissions = Array.isArray(allPermissions) ? allPermissions.reduce((acc, p) => {
        const [group] = p.name.split('.')
        if (!acc[group]) acc[group] = []
        acc[group].push(p)
        return acc
    }, {}) : {}

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Rol Listesi</h2>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                    <Plus size={16} /> Rol Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rolesLoading ? (
                    <div className="col-span-full py-12 text-center text-gray-400">Yükleniyor...</div>
                ) : roles.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                        Henüz rol oluşturulmamış.
                    </div>
                ) : roles.map(r => (
                    <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col group hover:border-indigo-500/50 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Shield size={16} className="text-indigo-500" />
                                {r.name}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openModal(r)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg"><Edit2 size={14} /></button>
                                <button onClick={() => setDeleteConfirm(r)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {r.permissions.length === 0 ? (
                                <span className="text-[10px] text-gray-400 italic">Yetki verilmemiş</span>
                            ) : (
                                r.permissions.slice(0, 5).map(p => (
                                    <span key={p.id} className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded capitalize">
                                        {p.name.replace('.', ' ')}
                                    </span>
                                ))
                            )}
                            {r.permissions.length > 5 && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-gray-50 dark:bg-gray-800/50 text-gray-400 rounded">
                                    +{r.permissions.length - 5} daha
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false, role: null })} title={modal.role ? 'Rolü Düzenle' : 'Yeni Rol Ekle'} size="lg">
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-5">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Rol Adı</label>
                        <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white" placeholder="Örn: Muhasebe, Saha Personeli" />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-tighter">İşlem Yetkileri (Granüler)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin min-h-[100px]">
                            {permsLoading ? (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span className="text-xs">Yetkiler yükleniyor...</span>
                                </div>
                            ) : Object.keys(groupedPermissions).length === 0 ? (
                                <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                                    Yetki bulunamadı. Lütfen sistem yöneticisiyle iletişime geçin.
                                </div>
                            ) : (
                                Object.entries(groupedPermissions).map(([group, perms]) => (
                                    <div key={group} className="border border-gray-100 dark:border-gray-800 rounded-xl p-3 bg-gray-50/30 dark:bg-gray-950/20">
                                        <div className="text-[11px] font-bold text-gray-400 uppercase mb-2 border-b border-gray-100 dark:border-gray-800 pb-1">{group}</div>
                                        <div className="space-y-2">
                                            {perms.map(p => (
                                                <label key={p.id} className="flex items-center gap-3 cursor-pointer group/item">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.permissions.includes(p.name)}
                                                        onChange={() => handleToggle(p.name)}
                                                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                                                    />
                                                    <span className="text-xs text-gray-600 dark:text-gray-400 group-hover/item:text-gray-900 dark:group-hover/item:text-gray-200 capitalize">
                                                        {p.name.split('.')[1]?.replace('_', ' ') || p.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, role: null })} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Rolü Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Rolü Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400"><span className="font-semibold">{deleteConfirm?.name}</span> rolünü silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

function UsersTab() {
    const qc = useQueryClient()
    const { user: currentUser } = useAuthStore()
    const [modal, setModal] = useState({ open: false, user: null })
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER', roleId: '' })
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    
    const [highlightId, setHighlightId] = useState(null)

    // Automatically scrolling feature can be triggered by useEffect
    useEffect(() => {
        const h = new URLSearchParams(window.location.search).get('highlight')
        if (h) {
            setHighlightId(h)
            setTimeout(() => {
                const el = document.getElementById(`user-${h}`)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 500)
            
            // Remove highlight after 3 seconds to create a blink/flash effect
            setTimeout(() => {
                setHighlightId(null)
            }, 3500)
        }
    }, [window.location.search])

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/settings/users').then(r => r.data)
    })

    const { data: roles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: () => api.get('/settings/roles').then(r => r.data)
    })

    const saveMutation = useMutation({
        mutationFn: (data) => modal.user
            ? api.put(`/settings/users/${modal.user.id}`, data)
            : api.post('/settings/users', data),
        onSuccess: () => {
            qc.invalidateQueries(['users'])
            toast.success(modal.user ? 'Kullanıcı güncellendi.' : 'Kullanıcı eklendi.')
            setModal({ open: false, user: null })
            setForm({ name: '', email: '', password: '', role: 'USER', roleId: '' })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/users/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['users'])
            toast.success('Kullanıcı silindi.')
            setDeleteConfirm(null)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Silinemedi.')
    })

    const openModal = (user = null) => {
        setForm({
            name: user?.name || '',
            email: user?.email || '',
            password: '',
            role: user?.role || 'USER',
            roleId: user?.roles?.[0]?.id || ''
        })
        setModal({ open: true, user })
    }

    const safeUsers = Array.isArray(users) ? users : (users?.data && Array.isArray(users.data) ? users.data : [])
    const safeRoles = Array.isArray(roles) ? roles : (roles?.data && Array.isArray(roles.data) ? roles.data : [])

    const adminUsers = safeUsers.filter(u => u.role === 'ADMIN')
    const sortedRoles = [...safeRoles].sort((a, b) => (b.permissions?.length || 0) - (a.permissions?.length || 0))
    const nonAdminUsers = safeUsers.filter(u => u.role !== 'ADMIN')

    const roleGroups = sortedRoles.map(r => ({
        ...r,
        users: []
    }))
    const unassignedUsers = []

    nonAdminUsers.forEach(u => {
        if (u.roles && u.roles.length > 0) {
            // Find matching role in our groups (first matched role)
            const matchedGroup = roleGroups.find(rg => rg.id === u.roles[0].id)
            if (matchedGroup) {
                matchedGroup.users.push(u)
            } else {
                unassignedUsers.push(u)
            }
        } else {
            unassignedUsers.push(u)
        }
    })

    const renderUserCard = (u) => {
        const isHighlighted = highlightId && String(highlightId) === String(u.id);
        
        return (
        <div 
            key={u.id} 
            id={`user-${u.id}`}
            className={
                isHighlighted 
                ? "bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500 rounded-2xl p-4 flex items-center justify-between group shadow-lg ring-4 ring-indigo-500/20 transition-all"
                : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-500/50 transition-all shadow-sm"
            }
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 truncate">
                        {u.name}
                        {u.role === 'ADMIN' && <ShieldCheck size={14} className="text-indigo-500" title="Yönetici" />}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${u.role === 'ADMIN' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                            }`}>
                            {u.role === 'ADMIN' ? 'Yetkili' : 'Personel'}
                        </span>
                        {u.roles?.map(r => (
                            <span key={r.id} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded font-bold uppercase flex items-center gap-1">
                                <Shield size={10} /> {r.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex gap-1 items-center">
                {u.role !== 'ADMIN' && (
                    <button onClick={() => openModal(u)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Edit2 size={16} />
                    </button>
                )}
                {u.id !== currentUser?.id && u.role !== 'ADMIN' && (
                    <button onClick={() => setDeleteConfirm(u)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    )}

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Kullanıcı Listesi (Hiyerarşik)</h2>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                    <Plus size={16} /> Kullanıcı Ekle
                </button>
            </div>

            {isLoading ? (
                <div className="py-12 text-center text-gray-400">Yükleniyor...</div>
            ) : safeUsers.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                    Henüz personel eklenmemiş.
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Admins */}
                    {adminUsers.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-800 pb-2 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-amber-500" />
                                Firma Yetkilileri (Tam Yetkili)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {adminUsers.map(u => renderUserCard(u))}
                            </div>
                        </div>
                    )}

                    {/* Grouped by Role */}
                    {roleGroups.map(role => {
                        if (role.users.length === 0) return null
                        return (
                            <div key={role.id}>
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-800 pb-2 flex items-center gap-2">
                                    <Shield size={16} className="text-indigo-500" />
                                    {role.name}
                                    <span className="text-[10px] font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{role.permissions?.length || 0} Yetki</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {role.users.map(u => renderUserCard(u))}
                                </div>
                            </div>
                        )
                    })}

                    {/* Unassigned Users */}
                    {unassignedUsers.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-800 pb-2 flex items-center gap-2">
                                <User size={16} className="text-gray-400" />
                                Özel Rolü Olmayanlar (Temel Personeller)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {unassignedUsers.map(u => renderUserCard(u))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* User Modal */}
            <Modal open={modal.open} onClose={() => setModal({ open: false, user: null })} title={modal.user ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Ad Soyad</label>
                        <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white" placeholder="Ahmet Yılmaz" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">E-posta</label>
                        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white" placeholder="ahmet@firma.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">{modal.user ? 'Yeni Şifre (Boş bırakılabilir)' : 'Şifre'}</label>
                        <input type="password" required={!modal.user} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white" placeholder="••••••••" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Temel Yetki</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white">
                                <option value="ADMIN">Firma Yetkilisi</option>
                                <option value="USER">Personel</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Özel Rol</label>
                            <select value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white">
                                <option value="">Rol Seçilmedi</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ open: false, user: null })} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kullanıcıyı Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Kullanıcıyı Sil">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-white">{deleteConfirm?.name}</span> isimli kullanıcıyı silmek istediğinize emin misiniz?
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">
                            {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
