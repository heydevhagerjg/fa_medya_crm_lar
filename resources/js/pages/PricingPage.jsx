import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Zap, ShieldCheck, Globe, Activity, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import PublicSiteShell from '../components/public/PublicSiteShell.jsx'

const features = [
    { key: 'personnel_limit', label: 'Personel Limiti', type: 'numeric' },
    { key: 'customer_limit', label: 'MÃ¼ÅŸteri Limiti', type: 'numeric' },
    { key: 'job_limit', label: 'Aktif Ä°ÅŸ Limiti', type: 'numeric' },
    { key: 'appointment_feature', label: 'Randevu YÃ¶netimi', type: 'boolean' },
    { key: 'service_tracking_feature', label: 'Hizmet Takibi', type: 'boolean' },
    { key: 'proposal_feature', label: 'Teklif YÃ¶netimi', type: 'boolean' },
    { key: 'backup_feature', label: 'Bulut Yedekleme', type: 'boolean' },
    { key: 'api_key_feature', label: 'API EriÅŸimi', type: 'boolean' },
    { key: 'chat_feature', label: 'Sohbet ModÃ¼lÃ¼', type: 'boolean' },
    { key: 'chat_limit', label: 'Sohbet Limiti', type: 'numeric' },
    { key: 'group_chat_limit', label: 'Grup Sohbeti Limiti', type: 'numeric' },
    { key: 'disk_usage_limit', label: 'Depolama AlanÄ±', type: 'numeric', suffix: ' MB' },
]

