import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    User,
    MoreVertical,
    MoreHorizontal,
    X,
    CheckCircle2,
    CalendarDays,
    ChevronDown,
    XCircle
} from 'lucide-react'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday, addHours, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAuthStore } from '../stores/index.js'
import PageHeader from '../components/layout/PageHeader.jsx'
import PlanRestrictionView from '../components/ui/PlanRestrictionView.jsx'

export default function AppointmentsPage() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_appointment_feature === false || user?.tenant?.plan_appointment_feature === 0

    if (isFeatureDisabled) {
        return <PlanRestrictionView featureName="Randevu" />
    }
    const qc = useQueryClient()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const urlAppointmentId = searchParams.get('id')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('calendarViewMode') || 'month') // 'day', 'week', 'month'
    const [showViewDropdown, setShowViewDropdown] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [showModal, setShowModal] = useState(false)
    const [editingAppointment, setEditingAppointment] = useState(null)
    const [formData, setFormData] = useState({
        customerId: '',
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        status: 'PENDING'
    })

    // Fetch appointments
    const { data: appointments = [], isLoading: appointmentsLoading, error, isError } = useQuery({
        queryKey: ['appointments'],
        queryFn: () => api.get('/appointments').then(r => r.data),
        retry: false
    })

    // Fetch customers for dropdown
    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: () => api.get('/customers').then(r => r.data)
    })

    // Fetch predefined titles
    const { data: titleTemplates = [] } = useQuery({
        queryKey: ['appointment-titles'],
        queryFn: () => api.get('/settings/appointment-titles').then(r => r.data)
    })

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/appointments', data),
        onSuccess: () => {
            qc.invalidateQueries(['appointments'])
            toast.success('Randevu oluşturuldu.')
            closeModal()
        },
        onError: () => toast.error('Randevu oluşturulamadı.')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/appointments/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries(['appointments'])
            toast.success('Randevu güncellendi.')
            closeModal()
        },
        onError: () => toast.error('Güncelleme başarısız.')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/appointments/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['appointments'])
            toast.success('Randevu silindi.')
        }
    })

    const resetForm = () => {
        setFormData({
            customerId: '',
            title: '',
            description: '',
            startTime: '',
            endTime: '',
            status: 'PENDING'
        })
    }

    const handleStartTimeChange = (val) => {
        const start = parseISO(val)
        if (isNaN(start.getTime())) {
            setFormData({ ...formData, startTime: val })
            return
        }

        const end = addHours(start, 1)
        setFormData({
            ...formData,
            startTime: val,
            endTime: format(end, "yyyy-MM-dd'T'HH:mm")
        })
    }

    const handleEdit = (apt) => {
        setEditingAppointment(apt)
        setFormData({
            customerId: apt.customerId,
            title: apt.title,
            description: apt.description || '',
            startTime: apt.startTime.slice(0, 16),
            endTime: apt.endTime.slice(0, 16),
            status: apt.status
        })
        setShowModal(true)
        setSearchParams({ id: apt.id })
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingAppointment(null)
        resetForm()
        if (searchParams.has('id')) {
            navigate('/appointments', { replace: true })
        }
    }

    useEffect(() => {
        if (urlAppointmentId && appointments.length > 0 && !showModal) {
            const apt = appointments.find(a => a.id.toString() === urlAppointmentId)
            if (apt) {
                handleEdit(apt)
            }
        }
    }, [urlAppointmentId, appointments])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (editingAppointment) {
            updateMutation.mutate({ id: editingAppointment.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    // Calendar logic
    const days = useMemo(() => {
        if (viewMode === 'day') {
            return [currentDate]
        }
        if (viewMode === 'week') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 })
            const end = endOfWeek(currentDate, { weekStartsOn: 1 })
            return eachDayOfInterval({ start, end })
        }
        // month
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
        return eachDayOfInterval({ start, end })
    }, [currentDate, viewMode])

    const next = () => {
        if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1))
        else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1))
        else setCurrentDate(addMonths(currentDate, 1))
    }

    const prev = () => {
        if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1))
        else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1))
        else setCurrentDate(subMonths(currentDate, 1))
    }

    const handleViewChange = (mode) => {
        setViewMode(mode)
        localStorage.setItem('calendarViewMode', mode)
        setCurrentDate(new Date())
        setShowViewDropdown(false)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Randevular"
                subtitle="Müşteri randevularınızı takvim üzerinden yönetin"
                icon={CalendarIcon}
                iconColor="text-indigo-500"
                actions={[
                    { label: 'Yeni Randevu', onClick: () => { resetForm(); setShowModal(true); }, icon: Plus, variant: 'primary' }
                ]}
                breadcrumbs={['Randevular']}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar Detail / List View */}
                <div className="lg:col-span-3 theme-surface rounded-3xl border shadow-sm flex flex-col min-h-[600px]">
                    {appointmentsLoading ? (
                        <div className="p-12 text-center theme-text-secondary">Yükleniyor...</div>
                    ) : isError ? (
                        <div className="p-12 text-center theme-text-secondary my-auto">
                            {error?.response?.status === 403 ? (
                                <PlanRestrictionView featureName="Randevu" />
                            ) : (
                                <>
                                    <XCircle size={40} className="mx-auto text-red-400 mb-3" />
                                    <p>Veriler yüklenemedi. Oturumunuz kapanmış olabilir, lütfen sayfayı yenileyiniz.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b theme-divider flex items-center justify-between theme-surface-alt rounded-t-3xl">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-lg font-black theme-text-primary capitalize">
                                        {viewMode === 'day' ? format(currentDate, 'd MMMM yyyy', { locale: tr }) : format(currentDate, 'MMMM yyyy', { locale: tr })}
                                    </h2>
                                    <div className="flex items-center theme-surface rounded-xl border theme-divider shadow-sm p-0.5">
                                        <button onClick={prev} className="p-1.5 theme-nav-item transition-colors rounded-lg"><ChevronLeft size={18} /></button>

                                        <div className="relative">
                                            <button
                                                onClick={() => setShowViewDropdown(!showViewDropdown)}
                                                className="px-3 py-1 text-xs font-bold theme-text-primary theme-nav-item transition-colors border-x theme-divider flex items-center gap-1"
                                            >
                                                {viewMode === 'day' ? 'Bugün' : viewMode === 'week' ? 'Bu Hafta' : 'Bu Ay'}
                                                <ChevronDown size={14} className={`transition-transform ${showViewDropdown ? 'rotate-180' : ''}`} />
                                            </button>

                                            {showViewDropdown && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setShowViewDropdown(false)}></div>
                                                    <div className="absolute top-full left-0 mt-1 w-32 theme-surface border theme-divider rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                                                        <button onClick={() => handleViewChange('day')} className={`w-full text-left px-4 py-2 text-xs font-bold theme-nav-item transition-colors ${viewMode === 'day' ? 'text-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10' : 'theme-text-secondary'}`}>Bugün</button>
                                                        <button onClick={() => handleViewChange('week')} className={`w-full text-left px-4 py-2 text-xs font-bold theme-nav-item transition-colors ${viewMode === 'week' ? 'text-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10' : 'theme-text-secondary'}`}>Bu Hafta</button>
                                                        <button onClick={() => handleViewChange('month')} className={`w-full text-left px-4 py-2 text-xs font-bold theme-nav-item transition-colors ${viewMode === 'month' ? 'text-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10' : 'theme-text-secondary'}`}>Bu Ay</button>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <button onClick={next} className="p-1.5 theme-nav-item transition-colors rounded-lg"><ChevronRight size={18} /></button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto">
                                <div className={`grid border-b theme-divider ${viewMode === 'month' ? 'grid-cols-7' : viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                                    {viewMode === 'day' ? (
                                        <div className="py-3 text-center text-[11px] font-black theme-text-secondary uppercase tracking-widest theme-surface-alt">
                                            {format(currentDate, 'EEEE', { locale: tr })}
                                        </div>
                                    ) : (
                                        ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                                            <div key={day} className="py-3 text-center text-[11px] font-black theme-text-secondary uppercase tracking-widest theme-surface-alt">
                                                {day}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                                    {days.map((day, idx) => {
                                        const dayAppointments = appointments.filter(apt => isSameDay(parseISO(apt.startTime), day))
                                        const isCurrentMonth = isSameMonth(day, currentDate)
                                        const isTodayDay = isToday(day)


                                        return (
                                            <div
                                                key={day.toISOString()}
                                                className={`min-h-[120px] p-2 border-r border-b theme-divider transition-colors group ${!isCurrentMonth ? 'theme-surface-alt opacity-70' : ''} ${isTodayDay ? 'bg-indigo-50/20 dark:bg-indigo-500/5' : ''}`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${isTodayDay ? 'bg-indigo-600 text-white shadow-sm' : isCurrentMonth ? 'theme-text-primary' : 'theme-text-secondary opacity-60'}`}>
                                                        {format(day, 'd')}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    {dayAppointments.map(apt => (
                                                        <button
                                                            key={apt.id}
                                                            onClick={() => handleEdit(apt)}
                                                            className={`w-full text-left p-1.5 rounded-lg text-[10px] font-bold border truncate transition-all ${apt.status === 'COMPLETED'
                                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                                                                : apt.status === 'CANCELLED'
                                                                    ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20'
                                                                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-700 shadow-sm hover:border-yellow-300 dark:hover:border-yellow-500'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                <Clock size={10} className="flex-shrink-0" />
                                                                <span>{format(parseISO(apt.startTime), 'HH:mm')}</span>
                                                            </div>
                                                            <div className="group mt-1">
                                                                <Link
                                                                    to={`/customers/${apt.customerId}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-md hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors inline-block max-w-full truncate"
                                                                >
                                                                    {apt.customer?.name}
                                                                </Link>
                                                            </div>
                                                            <div className="truncate mt-0.5 opacity-80">{apt.title}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Sidebar / Stats */}
                <div className="space-y-6">
                    <div className="theme-surface rounded-3xl p-6 border shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <CalendarDays size={20} />
                            </div>
                            <h3 className="font-bold theme-text-primary">Bilgiler</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl theme-surface-alt border theme-divider">
                                <div className="text-xs theme-text-secondary mb-1 font-bold">Bekleyen Randevular</div>
                                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                    {appointments.filter(a => a.status === 'PENDING').length}
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl theme-surface-alt border theme-divider">
                                <div className="text-xs theme-text-secondary mb-1 font-bold">Tamamlanan</div>
                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    {appointments.filter(a => a.status === 'COMPLETED').length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-lg theme-surface rounded-[32px] shadow-2xl overflow-hidden border">
                        <div className="p-6 border-b theme-divider flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black theme-text-primary">
                                    {editingAppointment ? 'Randevu Düzenle' : 'Yeni Randevu'}
                                </h3>
                                <p className="text-xs theme-text-secondary mt-1">Lütfen randevu bilgilerini eksiksiz doldurun</p>
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-xl theme-nav-item transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <label className="text-xs font-bold theme-text-secondary uppercase tracking-widest">Müşteri</label>
                                    {editingAppointment && (
                                        <Link
                                            to={`/customers/${editingAppointment.customerId}`}
                                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            Müşteri Detayına Git →
                                        </Link>
                                    )}
                                </div>
                                <select
                                    required
                                    className="w-full h-12 px-4 border rounded-2xl text-sm transition-all appearance-none theme-input"
                                    value={formData.customerId}
                                    onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                >
                                    <option value="">Müşteri Seçin</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold theme-text-secondary uppercase tracking-widest mb-2 px-1">Randevu Başlığı</label>
                                <input
                                    required
                                    type="text"
                                    list="appointment-titles-list"
                                    placeholder="Örn: Tasarım Revize Toplantısı"
                                    className="w-full h-12 px-4 border rounded-2xl text-sm transition-all theme-input"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                                <datalist id="appointment-titles-list">
                                    {titleTemplates.map(t => (
                                        <option key={t.id} value={t.name} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold theme-text-secondary uppercase tracking-widest mb-2 px-1">Randevu Saati</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        className="w-full h-12 px-4 border rounded-2xl text-sm transition-all theme-input"
                                        value={formData.startTime}
                                        onChange={e => handleStartTimeChange(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold theme-text-secondary uppercase tracking-widest mb-2 px-1">Randevu Bitiş Saati</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        className="w-full h-12 px-4 border rounded-2xl text-sm transition-all theme-input"
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold theme-text-secondary uppercase tracking-widest mb-2 px-1">Durum</label>
                                <select
                                    className="w-full h-12 px-4 border rounded-2xl text-sm transition-all appearance-none theme-input"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="PENDING">Bekliyor</option>
                                    <option value="COMPLETED">Tamamlandı</option>
                                    <option value="CANCELLED">İptal Edildi</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold theme-text-secondary uppercase tracking-widest mb-2 px-1">Açıklama</label>
                                <textarea
                                    rows="3"
                                    placeholder="Ek notlar..."
                                    className="w-full p-4 border rounded-2xl text-sm transition-all resize-none theme-input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-between gap-4">
                                {editingAppointment && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm('Randevuyu silmek istediğinize emin misiniz?')) {
                                                deleteMutation.mutate(editingAppointment.id)
                                                closeModal()
                                            }
                                        }}
                                        className="px-6 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        Sil
                                    </button>
                                )}
                                <div className="flex-1 flex gap-4 justify-end">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-6 h-12 font-bold rounded-2xl transition-all theme-button-secondary"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="px-8 h-12 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 theme-button-primary"
                                    >
                                        {editingAppointment ? 'Güncelle' : 'Kaydet'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
