import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
    Plus, Trash2, Edit2, Play, CheckCircle, Activity, Mail, Loader2, 
    AlertCircle, RefreshCw, UserPlus, Briefcase, FileText, Settings, 
    ChevronRight, ChevronDown, Database, Bell, Zap, Clock, Code, Globe, MessageSquare, 
    Hash, History, List
} from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal.jsx'

export default function WorkflowsTab() {
    const qc = useQueryClient()
    const [view, setView] = useState('list') // list, editor, logs
    const [modal, setModal] = useState({ open: false, workflow: null })
    const [logModal, setLogModal] = useState({ open: false, logs: [] })
    const [expandedSections, setExpandedSections] = useState({ step1: true, step2: false, step3: false })
    const [form, setForm] = useState({
        name: '',
        trigger_model: 'App\\Models\\Proposal',
        trigger_event: 'updated',
        is_active: true,
        conditions: [],
        actions: [{ type: 'send_email', parameters: {} }]
    })
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    // Data Fetching
    const { data: workflows = [], isLoading } = useQuery({
        queryKey: ['workflows'],
        queryFn: () => api.get('/settings/workflows').then(r => r.data)
    })

    const { data: jobStatuses = [] } = useQuery({
        queryKey: ['job-statuses'],
        queryFn: () => api.get('/settings/statuses').then(r => r.data)
    })

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/settings/users').then(r => r.data)
    })

    const { data: workflowLogs = [] } = useQuery({
        queryKey: ['workflow-logs'],
        queryFn: () => api.get('/settings/workflow-logs').then(r => r.data),
        enabled: view === 'logs'
    })

    // Mutations
    const saveMutation = useMutation({
        mutationFn: (data) => modal.workflow 
            ? api.put(`/settings/workflows/${modal.workflow.id}`, data) 
            : api.post('/settings/workflows', data),
        onSuccess: () => {
            qc.invalidateQueries(['workflows'])
            toast.success('Otomasyon başarıyla kaydedildi.')
            setModal({ open: false, workflow: null })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/workflows/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['workflows'])
            toast.success('Otomasyon silindi.')
            setDeleteConfirm(null)
        }
    })

    const toggleMutation = useMutation({
        mutationFn: (id) => api.patch(`/settings/workflows/${id}/toggle`),
        onSuccess: () => qc.invalidateQueries(['workflows']),
    })

    // Helpers
    const addCondition = () => setForm(p => ({ ...p, conditions: [...p.conditions, { field: '', operator: '=', value: '' }] }))
    const updateCondition = (idx, key, val) => setForm(p => ({ ...p, conditions: p.conditions.map((c, i) => i === idx ? { ...c, [key]: val } : c) }))
    const removeCondition = (idx) => setForm(p => ({ ...p, conditions: p.conditions.filter((_, i) => i !== idx) }))

    const addAction = () => setForm(p => ({ ...p, actions: [...p.actions, { type: 'send_email', parameters: {} }] }))
    const updateAction = (idx, key, val) => setForm(p => ({ 
        ...p, 
        actions: p.actions.map((a, i) => i === idx ? { ...a, [key]: val, parameters: {} } : a) 
    }))
    const updateActionParam = (actionIdx, paramKey, val) => setForm(p => ({
        ...p,
        actions: p.actions.map((a, i) => i === actionIdx ? { 
            ...a, 
            parameters: { ...a.parameters, [paramKey]: val } 
        } : a)
    }))
    const removeAction = (idx) => setForm(p => ({ ...p, actions: p.actions.filter((_, i) => i !== idx) }))

    // Full List of Models & Triggers based on request
    const models = [
        { id: 'App\\Models\\Customer', label: 'Müşteri Yönetimi', icon: UserPlus },
        { id: 'App\\Models\\JobCrm', label: 'İş / Proje Yönetimi', icon: Briefcase },
        { id: 'App\\Models\\Proposal', label: 'Teklif Yönetimi', icon: FileText },
        { id: 'App\\Models\\Payment', label: 'Finans / Ödemeler', icon: Database },
        { id: 'App\\Models\\Appointment', label: 'Randevu Sistemi', icon: Clock },
        { id: 'App\\Models\\Expense', label: 'Giderler / Harcamalar', icon: Hash },
        { id: 'App\\Models\\JobFile', label: 'Dosya Yönetimi', icon: Globe },
        { id: 'App\\Models\\User', label: 'Kullanıcı İşlemleri', icon: UserPlus },
    ]

    const events = useMemo(() => {
        const common = [
            { id: 'created', label: 'Yeni Kayıt Oluşturulduğunda' },
            { id: 'updated', label: 'Herhangi Bir Güncellemede' },
            { id: 'deleted', label: 'Kayıt Silindiğinde' }
        ];

        const specific = {
            'App\\Models\\Proposal': [
                { id: 'status_accepted', label: 'Teklif Kabul Edildiğinde' },
                { id: 'status_rejected', label: 'Teklif Reddedildiğinde' },
                { id: 'status_sent', label: 'Teklif Gönderildiğinde' }
            ],
            'App\\Models\\JobCrm': [
                { id: 'status_completed', label: 'İş Tamamlandığında' },
                { id: 'status_cancelled', label: 'İş İptal Edildiğinde' },
                { id: 'status_pending', label: 'İş Beklemeye Alındığında' }
            ],
            'App\\Models\\Payment': [
                { id: 'status_paid', label: 'Ödeme Tahsil Edildiğinde' }
            ]
        }

        return [...common, ...(specific[form.trigger_model] || [])]
    }, [form.trigger_model])

    const operators = [
        { id: '=', label: 'Eşittir' },
        { id: '!=', label: 'Eşit Değildir' },
        { id: '>', label: 'Büyüktür' },
        { id: '<', label: 'Küçüktür' },
        { id: 'contains', label: 'İçeriyorsa' },
        { id: 'not_contains', label: 'İçermiyorsa' },
        { id: 'empty', label: 'Boş ise' },
        { id: 'not_empty', label: 'Dolu ise' }
    ]

    const actionTypes = [
        { id: 'send_email', label: 'E-posta Gönder', icon: Mail, desc: 'Müşteriye veya personele mail iletir.' },
        { id: 'change_status', label: 'Durumu Güncelle', icon: RefreshCw, desc: 'Kaydın aşamasını otomatik değiştirir.' },
        { id: 'assign_to_user', label: 'Kullanıcı Ata', icon: UserPlus, desc: 'Sorumlu kişiyi belirler.' },
        { id: 'create_job', label: 'İş/Proje Oluştur', icon: Briefcase, desc: 'Teklifi işe dönüştürür.' },
        { id: 'create_task', label: 'Görev Oluştur', icon: CheckCircle, desc: 'İlgili işe yeni bir görev ekler.' },
        { id: 'create_appointment', label: 'Randevu Oluştur', icon: Clock, desc: 'İleri tarihli görüşme ayarlar.' },
        { id: 'add_note', label: 'Not Ekle', icon: MessageSquare, desc: 'Kayıt günlüğüne açıklama ekler.' },
        { id: 'send_webhook', label: 'Webhook Gönder', icon: Globe, desc: 'Harici bir URL tetikler.' },
        { id: 'log_activity', label: 'Log Kaydı Yaz', icon: History, desc: 'Sistem günlüğüne detay yazar.' },
    ]

    const fieldOptions = useMemo(() => {
        const common = [{ id: 'total_price', label: 'Tutar', type: 'number' }]
        const userOptions = Array.isArray(users) ? users.map(u => ({ id: u.id, label: u.name })) : []
        
        const options = {
            'App\\Models\\Proposal': [
                { id: 'status', label: 'Teklif Durumu', type: 'select', values: [
                    { id: 'taslak', label: 'Taslak' },
                    { id: 'SENT', label: 'Gönderildi' },
                    { id: 'ACCEPTED', label: 'Kabul Edildi' },
                    { id: 'REJECTED', label: 'Reddedildi' }
                ]},
                { id: 'user_id', label: 'Sorumlu', type: 'select', values: userOptions },
                ...common
            ],
            'App\\Models\\Customer': [
                { id: 'type', label: 'Müşteri Tipi', type: 'select', values: [
                    { id: '1', label: 'Bireysel' },
                    { id: '2', label: 'Kurumsal' }
                ]},
                { id: 'source', label: 'Kaynak', type: 'text' },
                { id: 'city', label: 'Şehir', type: 'text' }
            ],
            'App\\Models\\JobCrm': [
                { id: 'job_status_id', label: 'İş Durumu', type: 'select', values: jobStatuses.map(s => ({ id: String(s.id), label: s.name })) },
                { id: 'status', label: 'Aşama Metni', type: 'text' },
                { id: 'user_id', label: 'Sorumlu', type: 'select', values: userOptions },
                ...common
            ],
            'App\\Models\\Payment': [
                { id: 'amount', label: 'Ödeme Tutarı', type: 'number' },
                { id: 'is_paid', label: 'Ödendi mi?', type: 'select', values: [{id: '1', label: 'Evet'}, {id: '0', label: 'Hayır'}] }
            ]
        }
        return options[form.trigger_model] || common
    }, [form.trigger_model, jobStatuses, users])

    const openModal = (workflow = null) => {
        if (workflow) {
            setForm({
                name: workflow.name,
                trigger_model: workflow.trigger_model,
                trigger_event: workflow.trigger_event,
                is_active: !!workflow.is_active,
                conditions: workflow.conditions || [],
                actions: workflow.actions || [{ type: 'send_email', parameters: {} }]
            })
        } else {
            setForm({
                name: '',
                trigger_model: 'App\\Models\\Proposal',
                trigger_event: 'updated',
                is_active: true,
                conditions: [],
                actions: [{ type: 'send_email', parameters: {} }]
            })
        }
        setModal({ open: true, workflow })
    }

    return (
        <div className="space-y-6">
            {/* Header Navigation */}
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-[#111111] p-4 rounded-xl border border-[#E5E9F0] dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-1 p-1 bg-[#F4F5F7] dark:bg-white/5 rounded-xl border border-[#E5E9F0] dark:border-white/10">
                    <button 
                        onClick={() => setView('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'list' ? 'bg-white dark:bg-white/10 text-[#905EFC] shadow-sm' : 'text-[#9097A6] hover:text-[#1A1A2E]'}`}
                    >
                        <List size={14} /> Otomasyonlarım
                    </button>
                    <button 
                        onClick={() => setView('logs')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'logs' ? 'bg-white dark:bg-white/10 text-[#905EFC] shadow-sm' : 'text-[#9097A6] hover:text-[#1A1A2E]'}`}
                    >
                        <History size={14} /> Çalışma Kayıtları (Logs)
                    </button>
                </div>
                {view === 'list' && (
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-xs font-black shadow-lg shadow-[#905EFC]/20 active:scale-95 transition-all"
                    >
                        <Zap size={16} /> Yeni Senaryo Oluştur
                    </button>
                )}
            </div>

            {view === 'list' && (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {isLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#905EFC]" size={40} /></div>
                    ) : (
                        workflows.map(w => (
                            <div key={w.id} className="bg-white dark:bg-white/5 border-2 border-transparent hover:border-[#905EFC]/20 rounded-xl p-5 flex items-center justify-between transition-all hover:shadow-xl group">
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${w.is_active ? 'bg-[#905EFC]/10 text-[#905EFC] dark:bg-[#905EFC]/10' : 'bg-[#E5E9F0] text-[#9097A6]'}`}>
                                        <Zap size={20} className={w.is_active ? 'fill-current' : ''} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#1A1A2E] dark:text-white group-hover:text-[#905EFC] transition-colors">{w.name}</h3>
                                        <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                                            <span className="text-[10px] font-black text-[#9097A6] uppercase tracking-widest bg-[#F4F5F7] dark:bg-[#111111] px-2 py-0.5 rounded-md border border-[#E5E9F0] dark:border-white/5">
                                                {models.find(m => m.id === w.trigger_model)?.label?.split(' ')[0]}
                                            </span>
                                            <ChevronRight size={10} className="text-[#9097A6]" />
                                            <span className="text-[10px] font-bold text-[#9097A6] truncate max-w-[150px]">
                                                {events.find(e => e.id === w.trigger_event)?.label || w.trigger_event}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black tracking-tighter bg-[#905EFC]/10 dark:bg-[#905EFC]/10 text-[#905EFC]">
                                                {w.actions?.length || 0} AKSİYON
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleMutation.mutate(w.id)} className={`p-2 rounded-xl transition-all ${w.is_active ? 'text-green-600 hover:bg-green-50' : 'text-[#9097A6] hover:bg-[#F4F5F7]'}`} title={w.is_active ? 'Pasif Yap' : 'Aktif Yap'}>
                                        <CheckCircle size={20} />
                                    </button>
                                    <button onClick={() => openModal(w)} className="p-2 rounded-xl text-[#9097A6] hover:text-[#905EFC] hover:bg-[#905EFC]/10 transition-all"><Edit2 size={20} /></button>
                                    <button onClick={() => setDeleteConfirm(w)} className="p-2 rounded-xl text-[#9097A6] hover:text-red-500 transition-all"><Trash2 size={20} /></button>
                                </div>
                            </div>
                        ))
                    )}
                    {workflows.length === 0 && !isLoading && (
                        <div className="py-20 text-center bg-white dark:bg-[#111111] rounded-xl border border-dashed border-[#E5E9F0]">
                            <Zap size={40} className="mx-auto text-[#E5E9F0] mb-4" />
                            <p className="text-[#9097A6] font-bold">Henüz bir otomasyon senaryonuz yok.</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'logs' && (
                <div className="animate-in fade-in duration-500 lg:p-4">
                    <div className="bg-white dark:bg-[#111111] rounded-xl border border-[#E5E9F0] dark:border-white/5 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F4F5F7] dark:bg-white/5 border-b border-[#E5E9F0] dark:border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[#9097A6] tracking-wider">Tarih</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[#9097A6] tracking-wider">Otomasyon</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[#9097A6] tracking-wider">Tetikleyici / Kayıt ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[#9097A6] tracking-wider">Durum</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[#9097A6] tracking-wider">Detay</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F4F5F7] dark:divide-white/5">
                                {workflowLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-25/50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-[#9097A6]">{new Date(log.created_at).toLocaleString('tr-TR')}</td>
                                        <td className="px-6 py-4 text-xs font-black text-[#1A1A2E] dark:text-white uppercase truncate max-w-[200px]">{log.workflow_name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-[#905EFC] dark:text-[#905EFC]">{log.trigger_model}</span>
                                                <span className="text-[9px] text-[#9097A6] font-mono">ID: {log.model_id} • {log.trigger_event}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {log.status === 'success' ? 'BAŞARILI' : 'HATA'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => setLogModal({ open: true, logs: log.actions_taken || [] })}
                                                className="text-[10px] font-bold text-[#905EFC] hover:underline"
                                            >
                                                {log.actions_taken?.length || 0} Aksiyon Analizi
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {workflowLogs.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-[#9097A6] font-bold italic">Henüz çalışma kaydı bulunmuyor.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Workflow Editor Modal */}
            <Modal open={modal.open} onClose={() => setModal({ open: false, workflow: null })} title={modal.workflow ? 'Senaryoyu Düzenle' : 'Yeni Senaryo'} size="lg">
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-1">
                    {/* Name Input */}
                    <div className="space-y-2 pb-4 border-b border-[#E5E9F0] dark:border-white/5">
                        <label className="text-[10px] font-black text-[#9097A6] uppercase tracking-widest ml-1">Senaryo Adı</label>
                        <div className="flex gap-3">
                            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="flex-1 px-4 py-2.5 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#905EFC]/20 transition-all text-[#1A1A2E] dark:text-white" placeholder="Örn: Teklif Kabul İş Başlat" />
                            <div className="bg-[#F4F5F7] dark:bg-white/5 px-4 py-2.5 rounded-lg border border-[#E5E9F0] dark:border-white/10 flex items-center gap-2">
                                <span className="text-[10px] font-black text-[#9097A6] tracking-widest">DURUM</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="sr-only peer" />
                                    <div className="w-10 h-5 bg-[#E5E9F0] dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E5E9F0] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#905EFC]"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Trigger */}
                    <div className="border border-[#E5E9F0] dark:border-white/5 rounded-lg overflow-hidden">
                        <button type="button" onClick={() => setExpandedSections(p => ({ ...p, step1: !p.step1 }))} className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-500/5 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">1</div>
                                <span className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest">Olay Tetikleyici</span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 rounded-full">
                                    {models.find(m => m.id === form.trigger_model)?.label?.split(' ')[0]} • {events.find(e => e.id === form.trigger_event)?.label || form.trigger_event}
                                </span>
                            </div>
                            <ChevronDown size={16} className={`text-[#9097A6] transition-transform ${expandedSections.step1 ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedSections.step1 && (
                            <div className="px-4 py-4 border-t border-[#E5E9F0] dark:border-white/5 bg-white dark:bg-white/5 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#9097A6] uppercase tracking-widest ml-1">Kategori</label>
                                        <select value={form.trigger_model} onChange={e => setForm(p => ({ ...p, trigger_model: e.target.value, trigger_event: 'created', conditions: [] }))} className="w-full px-3 py-2 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-[#1A1A2E] dark:text-white">
                                            {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#9097A6] uppercase tracking-widest ml-1">Olay</label>
                                        <select value={form.trigger_event} onChange={e => setForm(p => ({ ...p, trigger_event: e.target.value }))} className="w-full px-3 py-2 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-[#1A1A2E] dark:text-white">
                                            {events.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Conditions */}
                    <div className="border border-[#E5E9F0] dark:border-white/5 rounded-lg overflow-hidden">
                        <button type="button" onClick={() => setExpandedSections(p => ({ ...p, step2: !p.step2 }))} className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-500/5 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">2</div>
                                <span className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest">Çalışma Koşulları</span>
                                {form.conditions.length > 0 && (
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 rounded-full">
                                        {form.conditions.length} Koşul
                                    </span>
                                )}
                            </div>
                            <ChevronDown size={16} className={`text-[#9097A6] transition-transform ${expandedSections.step2 ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedSections.step2 && (
                            <div className="px-4 py-4 border-t border-[#E5E9F0] dark:border-white/5 bg-white dark:bg-white/5 space-y-3">
                                {form.conditions.map((c, idx) => {
                                    const selectedField = fieldOptions.find(f => f.id === c.field);
                                    return (
                                        <div key={idx} className="flex gap-2 items-end">
                                            <select value={c.field} onChange={e => updateCondition(idx, 'field', e.target.value)} className="flex-1 px-2.5 py-1.5 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 text-[#1A1A2E] dark:text-white">
                                                <option value="">Alan</option>
                                                {fieldOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                            </select>
                                            <select value={c.operator} onChange={e => updateCondition(idx, 'operator', e.target.value)} className="w-20 px-2.5 py-1.5 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 text-[#905EFC]">
                                                {operators.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                            </select>
                                            {selectedField?.type === 'select' ? (
                                                <select value={c.value} onChange={e => updateCondition(idx, 'value', e.target.value)} className="flex-1 px-2.5 py-1.5 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 text-[#1A1A2E] dark:text-white">
                                                    <option value="">Seçin</option>
                                                    {selectedField.values.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                                                </select>
                                            ) : (
                                                <input type={selectedField?.type || 'text'} value={c.value} onChange={e => updateCondition(idx, 'value', e.target.value)} placeholder="Değer" className="flex-1 px-2.5 py-1.5 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 text-[#1A1A2E] dark:text-white" />
                                            )}
                                            <button type="button" onClick={() => removeCondition(idx)} className="p-1.5 text-[#9097A6] hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    )
                                })}
                                <button type="button" onClick={addCondition} className="w-full text-[10px] font-black text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-2 rounded-lg border border-dashed border-blue-300 dark:border-blue-500/30 transition-all">+ Koşul Ekle</button>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Actions */}
                    <div className="border border-[#E5E9F0] dark:border-white/5 rounded-lg overflow-hidden">
                        <button type="button" onClick={() => setExpandedSections(p => ({ ...p, step3: !p.step3 }))} className="w-full flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-500/5 hover:bg-green-100 dark:hover:bg-green-500/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-green-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">3</div>
                                <span className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest">Yapılacak İşlemler</span>
                                {form.actions.length > 0 && (
                                    <span className="text-[10px] text-green-600 dark:text-green-400 font-bold px-2 py-0.5 bg-green-100 dark:bg-green-500/20 rounded-full">
                                        {form.actions.length} Aksiyon
                                    </span>
                                )}
                            </div>
                            <ChevronDown size={16} className={`text-[#9097A6] transition-transform ${expandedSections.step3 ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedSections.step3 && (
                            <div className="px-4 py-4 border-t border-[#E5E9F0] dark:border-white/5 bg-white dark:bg-white/5 space-y-3">
                                {form.actions.map((action, actionIdx) => {
                                    const type = actionTypes.find(at => at.id === action.type);
                                    return (
                                        <div key={actionIdx} className="bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/5 rounded-lg p-4 relative group">
                                            <button type="button" onClick={() => removeAction(actionIdx)} className="absolute top-3 right-3 p-1 text-[#9097A6] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-6 h-6 bg-[#905EFC] text-white rounded-lg flex items-center justify-center shrink-0">
                                                    {type && <type.icon size={14} />}
                                                </div>
                                                <select 
                                                    value={action.type} 
                                                    onChange={e => updateAction(actionIdx, 'type', e.target.value)}
                                                    className="flex-1 bg-transparent border-none text-xs font-bold text-[#1A1A2E] dark:text-white focus:ring-0 p-0 outline-none"
                                                >
                                                    {actionTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                                </select>
                                            </div>

                                            {/* Action Fields - Compact Version */}
                                            {action.type === 'send_email' && (
                                                <div className="space-y-2 text-xs">
                                                    <input type="email" value={action.parameters.to || ''} onChange={e => updateActionParam(actionIdx, 'to', e.target.value)} placeholder="E-posta" className="w-full px-2.5 py-1.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded text-[10px] font-bold" />
                                                    <input type="text" value={action.parameters.subject || ''} onChange={e => updateActionParam(actionIdx, 'subject', e.target.value)} placeholder="Konu" className="w-full px-2.5 py-1.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded text-[10px] font-bold" />
                                                    <textarea rows={2} value={action.parameters.body || ''} onChange={e => updateActionParam(actionIdx, 'body', e.target.value)} placeholder="İçerik..." className="w-full px-2.5 py-1.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded text-[10px] font-bold resize-none" />
                                                </div>
                                            )}

                                            {action.type === 'change_status' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <select value={action.parameters.field || 'status'} onChange={e => updateActionParam(actionIdx, 'field', e.target.value)} className="px-2.5 py-1.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded text-[10px] font-bold">
                                                        {fieldOptions.filter(f => f.type === 'select').map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                                    </select>
                                                    <select value={action.parameters.value || ''} onChange={e => updateActionParam(actionIdx, 'value', e.target.value)} className="px-2.5 py-1.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded text-[10px] font-bold">
                                                        <option value="">Seçin</option>
                                                        {fieldOptions.find(f => f.id === (action.parameters.field || 'status'))?.values?.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                                                    </select>
                                                </div>
                                            )}

                                            {action.type === 'create_task' && (
                                                <input type="text" value={action.parameters.title || ''} onChange={e => updateActionParam(actionIdx, 'title', e.target.value)} placeholder="Görev adı" className="w-full px-2.5 py-1.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded text-[10px] font-bold" />
                                            )}

                                            {action.type === 'create_appointment' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="text" value={action.parameters.title || ''} onChange={e => updateActionParam(actionIdx, 'title', e.target.value)} placeholder="Başlık" className="px-2.5 py-1.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded text-[10px] font-bold" />
                                                    <input type="number" value={action.parameters.offset_days || 0} onChange={e => updateActionParam(actionIdx, 'offset_days', e.target.value)} placeholder="Gün" className="px-2.5 py-1.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded text-[10px] font-bold" />
                                                </div>
                                            )}

                                            {action.type === 'send_webhook' && (
                                                <input type="url" value={action.parameters.url || ''} onChange={e => updateActionParam(actionIdx, 'url', e.target.value)} placeholder="https://api.example.com" className="w-full px-2.5 py-1.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded text-[10px] font-bold" />
                                            )}

                                            {action.type === 'add_note' && (
                                                <input type="text" value={action.parameters.content || ''} onChange={e => updateActionParam(actionIdx, 'content', e.target.value)} placeholder="Not içeriği" className="w-full px-2.5 py-1.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded text-[10px] font-bold" />
                                            )}

                                            {action.type === 'assign_to_user' && (
                                                <select value={action.parameters.user_id || ''} onChange={e => updateActionParam(actionIdx, 'user_id', e.target.value)} className="w-full px-2.5 py-1.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded text-[10px] font-bold">
                                                    <option value="">Personel Seçin</option>
                                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                </select>
                                            )}

                                            {action.type === 'log_activity' && (
                                                <input type="text" value={action.parameters.description || ''} onChange={e => updateActionParam(actionIdx, 'description', e.target.value)} placeholder="Log açıklaması" className="w-full px-2.5 py-1.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded text-[10px] font-bold" />
                                            )}
                                        </div>
                                    )
                                })}
                                <button type="button" onClick={addAction} className="w-full text-[10px] font-black text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 px-3 py-2 rounded-lg border border-dashed border-green-300 dark:border-green-500/30 transition-all">+ Aksiyon Ekle</button>
                            </div>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-[#E5E9F0] dark:border-white/5 mt-4">
                        <button type="button" onClick={() => setModal({ open: false, workflow: null })} className="flex-1 px-4 py-2.5 border-2 border-[#E5E9F0] dark:border-white/10 rounded-lg text-[10px] font-black text-[#9097A6] hover:text-[#1A1A2E] dark:hover:text-white hover:bg-[#F4F5F7] dark:hover:bg-white/5 transition-all uppercase tracking-widest">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-[1.5] px-4 py-2.5 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-lg text-[10px] font-black shadow-lg shadow-[#905EFC]/20 transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-[#905EFC] uppercase tracking-widest flex items-center justify-center gap-2">
                            {saveMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />} 
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Log Details Modal */}
            <Modal open={logModal.open} onClose={() => setLogModal({ open: false, logs: [] })} title="Otomasyon Analizi" size="lg">
                <div className="space-y-4">
                    {logModal.logs.map((step, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${step.status === 'success' ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${step.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {step.status === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                </div>
                                <span className="text-xs font-black uppercase tracking-wider text-[#1A1A2E]">{step.type}</span>
                                <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full ${step.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {step.status === 'success' ? 'TAMAMLANDI' : 'HATA'}
                                </span>
                            </div>
                            <p className="text-xs text-[#9097A6] font-medium leading-relaxed">
                                {step.status === 'success' ? (step.result || 'İşlem başarıyla icra edildi.') : (step.error || 'Bilinmeyen bir hata oluştu.')}
                            </p>
                        </div>
                    ))}
                    {logModal.logs.length === 0 && <p className="text-center py-10 text-[#9097A6] italic">Analiz edilecek aksiyon verisi bulunmuyor.</p>}
                </div>
            </Modal>

            {/* Standard Delete Confirm */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Otomasyonu Sil">
                <div className="space-y-6">
                    <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-xl flex gap-4 text-red-600 border border-red-100 dark:border-red-500/20 shadow-sm">
                        <AlertCircle className="shrink-0" size={24} />
                        <p className="text-xs font-bold leading-relaxed">"{deleteConfirm?.name}" isimli otomasyonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-xs font-black text-[#9097A6] hover:bg-[#F4F5F7] transition-all uppercase tracking-widest">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-lg shadow-red-500/20 transition-all uppercase tracking-widest">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
