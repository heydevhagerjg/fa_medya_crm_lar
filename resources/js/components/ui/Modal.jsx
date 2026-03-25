import { Fragment } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
    if (!open) return null

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className={`relative w-full ${sizes[size]} bg-white dark:bg-[#111111] rounded-2xl shadow-2xl border border-[#E5E9F0] dark:border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-[#E5E9F0] dark:border-white/5 bg-[#F4F5F7] dark:bg-white/5">
                        <h2 className="text-sm font-black text-[#1A1A2E] dark:text-white uppercase tracking-widest">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-[#9097A6] hover:text-[#1A1A2E] dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-colors shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
