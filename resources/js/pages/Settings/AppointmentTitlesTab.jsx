import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import api from '../../lib/api.js'
import toast from 'react-hot-toast'
import PlanRestrictionView from '../../components/ui/PlanRestrictionView.jsx'
import { useAuthStore } from '../../stores/index.js'

export default function AppointmentTitlesTab() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_appointment_feature === false || user?.tenant?.plan_appointment_feature === 0
    if (isFeatureDisabled) return <PlanRestrictionView featureName="Randevu" />

    const qc = useQueryClient()
    const [name, setName] = useState('')
    const [editing, setEditing] = useState(null)

    const { data: titles = [], isLoading } = useQuery({
        queryKey: ['appointment-titles'],
        queryFn: () => api.get('/settings/appointment-titles').then(r => r.data)
    })

    const saveMutation = useMutation({
        mutationFn: (data) => editing ? api.put(`/settings/appointment-titles/${editing.id}`, data) : api.post('/settings/appointment-titles', data),
        onSuccess: () => {
            qc.invalidateQueries(['appointment-titles'])
            toast.success('Başlık kaydedildi.')
            setName('')
            setEditing(null)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/appointment-titles/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['appointment-titles'])
            toast.success('Başlık silindi.')
        }
    })

    if (isLoading) return <div className="text-center py-8 theme-text-secondary">Yükleniyor...</div>

    return (
        <div className="space-y-4">
            <div className="theme-surface border theme-divider rounded-xl p-4">
                <h3 className="text-sm font-medium theme-text-primary mb-3">
                    {editing ? 'Başlığı Düzenle' : 'Yeni Randevu Başlığı Ekle'}
                </h3>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Örn: Telefon Araması, Yüz Yüze Görüşme"
                        className="flex-1 px-3 py-2 theme-input"
                    />
                    <button
                        onClick={() => saveMutation.mutate({ name })}
                        disabled={saveMutation.isPending || !name}
                        className="px-4 py-2 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {editing ? 'Güncelle' : 'Ekle'}
                    </button>
                    {editing && (
                        <button
                            onClick={() => { setEditing(null); setName('') }}
                            className="px-4 py-2 border theme-divider theme-text-primary rounded-lg text-sm font-medium transition-colors"
                        >
                            İptal
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {titles.map(t => (
                    <div key={t.id} className="theme-surface border theme-divider rounded-xl p-4 flex items-center justify-between group">
                        <span className="text-sm font-medium theme-text-primary">{t.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => { setEditing(t); setName(t.name) }}
                                className="p-1.5 theme-text-secondary hover:text-[#905EFC] rounded-md transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => { if (window.confirm('Emin misiniz?')) deleteMutation.mutate(t.id) }}
                                className="p-1.5 theme-text-secondary hover:text-red-500 rounded-md transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {titles.length === 0 && <p className="text-center theme-text-secondary py-8">Henüz randevu başlığı eklenmemiş.</p>}
        </div>
    )
}
