import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../lib/api.js'
import toast from 'react-hot-toast'
import { Settings, Save, Server, ShieldCheck, AlertCircle, Plus, Edit2, Trash2, Shield } from 'lucide-react'
import Modal from '../../../components/ui/Modal.jsx'

export default function AdminSettingsPage() {
    const qc = useQueryClient();
    const [modal, setModal] = useState(false);
    const [editingState, setEditingState] = useState(null);
    const [form, setForm] = useState({
        name: '',
        aws_access_key_id: '',
        aws_secret_access_key: '',
        aws_region: '',
        aws_bucket_name: '',
        aws_endpoint: '',
        use_path_style_endpoint: false,
        is_active: true
    });

    const { data: configs, isLoading } = useQuery({
        queryKey: ['admin-s3-configs'],
        queryFn: () => api.get('/admin/settings').then(r => r.data),
    });

    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (editingState) return api.put(`/admin/settings/${editingState}`, data);
            return api.post('/admin/settings', data);
        },
        onSuccess: () => {
            qc.invalidateQueries(['admin-s3-configs']);
            toast.success('Konfigürasyon kaydedildi.');
            setModal(false);
            setEditingState(null);
            setForm({ name: '', aws_access_key_id: '', aws_secret_access_key: '', aws_region: '', aws_bucket_name: '', is_active: true });
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/admin/settings/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['admin-s3-configs']);
            toast.success('Konfigürasyon silindi.');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Silinemedi.'),
    });

    const testMutation = useMutation({
        mutationFn: (data) => api.post('/admin/settings/test', data),
        onSuccess: (data) => {
            if (data.data.success) {
                toast.success(data.data.message);
            } else {
                toast.error(data.data.message);
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Bağlantı başarısız.'),
    });

    const corsMutation = useMutation({
        mutationFn: (id) => api.post(`/admin/settings/${id}/setup-cors`),
        onSuccess: (data) => {
            if (data.data.success) {
                toast.success(data.data.message);
            } else {
                toast.error(data.data.message);
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Yapılandırma başarısız.'),
    });

    const openModal = (config = null) => {
        if (config) {
            setEditingState(config.id);
            setForm({
                name: config.name,
                aws_access_key_id: config.aws_access_key_id,
                aws_secret_access_key: config.aws_secret_access_key,
                aws_region: config.aws_region,
                aws_bucket_name: config.aws_bucket_name,
                aws_endpoint: config.aws_endpoint || '',
                use_path_style_endpoint: !!config.use_path_style_endpoint,
                is_active: config.is_active
            });
        } else {
            setEditingState(null);
            setForm({ name: '', aws_access_key_id: '', aws_secret_access_key: '', aws_region: '', aws_bucket_name: '', aws_endpoint: '', use_path_style_endpoint: false, is_active: true });
        }
        setModal(true);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings size={24} className="text-red-500" />
                        S3 Depolama Ayarları
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Tenant'lara atanacak rastgele depolama konfigürasyonları</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg"
                >
                    <Plus size={18} /> Yeni Ekle
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {configs && configs.length > 0 ? configs.map(config => (
                        <div key={config.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-600 shrink-0">
                                    <Server size={24} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 truncate">
                                        {config.name}
                                        {config.is_active ?
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Aktif</span>
                                            :
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Pasif</span>
                                        }
                                    </h3>
                                    <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-1 truncate">
                                        <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded italic">{config.aws_region}</span>
                                        <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">{config.aws_bucket_name}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => corsMutation.mutate(config.id)}
                                    disabled={corsMutation.isPending}
                                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                                    title="Tarayıcıdan doğrudan yükleme (Direct Upload) için S3 CORS ayarlarını otomatik yapılandırır."
                                >
                                    {corsMutation.isPending ? '...' : <><Shield size={14} /> CORS Yapılandır</>}
                                </button>
                                <button onClick={() => openModal(config)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => { if (window.confirm('Bu s3 bağlantısını silmek istediğinize emin misiniz?')) deleteMutation.mutate(config.id) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="p-12 text-center">
                            <Server size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Henüz bir S3 konfigürasyonu eklenmemiş. Lütfen yeni bir bağlantı ekleyin.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal open={modal} onClose={() => setModal(false)} title={editingState ? 'S3 Konfigürasyonu Düzenle' : 'Yeni S3 Konfigürasyonu'}>
                <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                            Konfigürasyon Adı
                        </label>
                        <input
                            type="text"
                            required
                            value={form.name || ''}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                            placeholder="Müşteri S3 - Ana Hesap"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                            <ShieldCheck size={14} className="text-gray-400" /> Access Key ID
                        </label>
                        <input
                            type="text"
                            required
                            value={form.aws_access_key_id || ''}
                            onChange={e => setForm({ ...form, aws_access_key_id: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                            placeholder="AKIA..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                            <ShieldCheck size={14} className="text-gray-400" /> Secret Access Key
                        </label>
                        <input
                            type="password"
                            required
                            value={form.aws_secret_access_key || ''}
                            onChange={e => setForm({ ...form, aws_secret_access_key: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                            placeholder="••••••••••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                            <Server size={14} className="text-gray-400" /> Bölge (Region)
                        </label>
                        <input
                            type="text"
                            required
                            value={form.aws_region || ''}
                            onChange={e => setForm({ ...form, aws_region: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                            placeholder="eu-central-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                            <Server size={14} className="text-gray-400" /> Custom Endpoint (Opsiyonel)
                        </label>
                        <input
                            type="text"
                            value={form.aws_endpoint || ''}
                            onChange={e => setForm({ ...form, aws_endpoint: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                            placeholder="https://s3.idrivee2-7.com"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Hetzner, IDrive vb. kullanıyorsanız giriniz. AWS için boş bırakın.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" /></svg>
                            Bucket Adı
                        </label>
                        <input
                            type="text"
                            required
                            value={form.aws_bucket_name || ''}
                            onChange={e => setForm({ ...form, aws_bucket_name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                            placeholder="famedya-crm-storage"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Aktif</div>
                                <div className="text-[10px] text-gray-500">Rastgele seçime dahil edilsin.</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <input type="checkbox" checked={form.use_path_style_endpoint} onChange={e => setForm({ ...form, use_path_style_endpoint: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Path Style</div>
                                <div className="text-[10px] text-gray-500">Hetzner vb. için gerekebilir.</div>
                            </div>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={() => testMutation.mutate(form)}
                            disabled={testMutation.isPending}
                            className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            {testMutation.isPending ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
                        </button>
                        <div className="flex-1"></div>
                        <button type="button" onClick={() => setModal(false)} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
                            İptal
                        </button>
                        <button type="submit" disabled={saveMutation.isPending} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
