import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Loader2, Image as ImageIcon, Briefcase, Mail, Phone, MapPin, Building2, Globe } from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/index.js'

export default function GeneralTab({ tenant, setTenant }) {
    const qc = useQueryClient()
    const { updateTenant } = useAuthStore()

    const updateMutation = useMutation({
        mutationFn: (data) => api.put('/settings/general', data),
        onSuccess: (res) => {
            qc.invalidateQueries(['auth-user'])
            updateTenant(res.data)
            toast.success('Ayarlar güncellendi.')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.')
    })

    const handleLogoChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        const fd = new FormData()
        fd.append('logo', file)
        try {
            const res = await api.post('/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            updateTenant(res.data)
            qc.invalidateQueries(['auth-user'])
            toast.success('Logo güncellendi.')
        } catch (err) {
            toast.error('Logo yüklenemedi.')
        }
    }

    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Building2 size={120} />
                </div>

                <div className="flex flex-col md:flex-row gap-10 relative z-10">
                    <div className="flex flex-col items-center gap-6">
                        <div className="group relative">
                            <div className="w-32 h-32 rounded-3xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-indigo-500 shadow-sm relative">
                                {tenant?.logo ? (
                                    <div className="relative w-full h-full p-2 flex items-center justify-center">
                                        <img src={`/storage/${tenant.logo}`} className="max-w-full max-h-full object-contain filter drop-shadow-md" alt="Logo" />
                                        <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
                                            <ImageIcon className="text-white" size={24} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 group-hover:text-indigo-500 transition-colors flex flex-col items-center gap-2">
                                        <ImageIcon size={32} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Logo Yükle</span>
                                    </div>
                                )}
                                <input type="file" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Kurumsal Logo</h4>
                            <p className="text-[10px] text-gray-500 italic max-w-[140px] leading-relaxed">PNG veya JPG formatında saydam logo kullanımı önerilir.</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-8">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600">
                                    <Briefcase size={16} />
                                </div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Firma Bilgileri</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">İşletme Adı</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                        <input type="text" value={tenant?.company_name || ''} onChange={e => setTenant({ ...tenant, company_name: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white" placeholder="Firma Ünvanı" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">E-posta Adresi</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                        <input type="email" value={tenant?.email || ''} onChange={e => setTenant({ ...tenant, email: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white" placeholder="kurumsal@eposta.com" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Telefon</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                        <input type="text" value={tenant?.phone || ''} onChange={e => setTenant({ ...tenant, phone: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white" placeholder="05XX XXX XX XX" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Web Sitesi</label>
                                    <div className="relative group">
                                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                        <input type="text" value={tenant?.website || ''} onChange={e => setTenant({ ...tenant, website: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white" placeholder="www.firmawebsite.com" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Adres</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3.5 top-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                        <textarea rows={3} value={tenant?.address || ''} onChange={e => setTenant({ ...tenant, address: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-gray-900 dark:text-white" placeholder="İşletme açık adresi..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex pt-4">
                            <button
                                onClick={() => updateMutation.mutate({ company_name: tenant.company_name, email: tenant.email, phone: tenant.phone, address: tenant.address, website: tenant.website })}
                                disabled={updateMutation.isPending}
                                className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-xl shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                            >
                                {updateMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {updateMutation.isPending ? 'KAYDEDİLİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
