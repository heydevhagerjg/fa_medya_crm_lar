import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import {
    CheckCircle2, XCircle, Clock, AlertCircle,
    FileText, Calendar, Building2, User, ChevronRight,
    Check, Download, RotateCcw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPhoneNumber } from '../lib/utils'


const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
const formatDate = (val) => val ? new Date(val).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'
const formatDateTime = (val) => val ? new Date(val).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

export default function PublicProposalPage() {
    const { uuid } = useParams()
    const [action, setAction] = useState(null) // 'ACCEPT', 'REJECT', 'REVISE'
    const [notes, setNotes] = useState('')

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['public-proposal', uuid],
        queryFn: () => axios.get(`/api/public/proposals/${uuid}`).then(r => r.data),
    })

    const respondMutation = useMutation({
        mutationFn: (payload) => axios.post(`/api/public/proposals/${uuid}/respond`, payload),
        onSuccess: (res) => {
            toast.success(res.data.message)
            setAction(null)
            setNotes('')
            refetch()
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Bir hata oluştu.'),
    })

    if (isLoading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
        </div>
    )

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
                <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">Teklif Bulunamadı</h1>
                <p className="text-gray-500">Aradığınız teklif formu silinmiş veya bağlantı hatalı olabilir.</p>
            </div>
        </div>
    )

    const { proposal, can_respond, message: statusMessage } = data

    return (
        <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8">

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                                <FileText size={24} />
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hizmet Teklif Formu</h1>
                        </div>
                        <p className="text-gray-500 max-w-md">Sayın <strong>{proposal.customer?.name}</strong>, sizin için hazırladığımız özel hizmet teklifini aşağıda inceleyebilirsiniz.</p>
                    </div>

                    <div className="flex flex-col gap-2 items-start md:items-end relative z-10">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${(proposal.valid_until && new Date(proposal.valid_until) < new Date().setHours(0, 0, 0, 0)) ? 'bg-black text-white border-black' :
                            proposal.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 border-green-200' :
                                proposal.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                    proposal.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600 border-gray-300' :
                                        proposal.status === 'RENEWAL_REQUESTED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                            proposal.status === 'REVISION_REQUESTED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                            {(proposal.valid_until && new Date(proposal.valid_until) < new Date().setHours(0, 0, 0, 0) && proposal.status === 'SENT') ? 'Süresi Dolmuş' :
                                proposal.status === 'DRAFT' ? 'Taslak' :
                                    proposal.status === 'SENT' ? 'Bekliyor' :
                                        proposal.status === 'ACCEPTED' ? 'Onaylandı' :
                                            proposal.status === 'REJECTED' ? 'Reddedildi' :
                                                proposal.status === 'CANCELLED' ? 'Teklif Geri Çekildi' :
                                                    proposal.status === 'RENEWAL_REQUESTED' ? 'Yenileme Talebi' : 'Revize İstendi'}
                        </span>
                        <div className={`flex items-center gap-2 text-sm font-medium ${(proposal.valid_until && new Date(proposal.valid_until) < new Date().setHours(0, 0, 0, 0)) ? 'text-red-500' : 'text-gray-500'
                            }`}>
                            <Calendar size={16} />
                            Geçerlilik: {formatDate(proposal.valid_until)}
                        </div>
                        <a
                            href={`/api/public/proposals/${uuid}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-slate-200"
                        >
                            <Download size={14} /> PDF Olarak İndir
                        </a>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                            <Building2 size={14} /> Hizmet Sağlayıcı
                        </div>
                        {proposal.tenant?.logo && (
                            <img 
                                src={proposal.tenant.logo} 
                                alt={proposal.tenant.name}
                                className="w-20 h-20 object-contain mb-4 rounded-lg bg-gray-50 p-2"
                                onError={(e) => {
                                    // If signed URL expires, fallback to backend endpoint
                                    e.target.src = `/api/logo/${proposal.tenant.id}`;
                                }}
                            />
                        )}
                        <div className="font-bold text-lg text-gray-900 mb-1">{proposal.tenant?.name}</div>
                        <div className="text-sm text-gray-500 mb-2">{proposal.tenant?.address || 'Adres belirtilmemiş'}</div>
                        {proposal.tenant?.email && <div className="text-sm text-gray-500">{proposal.tenant.email}</div>}
                        {proposal.tenant?.phone && <div className="text-sm text-gray-500">{formatPhoneNumber(proposal.tenant.phone)}</div>}
                        {proposal.tenant?.website && (
                            <div className="text-sm text-indigo-600 hover:text-indigo-700">
                                <a href={proposal.tenant.website} target="_blank" rel="noopener noreferrer">
                                    {proposal.tenant.website}
                                </a>
                            </div>
                        )}
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                            <User size={14} /> Müşteri Bilgileri
                        </div>
                        <div className="font-bold text-lg text-gray-900 mb-1">{proposal.customer?.name}</div>
                        <div className="text-sm text-gray-500">{proposal.customer?.email}</div>
                        <div className="text-sm text-gray-500">{formatPhoneNumber(proposal.customer?.phone)}</div>

                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{proposal.title}</h2>
                        <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{proposal.description}</div>
                    </div>

                    <div className="p-0">
                        <table className="w-full text-left theme-table">
                            <thead>
                                <tr className="bg-white">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Hizmet / Ürün</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Adet</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Birim Fiyat</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Toplam</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {proposal.items?.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6 font-medium text-gray-800">{item.description}</td>
                                        <td className="px-8 py-6 text-gray-500 text-center">{item.quantity}</td>
                                        <td className="px-8 py-6 text-gray-500 text-right">{formatCurrency(item.unit_price)}</td>
                                        <td className="px-8 py-6 font-bold text-gray-900 text-right">{formatCurrency(item.total_price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="rounded-3xl p-8 bg-slate-900 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
                            <div className="text-center sm:text-left space-y-4 flex-1">
                                <div>
                                    <div className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Ödeme Özeti</div>
                                    <div className="text-2xl font-bold mb-1">Genel Toplam</div>
                                </div>

                                {proposal.is_vat_included && (
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 max-w-xs">
                                        <div className="text-slate-400 text-sm font-medium">Ara Toplam:</div>
                                        <div className="text-right text-sm font-bold text-slate-200">{formatCurrency(proposal.subtotal)}</div>
                                        <div className="text-slate-400 text-sm font-medium">KDV (%{proposal.vat_rate}):</div>
                                        <div className="text-right text-sm font-bold text-slate-200">{formatCurrency(proposal.vat_amount)}</div>
                                    </div>
                                )}
                            </div>
                            <div className="text-4xl sm:text-6xl font-black text-white tracking-tighter shrink-0">
                                {formatCurrency(proposal.total_price)}
                            </div>
                        </div>
                    </div>
                    {/* Payment Schedule Card */}
                    {proposal.installments?.length > 0 && (
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-6 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                                <Clock size={14} /> Ödeme Takvimi
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {proposal.installments.map((ins, idx) => (
                                    <div key={idx} className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 flex flex-col gap-2 relative overflow-hidden group hover:bg-white hover:border-indigo-100 transition-all">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full -mr-8 -mt-8"></div>
                                        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{ins.description || `${idx + 1}. Ödeme`}</div>
                                        <div className="text-xl font-bold text-gray-900">{formatCurrency(ins.amount)}</div>
                                        <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                                            <Calendar size={12} className="text-gray-400" /> {formatDate(ins.payment_date)}
                                        </div>
                                        {ins.is_paid && (
                                            <div className="absolute bottom-3 right-3 text-green-500">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Section */}
                <div className="space-y-6">
                    {!can_respond ? (
                        <div className="space-y-4">
                            <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 flex items-start gap-4">
                                <Clock className="text-orange-500 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-orange-900 mb-1">Bilgilendirme</h4>
                                    <p className="text-orange-800 text-sm leading-relaxed">{statusMessage || 'Bu teklif şu anki durumuyla yanıtlanamaz.'}</p>
                                </div>
                            </div>

                            {(proposal.valid_until && new Date(proposal.valid_until) < new Date().setHours(0, 0, 0, 0) && proposal.status === 'SENT') && (
                                <button
                                    onClick={() => respondMutation.mutate({ action: 'RENEWAL_REQUEST' })}
                                    disabled={respondMutation.isPending}
                                    className="w-full p-6 bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-3xl shadow-sm transition-all group flex flex-col items-center justify-center gap-3"
                                >
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                        <RotateCcw size={24} />
                                    </div>
                                    <div className="text-center">
                                        <span className="block font-bold text-gray-900">Teklifi Yenilemesini İste</span>
                                        <span className="text-xs text-slate-500">Teklifin süresi dolduğu için yeni bir teklif talep edebilirsiniz.</span>
                                    </div>
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <button
                                    disabled={respondMutation.isPending}
                                    onClick={() => {
                                        if (confirm('Teklifi onaylamak istediğinize emin misiniz?')) {
                                            respondMutation.mutate({ action: 'ACCEPT' })
                                        }
                                    }}
                                    className="flex flex-col items-center justify-center p-6 bg-white border-2 border-transparent hover:border-green-500 rounded-3xl shadow-sm transition-all group"
                                >
                                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-3 group-hover:scale-110 transition-transform">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <span className="font-bold text-gray-900">{respondMutation.isPending && action === 'ACCEPT' ? 'Onaylanıyor...' : 'Teklifi Onayla'}</span>
                                </button>

                                <button
                                    onClick={() => setAction('REVISE')}
                                    className="flex flex-col items-center justify-center p-6 bg-white border-2 border-transparent hover:border-orange-500 rounded-3xl shadow-sm transition-all group"
                                >
                                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-3 group-hover:scale-110 transition-transform">
                                        <Clock size={24} />
                                    </div>
                                    <span className="font-bold text-gray-900">Teklif Revizesi İste</span>
                                </button>

                                <button
                                    disabled={respondMutation.isPending}
                                    onClick={() => {
                                        if (confirm('Teklifi reddetmek istediğinize emin misiniz?')) {
                                            respondMutation.mutate({ action: 'REJECT' })
                                        }
                                    }}
                                    className="flex flex-col items-center justify-center p-6 bg-white border-2 border-transparent hover:border-red-500 rounded-3xl shadow-sm transition-all group"
                                >
                                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-3 group-hover:scale-110 transition-transform">
                                        <XCircle size={24} />
                                    </div>
                                    <span className="font-bold text-gray-900">{respondMutation.isPending && action === 'REJECT' ? 'Reddediliyor...' : 'Teklifi Reddet'}</span>
                                </button>
                            </div>

                            {action === 'REVISE' && (
                                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        Teklif Revizesi İste
                                    </h3>
                                    <label className="block text-sm text-gray-500 mb-2">Notlarınız (Eklemeniz gereken detaylar, revize istediğiniz kısımlar vb.)</label>
                                    <textarea
                                        rows={4}
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none mb-6"
                                        placeholder="Mesajınızı buraya yazınız..."
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setAction(null)}
                                            className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            disabled={respondMutation.isPending}
                                            onClick={() => respondMutation.mutate({ action: 'REVISE', customer_notes: notes })}
                                            className="flex-1 px-6 py-3 bg-orange-500 shadow-orange-200 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            {respondMutation.isPending ? 'İşleniyor...' : (
                                                <>
                                                    Onayla ve İlet <ChevronRight size={18} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Timeline Section */}
                {data.history && data.history.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-8 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                            <Clock size={14} /> Teklif Geçmişi
                        </div>
                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {data.history.map((log, idx) => (
                                <div key={idx} className={`relative flex items-center justify-between md:justify-normal group is-active ${log.is_customer ? 'md:flex-row-reverse' : ''}`}>
                                    {/* Icon */}
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-sm shrink-0 md:order-1 transition-all duration-300 
                                        ${log.is_customer
                                            ? 'bg-emerald-500 text-white md:-translate-x-1/2'
                                            : 'bg-indigo-600 text-white md:translate-x-1/2'}`}>
                                        {log.action === 'CREATE' ? <FileText size={16} /> :
                                            log.action === 'UPDATE' ? <Check size={16} /> :
                                                <Clock size={16} />}
                                    </div>
                                    {/* Content */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between space-x-2 mb-2">
                                            <div className={`font-bold text-sm ${log.is_customer ? 'text-emerald-700' : 'text-indigo-900'}`}>
                                                {log.action === 'CREATE' ? 'Teklif Hazırlandı' :
                                                    log.details.includes('gönderildi') ? 'Teklif Sunuldu' :
                                                        log.details.includes('kabul') ? 'Teklif Onaylandı' :
                                                            log.details.includes('red') ? 'Teklif Reddedildi' :
                                                                log.details.includes('revize') ? 'Revize Talep Edildi' : 'İşlem Yapıldı'}
                                            </div>
                                            <time className="font-medium text-gray-400 text-[10px] whitespace-nowrap">{formatDateTime(log.created_at)}</time>
                                        </div>
                                        <div className="text-gray-500 text-xs leading-relaxed">
                                            {log.details || 'Detay belirtilmedi.'}
                                        </div>
                                        <div className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter ${log.is_customer ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {log.is_customer ? 'MÜÅTERİ' : 'HİZMET SAÄLAYICI'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center py-8">
                    <p className="text-xs text-gray-400 font-medium tracking-widest uppercase flex items-center justify-center gap-2">
                        Powered by <span className="text-indigo-400 font-black">{import.meta.env.VITE_APP_NAME}</span>
                    </p>
                </div>
            </div>
        </div>
    )
}

