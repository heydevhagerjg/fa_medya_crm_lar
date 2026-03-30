import { useQuery } from '@tanstack/react-query'
import { User, Clock, Loader2, Database, ShieldAlert, FileText, Smartphone, Laptop, Globe } from 'lucide-react'
import api from '../../lib/api.js'
import SettingsPageHeader from './Shared/SettingsPageHeader.jsx'

export default function AuditLogTab() {
    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: () => api.get('/logs').then(r => r.data.logs)
    })

    const getActionColor = (action) => {
        if (!action) return 'theme-text-secondary bg-[#F4F5F7] dark:bg-gray-500/10'
        const lowerAction = action.toLowerCase()
        if (lowerAction.includes('create')) return 'text-green-600 bg-green-50 dark:bg-green-500/10'
        if (lowerAction.includes('update')) return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10'
        if (lowerAction.includes('delete')) return 'text-red-600 bg-red-50 dark:bg-red-500/10'
        return 'theme-text-secondary bg-[#F4F5F7] dark:bg-gray-500/10'
    }

    const getActionLabel = (action) => {
        if (!action) return 'EVENT'
        if (action === 'CREATE') return 'Oluşturuldu'
        if (action === 'UPDATE') return 'Güncellendi'
        if (action === 'DELETE') return 'Silindi'
        return action
    }

    const getEntityTypeLabel = (entityType) => {
        if (!entityType) return 'İşlem'
        const typeMap = {
            'PROPOSAL': 'Teklif',
            'JOB': 'İş',
            'CUSTOMER': 'Müşteri',
            'PAYMENT': 'Ödeme',
            'EXPENSE': 'Gider',
            'APPOINTMENT': 'Randevu',
            'SERVICE': 'Hizmet',
            'STEP_TEMPLATE': 'Adım Şablonu',
            'JOB_STATUS': 'İş Durumu',
            'EXPENSE_CATEGORY': 'Gider Kategorisi',
            'CASH_REGISTER': 'Kasa',
            'SERVICE_TRACKING': 'Hizmet Takibi',
            'BACKUP': 'Yedekleme',
            'USER': 'Kullanıcı',
            'ROLE': 'Rol',
        }
        return typeMap[entityType] || entityType
    }

    const getFullSentence = (action, entityType, entityName, details) => {
        const sentenceMap = {
            'CUSTOMER': {
                'CREATE': (name) => `"${name}" isminde yeni müşteri kaydı oluşturuldu`,
                'UPDATE': (name) => `"${name}" müşteri bilgileri güncellendi`,
                'DELETE': (name) => `"${name}" müşterisi silindi`
            },
            'PROPOSAL': {
                'CREATE': (name) => `"${name}" isminde yeni teklif oluşturuldu`,
                'UPDATE': (name) => `"${name}" teklifi güncellendi`,
                'DELETE': (name) => `"${name}" teklifi iptal edildi`
            },
            'JOB': {
                'CREATE': (name) => `"${name}" isminde yeni iş kaydı oluşturuldu`,
                'UPDATE': (name) => `"${name}" iş detayları güncellendi`,
                'DELETE': (name) => `"${name}" iş kaydı silindi`
            },
            'PAYMENT': {
                'CREATE': (name) => `"${name}" ödeme kaydı oluşturuldu`,
                'UPDATE': (name) => `"${name}" ödeme güncellendi`,
                'DELETE': (name) => `"${name}" ödeme silindi`
            },
            'EXPENSE': {
                'CREATE': (name) => `"${name}" isminde yeni gider kaydı oluşturuldu`,
                'UPDATE': (name) => `"${name}" gider güncellendi`,
                'DELETE': (name) => `"${name}" gider silindi`
            },
            'APPOINTMENT': {
                'CREATE': (name) => `"${name}" randevusu oluşturuldu`,
                'UPDATE': (name) => `"${name}" randevu detayları değiştirildi`,
                'DELETE': (name) => `"${name}" randevusu iptal edildi`
            },
            'SERVICE': {
                'CREATE': (name) => `"${name}" hizmeti tanımlandı`,
                'UPDATE': (name) => `"${name}" hizmeti güncellendi`,
                'DELETE': (name) => `"${name}" hizmeti silindi`
            },
            'SERVICE_TRACKING': {
                'CREATE': (name) => `"${name}" hizmet takibi başlatıldı`,
                'UPDATE': (name) => `"${name}" hizmet takibi güncellendi`,
                'DELETE': (name) => `"${name}" hizmet takibi iptal edildi`
            },
            'USER': {
                'CREATE': (name) => `"${name}" adında yeni kullanıcı hesabı oluşturuldu`,
                'UPDATE': (name) => `"${name}" kullanıcı bilgileri güncellendi`,
                'DELETE': (name) => `"${name}" kullanıcısı devre dışı bırakıldı`
            },
            'ROLE': {
                'CREATE': (name) => `"${name}" rolü tanımlandı`,
                'UPDATE': (name) => `"${name}" rolü güncellendi`,
                'DELETE': (name) => `"${name}" rolü silindi`
            },
            'CASH_REGISTER': {
                'CREATE': (name) => `"${name}" kasası oluşturuldu`,
                'UPDATE': (name) => `"${name}" kasa ayarları güncellendi`,
                'DELETE': (name) => `"${name}" kasası silindi`
            },
            'EXPENSE_CATEGORY': {
                'CREATE': (name) => `"${name}" gider kategorisi oluşturuldu`,
                'UPDATE': (name) => `"${name}" gider kategorisi güncellendi`,
                'DELETE': (name) => `"${name}" gider kategorisi silindi`
            },
            'STEP_TEMPLATE': {
                'CREATE': (name) => `"${name}" adım şablonu oluşturuldu`,
                'UPDATE': (name) => `"${name}" adım şablonu güncellendi`,
                'DELETE': (name) => `"${name}" adım şablonu silindi`
            },
            'JOB_STATUS': {
                'CREATE': (name) => `"${name}" iş durumu tanımlandı`,
                'UPDATE': (name) => `"${name}" iş durumu güncellendi`,
                'DELETE': (name) => `"${name}" iş durumu silindi`
            },
            'BACKUP': {
                'CREATE': (name) => `"${name}" sistem yedeği alındı`,
                'UPDATE': (name) => `"${name}" yedek ayarları güncellendi`,
                'DELETE': (name) => `"${name}" yedeği silindi`
            },
        }

        // Özel mapping var mı?
        if (sentenceMap[entityType] && sentenceMap[entityType][action]) {
            return sentenceMap[entityType][action](entityName || 'İşlem')
        }

        // Fallback: details varsa onu kullan
        if (details) {
            return details
        }

        // Son fallback: generic cümle
        const entityLabel = getEntityTypeLabel(entityType)
        if (action === 'CREATE') return `"${entityName || 'İşlem'}" ${entityLabel.toLowerCase()} oluşturuldu`
        if (action === 'UPDATE') return `"${entityName || 'İşlem'}" ${entityLabel.toLowerCase()} güncellendi`
        if (action === 'DELETE') return `"${entityName || 'İşlem'}" ${entityLabel.toLowerCase()} silindi`
        return `"${entityName || 'İşlem'}" ${entityLabel.toLowerCase()} işlemi yapıldı`
    }

    const getDeviceIcon = (ua) => {
        if (!ua) return <Globe size={14} />
        const u = ua.toLowerCase()
        if (u.includes('mobile') || u.includes('android') || u.includes('iphone')) return <Smartphone size={14} />
        if (u.includes('windows') || u.includes('macintosh') || u.includes('linux')) return <Laptop size={14} />
        return <Globe size={14} />
    }

    if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-[#905EFC]" size={32} /></div>

    return (
        <div className="space-y-4">
            <SettingsPageHeader title="Denetim Kayıtları" />

            <div className="bg-[#905EFC]/10 dark:bg-[#905EFC]/10 p-4 rounded-xl border border-[#905EFC]/20 dark:border-[#905EFC]/10 flex items-start gap-4">
                <div className="p-2 bg-[#905EFC]/20 dark:bg-[#905EFC]/10 rounded-xl text-[#905EFC]">
                    <ShieldAlert size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold theme-text-primary">Güvenlik Logları</h3>
                    <p className="text-xs theme-text-secondary mt-1">Sistem üzerindeki tüm kritik işlemler (ekleme, silme, güncelleme) denetim amaçlı kayıt altına alınır.</p>
                </div>
            </div>

            <div className="theme-surface border theme-divider rounded-xl overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-50 dark:divide-white/5">
                    {logs.map(log => (
                        <div key={log.id} className="p-4 hover:bg-[#F4F5F7] dark:hover:bg-white/10 transition-all group">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-10 h-10 bg-[#E5E9F0] dark:bg-white/5 rounded-xl flex items-center justify-center theme-text-secondary group-hover:bg-[#905EFC]/10 group-hover:text-[#905EFC] transition-colors shrink-0">
                                        <FileText size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div className="text-sm theme-text-primary flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-black ${getActionColor(log.action)}`}>
                                                {getActionLabel(log.action)}
                                            </span>
                                            {log.user ? (
                                                <span>
                                                    <span className="font-semibold text-[#905EFC]">{log.user.name}</span>
                                                    <span className="theme-text-secondary mx-1">tarafından</span>
                                                    <span className="theme-text-primary">
                                                        {getFullSentence(log.action, log.entity_type, log.entity_name, log.details)}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="theme-text-primary">
                                                    {getFullSentence(log.action, log.entity_type, log.entity_name, log.details)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] theme-text-secondary flex-wrap justify-end md:justify-start">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} className="text-amber-400" />
                                        {new Date(log.created_at).toLocaleString('tr-TR')}
                                    </span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                    <span className="flex items-center gap-1 font-mono uppercase text-[10px] tracking-tight bg-[#E5E9F0] dark:bg-white/5 px-1.5 py-0.5 rounded">
                                        {log.ip_address}
                                    </span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                    <span className="flex items-center gap-1" title={log.user_agent}>
                                        {getDeviceIcon(log.user_agent)} {log.user_agent?.split(' ')[0]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {logs.length === 0 && (
                    <div className="p-12 text-center theme-text-secondary italic">
                        <Database size={32} className="mx-auto mb-2 opacity-20" />
                        Log kaydı bulunamadı.
                    </div>
                )}
            </div>
        </div>
    )
}
