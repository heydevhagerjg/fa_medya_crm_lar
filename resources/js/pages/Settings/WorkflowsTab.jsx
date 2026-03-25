import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
    Plus, Trash2, Edit2, Play, CheckCircle, Activity, Mail, Loader2, 
    AlertCircle, RefreshCw, UserPlus, Briefcase, FileText, Settings, 
    ChevronRight, Database, Bell, Zap, Clock, Code, Globe, MessageSquare, 
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
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <button 
                        onClick={() => setView('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'list' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <List size={14} /> Otomasyonlarım
                    </button>
                    <button 
                        onClick={() => setView('logs')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'logs' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <History size={14} /> Çalışma Kayıtları (Logs)
                    </button>
                </div>
                {view === 'list' && (
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                        <Zap size={16} /> Yeni Senaryo Oluştur
                    </button>
                )}
            </div>

            {view === 'list' && (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {isLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
                    ) : (
                        workflows.map(w => (
                            <div key={w.id} className="bg-white dark:bg-gray-800 border-2 border-transparent hover:border-indigo-500/20 rounded-3xl p-5 flex items-center justify-between transition-all hover:shadow-xl group">
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${w.is_active ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' : 'bg-gray-100 text-gray-400'}`}>
                                        <Zap size={20} className={w.is_active ? 'fill-current' : ''} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{w.name}</h3>
                                        <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-800">
                                                {models.find(m => m.id === w.trigger_model)?.label?.split(' ')[0]}
                                            </span>
                                            <ChevronRight size={10} className="text-gray-300" />
                                            <span className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]">
                                                {events.find(e => e.id === w.trigger_event)?.label || w.trigger_event}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black tracking-tighter bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
                                                {w.actions?.length || 0} AKSİYON
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleMutation.mutate(w.id)} className={`p-2 rounded-xl transition-all ${w.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-50'}`} title={w.is_active ? 'Pasif Yap' : 'Aktif Yap'}>
                                        <CheckCircle size={20} />
                                    </button>
                                    <button onClick={() => openModal(w)} className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Edit2 size={20} /></button>
                                    <button onClick={() => setDeleteConfirm(w)} className="p-2 rounded-xl text-gray-300 hover:text-red-500 transition-all"><Trash2 size={20} /></button>
                                </div>
                            </div>
                        ))
                    )}
                    {workflows.length === 0 && !isLoading && (
                        <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-[2.5rem] border border-dashed border-gray-200">
                            <Zap size={40} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-400 font-bold">Henüz bir otomasyon senaryonuz yok.</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'logs' && (
                <div className="animate-in fade-in duration-500 lg:p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Tarih</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Otomasyon</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Tetikleyici / Kayıt ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Durum</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Detay</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {workflowLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-25/50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-gray-400">{new Date(log.created_at).toLocaleString('tr-TR')}</td>
                                        <td className="px-6 py-4 text-xs font-black text-gray-900 dark:text-white uppercase truncate max-w-[200px]">{log.workflow_name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{log.trigger_model}</span>
                                                <span className="text-[9px] text-gray-400 font-mono">ID: {log.model_id} • {log.trigger_event}</span>
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
                                                className="text-[10px] font-bold text-indigo-600 hover:underline"
                                            >
                                                {log.actions_taken?.length || 0} Aksiyon Analizi
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {workflowLogs.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold italic">Henüz çalışma kaydı bulunmuyor.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Workflow Editor Modal */}
            <Modal open={modal.open} onClose={() => setModal({ open: false, workflow: null })} title={modal.workflow ? 'Otomasyon Senaryosu Düzenle' : 'Yeni Otomasyon Tasarla'} size="2xl">
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-8 py-2">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Senaryo Başlığı</label>
                            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-gray-900 dark:text-white" placeholder="Örn: Teklif Kabul Edilince İş Başlat" />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 self-end">
                            <span className="text-[10px] font-black text-gray-400 tracking-widest">DURUM</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                            <span className={`text-[10px] font-black tracking-widest ${form.is_active ? 'text-indigo-600' : 'text-gray-400'}`}>{form.is_active ? 'AKTİF' : 'PASİF'}</span>
                        </div>
                    </div>

                    {/* Step 1: Trigger */}
                    <div className="space-y-5 bg-amber-50/20 dark:bg-amber-500/5 p-6 rounded-[2rem] border border-amber-100/50 dark:border-amber-500/10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-500 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-amber-500/30">1</div>
                            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Olay ve Tetikleyici</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Kategori / Modül</label>
                                <select value={form.trigger_model} onChange={e => setForm(p => ({ ...p, trigger_model: e.target.value, trigger_event: 'created', conditions: [] }))} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-black outline-none focus:border-indigo-500 transition-all text-gray-700 dark:text-white shadow-sm">
                                    {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tetikleyici Olay</label>
                                <select value={form.trigger_event} onChange={e => setForm(p => ({ ...p, trigger_event: e.target.value }))} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-black outline-none focus:border-indigo-500 transition-all text-gray-700 dark:text-white shadow-sm">
                                    {events.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Conditions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-500 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-500/30">2</div>
                                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Çalışma Koşulları</h4>
                            </div>
                            <button type="button" onClick={addCondition} className="text-[10px] font-black text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-dashed border-indigo-200 transition-all">+ Yeni Koşul</button>
                        </div>
                        <div className="space-y-2">
                            {form.conditions.map((c, idx) => {
                                const selectedField = fieldOptions.find(f => f.id === c.field);
                                return (
                                    <div key={idx} className="flex gap-2 items-end group">
                                        <div className="flex-1 min-w-[150px]">
                                            <select value={c.field} onChange={e => updateCondition(idx, 'field', e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold outline-none">
                                                <option value="">Alan Seçin</option>
                                                {fieldOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="w-32">
                                            <select value={c.operator} onChange={e => updateCondition(idx, 'operator', e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold outline-none text-indigo-600">
                                                {operators.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-[1.5] min-w-[150px]">
                                            {selectedField?.type === 'select' ? (
                                                <select value={c.value} onChange={e => updateCondition(idx, 'value', e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold outline-none">
                                                    <option value="">Değer Seçin</option>
                                                    {selectedField.values.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                                                </select>
                                            ) : (
                                                <input type={selectedField?.type || 'text'} value={c.value} onChange={e => updateCondition(idx, 'value', e.target.value)} placeholder="Değer..." className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold outline-none" />
                                            )}
                                        </div>
                                        <button type="button" onClick={() => removeCondition(idx)} className="p-2.5 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Step 3: Actions */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-500 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-green-500/30">3</div>
                                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Yapılacak İşlemler (Actions)</h4>
                            </div>
                            <button type="button" onClick={addAction} className="text-[10px] font-black text-green-600 px-6 py-2.5 bg-green-50 rounded-2xl hover:bg-green-100 transition-all">+ Aksiyon Ekle</button>
                        </div>
                        <div className="space-y-4">
                            {form.actions.map((action, actionIdx) => {
                                const type = actionTypes.find(at => at.id === action.type);
                                return (
                                    <div key={actionIdx} className="bg-white dark:bg-gray-900 border-2 border-indigo-50 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm relative group">
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                                            <button type="button" onClick={() => removeAction(actionIdx)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                                    {type && <type.icon size={20} />}
                                                </div>
                                                <div className="flex-1">
                                                    <select 
                                                        value={action.type} 
                                                        onChange={e => updateAction(actionIdx, 'type', e.target.value)}
                                                        className="bg-transparent border-none text-base font-black text-gray-900 dark:text-white focus:ring-0 p-0 outline-none w-full"
                                                    >
                                                        {actionTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                                    </select>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{type?.desc}</p>
                                                </div>
                                            </div>

                                            {/* Action Specific UI */}
                                            {action.type === 'send_email' && (
                                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Alıcı E-posta</label>
                                                            <input type="email" value={action.parameters.to || ''} onChange={e => updateActionParam(actionIdx, 'to', e.target.value)} placeholder="Örn: admin@site.com" className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Konu</label>
                                                            <input type="text" value={action.parameters.subject || ''} onChange={e => updateActionParam(actionIdx, 'subject', e.target.value)} placeholder="Konu başlığı..." className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold" />
                                                        </div>
                                                    </div>
                                                    <textarea rows={2} value={action.parameters.body || ''} onChange={e => updateActionParam(actionIdx, 'body', e.target.value)} placeholder="E-posta içeriği..." className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold resize-none" />
                                                </div>
                                            )}

                                            {action.type === 'change_status' && (
                                                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                                    <div className="space-y-1 text-gray-400">
                                                        <label className="text-[10px] font-bold uppercase ml-1">Alan</label>
                                                        <select value={action.parameters.field || 'status'} onChange={e => updateActionParam(actionIdx, 'field', e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold">
                                                            {fieldOptions.filter(f => f.type === 'select').map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                                            <option value="status">Metin Statüsü</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Yeni Değer</label>
                                                        {(() => {
                                                            const field = fieldOptions.find(f => f.id === (action.parameters.field || 'status'));
                                                            if (field?.type === 'select') {
                                                                return (
                                                                    <select value={action.parameters.value || ''} onChange={e => updateActionParam(actionIdx, 'value', e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold">
                                                                        <option value="">Seçiniz</option>
                                                                        {field.values.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                                                                    </select>
                                                                )
                                                            }
                                                            return <input type="text" value={action.parameters.value || ''} onChange={e => updateActionParam(actionIdx, 'value', e.target.value)} placeholder="Yeni değer..." className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold" />
                                                        })()}
                                                    </div>
                                                </div>
                                            )}

                                            {action.type === 'create_task' && (
                                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Görev Başlığı</label>
                                                        <input type="text" value={action.parameters.title || ''} onChange={e => updateActionParam(actionIdx, 'title', e.target.value)} placeholder="Örn: Müşteriyi 3 gün sonra ara" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold" />
                                                    </div>
                                                </div>
                                            )}

                                            {action.type === 'create_appointment' && (
                                                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Randevu Başlığı</label>
                                                        <input type="text" value={action.parameters.title || ''} onChange={e => updateActionParam(actionIdx, 'title', e.target.value)} placeholder="Örn: Toplantı" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Kaç Gün Sonra?</label>
                                                        <input type="number" value={action.parameters.offset_days || 0} onChange={e => updateActionParam(actionIdx, 'offset_days', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold" />
                                                    </div>
                                                </div>
                                            )}

                                            {action.type === 'send_webhook' && (
                                                <div className="space-y-1 animate-in slide-in-from-top-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Webhook URL</label>
                                                    <input type="url" value={action.parameters.url || ''} onChange={e => updateActionParam(actionIdx, 'url', e.target.value)} placeholder="https://api.example.com/callback" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold" />
                                                </div>
                                            )}

                                            {action.type === 'add_note' && (
                                                <div className="space-y-1 animate-in slide-in-from-top-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Not İçeriği</label>
                                                    <input type="text" value={action.parameters.content || ''} onChange={e => updateActionParam(actionIdx, 'content', e.target.value)} placeholder="Kayıt üzerine eklenecek not..." className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold" />
                                                </div>
                                            )}

                                            {(action.type === 'assign_to_user' || action.type === 'log_activity') && (
                                                <div className="animate-in slide-in-from-top-2">
                                                    {action.type === 'assign_to_user' ? (
                                                        <select value={action.parameters.user_id || ''} onChange={e => updateActionParam(actionIdx, 'user_id', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold">
                                                            <option value="">Personel Seçin</option>
                                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                        </select>
                                                    ) : (
                                                        <input type="text" value={action.parameters.description || ''} onChange={e => updateActionParam(actionIdx, 'description', e.target.value)} placeholder="Log açıklaması..." className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-gray-50 dark:border-gray-800">
                        <button type="button" onClick={() => setModal({ open: false, workflow: null })} className="flex-1 px-8 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all uppercase tracking-widest">İptal</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex-[2] px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest flex items-center justify-center gap-2">
                            {saveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />} 
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Senaryoyu Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Log Details Modal */}
            <Modal open={logModal.open} onClose={() => setLogModal({ open: false, logs: [] })} title="Otomasyon Analizi" size="lg">
                <div className="space-y-4">
                    {logModal.logs.map((step, i) => (
                        <div key={i} className={`p-4 rounded-2xl border ${step.status === 'success' ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${step.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {step.status === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                </div>
                                <span className="text-xs font-black uppercase tracking-wider text-gray-700">{step.type}</span>
                                <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full ${step.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {step.status === 'success' ? 'TAMAMLANDI' : 'HATA'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                {step.status === 'success' ? (step.result || 'İşlem başarıyla icra edildi.') : (step.error || 'Bilinmeyen bir hata oluştu.')}
                            </p>
                        </div>
                    ))}
                    {logModal.logs.length === 0 && <p className="text-center py-10 text-gray-400 italic">Analiz edilecek aksiyon verisi bulunmuyor.</p>}
                </div>
            </Modal>

            {/* Standard Delete Confirm */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Otomasyonu Sil">
                <div className="space-y-6">
                    <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-2xl flex gap-4 text-red-600 border border-red-100 dark:border-red-500/20 shadow-sm">
                        <AlertCircle className="shrink-0" size={24} />
                        <p className="text-xs font-bold leading-relaxed">"{deleteConfirm?.name}" isimli otomasyonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest">İptal</button>
                        <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-lg shadow-red-500/20 transition-all uppercase tracking-widest">Sil</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
