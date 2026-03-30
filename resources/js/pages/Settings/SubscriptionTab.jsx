import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, ShieldCheck, Clock, Layers, Wallet, Loader2, XCircle, CheckCircle, Download } from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import SettingsPageHeader from './Shared/SettingsPageHeader.jsx'

export default function SubscriptionTab() {
    const [successModal, setSuccessModal] = useState(false)
    const [page, setPage] = useState(1)
    const perPage = 10
    const qc = useQueryClient()
    const { data: sub, isLoading } = useQuery({
        queryKey: ['subscription'],
        queryFn: () => api.get('/billing/subscription').then(r => r.data)
    })

    const checkoutMutation = useMutation({
        mutationFn: (package_id) => api.get(`/billing/checkout${package_id ? `?package_id=${package_id}` : ''}`).then(r => r.data),
        onSuccess: (res) => {
            if (res.applied) {
                toast.success(res.message)
                qc.invalidateQueries(['subscription'])
                return
            }
            if (res.checkout && window.Paddle) {
                try {
                    window.Paddle.Checkout.open({
                        ...res.checkout,
                        eventCallback: (event) => {
                            if (event.name === "checkout.completed") {
                                setSuccessModal(true)
                            }
                        }
                    })
                } catch (error) {
                    console.error('Paddle Checkout Error:', error)
                    toast.error('Ã–deme ekranÄ± aÃ§Ä±lÄ±rken bir hata oluÅŸtu.')
                }
            } else {
                toast.error(res.message || 'Ã–deme bilgileri alÄ±namadÄ±.')
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Ã–deme linki oluÅŸturulamadÄ±.')
    })

    const cancelMutation = useMutation({
        mutationFn: () => api.post('/billing/cancel').then(r => r.data),
        onSuccess: (res) => {
            qc.invalidateQueries(['subscription'])
            toast.success(res.message)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Ä°ÅŸlem baÅŸarÄ±sÄ±z.')
    })

    const swapMutation = useMutation({
        mutationFn: (package_id) => api.post('/billing/swap', { package_id }).then(r => r.data),
        onSuccess: (res) => {
            qc.invalidateQueries(['subscription'])
            toast.success(res.message)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Ä°ÅŸlem baÅŸarÄ±sÄ±z.')
    })

    if (isLoading) return <div className="text-center py-8 theme-text-secondary">YÃ¼kleniyor...</div>

    const receipts = sub.receipts || []
    const totalPages = Math.ceil(receipts.length / perPage)
    const paginatedReceipts = receipts.slice((page - 1) * perPage, page * perPage)

    const nextBilledAt = sub.subscription?.next_billed_at || sub.subscription?.scheduled_change?.effective_at || sub.subscription?.billing_period?.ends_at || sub.trial_ends_at

    const isUnlimited = sub.is_gifted || (sub.is_on_trial && sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date(new Date().setFullYear(new Date().getFullYear() + 50)))

    return (
        <div className="max-w-4xl space-y-6">
            <SettingsPageHeader title="Abonelik ve Ã–deme" />

            <div className={`grid grid-cols-1 ${sub.is_gifted ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
                <div className="theme-surface p-6 rounded-2xl border theme-divider shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-bold theme-text-secondary uppercase tracking-widest">MEVCUT PAKET</div>
                        <CreditCard size={18} className="text-indigo-500" />
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                        <p className="text-2xl font-black theme-text-primary uppercase tracking-tight">{sub.package?.name || 'Paket SeÃ§ilmedi'}</p>
                    </div>
                    {sub.is_subscribed || sub.on_trial || sub.is_gifted || sub.is_free ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-lg border border-green-100 dark:border-green-500/20 w-fit">
                            <ShieldCheck size={12} /> AKTÄ°F
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-lg border border-red-100 dark:border-red-500/20 w-fit uppercase">
                            Pasif / SÃ¼resi DolmuÅŸ
                        </div>
                    )}
                </div>

                {!sub.is_gifted && (
                    <div className="theme-surface p-6 rounded-2xl border theme-divider shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-xs font-bold theme-text-secondary uppercase tracking-widest">DENEME BÄ°TÄ°Å</div>
                            <Clock size={16} className="text-amber-500" />
                        </div>
                        <p className="text-xl font-bold theme-text-primary">
                            {sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </p>
                        <p className="text-xs theme-text-secondary mt-2 font-medium">Kredi kartÄ± gerekmeden Ã¼cretsiz deneyin.</p>
                    </div>
                )}

                <div className="theme-surface p-6 rounded-2xl border theme-divider shadow-sm flex flex-col justify-center items-center text-center">
                    {sub.is_subscribed ? (
                        <div className="space-y-4 w-full">
                            <div className="text-center">
                                <p className="text-sm font-bold theme-text-primary">Abonelik Aktif</p>
                                <p className="text-xs theme-text-secondary mt-1">
                                    {sub.subscription?.ends_at
                                        ? `BitiÅŸ: ${new Date(sub.subscription.ends_at).toLocaleDateString('tr-TR')}`
                                        : `Yenileme: ${nextBilledAt ? new Date(nextBilledAt).toLocaleDateString('tr-TR') : '-'}`
                                    }
                                </p>
                            </div>

                            {!sub.subscription?.ends_at && (
                                <button
                                    onClick={() => { if (window.confirm('AboneliÄŸinizi dÃ¶nem sonunda sona ermek Ã¼zere iptal etmek istediÄŸinize emin misiniz?')) cancelMutation.mutate() }}
                                    disabled={cancelMutation.isPending}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/20 transition-colors"
                                >
                                    {cancelMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                    AboneliÄŸi Ä°ptal Et
                                </button>
                            )}
                            {sub.subscription?.ends_at && (
                                <div className="text-[10px] p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-500/20 font-medium leading-tight">
                                    Abonelik iptal edildi, {new Date(sub.subscription.ends_at).toLocaleDateString('tr-TR')} tarihinde sona erecek.
                                </div>
                            )}
                        </div>
                    ) : isUnlimited ? (
                        <div className="text-center space-y-2">
                            <div className="mx-auto w-10 h-10 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold theme-text-primary">SÄ±nÄ±rsÄ±z EriÅŸim</p>
                                <p className="text-[10px] theme-text-secondary mt-1 uppercase font-black tracking-widest">YÃ¶netici TarafÄ±ndan Yetkilendirildi</p>
                            </div>
                        </div>
                    ) : sub.is_free ? (
                        <div className="text-center space-y-2">
                            <div className="mx-auto w-10 h-10 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold theme-text-primary">{sub.package?.name || 'Aktif Plan'}</p>
                                <p className="text-[10px] theme-text-secondary mt-1 uppercase font-black tracking-widest">Ã–mÃ¼r Boyu Ãœcretsiz KullanÄ±m</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm font-medium theme-text-secondary mb-3">Tam Ã¶zellikler iÃ§in abone olun</p>
                            <button
                                onClick={() => checkoutMutation.mutate()}
                                disabled={checkoutMutation.isPending}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                {checkoutMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                                Åimdi Abone Ol
                            </button>
                        </>
                    )}
                </div>
            </div>

            {!sub.is_gifted && sub.all_packages?.length > 0 && (
                <div className="theme-surface border theme-divider rounded-2xl shadow-sm overflow-hidden p-6">
                    <h3 className="text-sm font-bold theme-text-primary mb-4 flex items-center gap-2">
                        <Layers size={18} className="text-indigo-500" /> {sub.is_subscribed ? 'Paket DeÄŸiÅŸtir / YÃ¼kselt' : 'Bir Paket SeÃ§in ve BaÅŸlayÄ±n'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sub.all_packages.map(p => {
                            const isCurrent = p.id === sub.package?.id
                            const isPending = sub.is_subscribed ? swapMutation.isPending : checkoutMutation.isPending
                            const isFree = Number(p.price) <= 0 || !p.paddle_price_id

                            return (
                                <div key={p.id} className={`p-4 rounded-xl border ${isCurrent ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/5' : 'theme-divider'} transition-all`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold theme-text-primary">{p.name}</h4>
                                        {isCurrent && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">MEVCUT</span>}
                                    </div>
                                    <p className="text-lg font-black theme-text-primary mb-3">
                                        {Number(p.price) > 0 ? (
                                            <>
                                                {Number(p.price).toLocaleString('tr-TR')} <span className="text-xs font-normal theme-text-secondary">â‚º / ay</span>
                                            </>
                                        ) : (
                                            <span className="text-green-500">Ãœcretsiz</span>
                                        )}
                                    </p>
                                    <button
                                        disabled={(isCurrent && (sub.is_subscribed || isFree)) || isPending}
                                        onClick={() => {
                                            if (isFree) {
                                                if (sub.is_subscribed) {
                                                    if (window.confirm(`${p.name} Ã¼cretsiz paketine geÃ§mek istediÄŸinizden emin misiniz? Mevcut Ã¼cretli aboneliÄŸiniz dÃ¶nem sonunda sona erecek ÅŸekilde iptal edilecektir.`)) {
                                                        swapMutation.mutate(p.id)
                                                    }
                                                } else {
                                                    checkoutMutation.mutate(p.id)
                                                }
                                                return
                                            }

                                            if (sub.is_subscribed) {
                                                if (window.confirm(`${p.name} paketine geÃ§mek istediÄŸinizden emin misiniz? Aradaki fiyat farkÄ± Paddle tarafÄ±ndan otomatik hesaplanacaktÄ±r.`)) {
                                                    swapMutation.mutate(p.id)
                                                }
                                            } else {
                                                checkoutMutation.mutate(p.id)
                                            }
                                        }}
                                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${(isCurrent && (sub.is_subscribed || isFree)) ? 'theme-button-secondary theme-text-secondary cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'}`}
                                    >
                                        {isPending ? <Loader2 size={14} className="animate-spin m-auto" /> : (isCurrent && (sub.is_subscribed || isFree)) ? 'Åu Anki Paketiniz' : sub.is_subscribed ? 'Bu Pakete GeÃ§' : 'Bu Paketle BaÅŸla'}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="theme-surface border theme-divider rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b theme-divider">
                    <h3 className="text-sm font-bold theme-text-primary">Ã–deme GeÃ§miÅŸi</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm theme-table">
                        <thead className="bg-[#F4F5F7]/50 dark:bg-white/5 theme-text-secondary text-[10px] uppercase font-bold">
                            <tr>
                                <th className="px-6 py-3">Tarih</th>
                                <th className="px-6 py-3">AÃ§Ä±klama</th>
                                <th className="px-6 py-3 text-right">Tutar</th>
                                <th className="px-6 py-3 text-right">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {paginatedReceipts.map((r, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-xs">
                                    <td className="px-6 py-4 theme-text-secondary">
                                        {new Date(r.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 font-medium theme-text-primary">{r.description || 'Abonelik Ã–demesi'}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold theme-text-primary">{r.total ? (r.total / 100).toFixed(2) : '0.00'} {r.currency}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="px-2 py-1 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-lg border border-green-200 dark:border-green-500/20 uppercase">
                                                BaÅŸarÄ±lÄ±
                                            </span>
                                            <button
                                                onClick={() => api.get(`/billing/receipt/${r.id}`).then(res => res.data.url && window.open(res.data.url, '_blank')).catch(() => toast.error('Fatura alÄ±namadÄ±'))}
                                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg theme-text-secondary hover:text-indigo-500 transition-colors"
                                                title="FaturayÄ± Ä°ndir"
                                            >
                                                <Download size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!sub.receipts || sub.receipts.length === 0) && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center theme-text-secondary">HenÃ¼z bir Ã¶deme kaydÄ± bulunmamaktadÄ±r.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalItems={receipts.length}
                />
            </div>

            <Modal open={successModal} onClose={() => window.location.reload()} title="Ã–deme BaÅŸarÄ±lÄ±" size="sm">
                <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold theme-text-primary">AboneliÄŸiniz Aktif Edildi</h3>
                        <p className="text-sm theme-text-secondary mt-2">
                            Ã–demeniz baÅŸarÄ±yla alÄ±ndÄ±. Yeni limitleriniz ve Ã¶zellikleriniz tanÄ±mlandÄ±.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        Paneli Yenile ve BaÅŸla
                    </button>
                </div>
            </Modal>
        </div>
    )
}

