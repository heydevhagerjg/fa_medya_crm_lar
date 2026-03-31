import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Phone, PhoneOff, MessageSquare, Users } from 'lucide-react'

function formatDuration(seconds) {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
    const mm = String(Math.floor(safe / 60)).padStart(2, '0')
    const ss = String(safe % 60).padStart(2, '0')
    return `${mm}:${ss}`
}

export default function FloatingCallWidget({ activeCall, isInCall, callDuration, onEndCall, isCallActionPending }) {
    const navigate = useNavigate()
    const location = useLocation()

    // Chat sayfasındayken gösterme
    if (location.pathname.startsWith('/chats')) return null
    if (!activeCall || !isInCall) return null

    const joinedCount = activeCall.participants?.filter(p => p.status === 'joined')?.length || 0
    const totalCount = activeCall.participants?.length || 0
    const callerName = activeCall.caller_name || 'Görüşme'

    return (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl theme-surface border theme-divider shadow-2xl backdrop-blur-xl min-w-[280px]">
                {/* Pulse indicator */}
                <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                        <Phone size={18} />
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold theme-text-primary truncate">{callerName}</div>
                    <div className="flex items-center gap-2 text-xs theme-text-secondary">
                        <span className="font-mono font-semibold text-emerald-500">{formatDuration(callDuration)}</span>
                        <span className="opacity-40">•</span>
                        <span className="flex items-center gap-1">
                            <Users size={11} />
                            {joinedCount}/{totalCount}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => navigate(`/chats?open=${activeCall.chat_id}`)}
                        title="Sohbete Git"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-all"
                    >
                        <MessageSquare size={16} />
                    </button>
                    <button
                        onClick={onEndCall}
                        disabled={isCallActionPending}
                        title="Görüşmeden Ayrıl"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    >
                        <PhoneOff size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}
