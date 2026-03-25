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
        <div className="space-y-5 max-w-4xl">
            <div className="bg-white dark:bg-[#111111] border border-[#E5E9F0] dark:border-white/5 rounded-xl p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.06]">
                    <Building2 size={120} />
                </div>

                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                    {/* Logo upload */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="group relative">
                            <div className="w-28 h-28 rounded-xl bg-[#F4F5F7] dark:bg-white/5 border-2 border-dashed border-[#E5E9F0] dark:border-white/10 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:border-[#905EFC] relative">
                                {tenant?.logo ? (
                                    <>
                                        <img src={`/storage/${tenant.logo}`} className="max-w-full max-h-full object-contain p-2" alt="Logo" />
                                        <div className="absolute inset-0 bg-[#905EFC]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                                            <ImageIcon className="text-white" size={22} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-[#9097A6] group-hover:text-[#905EFC] transition-colors flex flex-col items-center gap-1.5">
                                        <ImageIcon size={28} strokeWidth={1.5} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Logo Yükle</span>
                                    </div>
                                )}
                                <input type="file" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h4 className="text-[11px] font-bold text-[#9097A6] uppercase tracking-widest mb-0.5">Kurumsal Logo</h4>
                            <p className="text-[10px] text-[#9097A6] italic max-w-[130px] leading-relaxed">PNG veya JPG formatında saydam logo kullanımı önerilir.</p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[#905EFC]/10 rounded-lg text-[#905EFC]">
                                <Briefcase size={14} />
                            </div>
                            <h3 className="text-sm font-black text-[#1A1A2E] dark:text-white uppercase tracking-wider">Firma Bilgileri</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'İşletme Adı', key: 'company_name', icon: Building2, placeholder: 'Firma Ünvanı', type: 'text' },
                                { label: 'E-posta Adresi', key: 'email', icon: Mail, placeholder: 'kurumsal@eposta.com', type: 'email' },
                                { label: 'Telefon', key: 'phone', icon: Phone, placeholder: '05XX XXX XX XX', type: 'text' },
                                { label: 'Web Sitesi', key: 'website', icon: Globe, placeholder: 'www.firmawebsite.com', type: 'text' },
                            ].map(({ label, key, icon: Icon, placeholder, type }) => (
                                <div key={key} className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-[#9097A6] uppercase tracking-widest ml-0.5">{label}</label>
                                    <div className="relative group">
                                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9097A6] group-focus-within:text-[#905EFC] transition-colors" size={15} />
                                        <input
                                            type={type}
                                            value={tenant?.[key] || ''}
                                            onChange={e => setTenant({ ...tenant, [key]: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm font-semibold text-[#1A1A2E] dark:text-white placeholder:text-[#9097A6] focus:outline-none focus:ring-2 focus:ring-[#905EFC]/20 focus:border-[#905EFC] transition-all"
                                            placeholder={placeholder}
                                        />
                                    </div>
                                </div>
                            ))}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[11px] font-bold text-[#9097A6] uppercase tracking-widest ml-0.5">Adres</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-3 top-3 text-[#9097A6] group-focus-within:text-[#905EFC] transition-colors" size={15} />
                                    <textarea
                                        rows={3}
                                        value={tenant?.address || ''}
                                        onChange={e => setTenant({ ...tenant, address: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-xl text-sm font-semibold text-[#1A1A2E] dark:text-white placeholder:text-[#9097A6] focus:outline-none focus:ring-2 focus:ring-[#905EFC]/20 focus:border-[#905EFC] transition-all resize-none"
                                        placeholder="İşletme açık adresi..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex pt-2">
                            <button
                                onClick={() => updateMutation.mutate({ company_name: tenant.company_name, email: tenant.email, phone: tenant.phone, address: tenant.address, website: tenant.website })}
                                disabled={updateMutation.isPending}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#905EFC]/20 transition-all active:scale-95 disabled:opacity-60 disabled:active:scale-100"
                            >
                                {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                {updateMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
