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
import SettingsPageHeader from './Shared/SettingsPageHeader.jsx'

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
            toast.success('Otomasyon baÅŸarÄ±yla kaydedildi.')
            setModal({ open: false, workflow: null })
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluÅŸtu.')
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
        { id: 'App\\Models\\Customer', label: 'MÃ¼ÅŸteri YÃ¶netimi', icon: UserPlus },
        { id: 'App\\Models\\JobCrm', label: 'Ä°ÅŸ / Proje YÃ¶netimi', icon: Briefcase },
        { id: 'App\\Models\\Proposal', label: 'Teklif YÃ¶netimi', icon: FileText },
        { id: 'App\\Models\\Payment', label: 'Finans / Ã–demeler', icon: Database },
        { id: 'App\\Models\\Appointment', label: 'Randevu Sistemi', icon: Clock },
        { id: 'App\\Models\\Expense', label: 'Giderler / Harcamalar', icon: Hash },
        { id: 'App\\Models\\JobFile', label: 'Dosya YÃ¶netimi', icon: Globe },
        { id: 'App\\Models\\User', label: 'KullanÄ±cÄ± Ä°ÅŸlemleri', icon: UserPlus },
    ]

    const events = useMemo(() => {
        const common = [
            { id: 'created', label: 'Yeni KayÄ±t OluÅŸturulduÄŸunda' },
            { id: 'updated', label: 'Herhangi Bir GÃ¼ncellemede' },
            { id: 'deleted', label: 'KayÄ±t SilindiÄŸinde' }
        ];

        const specific = {
            'App\\Models\\Proposal': [
                { id: 'status_accepted', label: 'Teklif Kabul EdildiÄŸinde' },
                { id: 'status_rejected', label: 'Teklif ReddedildiÄŸinde' },
                { id: 'status_sent', label: 'Teklif GÃ¶nderildiÄŸinde' }
            ],
            'App\\Models\\JobCrm': [
                { id: 'status_completed', label: 'Ä°ÅŸ TamamlandÄ±ÄŸÄ±nda' },
                { id: 'status_cancelled', label: 'Ä°ÅŸ Ä°ptal EdildiÄŸinde' },
                { id: 'status_pending', label: 'Ä°ÅŸ Beklemeye AlÄ±ndÄ±ÄŸÄ±nda' }
            ],
            'App\\Models\\Payment': [
                { id: 'status_paid', label: 'Ã–deme Tahsil EdildiÄŸinde' }
            ]
        }

        return [...common, ...(specific[form.trigger_model] || [])]
    }, [form.trigger_model])

    const operators = [
        { id: '=', label: 'EÅŸittir' },
        { id: '!=', label: 'EÅŸit DeÄŸildir' },
        { id: '>', label: 'BÃ¼yÃ¼ktÃ¼r' },
        { id: '<', label: 'KÃ¼Ã§Ã¼ktÃ¼r' },
        { id: 'contains', label: 'Ä°Ã§eriyorsa' },
        { id: 'not_contains', label: 'Ä°Ã§ermiyorsa' },
        { id: 'empty', label: 'BoÅŸ ise' },
        { id: 'not_empty', label: 'Dolu ise' }
    ]

    const actionTypes = [
        { id: 'send_email', label: 'E-posta GÃ¶nder', icon: Mail, desc: 'MÃ¼ÅŸteriye veya personele mail iletir.' },
        { id: 'change_status', label: 'Durumu GÃ¼ncelle', icon: RefreshCw, desc: 'KaydÄ±n aÅŸamasÄ±nÄ± otomatik deÄŸiÅŸtirir.' },
        { id: 'assign_to_user', label: 'KullanÄ±cÄ± Ata', icon: UserPlus, desc: 'Sorumlu kiÅŸiyi belirler.' },
        { id: 'create_job', label: 'Ä°ÅŸ/Proje OluÅŸtur', icon: Briefcase, desc: 'Teklifi iÅŸe dÃ¶nÃ¼ÅŸtÃ¼rÃ¼r.' },
        { id: 'create_task', label: 'GÃ¶rev OluÅŸtur', icon: CheckCircle, desc: 'Ä°lgili iÅŸe yeni bir gÃ¶rev ekler.' },
        { id: 'create_appointment', label: 'Randevu OluÅŸtur', icon: Clock, desc: 'Ä°leri tarihli gÃ¶rÃ¼ÅŸme ayarlar.' },
        { id: 'add_note', label: 'Not Ekle', icon: MessageSquare, desc: 'KayÄ±t gÃ¼nlÃ¼ÄŸÃ¼ne aÃ§Ä±klama ekler.' },
        { id: 'send_webhook', label: 'Webhook GÃ¶nder', icon: Globe, desc: 'Harici bir URL tetikler.' },
        { id: 'log_activity', label: 'Log KaydÄ± Yaz', icon: History, desc: 'Sistem gÃ¼nlÃ¼ÄŸÃ¼ne detay yazar.' },
    ]

    const fieldOptions = useMemo(() => {
        const common = [{ id: 'total_price', label: 'Tutar', type: 'number' }]
        const userOptions = Array.isArray(users) ? users.map(u => ({ id: u.id, label: u.name })) : []
        
        const options = {
            'App\\Models\\Proposal': [
                { id: 'status', label: 'Teklif Durumu', type: 'select', values: [
                    { id: 'taslak', label: 'Taslak' },
                    { id: 'SENT', label: 'GÃ¶nderildi' },
                    { id: 'ACCEPTED', label: 'Kabul Edildi' },
                    { id: 'REJECTED', label: 'Reddedildi' }
                ]},
                { id: 'user_id', label: 'Sorumlu', type: 'select', values: userOptions },
                ...common
            ],
            'App\\Models\\Customer': [
                { id: 'type', label: 'MÃ¼ÅŸteri Tipi', type: 'select', values: [
                    { id: '1', label: 'Bireysel' },
                    { id: '2', label: 'Kurumsal' }
                ]},
                { id: 'source', label: 'Kaynak', type: 'text' },
                { id: 'city', label: 'Åehir', type: 'text' }
            ],
            'App\\Models\\JobCrm': [
                { id: 'job_status_id', label: 'Ä°ÅŸ Durumu', type: 'select', values: jobStatuses.map(s => ({ id: String(s.id), label: s.name })) },
                { id: 'status', label: 'AÅŸama Metni', type: 'text' },
                { id: 'user_id', label: 'Sorumlu', type: 'select', values: userOptions },
                ...common
            ],
            'App\\Models\\Payment': [
                { id: 'amount', label: 'Ã–deme TutarÄ±', type: 'number' },
                { id: 'is_paid', label: 'Ã–dendi mi?', type: 'select', values: [{id: '1', label: 'Evet'}, {id: '0', label: 'HayÄ±r'}] }
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
            <SettingsPageHeader
                title="Ä°ÅŸ OtomasyonlarÄ±"
                actions={view === 'list' ? [{ label: 'Yeni Senaryo OluÅŸtur', onClick: () => openModal(), icon: Zap, variant: 'primary' }] : []}
            />

            {/* Header Navigation */}
            <div className="flex items-center justify-between gap-4 theme-surface p-4 rounded-xl border theme-divider shadow-sm">
                <div className="flex items-center gap-1 p-1 bg-[#F4F5F7] dark:bg-white/5 rounded-xl border theme-divider">
                    <button 
                        onClick={() => setView('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'list' ? 'bg-white dark:bg-white/10 text-[#905EFC] shadow-sm' : 'theme-text-secondary hover:text-[#1A1A2E]'}`}
                    >
                        <List size={14} /> OtomasyonlarÄ±m
                    </button>
                    <button 
                        onClick={() => setView('logs')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'logs' ? 'bg-white dark:bg-white/10 text-[#905EFC] shadow-sm' : 'theme-text-secondary hover:text-[#1A1A2E]'}`}
                    >
                        <History size={14} /> Ã‡alÄ±ÅŸma KayÄ±tlarÄ± (Logs)
                    </button>
                </div>
                <div className="hidden" />
            </div>

            {view === 'list' && (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {isLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#905EFC]" size={40} /></div>
                    ) : (
                        workflows.map(w => (
                            <div key={w.id} className="bg-white dark:bg-white/5 border-2 border-transparent hover:border-[#905EFC]/20 rounded-xl p-5 flex items-center justify-between transition-all hover:shadow-xl group">
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${w.is_active ? 'bg-[#905EFC]/10 text-[#905EFC] dark:bg-[#905EFC]/10' : 'bg-[#E5E9F0] theme-text-secondary'}`}>
                                        <Zap size={20} className={w.is_active ? 'fill-current' : ''} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold theme-text-primary group-hover:text-[#905EFC] transition-colors">{w.name}</h3>
                                        <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                                            <span className="text-[10px] font-black theme-text-secondary uppercase tracking-widest bg-[#F4F5F7] dark:bg-[#111111] px-2 py-0.5 rounded-md border theme-divider">
                                                {models.find(m => m.id === w.trigger_model)?.label?.split(' ')[0]}
                                            </span>
                                            <ChevronRight size={10} className="theme-text-secondary" />
                                            <span className="text-[10px] font-bold theme-text-secondary truncate max-w-[150px]">
                                                {events.find(e => e.id === w.trigger_event)?.label || w.trigger_event}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black tracking-tighter bg-[#905EFC]/10 dark:bg-[#905EFC]/10 text-[#905EFC]">
                                                {w.actions?.length || 0} AKSÄ°YON
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleMutation.mutate(w.id)} className={`p-2 rounded-xl transition-all ${w.is_active ? 'text-green-600 hover:bg-green-50' : 'theme-text-secondary hover:bg-[#F4F5F7]'}`} title={w.is_active ? 'Pasif Yap' : 'Aktif Yap'}>
                                        <CheckCircle size={20} />
                                    </button>
                                    <button onClick={() => openModal(w)} className="p-2 rounded-xl theme-text-secondary hover:text-[#905EFC] hover:bg-[#905EFC]/10 transition-all"><Edit2 size={20} /></button>
                                    <button onClick={() => setDeleteConfirm(w)} className="p-2 rounded-xl theme-text-secondary hover:text-red-500 transition-all"><Trash2 size={20} /></button>
                                </div>
                            </div>
                        ))
                    )}
                    {workflows.length === 0 && !isLoading && (
                        <div className="py-20 text-center theme-surface rounded-xl border border-dashed theme-divider">
                            <Zap size={40} className="mx-auto text-[#E5E9F0] mb-4" />
                            <p className="theme-text-secondary font-bold">HenÃ¼z bir otomasyon senaryonuz yok.</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'logs' && (
                <div className="animate-in fade-in duration-500 lg:p-4">
                    <div className="theme-surface rounded-xl border theme-divider overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse theme-table">
                            <thead>
                                <tr className="bg-[#F4F5F7] dark:bg-white/5 border-b theme-divider">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase theme-text-secondary tracking-wider">Tarih</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase theme-text-secondary tracking-wider">Otomasyon</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase theme-text-secondary tracking-wider">Tetikleyici / KayÄ±t ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase theme-text-secondary tracking-wider">Durum</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase theme-text-secondary tracking-wider">Detay</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F4F5F7] dark:divide-white/5">
                                {workflowLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-25/50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold theme-text-secondary">{new Date(log.created_at).toLocaleString('tr-TR')}</td>
                                        <td className="px-6 py-4 text-xs font-black theme-text-primary uppercase truncate max-w-[200px]">{log.workflow_name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-[#905EFC] dark:text-[#905EFC]">{log.trigger_model}</span>
                                                <span className="text-[9px] theme-text-secondary font-mono">ID: {log.model_id} â€¢ {log.trigger_event}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {log.status === 'success' ? 'BAÅARILI' : 'HATA'}
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
                                    <tr><td colSpan={5} className="px-6 py-20 text-center theme-text-secondary font-bold italic">HenÃ¼z Ã§alÄ±ÅŸma kaydÄ± bulunmuyor.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Workflow Editor Modal */}
            <Modal open={modal.open} onClose={() => setModal({ open: false, workflow: null })} title={modal.workflow ? 'Senaryoyu DÃ¼zenle' : 'Yeni Senaryo'} size="lg">
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-1">
                    {/* Name Input */}
                    <div className="space-y-2 pb-4 border-b theme-divider">
                        <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest ml-1">Senaryo AdÄ±</label>
                        <div className="flex gap-3">
                            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-bold theme-input transition-all" placeholder="Ã–rn: Teklif Kabul Ä°ÅŸ BaÅŸlat" />
                            <div className="bg-[#F4F5F7] dark:bg-white/5 px-4 py-2.5 rounded-lg border theme-divider flex items-center gap-2">
                                <span className="text-[10px] font-black theme-text-secondary tracking-widest">DURUM</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="sr-only peer" />
                                    <div className="w-10 h-5 bg-[#E5E9F0] dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E5E9F0] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#905EFC]"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Trigger */}
                    <div className="border theme-divider rounded-lg overflow-hidden">
                        <button type="button" onClick={() => setExpandedSections(p => ({ ...p, step1: !p.step1 }))} className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-500/5 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">1</div>
                                <span className="text-xs font-bold theme-text-primary uppercase tracking-widest">Olay Tetikleyici</span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 rounded-full">
                                    {models.find(m => m.id === form.trigger_model)?.label?.split(' ')[0]} â€¢ {events.find(e => e.id === form.trigger_event)?.label || form.trigger_event}
                                </span>
                            </div>
                            <ChevronDown size={16} className={`theme-text-secondary transition-transform ${expandedSections.step1 ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedSections.step1 && (
                            <div className="px-4 py-4 border-t theme-divider bg-white dark:bg-white/5 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-widest ml-1">Kategori</label>
                                        <select value={form.trigger_model} onChange={e => setForm(p => ({ ...p, trigger_model: e.target.value, trigger_event: 'created', conditions: [] }))} className="w-full px-3 py-2 border rounded-lg text-xs font-bold theme-input transition-all">
                                            {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-widest ml-1">Olay</label>
                                        <select value={form.trigger_event} onChange={e => setForm(p => ({ ...p, trigger_event: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-xs font-bold theme-input transition-all">
                                            {events.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Conditions */}
                    <div className="border theme-divider rounded-lg overflow-hidden">
                        <button type="button" onClick={() => setExpandedSections(p => ({ ...p, step2: !p.step2 }))} className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-500/5 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">2</div>
                                <span className="text-xs font-bold theme-text-primary uppercase tracking-widest">Ã‡alÄ±ÅŸma KoÅŸullarÄ±</span>
                                {form.conditions.length > 0 && (
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 rounded-full">
                                        {form.conditions.length} KoÅŸul
                                    </span>
                                )}
                            </div>
                            <ChevronDown size={16} className={`theme-text-secondary transition-transform ${expandedSections.step2 ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedSections.step2 && (
                            <div className="px-4 py-4 border-t theme-divider bg-white dark:bg-white/5 space-y-3">
                                {form.conditions.map((c, idx) => {
                                    const selectedField = fieldOptions.find(f => f.id === c.field);
                                    return (
                                        <div key={idx} className="flex gap-2 items-end">
                                            <select value={c.field} onChange={e => updateCondition(idx, 'field', e.target.value)} className="flex-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold theme-input">
                                                <option value="">Alan</option>
                                                {fieldOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                            </select>
                                            <select value={c.operator} onChange={e => updateCondition(idx, 'operator', e.target.value)} className="w-20 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold theme-input">
                                                {operators.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                            </select>
                                            {selectedField?.type === 'select' ? (
                                                <select value={c.value} onChange={e => updateCondition(idx, 'value', e.target.value)} className="flex-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold theme-input">
                                                    <option value="">SeÃ§in</option>
                                                    {selectedField.values.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                                                </select>
                                            ) : (
                                                <input type={selectedField?.type || 'text'} value={c.value} onChange={e => updateCondition(idx, 'value', e.target.value)} placeholder="DeÄŸer" className="flex-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold theme-input" />
                                            )}
                                            <button type="button" onClick={() => removeCondition(idx)} className="p-1.5 theme-text-secondary hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    )
                                })}
                                <button type="button" onClick={addCondition} className="w-full text-[10px] font-black text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-2 rounded-lg border border-dashed border-blue-300 dark:border-blue-500/30 transition-all">+ KoÅŸul Ekle</button>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Actions */}
                    <div className="border theme-divider rounded-lg overflow-hidden">
                        <button type="button" onClick={() => setExpandedSections(p => ({ ...p, step3: !p.step3 }))} className="w-full flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-500/5 hover:bg-green-100 dark:hover:bg-green-500/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-green-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">3</div>
                                <span className="text-xs font-bold theme-text-primary uppercase tracking-widest">YapÄ±lacak Ä°ÅŸlemler</span>
                                {form.actions.length > 0 && (
                                    <span className="text-[10px] text-green-600 dark:text-green-400 font-bold px-2 py-0.5 bg-green-100 dark:bg-green-500/20 rounded-full">
                                        {form.actions.length} Aksiyon
                                    </span>
                                )}
                            </div>
                            <ChevronDown size={16} className={`theme-text-secondary transition-transform ${expandedSections.step3 ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedSections.step3 && (
                            <div className="px-4 py-4 border-t theme-divider bg-white dark:bg-white/5 space-y-3">
                                {form.actions.map((action, actionIdx) => {
                                    const type = actionTypes.find(at => at.id === action.type);
                                    return (
                                        <div key={actionIdx} className="bg-[#F4F5F7] dark:bg-white/5 border theme-divider rounded-lg p-4 relative group">
                                            <button type="button" onClick={() => removeAction(actionIdx)} className="absolute top-3 right-3 p-1 theme-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-6 h-6 bg-[#905EFC] text-white rounded-lg flex items-center justify-center shrink-0">
                                                    {type && <type.icon size={14} />}
                                                </div>
                                                <select 
                                                    value={action.type} 
                                                    onChange={e => updateAction(actionIdx, 'type', e.target.value)}
                                                    className="flex-1 bg-transparent border-none text-xs font-bold theme-text-primary focus:ring-0 p-0 outline-none"
                                                >
                                                    {actionTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                                </select>
                                            </div>

                                            {/* Action Fields - Compact Version */}
                                            {action.type === 'send_email' && (
                                                <div className="space-y-2 text-xs">
                                                    <input type="email" value={action.parameters.to || ''} onChange={e => updateActionParam(actionIdx, 'to', e.target.value)} placeholder="E-posta" className="w-full px-2.5 py-1.5 border rounded text-[10px] font-bold theme-input" />
                                                    <input type="text" value={action.parameters.subject || ''} onChange={e => updateActionParam(actionIdx, 'subject', e.target.value)} placeholder="Konu" className="w-full px-2.5 py-1.5 border rounded text-[10px] font-bold theme-input" />
                                                    <textarea rows={2} value={action.parameters.body || ''} onChange={e => updateActionParam(actionIdx, 'body', e.target.value)} placeholder="Ä°Ã§erik..." className="w-full px-2.5 py-1.5 border rounded text-[10px] font-bold theme-input resize-none" />
                                                </div>
                                            )}

                                            {action.type === 'change_status' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <select value={action.parameters.field || 'status'} onChange={e => updateActionParam(actionIdx, 'field', e.target.value)} className="px-2.5 py-1.5 border rounded text-[10px] font-bold theme-input">
                                                        {fieldOptions.filter(f => f.type === 'select').map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                                    </select>
                                                    <select value={action.parameters.value || ''} onChange={e => updateActionParam(actionIdx, 'value', e.target.value)} className="px-2.5 py-1.5 border rounded text-[10px] font-bold theme-input">
                                                        <option value="">SeÃ§in</option>
                                                        {fieldOptions.find(f => f.id === (action.parameters.field || 'status'))?.values?.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                                                    </select>
                                                </div>
                                            )}

                                            {action.type === 'create_task' && (
                                                <input type="text" value={action.parameters.title || ''} onChange={e => updateActionParam(actionIdx, 'title', e.target.value)} placeholder="GÃ¶rev adÄ±" className="w-full px-2.5 py-1.5 border rounded text-[10px] font-bold theme-input" />
                                            )}

                                            {action.type === 'create_appointment' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="text" value={action.parameters.title || ''} onChange={e => updateActionParam(actionIdx, 'title', e.target.value)} placeholder="BaÅŸlÄ±k" className="px-2.5 py-1.5 border rounded text-[10px] font-bold theme-input" />
                                                    <input type="number" value={action.parameters.offset_days || 0} onChange={e => updateActionParam(actionIdx, 'offset_days', e.target.value)} placeholder="GÃ¼n" className="px-2.5 py-1.5 border rounded text-[10px] font-bold theme-input" />
                                                </div>
                                            )}

                                            {action.type === 'send_webhook' && (
                                                <input type="url" value={action.parameters.url || ''} onChange={e => updateActionParam(actionIdx, 'url', e.target.value)} placeholder="https://api.example.com" className="w-full px-2.5 py-1.5 border rounded text-[10px] font-bold theme-input" />
                                            )}

                                            {action.type === 'add_note' && (
                                                <input type="text" value={action.parameters.content || ''} onChange={e => updateActionParam(actionIdx, 'content', e.target.value)} placeholder="Not iÃ§eriÄŸi" className="w-full px-2.5 py-1.5 border rounded text-[10px] font-bold theme-input" />
                                            )}

                                            {action.type === 'assign_to_user' && (
                                                <select value={action.parameters.user_id || ''} onChange={e => updateActionParam(actionIdx, 'user_id', e.target.value)} className="w-full px-2.5 py-1.5 border rounded text-[10px] font-bold theme-input">
                                                    <option value="">Personel SeÃ§in</option>
                                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                </select>
                                            )}

                                            {action.type === 'log_activity' && (
                                                <input type="text" value={action.parameters.description || ''} onChange={e => updateActionParam(actionIdx, 'description', e.target.value)} placeholder="Log aÃ§Ä±klamasÄ±" className="w-full px-2.5 py-1.5 border rounded text-[10px] font-bold theme-input" />
                                            )}
                                        </div>
                                    )
                                })}
                                <button type="button" onClick={addAction} className="w-full text-[10px] font-black text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 px-3 py-2 rounded-lg border border-dashed border-green-300 dark:border-green-500/30 transition-all">+ Aksiyon Ekle</button>
                            </div>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 pt-4 border-t theme-divider mt-4">
                        <button type="button" onClick={() => setModal({ open: false, workflow: null })} className="flex-1 px-4 py-2.5 border-2 theme-divider rounded-lg text-[10px] font-black theme-text-secondary hover:text-[#1A1A2E] dark:hover:text-white hover:bg-[#F4F5F7] dark:hover:bg-white/5 transition-all uppercase tracking-widest">Ä°ptal</button>
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
                                <span className="text-xs font-black uppercase tracking-wider theme-text-primary">{step.type}</span>
                                <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full ${step.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {step.status === 'success' ? 'TAMAMLANDI' : 'HATA'}
                                </span>
                            </div>
                            <p className="text-xs theme-text-secondary font-medium leading-relaxed">
                                {step.status === 'success' ? (step.result || 'Ä°ÅŸlem baÅŸarÄ±yla icra edildi.') : (step.error || 'Bilinmeyen bir hata oluÅŸtu.')}
                            </p>
                        </div>
                    ))}
                    {logModal.logs.length === 0 && <p className="text-center py-10 theme-text-secondary italic">Analiz edilecek aksiyon verisi bulunmuyor.</p>}
                </div>
            </Modal>

            {/* Standard Delete Confirm */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Otomasyonu Sil">
                <div className="space-y-6">
                    <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-xl flex gap-4 text-red-600 border border-red-100 dark:border-red-500/20 shadow-sm">
                        <AlertCircle className="shrink-0" size={24} />
                        <p className="text-xs font-bold leading-relaxed">"{deleteConfirm?.name}" isimli otomasyonu silmek istediÄŸinize emin misiniz? Bu iÅŸlem geri alÄ±namaz.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 border theme-divider rounded-xl text-xs font-black theme-text-secondary hover:bg-[#F4F5F7] transition-all uppercase tracking-widest">Ä°ptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-lg shadow-red-500/20 transition-all uppercase tracking-widest">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

