import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { 
    Settings, Layers, ListTodo, ClipboardList, Wallet, FolderOpen, 
    CalendarCheck, Activity, Users, Shield, Key, Database, ShieldAlert, Plus,
    CreditCard
} from 'lucide-react'
import { useAuthStore } from '../stores/index.js'
import PageHeader from '../components/layout/PageHeader.jsx'

// Modüler Bileşenler
import GeneralTab from './Settings/GeneralTab.jsx'
import ServicesTab from './Settings/ServicesTab.jsx'
import StatusesTab from './Settings/StatusesTab.jsx'
import TemplatesTab from './Settings/TemplatesTab.jsx'
import CashRegistersTab from './Settings/CashRegistersTab.jsx'
import ExpenseCategoriesTab from './Settings/ExpenseCategoriesTab.jsx'
import AppointmentTitlesTab from './Settings/AppointmentTitlesTab.jsx'
import ServiceTrackingCategoriesTab from './Settings/ServiceTrackingCategoriesTab.jsx'
import WorkflowsTab from './Settings/WorkflowsTab.jsx'
import UsersTab from './Settings/UsersTab.jsx'
import RolesTab from './Settings/RolesTab.jsx'
import ApiKeysTab from './Settings/ApiKeysTab.jsx'
import BackupTab from './Settings/BackupTab.jsx'
import AuditLogTab from './Settings/AuditLogTab.jsx'
import SubscriptionTab from './Settings/SubscriptionTab.jsx'
import PackageUsageTab from './Settings/PackageUsageTab.jsx'

export default function SettingsPage() {
    const { user } = useAuthStore()
    const location = useLocation()
    const [activeTab, setActiveTab] = useState('general')
    const [tenant, setTenant] = useState(user?.tenant || {})

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const tab = params.get('tab')
        if (tab) setActiveTab(tab)
    }, [location])

    useEffect(() => {
        if (user?.tenant) setTenant(user.tenant)
    }, [user])

    const menuItems = [
        { id: 'general', label: 'Genel Bilgiler', icon: Settings, to: '/settings?tab=general' },
        { id: 'services', label: 'Hizmet Tanımları', icon: Layers, to: '/settings?tab=services' },
        { id: 'statuses', label: 'İş Akış Durumları', icon: ListTodo, to: '/settings?tab=statuses' },
        { id: 'templates', label: 'Adım Şablonları', icon: ClipboardList, to: '/settings?tab=templates' },
        { id: 'cash-registers', label: 'Kasa Yönetimi', icon: Wallet, to: '/settings?tab=cash-registers' },
        { id: 'expense-categories', label: 'Gider Kategorileri', icon: FolderOpen, to: '/settings?tab=expense-categories' },
        { id: 'appointment-titles', label: 'Randevu Başlıkları', icon: CalendarCheck, to: '/settings?tab=appointment-titles' },
        { id: 'service-tracking', label: 'Hizmet Takip Kategorileri', icon: Activity, to: '/settings?tab=service-tracking' },
        { id: 'workflows', label: 'İş Otomasyonları', icon: Activity, to: '/settings?tab=workflows' },
        { id: 'users', label: 'Personel Yönetimi', icon: Users, to: '/settings?tab=users' },
        { id: 'roles', label: 'Yetki Grupları (Roller)', icon: Shield, to: '/settings?tab=roles' },
        { id: 'api-keys', label: 'API / Entegrasyon', icon: Key, to: '/settings?tab=api-keys' },
        { id: 'backups', label: 'Veri Yedekleme', icon: Database, to: '/settings?tab=backups' },
        { id: 'logs', label: 'Denetim Kayıtları', icon: ShieldAlert, to: '/settings?tab=logs' },
        { id: 'subscription', label: 'Abonelik & Ödeme', icon: CreditCard, to: '/settings?tab=subscription' },
        { id: 'plan-usage', label: 'Paket Kullanımı', icon: Activity, to: '/settings?tab=plan-usage' },
    ]

    const menuLabels = {
        'general': 'Genel Bilgiler',
        'services': 'Hizmet Tanımları',
        'statuses': 'İş Akış Durumları',
        'templates': 'Adım Şablonları',
        'cash-registers': 'Kasa Yönetimi',
        'expense-categories': 'Gider Kategorileri',
        'appointment-titles': 'Randevu Başlıkları',
        'service-tracking': 'Hizmet Takip Kategorileri',
        'workflows': 'İş Otomasyonları',
        'users': 'Personel Yönetimi',
        'roles': 'Yetki Grupları (Roller)',
        'api-keys': 'API / Entegrasyon',
        'backups': 'Veri Yedekleme',
        'logs': 'Denetim Kayıtları',
        'subscription': 'Abonelik & Ödeme',
        'plan-usage': 'Paket Kullanımı',
    }

    const renderTab = () => {
        switch (activeTab) {
            case 'general': return <GeneralTab tenant={tenant} setTenant={setTenant} />
            case 'services': return <ServicesTab />
            case 'statuses': return <StatusesTab />
            case 'templates': return <TemplatesTab />
            case 'cash-registers': return <CashRegistersTab />
            case 'expense-categories': return <ExpenseCategoriesTab />
            case 'appointment-titles': return <AppointmentTitlesTab />
            case 'service-tracking': return <ServiceTrackingCategoriesTab />
            case 'workflows': return <WorkflowsTab />
            case 'users': return <UsersTab />
            case 'roles': return <RolesTab />
            case 'api-keys': return <ApiKeysTab />
            case 'backups': return <BackupTab />
            case 'logs': return <AuditLogTab />
            case 'subscription': return <SubscriptionTab />
            case 'plan-usage': return <PackageUsageTab />
            default: return <GeneralTab tenant={tenant} setTenant={setTenant} />
        }
    }

    return (
        <div className="flex flex-col w-full min-h-screen p-6">
            <PageHeader
                title={menuLabels[activeTab] || 'Ayarlar'}
                breadcrumbs={['Ayarlar', menuLabels[activeTab] || 'Ayarlar']}
                icon={Settings}
                iconColor="text-[#905EFC]"
            />
            <div className="mt-6">
                {renderTab()}
            </div>
        </div>
    )
}