export default function PricingPage() {
    const [packages, setPackages] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/auth/packages')
            .then(res => {
                setPackages(res.data.filter(p => p.is_active))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    return (
        <PublicSiteShell activePage="pricing">
            <div>
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#bbf7d0] bg-[#dcfce7] px-4 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#166534]">
                        <Zap size={14} /> Åeffaf KarÅŸÄ±laÅŸtÄ±rma
                    </div>
                    <h1 className="mt-4 text-4xl font-black tracking-tight text-[#0f172a] sm:text-6xl">
                        Paketinizi seÃ§in,
                        <span className="block text-[#0f766e]">ekibinizi aynÄ± gÃ¼n canlÄ±ya alÄ±n.</span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-[#475569]">
                        Ä°htiyaÃ§larÄ±nÄ±za en uygun paketi seÃ§in. TÃ¼m paketlerde 14 gÃ¼n Ã¼cretsiz deneme imkanÄ±.
                    </p>
                </div>

                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0f766e] border-t-transparent" />
                    </div>
                ) : (
                    <div className="relative overflow-hidden rounded-4xl border border-[#d8d2c7] bg-white/80 shadow-xl shadow-[#334155]/10">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse theme-table">
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 z-30 w-70 min-w-55 border-b border-r border-[#e6dfd2] bg-[#faf7f1] p-8 text-left shadow-[4px_0_12px_rgba(15,23,42,0.08)]">
                                            <div className="text-sm font-black uppercase tracking-widest text-[#64748b]">Ã–zellikler</div>
                                        </th>

                                        {packages.map((pkg) => (
                                            <th key={pkg.id} className={`relative w-70 min-w-55 border-b border-[#e6dfd2] p-8 text-center ${pkg.is_popular ? 'bg-[#0f766e]/5' : 'bg-[#fffdf8]'}`}>
                                                {pkg.is_popular && (
                                                    <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-xl bg-linear-to-r from-[#facc15] to-[#f59e0b] px-4 py-1 text-[10px] font-black uppercase text-black shadow-lg">
                                                        PopÃ¼ler
                                                    </div>
                                                )}
                                                <div className="mb-2 truncate px-2 text-2xl font-black text-[#0f172a]">{pkg.name}</div>
                                                <div className="mb-4 flex items-baseline justify-center gap-1">
                                                    {Number(pkg.price) > 0 ? (
                                                        <>
                                                            <span className="text-3xl font-black tracking-tighter">â‚º{Number(pkg.price).toLocaleString('tr-TR')}</span>
                                                            <span className="text-xs font-bold text-[#64748b]">/ay</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-3xl font-black tracking-tighter uppercase text-[#16a34a]">Ucretsiz</span>
                                                    )}
                                                </div>
                                                <Link
                                                    to={`/register?package=${pkg.id}`}
                                                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition-all active:scale-95 ${pkg.is_popular ? 'bg-[#0f766e] text-white hover:bg-[#115e59] shadow-lg shadow-[#0f766e]/20' : 'bg-[#ece6da] text-[#334155] hover:bg-[#dfd7c7]'}`}
                                                >
                                                    Hemen BaÅŸlat <ChevronRight size={14} />
                                                </Link>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="group transition-colors hover:bg-[#f8f4ea]">
                                        <td className="sticky left-0 z-20 border-r border-[#e6dfd2] bg-[#faf7f1] p-5 px-8 text-sm font-bold text-[#334155] shadow-[4px_0_12px_rgba(15,23,42,0.06)]">
                                            Deneme SÃ¼resi
                                        </td>
                                        {packages.map((pkg, idx) => (
                                            <td key={`${pkg.id}-trial`} className={`border-b border-[#ede6d9] p-5 text-center text-sm font-bold text-[#64748b] ${idx % 2 === 1 ? 'bg-[#fffaf0]' : 'bg-[#fffdf8]'}`}>
                                                {Number(pkg.price) > 0 ? `${pkg.trial_days} GÃ¼n Ãœcretsiz` : 'SÃ¼rekli'}
                                            </td>
                                        ))}
                                    </tr>
                                    {features.map((feature) => (
                                        <tr key={feature.key} className="group transition-colors hover:bg-[#f8f4ea]">
                                            <td className="sticky left-0 z-20 border-r border-[#e6dfd2] bg-[#faf7f1] p-5 px-8 text-sm font-bold text-[#334155] shadow-[4px_0_12px_rgba(15,23,42,0.06)]">
                                                {feature.label}
                                            </td>

                                            {packages.map((pkg, idx) => {
                                                const value = pkg[feature.key]
                                                const isChatLimit = feature.key === 'chat_limit' || feature.key === 'group_chat_limit'
                                                const chatFeatureDisabled = isChatLimit && !pkg.chat_feature

                                                return (
                                                    <td key={`${pkg.id}-${feature.key}`} className={`border-b border-[#ede6d9] p-5 text-center ${idx % 2 === 1 ? 'bg-[#fffaf0]' : 'bg-[#fffdf8]'}`}>
                                                        {feature.type === 'boolean' ? (
                                                            value ? (
                                                                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#16a34a]/10 text-[#16a34a]">
                                                                    <Check size={18} strokeWidth={3} />
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500/50">
                                                                    <X size={18} strokeWidth={3} />
                                                                </div>
                                                            )
                                                        ) : chatFeatureDisabled ? (
                                                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500/50">
                                                                <X size={18} strokeWidth={3} />
                                                            </div>
                                                        ) : (
                                                            <span className={`text-base font-black ${value === 0 ? 'text-[#0f766e]' : 'text-[#0f172a]'}`}>
                                                                {value === 0 ? 'SÄ±nÄ±rsÄ±z' : `${value}${feature.suffix || ''}`}
                                                            </span>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-20 grid grid-cols-1 gap-8 rounded-[30px] border border-[#d8d2c7] bg-[#faf7f1] p-8 text-center md:grid-cols-3">
                    {[
                        { icon: ShieldCheck, title: 'GÃ¼venli Ã–deme', text: 'Paddle gÃ¼vencesiyle tÃ¼m Ã¶demeleriniz 256-bit SSL ile korunur.', color: 'text-[#2563eb]', bg: 'bg-[#2563eb]/10' },
                        { icon: Globe, title: 'Gizli Ãœcret Yok', text: 'Ä°stediÄŸiniz zaman tek tÄ±kla aboneliÄŸinizi dondurabilir veya iptal edebilirsiniz.', color: 'text-[#16a34a]', bg: 'bg-[#16a34a]/10' },
                        { icon: Activity, title: '7/24 Teknik Destek', text: 'TÃ¼m planlarda Ã¶ncelikli e-posta ve canlÄ± yardÄ±m desteÄŸi alÄ±rsÄ±nÄ±z.', color: 'text-[#7c3aed]', bg: 'bg-[#7c3aed]/10' },
                    ].map((item) => (
                        <div key={item.title} className="space-y-4">
                            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${item.bg} ${item.color}`}>
                                <item.icon size={32} />
                            </div>
                            <h4 className="text-lg font-black uppercase tracking-tight text-[#0f172a]">{item.title}</h4>
                            <p className="text-sm leading-relaxed text-[#64748b]">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </PublicSiteShell>
    )
}
            
