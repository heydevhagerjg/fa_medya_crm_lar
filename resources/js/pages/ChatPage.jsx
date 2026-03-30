import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import ChatSidebar from '../components/chat/ChatSidebar'
import ChatWindow from '../components/chat/ChatWindow'
import { useAuthStore } from '../stores/index.js'
import { Toaster, toast } from 'react-hot-toast'
import { Search as SearchIcon, Users, User, Check, X, Phone, PhoneOff } from 'lucide-react'

// ─── New Chat Modal ────────────────────────────────────────────────────────────
function NewChatModal({ open, onClose, currentUser, onCreated }) {
    const [tab, setTab] = useState('direct') // 'direct' | 'group'
    const [search, setSearch] = useState('')
    const [groupName, setGroupName] = useState('')
    const [groupDesc, setGroupDesc] = useState('')
    const [selected, setSelected] = useState([])

    const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
        queryKey: ['users-list'],
        queryFn: () => api.get('/chats/users-list').then(r => {
            const raw = r.data?.data || r.data || []
            return Array.isArray(raw) ? raw : []
        }),
        enabled: open,
    })

    useEffect(() => {
        if (open) {
            refetchUsers(); // Force fresh data when opening modal
            reset();
        }
    }, [open])

    const filteredUsers = users.filter(u => {
        const isSelf = u.id === currentUser?.id
        const searchLower = (search || '').toString().toLowerCase()
        const nameMatch = (u.name || '').toString().toLowerCase().includes(searchLower)
        const emailMatch = (u.email || '').toString().toLowerCase().includes(searchLower)
        return !isSelf && (nameMatch || emailMatch)
    })

    const directMutation = useMutation({
        mutationFn: (data) => api.post('/chats', data),
        onSuccess: (res) => { onCreated(res.data.data); toast.success('Sohbet başlatıldı.') },
        onError: (err) => toast.error(err?.response?.data?.message || 'Sohbet başlatılamadı.')
    })

    const groupMutation = useMutation({
        mutationFn: (data) => api.post('/chats/group', data),
        onSuccess: (res) => { onCreated(res.data.data); toast.success('Grup sohbeti oluşturuldu.') },
        onError: (err) => toast.error(err?.response?.data?.message || 'Grup oluşturulamadı.')
    })

    const handleDirectChat = (u) => {
        directMutation.mutate({ entity_type: 'User', entity_id: u.id, participant_ids: [u.id], name: u.name })
    }

    const handleGroupCreate = () => {
        if (!groupName.trim()) return toast.error('Grup adı gereklidir.')
        if (selected.length < 2) return toast.error('En az 2 katılımcı seçin.')
        groupMutation.mutate({ name: groupName.trim(), description: groupDesc.trim() || null, participant_ids: selected })
    }

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const reset = () => { setSearch(''); setGroupName(''); setGroupDesc(''); setSelected([]); setTab('direct') }

    if (!open) return null

    const isPending = directMutation.isPending || groupMutation.isPending

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-md theme-surface rounded-3xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b theme-divider">
                    <h2 className="text-base font-bold theme-text-primary">Yeni Sohbet</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center theme-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-1 mx-6 mt-4 p-1 theme-surface-alt rounded-2xl">
                    <button
                        onClick={() => setTab('direct')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            tab === 'direct'
                                ? 'theme-surface text-primary shadow-sm'
                                : 'theme-text-secondary hover:theme-text-primary'
                        }`}
                    >
                        <User size={14} /> Bireysel
                    </button>
                    <button
                        onClick={() => setTab('group')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            tab === 'group'
                                ? 'theme-surface text-primary shadow-sm'
                                : 'theme-text-secondary hover:theme-text-primary'
                        }`}
                    >
                        <Users size={14} /> Grup
                    </button>
                </div>

                <div className="px-6 py-4 space-y-3">
                    {/* Group fields */}
                    {tab === 'group' && (
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Grup adı *"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-2xl border theme-input text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Açıklama (isteğe bağlı)"
                                value={groupDesc}
                                onChange={e => setGroupDesc(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-2xl border theme-input text-sm"
                            />
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-secondary" size={14} />
                        <input
                            type="text"
                            placeholder={tab === 'group' ? 'Katılımcı ara... (en az 2)' : 'Personel ara...'}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border theme-input text-sm"
                        />
                    </div>

                    {/* Selected chips (group) */}
                    {tab === 'group' && selected.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {selected.map(id => {
                                const u = users.find(u => u.id === id)
                                return u ? (
                                    <span key={id} className="flex items-center gap-1 pl-2.5 pr-1 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                                        {u.name}
                                        <button onClick={() => toggleSelect(id)} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                                            <X size={10} />
                                        </button>
                                    </span>
                                ) : null
                            })}
                        </div>
                    )}

                    {/* User list */}
                    <div className="max-h-56 overflow-y-auto space-y-0.5 -mx-1 px-1">
                        {usersLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <p className="text-center text-xs theme-text-secondary py-6">Kullanıcı bulunamadı</p>
                        ) : filteredUsers.map(u => {
                            const isSelected = selected.includes(u.id)
                            return (
                                <div
                                    key={u.id}
                                    onClick={() => tab === 'direct' ? handleDirectChat(u) : toggleSelect(u.id)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${
                                        isSelected
                                                ? 'bg-primary/8 dark:bg-primary/15'
                                                : 'hover:theme-surface-alt'
                                    }`}
                                >
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold theme-text-primary truncate">{u.name}</div>
                                        <div className="text-[11px] theme-text-secondary truncate">{u.email}</div>
                                    </div>
                                    {tab === 'group' && (
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                            isSelected ? 'bg-primary border-primary' : 'theme-divider'
                                        }`}>
                                            {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Group create button */}
                {tab === 'group' && (
                    <div className="px-6 pb-5">
                        <button
                            onClick={handleGroupCreate}
                            disabled={isPending || selected.length < 2 || !groupName.trim()}
                            className="theme-button-primary w-full py-3 rounded-2xl text-white text-sm font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                        >
                            {isPending ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Oluşturuluyor...</>
                            ) : (
                                <><Users size={16} /> Grubu Oluştur {selected.length >= 2 ? `(${selected.length + 1} kişi)` : ''}</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function parseIceServers() {
    try {
        const parsed = JSON.parse(import.meta.env.VITE_WEBRTC_ICE_SERVERS || '[]')
        return Array.isArray(parsed) && parsed.length > 0
            ? parsed
            : [{ urls: 'stun:stun.l.google.com:19302' }]
    } catch {
        return [{ urls: 'stun:stun.l.google.com:19302' }]
    }
}

function formatDuration(seconds) {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
    const mm = String(Math.floor(safe / 60)).padStart(2, '0')
    const ss = String(safe % 60).padStart(2, '0')
    return `${mm}:${ss}`
}

function IncomingCallModal({ call, pending, onAccept, onReject }) {
    if (!call) return null

    const participantCount = Array.isArray(call.participants) ? call.participants.length : 0
    const callerName = call.caller_name || 'Bir kişi'

    return (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm rounded-3xl theme-surface border theme-divider shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 pt-7 pb-4 text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <Phone size={30} />
                    </div>
                    <h3 className="text-lg font-black theme-text-primary">{callerName} sizi arıyor</h3>
                    <p className="text-xs theme-text-secondary mt-1">
                        {participantCount > 2
                            ? `Grup sesli araması • ${participantCount} kişi`
                            : 'Birebir sesli arama'}
                    </p>
                </div>

                <div className="px-6 pb-6 grid grid-cols-2 gap-3">
                    <button
                        onClick={onReject}
                        disabled={pending}
                        className="h-11 rounded-2xl bg-red-500/90 text-white font-semibold text-sm hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <PhoneOff size={16} /> Reddet
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={pending}
                        className="h-11 rounded-2xl bg-emerald-500/90 text-white font-semibold text-sm hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Phone size={16} /> Kabul Et
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── ChatPage ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
    const { user: currentUser } = useAuthStore()
    const queryClient = useQueryClient()
    const peerConnectionsRef = useRef(new Map())
    const remoteAudioRef = useRef(new Map())
    const localStreamRef = useRef(null)
    const iceServersRef = useRef(parseIceServers())
    const callSoundRef = useRef({ ctx: null, nodes: [], timerId: null, stopped: false })
    const iceCandidateBufferRef = useRef(new Map())
    const handleIncomingSignalRef = useRef(null)
    const applyCallUpdateRef = useRef(null)

    const [selectedChat, setSelectedChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
    const [incomingCall, setIncomingCall] = useState(null)
    const [activeCall, setActiveCall] = useState(null)
    const [isInCall, setIsInCall] = useState(false)
    const [isCallActionPending, setIsCallActionPending] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [searchParams, setSearchParams] = useSearchParams()
    const openChatId = searchParams.get('open')

    const { data: chats = [] } = useQuery({
        queryKey: ['chats'],
        queryFn: () => api.get('/chats').then(r => {
            const raw = r.data?.data || []
            return Array.isArray(raw) ? raw : Object.values(raw)
        }),
    })

    const cleanupRemoteAudios = useCallback(() => {
        for (const [, element] of remoteAudioRef.current.entries()) {
            element.pause()
            element.srcObject = null
            element.remove()
        }
        remoteAudioRef.current.clear()
    }, [])

    const cleanupPeerConnections = useCallback(() => {
        for (const [, peerConnection] of peerConnectionsRef.current.entries()) {
            peerConnection.close()
        }
        peerConnectionsRef.current.clear()
        iceCandidateBufferRef.current.clear()
    }, [])

    const cleanupLocalStream = useCallback(() => {
        if (!localStreamRef.current) return
        localStreamRef.current.getTracks().forEach(track => track.stop())
        localStreamRef.current = null
    }, [])

    const stopCallSounds = useCallback(() => {
        const s = callSoundRef.current
        s.stopped = true
        if (s.timerId) { clearTimeout(s.timerId); s.timerId = null }
        s.nodes.forEach(n => { try { n.stop() } catch (_) {} })
        s.nodes = []
        if (s.ctx) { try { s.ctx.close() } catch (_) {} ; s.ctx = null }
    }, [])

    const playTonePattern = useCallback((onMs, offMs) => {
        stopCallSounds()
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()
        const s = callSoundRef.current
        s.stopped = false
        s.ctx = ctx
        const tick = () => {
            if (s.stopped) return
            const osc1 = ctx.createOscillator()
            const osc2 = ctx.createOscillator()
            const gain = ctx.createGain()
            osc1.frequency.value = 440
            osc2.frequency.value = 480
            gain.gain.value = 0.25
            osc1.connect(gain)
            osc2.connect(gain)
            gain.connect(ctx.destination)
            s.nodes = [osc1, osc2]
            osc1.start()
            osc2.start()
            s.timerId = setTimeout(() => {
                s.nodes.forEach(n => { try { n.stop() } catch (_) {} })
                s.nodes = []
                if (!s.stopped) {
                    s.timerId = setTimeout(tick, offMs)
                }
            }, onMs)
        }
        tick()
    }, [stopCallSounds])

    // Arayana: çağrı sesi (1s çalar, 3s sessiz)
    const startRingbackTone = useCallback(() => playTonePattern(1000, 3000), [playTonePattern])
    // Aranana: telefon çalma sesi (2s çalar, 4s sessiz)
    const startRingTone = useCallback(() => playTonePattern(2000, 4000), [playTonePattern])

    const teardownCallMedia = useCallback(() => {
        stopCallSounds()
        cleanupPeerConnections()
        cleanupRemoteAudios()
        cleanupLocalStream()
    }, [stopCallSounds, cleanupPeerConnections, cleanupRemoteAudios, cleanupLocalStream])

    const ensureLocalStream = useCallback(async () => {
        if (localStreamRef.current) return localStreamRef.current
        if (!navigator?.mediaDevices?.getUserMedia) {
            throw new Error('Tarayıcınız sesli görüşmeyi desteklemiyor.')
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
            video: false,
        })
        localStreamRef.current = stream
        return stream
    }, [])

    const attachRemoteStream = useCallback((remoteUserId, stream) => {
        let audioElement = remoteAudioRef.current.get(remoteUserId)
        if (!audioElement) {
            audioElement = document.createElement('audio')
            audioElement.autoplay = true
            audioElement.playsInline = true
            audioElement.setAttribute('data-remote-user', String(remoteUserId))
            audioElement.style.display = 'none'
            document.body.appendChild(audioElement)
            remoteAudioRef.current.set(remoteUserId, audioElement)
        }

        audioElement.srcObject = stream
        audioElement.play().catch(() => {
            // Browser may block autoplay until user interaction.
        })
    }, [])

    const sendSignal = useCallback(async (chatId, callId, signalType, payload, targetUserId = null) => {
        await api.post(`/chats/${chatId}/calls/${callId}/signal`, {
            signal_type: signalType,
            target_user_id: targetUserId,
            payload,
        })
    }, [])

    const getOrCreatePeerConnection = useCallback(async (chatId, callId, remoteUserId) => {
        if (peerConnectionsRef.current.has(remoteUserId)) {
            return peerConnectionsRef.current.get(remoteUserId)
        }

        const localStream = await ensureLocalStream()
        const peerConnection = new RTCPeerConnection({
            iceServers: iceServersRef.current,
        })

        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream)
        })

        peerConnection.ontrack = (event) => {
            const [stream] = event.streams || []
            if (stream) {
                attachRemoteStream(remoteUserId, stream)
            }
        }

        peerConnection.onicecandidate = (event) => {
            if (!event.candidate) return
            sendSignal(chatId, callId, 'ice-candidate', { candidate: event.candidate }, remoteUserId)
                .catch(() => {})
        }

        peerConnection.onconnectionstatechange = () => {
            const terminalStates = ['failed', 'closed', 'disconnected']
            if (terminalStates.includes(peerConnection.connectionState)) {
                peerConnection.close()
                peerConnectionsRef.current.delete(remoteUserId)
            }
        }

        peerConnectionsRef.current.set(remoteUserId, peerConnection)
        return peerConnection
    }, [attachRemoteStream, ensureLocalStream, sendSignal])

    const createOfferForPeer = useCallback(async (callPayload, remoteUserId) => {
        const peerConnection = await getOrCreatePeerConnection(callPayload.chat_id, callPayload.id, remoteUserId)
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        await sendSignal(callPayload.chat_id, callPayload.id, 'offer', { offer: peerConnection.localDescription }, remoteUserId)
    }, [getOrCreatePeerConnection, sendSignal])

    const applyCallUpdate = useCallback((payload) => {
        if (!payload?.id) return

        setActiveCall(previous => {
            if (!previous) return payload
            if (String(previous.id) !== String(payload.id)) return previous
            return payload
        })

        if (incomingCall && String(incomingCall.id) === String(payload.id)) {
            if (['ended', 'cancelled', 'rejected'].includes(payload.status)) {
                setIncomingCall(null)
            }
        }

        const myParticipant = payload.participants?.find(p => String(p.user_id) === String(currentUser?.id))
        const joined = myParticipant?.status === 'joined'
        setIsInCall(joined)

        if (payload.status === 'active') {
            stopCallSounds()
        }

        if (['ended', 'cancelled', 'rejected'].includes(payload.status)) {
            teardownCallMedia()
            setIsInCall(false)
            setCallDuration(0)
            setIncomingCall(null)
            setActiveCall(prev => String(prev?.id) === String(payload.id) ? null : prev)
        }
    }, [currentUser?.id, incomingCall, stopCallSounds, teardownCallMedia])

    const handleIncomingSignal = useCallback(async (signal) => {
        if (!activeCall || String(signal.call_id) !== String(activeCall.id)) return
        if (String(signal.from_user_id) === String(currentUser?.id)) return
        if (signal.target_user_id && String(signal.target_user_id) !== String(currentUser?.id)) return

        const remoteUserId = signal.from_user_id
        const signalType = signal.signal_type
        const payload = signal.payload || {}

        try {
            if (signalType === 'offer') {
                const peerConnection = await getOrCreatePeerConnection(activeCall.chat_id, activeCall.id, remoteUserId)
                await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.offer))
                const buffered = iceCandidateBufferRef.current.get(remoteUserId) || []
                iceCandidateBufferRef.current.delete(remoteUserId)
                for (const c of buffered) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
                }
                const answer = await peerConnection.createAnswer()
                await peerConnection.setLocalDescription(answer)
                await sendSignal(activeCall.chat_id, activeCall.id, 'answer', { answer: peerConnection.localDescription }, remoteUserId)
                return
            }

            if (signalType === 'answer') {
                const peerConnection = peerConnectionsRef.current.get(remoteUserId)
                if (!peerConnection) return
                await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer))
                const buffered = iceCandidateBufferRef.current.get(remoteUserId) || []
                iceCandidateBufferRef.current.delete(remoteUserId)
                for (const c of buffered) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
                }
                return
            }

            if (signalType === 'ice-candidate') {
                const peerConnection = peerConnectionsRef.current.get(remoteUserId)
                if (!peerConnection || !payload.candidate) return
                if (!peerConnection.remoteDescription) {
                    const buf = iceCandidateBufferRef.current.get(remoteUserId) || []
                    buf.push(payload.candidate)
                    iceCandidateBufferRef.current.set(remoteUserId, buf)
                    return
                }
                await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate))
            }
        } catch (error) {
            console.error('Signal handling error:', error)
        }
    }, [activeCall, currentUser?.id, getOrCreatePeerConnection, sendSignal])

    useEffect(() => { handleIncomingSignalRef.current = handleIncomingSignal }, [handleIncomingSignal])
    useEffect(() => { applyCallUpdateRef.current = applyCallUpdate }, [applyCallUpdate])

    // Auto-select chat from ?open query parameter
    useEffect(() => {
        if (openChatId && chats.length > 0) {
            const chatToOpen = chats.find(c => String(c.id) === openChatId)
            if (chatToOpen && (!selectedChat || selectedChat.id !== chatToOpen.id)) {
                setSelectedChat(chatToOpen)
                // Remove the param without reloading the page
                searchParams.delete('open')
                setSearchParams(searchParams, { replace: true })
            }
        }
    }, [openChatId, chats, selectedChat, searchParams, setSearchParams])

    // Keep selected chat synced if group info/participants change in background 
    useEffect(() => {
        if (selectedChat && chats.length > 0) {
            const current = chats.find(c => c.id === selectedChat.id)
            if (current && JSON.stringify(current.participants) !== JSON.stringify(selectedChat.participants)) {
                // Data changed (like participants added/removed), sync it
                setSelectedChat(current)
            }
        }
    }, [chats, selectedChat])

    useEffect(() => {
        if (!selectedChat?.id) return

        let cancelled = false
        api.get(`/chats/${selectedChat.id}/calls/active`)
            .then((res) => {
                if (cancelled) return
                const call = res.data?.data || null
                setActiveCall(call)

                const myStatus = call?.participants?.find(p => String(p.user_id) === String(currentUser?.id))?.status
                setIsInCall(myStatus === 'joined')
            })
            .catch(() => {
                if (!cancelled) {
                    setActiveCall(null)
                    setIsInCall(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [selectedChat?.id, currentUser?.id])

    useEffect(() => {
        if (!window.Echo || !currentUser?.id) return

        window.Echo.private(`user.chats.${currentUser.id}`)
            .listen('.chat.call.incoming', (event) => {
                setIncomingCall(event)
                setActiveCall(event)
                startRingTone()
                toast((event.caller_name || 'Bir kişi') + ' sizi arıyor')
            })
            .listen('.chat.call.updated', (event) => {
                applyCallUpdate(event)
            })

        return () => {
            window.Echo.leave(`user.chats.${currentUser.id}`)
        }
    }, [currentUser?.id, applyCallUpdate, startRingTone])

    useEffect(() => {
        if (!activeCall?.id || !isInCall || activeCall.status !== 'active') {
            setCallDuration(0)
            return
        }

        const baseTime = activeCall.answered_at || activeCall.started_at
        if (!baseTime) return

        const startedAtMs = new Date(baseTime).getTime()
        const tick = () => {
            const elapsed = Math.floor((Date.now() - startedAtMs) / 1000)
            setCallDuration(Math.max(elapsed, 0))
        }

        tick()
        const timer = setInterval(tick, 1000)
        return () => clearInterval(timer)
    }, [activeCall?.id, activeCall?.answered_at, activeCall?.started_at, activeCall?.status, isInCall])

    useEffect(() => {
        if (!activeCall?.id || !isInCall || activeCall.status !== 'active' || !currentUser?.id) return

        const joinedParticipants = (activeCall.participants || [])
            .filter(p => p.status === 'joined' && String(p.user_id) !== String(currentUser.id))

        joinedParticipants.forEach((participant) => {
            const remoteUserId = String(participant.user_id)
            const shouldInitiate = String(currentUser.id) < remoteUserId
            if (!shouldInitiate) return
            if (peerConnectionsRef.current.has(remoteUserId)) return

            createOfferForPeer(activeCall, remoteUserId).catch((error) => {
                console.error('Offer create error:', error)
            })
        })
    }, [activeCall, isInCall, currentUser?.id, createOfferForPeer])

    useEffect(() => {
        return () => {
            teardownCallMedia()
        }
    }, [teardownCallMedia])

    const deleteChatMutation = useMutation({
        mutationFn: (chatId) => api.delete(`/chats/${chatId}`),
        onSuccess: (_, chatId) => {
            queryClient.invalidateQueries(['chats'])
            if (selectedChat?.id === chatId) { setSelectedChat(null); setMessages([]) }
            toast.success('Sohbet silindi.')
        },
        onError: (err) => toast.error(err?.response?.data?.message || 'Sohbet silinemedi.')
    })

    const fetchMessages = useCallback(async (chatId) => {
        try {
            const res = await api.get(`/chats/${chatId}/messages`)
            setMessages(res.data?.data || [])
        } catch { toast.error('Mesajlar yüklenemedi.') }
    }, [])

    const markAsRead = useCallback((chatId) => {
        if (!chatId) return
        api.post(`/chats/${chatId}/read`)
        
        // Instant UI reset for unread count in the sidebar
        queryClient.setQueryData(['chats'], (old) => {
            if (!Array.isArray(old)) return old
            return old.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c)
        })
    }, [queryClient])

    const deleteMessageMutation = useMutation({
        mutationFn: (messageId) => api.delete(`/chats/${selectedChat.id}/messages/${messageId}`),
        onSuccess: (res) => {
            const messageId = res.data?.message_id
            if (messageId) {
                setMessages(prev => prev.filter(m => m.id !== messageId))
            }
            toast.success('Mesaj silindi.')
        },
        onError: () => toast.error('Mesaj silinemedi.')
    })

    useEffect(() => {
        if (selectedChat?.id) { 
            fetchMessages(selectedChat.id)
            markAsRead(selectedChat.id)
        } else {
            setMessages([])
        }
    }, [selectedChat, fetchMessages, markAsRead])

    useEffect(() => {
        if (!selectedChat?.id || !window.Echo) return
        window.Echo.private(`chat.${selectedChat.id}`)
            .listen('.message.created', (e) => {
                if (e.metadata && String(e.metadata.removed_user_id) === String(currentUser?.id)) {
                    toast.error('Bu gruptan çıkarıldınız.')
                    setSelectedChat(null)
                    setMessages([])
                    queryClient.invalidateQueries(['chats'])
                    return
                }

                setMessages(prev => {
                    const index = prev.findIndex(m => m.id === e.id)
                    if (index !== -1) {
                         const updated = [...prev]
                         updated[index] = e
                         return updated
                    }
                    return [...prev, e]
                })
                markAsRead(selectedChat.id)
            })
            .listen('.message.deleted', (e) => {
                setMessages(prev => prev.filter(m => String(m.id) !== String(e.messageId)))
            })
            .listen('.chat.deleted', (e) => {
                if (String(e.deletedBy) !== String(currentUser?.id)) {
                    toast.error('Bu sohbet kapatıldı veya silindi.')
                }
                if (selectedChat?.id === e.chatId) {
                    setSelectedChat(null)
                    setMessages([])
                }
                queryClient.invalidateQueries(['chats'])
            })
            .listen('.chat.call.updated', (e) => {
                applyCallUpdateRef.current?.(e)
            })
            .listen('.chat.call.signal', (e) => {
                handleIncomingSignalRef.current?.(e)
            })
        return () => window.Echo.leave(`chat.${selectedChat.id}`)
    }, [selectedChat, currentUser, queryClient, markAsRead])

    const handleSendMessage = async (content) => {
        if (!selectedChat?.id) return
        try {
            const res = await api.post(`/chats/${selectedChat.id}/messages`, { content })
            if (res.data?.data) setMessages(prev => prev.some(m => m.id === res.data.data.id) ? prev : [...prev, res.data.data])
        } catch { toast.error('Mesaj gönderilemedi.') }
    }

    const handleFileUpload = async (files) => {
        if (!selectedChat?.id || !files) return
        
        const filesArray = Array.from(files)
        if (filesArray.length === 0) return;
        if (filesArray.length > 10) {
            toast.error('Tek seferde en fazla 10 dosya seçebilirsiniz.')
            return
        }

        setIsUploading(true)
        setUploadProgress({ current: 0, total: filesArray.length })
        try {
            await Promise.all(filesArray.map(async (file) => {
                const fd = new FormData(); fd.append('file', file)
                const res = await api.post(`/chats/${selectedChat.id}/attachments`, fd, { 
                    headers: { 'Content-Type': 'multipart/form-data' } 
                })
                
                // Update progress
                setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }))
                
                // Update local state immediately for the uploader
                if (res.data?.data) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === res.data.data.id)) return prev
                        return [...prev, res.data.data]
                    })
                }
                return res
            }))
            toast.success(`${filesArray.length} dosya yüklendi.`)
        } catch { 
            toast.error('Bazı dosyalar yüklenemedi.') 
        } finally { 
            setIsUploading(false) 
            setUploadProgress({ current: 0, total: 0 })
        }
    }

    const handleChatCreated = (chat) => {
        queryClient.invalidateQueries(['chats'])
        setSelectedChat(chat)
        setIsNewChatModalOpen(false)
    }

    const handleStartCall = async () => {
        if (!selectedChat?.id) return

        setIsCallActionPending(true)
        try {
            const response = await api.post(`/chats/${selectedChat.id}/calls`, { type: 'audio' })
            const call = response.data?.data
            if (!call) return

            setActiveCall(call)
            setIncomingCall(null)
            startRingbackTone()
            await ensureLocalStream()
            setIsInCall(true)
            toast.success('Arama başlatıldı.')
        } catch (error) {
            const status = error?.response?.status
            if (status === 409 && error?.response?.data?.data) {
                const existing = error.response.data.data
                setActiveCall(existing)
                toast('Bu sohbette zaten aktif bir görüşme var.')
            } else {
                toast.error(error?.response?.data?.message || 'Arama başlatılamadı.')
            }
        } finally {
            setIsCallActionPending(false)
        }
    }

    const handleAcceptIncomingCall = async () => {
        if (!incomingCall?.id || !incomingCall?.chat_id) return

        setIsCallActionPending(true)
        try {
            const relatedChat = chats.find(c => String(c.id) === String(incomingCall.chat_id))
            if (relatedChat) {
                setSelectedChat(relatedChat)
            } else {
                setSearchParams({ open: String(incomingCall.chat_id) }, { replace: true })
            }

            const response = await api.post(`/chats/${incomingCall.chat_id}/calls/${incomingCall.id}/accept`)
            const call = response.data?.data
            if (!call) return

            stopCallSounds()
            setActiveCall(call)
            setIncomingCall(null)
            await ensureLocalStream()
            setIsInCall(true)
            toast.success('Arama kabul edildi.')
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Arama kabul edilemedi.')
        } finally {
            setIsCallActionPending(false)
        }
    }

    const handleRejectIncomingCall = async () => {
        if (!incomingCall?.id || !incomingCall?.chat_id) return

        setIsCallActionPending(true)
        try {
            await api.post(`/chats/${incomingCall.chat_id}/calls/${incomingCall.id}/reject`)
            toast('Arama reddedildi.')
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Arama reddedilemedi.')
        } finally {
            stopCallSounds()
            setIncomingCall(null)
            setIsCallActionPending(false)
        }
    }

    const handleEndCall = async () => {
        if (!activeCall?.id || !activeCall?.chat_id) return

        setIsCallActionPending(true)
        try {
            await api.post(`/chats/${activeCall.chat_id}/calls/${activeCall.id}/end`)
            toast('Görüşme sonlandırıldı.')
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Görüşme sonlandırılamadı.')
        } finally {
            teardownCallMedia()
            setActiveCall(null)
            setIsInCall(false)
            setCallDuration(0)
            setIsCallActionPending(false)
        }
    }

    const callState = useMemo(() => {
        const joinedCount = activeCall?.participants?.filter(p => p.status === 'joined')?.length || 0
        const totalCount = activeCall?.participants?.length || 0

        return {
            call: activeCall,
            isInCall,
            durationLabel: formatDuration(callDuration),
            participantSummary: activeCall ? `${joinedCount}/${totalCount} kişi` : null,
        }
    }, [activeCall, isInCall, callDuration])

    return (
        <div className="-m-5 lg:-m-8 h-[calc(100dvh-70px)] flex overflow-hidden theme-app-shell animate-in fade-in zoom-in-95 duration-500">
            <Toaster position="top-right" />

            <div className={`w-full md:w-[320px] shrink-0 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <ChatSidebar
                    chats={chats}
                    selectedChatId={selectedChat?.id}
                    onSelectChat={setSelectedChat}
                    onNewChat={() => setIsNewChatModalOpen(true)}
                    onDeleteChat={(chat) => deleteChatMutation.mutate(chat.id)}
                    currentUser={currentUser}
                />
            </div>

            <div className={`flex-1 h-full ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <ChatWindow
                    chat={selectedChat}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onFileUpload={handleFileUpload}
                    onDeleteMessage={(id) => deleteMessageMutation.mutate(id)}
                    isUploading={isUploading}
                    isDeleting={deleteChatMutation.isPending}
                    uploadProgress={uploadProgress}
                    isLoading={false}
                    currentUser={currentUser}
                    onUpdateChat={setSelectedChat}
                    onBack={() => setSelectedChat(null)}
                    callState={callState}
                    onStartCall={handleStartCall}
                    onEndCall={handleEndCall}
                    isCallActionPending={isCallActionPending}
                />
            </div>

            <NewChatModal
                open={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
                currentUser={currentUser}
                onCreated={handleChatCreated}
            />

            <IncomingCallModal
                call={incomingCall}
                pending={isCallActionPending}
                onAccept={handleAcceptIncomingCall}
                onReject={handleRejectIncomingCall}
            />
        </div>
    )
}
