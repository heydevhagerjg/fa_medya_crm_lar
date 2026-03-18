import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../../lib/api.js'
import toast from 'react-hot-toast'
import { Settings, Save, Server, ShieldCheck, AlertCircle } from 'lucide-react'

export default function AdminSettingsPage() {
    const [form, setForm] = useState({
        aws_access_key_id: '',
        aws_secret_access_key: '',
        aws_region: '',
        aws_bucket_name: ''
    })

    const { data: settings, isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: () => api.get('/admin/settings').then(r => r.data),
    })

    useEffect(() => {
        if (settings) {
            setForm(settings)
        }
    }, [settings])

    const saveMutation = useMutation({
        mutationFn: (data) => api.put('/admin/settings', data),
        onSuccess: () => {
            toast.success('Ayarlar kaydedildi.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const testMutation = useMutation({
        mutationFn: (data) => api.post('/admin/settings/test', data),
        onSuccess: (data) => {
            if (data.data.success) {
                toast.success(data.data.message)
            } else {
                toast.error(data.data.message)
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Bağlantı başarısız.'),
    })

    if (isLoading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Settings size={24} className="text-red-500" />
                    Sistem Ayarları
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Global depolama ve uygulama ayarları</p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-xl text-orange-600">
                            <Server size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">AWS S3 Depolama Ayarları</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Tüm firmalar için kullanılacak ortak depolama birimi</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-gray-400" /> Access Key ID
                            </label>
                            <input
                                type="text"
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
                                value={form.aws_region || ''}
                                onChange={e => setForm({ ...form, aws_region: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                                placeholder="eu-central-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                <Database size={14} className="text-gray-400" /> Bucket Adı
                            </label>
                            <input
                                type="text"
                                value={form.aws_bucket_name || ''}
                                onChange={e => setForm({ ...form, aws_bucket_name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                                placeholder="famedya-crm-storage"
                            />
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex gap-3">
                        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                            Bu ayarlar kaydedildiğinde tüm firmalar (tenants) ortak olarak bu S3 bucket'ını kullanacaktır. 
                            Yanlış yapılandırma durumunda dosya yükleme ve görüntüleme işlemleri tüm sistemde duracaktır.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => testMutation.mutate(form)}
                            disabled={testMutation.isPending}
                            className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            {testMutation.isPending ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
                        </button>
                        <button
                            onClick={() => saveMutation.mutate(form)}
                            disabled={saveMutation.isPending}
                            className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
                        >
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                            <Save size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Database({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5V19A9 3 0 0 0 21 19V5" />
            <path d="M3 12A9 3 0 0 0 21 12" />
        </svg>
    )
}
