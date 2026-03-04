import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
    ChevronDown
} from 'lucide-react'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday, addHours, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function AppointmentsPage() {
    const qc = useQueryClient()
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
    const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
        queryKey: ['appointments'],
        queryFn: () => api.get('/appointments').then(r => r.data)
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
            setShowModal(false)
            resetForm()
        },
        onError: () => toast.error('Randevu oluşturulamadı.')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/appointments/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries(['appointments'])
            toast.success('Randevu güncellendi.')
            setShowModal(false)
            setEditingAppointment(null)
            resetForm()
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
    }

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <CalendarIcon size={22} />
                        </div>
                        Randevular
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Müşteri randevularınızı takvim üzerinden yönetin</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Yeni Randevu
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar Detail / List View */}
                <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col min-h-[600px]">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30 rounded-t-3xl">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white capitalize">
                                {viewMode === 'day' ? format(currentDate, 'd MMMM yyyy', { locale: tr }) : format(currentDate, 'MMMM yyyy', { locale: tr })}
                            </h2>
                            <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-0.5">
                                <button onClick={prev} className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 transition-colors"><ChevronLeft size={18} /></button>

                                <div className="relative">
                                    <button
                                        onClick={() => setShowViewDropdown(!showViewDropdown)}
                                        className="px-3 py-1 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-x border-gray-100 dark:border-gray-700 flex items-center gap-1"
                                    >
                                        {viewMode === 'day' ? 'Bugün' : viewMode === 'week' ? 'Bu Hafta' : 'Bu Ay'}
                                        <ChevronDown size={14} className={`transition-transform ${showViewDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showViewDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowViewDropdown(false)}></div>
                                            <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                                                <button onClick={() => handleViewChange('day')} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${viewMode === 'day' ? 'text-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10' : 'text-gray-600 dark:text-gray-400'}`}>Bugün</button>
                                                <button onClick={() => handleViewChange('week')} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${viewMode === 'week' ? 'text-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10' : 'text-gray-600 dark:text-gray-400'}`}>Bu Hafta</button>
                                                <button onClick={() => handleViewChange('month')} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${viewMode === 'month' ? 'text-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10' : 'text-gray-600 dark:text-gray-400'}`}>Bu Ay</button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button onClick={next} className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 transition-colors"><ChevronRight size={18} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <div className={`grid border-b border-gray-100 dark:border-gray-800 ${viewMode === 'month' ? 'grid-cols-7' : viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                            {viewMode === 'day' ? (
                                <div className="py-3 text-center text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50/30 dark:bg-gray-900/50">
                                    {format(currentDate, 'EEEE', { locale: tr })}
                                </div>
                            ) : (
                                ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                                    <div key={day} className="py-3 text-center text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50/30 dark:bg-gray-900/50">
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
                                        className={`min-h-[120px] p-2 border-r border-b border-gray-100 dark:border-gray-800 transition-colors group ${!isCurrentMonth ? 'bg-gray-50/30 dark:bg-gray-900/20' : ''} ${isTodayDay ? 'bg-indigo-50/20 dark:bg-indigo-500/5' : ''}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${isTodayDay ? 'bg-indigo-600 text-white shadow-sm' : isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}>
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
                                                    <div className="truncate mt-0.5 text-md">{apt.customer.name}</div>
                                                    <div className="truncate mt-0.5">{apt.title}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Sidebar / Stats */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <CalendarDays size={20} />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Bilgiler</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-bold">Bekleyen Randevular</div>
                                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                    {appointments.filter(a => a.status === 'PENDING').length}
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-bold">Tamamlanan</div>
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
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                    {editingAppointment ? 'Randevu Düzenle' : 'Yeni Randevu'}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lütfen randevu bilgilerini eksiksiz doldurun</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Müşteri</label>
                                <select
                                    required
                                    className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all appearance-none"
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
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Randevu Başlığı</label>
                                <input
                                    required
                                    type="text"
                                    list="appointment-titles-list"
                                    placeholder="Örn: Tasarım Revize Toplantısı"
                                    className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
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
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Randevu Saati</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                                        value={formData.startTime}
                                        onChange={e => handleStartTimeChange(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Randevu Bitiş Saati</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Durum</label>
                                <select
                                    className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all appearance-none"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="PENDING">Bekliyor</option>
                                    <option value="COMPLETED">Tamamlandı</option>
                                    <option value="CANCELLED">İptal Edildi</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Açıklama</label>
                                <textarea
                                    rows="3"
                                    placeholder="Ek notlar..."
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all resize-none"
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
                                                setShowModal(false)
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
                                        onClick={() => setShowModal(false)}
                                        className="px-6 h-12 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="px-8 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50"
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
