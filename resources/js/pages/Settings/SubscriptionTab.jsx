import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, ShieldCheck, Clock, Layers, Wallet, Loader2, XCircle, CheckCircle, Download } from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal.jsx'
import Pagination from '../../components/ui/Pagination.jsx'

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
                    toast.error('Ödeme ekranı açılırken bir hata oluştu.')
                }
            } else {
                toast.error(res.message || 'Ödeme bilgileri alınamadı.')
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Ödeme linki oluşturulamadı.')
    })

    const cancelMutation = useMutation({
        mutationFn: () => api.post('/billing/cancel').then(r => r.data),
        onSuccess: (res) => {
            qc.invalidateQueries(['subscription'])
            toast.success(res.message)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'İşlem başarısız.')
    })

    const swapMutation = useMutation({
        mutationFn: (package_id) => api.post('/billing/swap', { package_id }).then(r => r.data),
        onSuccess: (res) => {
            qc.invalidateQueries(['subscription'])
            toast.success(res.message)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'İşlem başarısız.')
    })

    if (isLoading) return <div className="text-center py-8 text-gray-400">Yükleniyor...</div>

    const receipts = sub.receipts || []
    const totalPages = Math.ceil(receipts.length / perPage)
    const paginatedReceipts = receipts.slice((page - 1) * perPage, page * perPage)

    const nextBilledAt = sub.subscription?.next_billed_at || sub.subscription?.scheduled_change?.effective_at || sub.subscription?.billing_period?.ends_at || sub.trial_ends_at

    const isUnlimited = sub.is_gifted || (sub.is_on_trial && sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date(new Date().setFullYear(new Date().getFullYear() + 50)))

    return (
        <div className="max-w-4xl space-y-6">
            <div className={`grid grid-cols-1 ${sub.is_gifted ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">MEVCUT PAKET</div>
                        <CreditCard size={18} className="text-indigo-500" />
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                        <p className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{sub.package?.name || 'Paket Seçilmedi'}</p>
                    </div>
                    {sub.is_subscribed || sub.on_trial || sub.is_gifted || sub.is_free ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-lg border border-green-100 dark:border-green-500/20 w-fit">
                            <ShieldCheck size={12} /> AKTİF
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-lg border border-red-100 dark:border-red-500/20 w-fit uppercase">
                            Pasif / Süresi Dolmuş
                        </div>
                    )}
                </div>

                {!sub.is_gifted && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">DENEME BİTİŞ</div>
                            <Clock size={16} className="text-amber-500" />
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </p>
                        <p className="text-xs text-gray-400 mt-2 font-medium">Kredi kartı gerekmeden ücretsiz deneyin.</p>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center items-center text-center">
                    {sub.is_subscribed ? (
                        <div className="space-y-4 w-full">
                            <div className="text-center">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Abonelik Aktif</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {sub.subscription?.ends_at
                                        ? `Bitiş: ${new Date(sub.subscription.ends_at).toLocaleDateString('tr-TR')}`
                                        : `Yenileme: ${nextBilledAt ? new Date(nextBilledAt).toLocaleDateString('tr-TR') : '-'}`
                                    }
                                </p>
                            </div>

                            {!sub.subscription?.ends_at && (
                                <button
                                    onClick={() => { if (window.confirm('Aboneliğinizi dönem sonunda sona ermek üzere iptal etmek istediğinize emin misiniz?')) cancelMutation.mutate() }}
                                    disabled={cancelMutation.isPending}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/20 transition-colors"
                                >
                                    {cancelMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                    Aboneliği İptal Et
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
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Sınırsız Erişim</p>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase font-black tracking-widest">Yönetici Tarafından Yetkilendirildi</p>
                            </div>
                        </div>
                    ) : sub.is_free ? (
                        <div className="text-center space-y-2">
                            <div className="mx-auto w-10 h-10 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{sub.package?.name || 'Aktif Plan'}</p>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase font-black tracking-widest">Ömür Boyu Ücretsiz Kullanım</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Tam özellikler için abone olun</p>
                            <button
                                onClick={() => checkoutMutation.mutate()}
                                disabled={checkoutMutation.isPending}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                {checkoutMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                                Şimdi Abone Ol
                            </button>
                        </>
                    )}
                </div>
            </div>

            {!sub.is_gifted && sub.all_packages?.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden p-6">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Layers size={18} className="text-indigo-500" /> {sub.is_subscribed ? 'Paket Değiştir / Yükselt' : 'Bir Paket Seçin ve Başlayın'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sub.all_packages.map(p => {
                            const isCurrent = p.id === sub.package?.id
                            const isPending = sub.is_subscribed ? swapMutation.isPending : checkoutMutation.isPending
                            const isFree = Number(p.price) <= 0 || !p.paddle_price_id

                            return (
                                <div key={p.id} className={`p-4 rounded-xl border ${isCurrent ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/5' : 'border-gray-100 dark:border-gray-800'} transition-all`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{p.name}</h4>
                                        {isCurrent && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">MEVCUT</span>}
                                    </div>
                                    <p className="text-lg font-black text-gray-900 dark:text-white mb-3">
                                        {Number(p.price) > 0 ? (
                                            <>
                                                {Number(p.price).toLocaleString('tr-TR')} <span className="text-xs font-normal text-gray-400">₺ / ay</span>
                                            </>
                                        ) : (
                                            <span className="text-green-500">Ücretsiz</span>
                                        )}
                                    </p>
                                    <button
                                        disabled={(isCurrent && (sub.is_subscribed || isFree)) || isPending}
                                        onClick={() => {
                                            if (isFree) {
                                                if (sub.is_subscribed) {
                                                    if (window.confirm(`${p.name} ücretsiz paketine geçmek istediğinizden emin misiniz? Mevcut ücretli aboneliğiniz dönem sonunda sona erecek şekilde iptal edilecektir.`)) {
                                                        swapMutation.mutate(p.id)
                                                    }
                                                } else {
                                                    checkoutMutation.mutate(p.id)
                                                }
                                                return
                                            }

                                            if (sub.is_subscribed) {
                                                if (window.confirm(`${p.name} paketine geçmek istediğinizden emin misiniz? Aradaki fiyat farkı Paddle tarafından otomatik hesaplanacaktır.`)) {
                                                    swapMutation.mutate(p.id)
                                                }
                                            } else {
                                                checkoutMutation.mutate(p.id)
                                            }
                                        }}
                                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${(isCurrent && (sub.is_subscribed || isFree)) ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'}`}
                                    >
                                        {isPending ? <Loader2 size={14} className="animate-spin m-auto" /> : (isCurrent && (sub.is_subscribed || isFree)) ? 'Şu Anki Paketiniz' : sub.is_subscribed ? 'Bu Pakete Geç' : 'Bu Paketle Başla'}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Ödeme Geçmişi</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 text-[10px] uppercase font-bold">
                            <tr>
                                <th className="px-6 py-3">Tarih</th>
                                <th className="px-6 py-3">Açıklama</th>
                                <th className="px-6 py-3 text-right">Tutar</th>
                                <th className="px-6 py-3 text-right">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedReceipts.map((r, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-xs">
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        {new Date(r.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{r.description || 'Abonelik Ödemesi'}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-white">{r.total ? (r.total / 100).toFixed(2) : '0.00'} {r.currency}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="px-2 py-1 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-lg border border-green-200 dark:border-green-500/20 uppercase">
                                                Başarılı
                                            </span>
                                            <button
                                                onClick={() => api.get(`/billing/receipt/${r.id}`).then(res => res.data.url && window.open(res.data.url, '_blank')).catch(() => toast.error('Fatura alınamadı'))}
                                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-500 transition-colors"
                                                title="Faturayı İndir"
                                            >
                                                <Download size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!sub.receipts || sub.receipts.length === 0) && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400">Henüz bir ödeme kaydı bulunmamaktadır.</td>
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

            <Modal open={successModal} onClose={() => window.location.reload()} title="Ödeme Başarılı" size="sm">
                <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Aboneliğiniz Aktif Edildi</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Ödemeniz başarıyla alındı. Yeni limitleriniz ve özellikleriniz tanımlandı.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        Paneli Yenile ve Başla
                    </button>
                </div>
            </Modal>
        </div>
    )
}
