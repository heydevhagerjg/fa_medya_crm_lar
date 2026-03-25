import { GripVertical, Lock, Edit2, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function StatusItem({ s, openModal, setDeleteConfirm, isLocked = false }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: s.id,
        disabled: isLocked
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group bg-white dark:bg-white/5 border transition-all rounded-xl p-4 flex items-center gap-4
                ${isDragging ? 'shadow-lg border-[#905EFC] z-50' : 'border-[#E5E9F0] dark:border-white/10 hover:border-[#905EFC]/30'}
                ${isLocked ? 'bg-[#F4F5F7] dark:bg-white/5' : ''}
            `}
        >
            {!isLocked ? (
                <button {...attributes} {...listeners} className="p-1 text-[#9097A6] hover:text-[#905EFC] cursor-grab active:cursor-grabbing">
                    <GripVertical size={20} />
                </button>
            ) : (
                <div className="w-8 flex items-center justify-center text-[#9097A6]">
                    <Lock size={16} />
                </div>
            )}

            <div className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm border border-white dark:border-white/10" style={{ background: s.color }} />

            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A2E] dark:text-white text-sm uppercase tracking-tight">{s.name}</span>
                    <span className="text-[10px] text-[#9097A6] font-medium">ID: #{s.id}</span>
                </div>
                {isLocked && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Sistem Varsayılanı</span>}
            </div>

            <div className="flex gap-1">
                <button onClick={() => openModal(s)} className="p-2 rounded-lg text-[#9097A6] hover:text-[#905EFC] hover:bg-[#905EFC]/10 dark:hover:bg-[#905EFC]/10 transition-colors"><Edit2 size={16} /></button>
                {!isLocked && (
                    <button onClick={() => setDeleteConfirm(s)} className="p-2 rounded-lg text-[#9097A6] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                )}
            </div>
        </div>
    )
}
