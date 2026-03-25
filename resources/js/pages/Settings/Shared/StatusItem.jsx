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
                group bg-white dark:bg-gray-800 border transition-all rounded-xl p-4 flex items-center gap-4
                ${isDragging ? 'shadow-lg border-indigo-500 z-50' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-500/30'}
                ${isLocked ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
            `}
        >
            {!isLocked ? (
                <button {...attributes} {...listeners} className="p-1 text-gray-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing">
                    <GripVertical size={20} />
                </button>
            ) : (
                <div className="w-8 flex items-center justify-center text-gray-300">
                    <Lock size={16} />
                </div>
            )}

            <div className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm border border-white dark:border-gray-700" style={{ background: s.color }} />

            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-tight">{s.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">ID: #{s.id}</span>
                </div>
                {isLocked && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Sistem Varsayılanı</span>}
            </div>

            <div className="flex gap-1">
                <button onClick={() => openModal(s)} className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"><Edit2 size={16} /></button>
                {!isLocked && (
                    <button onClick={() => setDeleteConfirm(s)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                )}
            </div>
        </div>
    )
}
