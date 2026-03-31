import React, { useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { toast } from 'react-hot-toast'
import api from '../../lib/api.js'
import { useAuthStore } from '../../stores/index.js'
import { useCallStore } from '../../stores/callStore.js'
import FloatingCallWidget from './FloatingCallWidget.jsx'
import { Phone, PhoneOff } from 'lucide-react'

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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
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

export default function CallManager() {
    const { user: currentUser } = useAuthStore()
    const location = useLocation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        activeCall, incomingCall, isInCall, callDuration, isCallActionPending,
        setActiveCall, setIncomingCall, setIsInCall, setIsCallActionPending,
        setCallDuration, clearCallState, applyCallUpdate,
    } = useCallStore()

    const agoraClientRef = useRef(null)
    const localAudioTrackRef = useRef(null)
    const callSoundRef = useRef({ ctx: null, nodes: [], timerId: null, stopped: false })
    const applyCallUpdateRef = useRef(applyCallUpdate)
    const locationRef = useRef(location)

    useEffect(() => { applyCallUpdateRef.current = applyCallUpdate }, [applyCallUpdate])
    useEffect(() => { locationRef.current = location }, [location])

    // ─── Agora ────────────────────────────────────────────────────────────────

    const joinAgoraChannel = useCallback(async (callId) => {
        const chatId = useCallStore.getState().activeCall?.chat_id
        if (!chatId) throw new Error('Chat ID not available')

        const tokenRes = await api.get(`/chats/${chatId}/calls/${callId}/token`)
        const { token, channel, uid, app_id: appId } = tokenRes.data?.data || {}

        if (!appId || !token) {
            toast.error('Ses bağlantısı için gerekli bilgiler alınamadı.')
            throw new Error('Missing Agora token or appId from backend')
        }

        if (!agoraClientRef.current) {
            agoraClientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        }
        const client = agoraClientRef.current

        client.removeAllListeners()

        client.on('user-published', async (user, mediaType) => {
            await client.subscribe(user, mediaType)
            if (mediaType === 'audio') user.audioTrack.play()
        })

        client.on('user-unpublished', (user, mediaType) => {
            if (mediaType === 'audio') user.audioTrack?.stop()
        })

        await client.join(appId, channel, token, uid)

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
            AEC: true, ANS: true, AGC: true,
        })
        localAudioTrackRef.current = audioTrack
        await client.publish([audioTrack])
    }, [])

    const leaveAgoraChannel = useCallback(async () => {
        if (localAudioTrackRef.current) {
            localAudioTrackRef.current.stop()
            localAudioTrackRef.current.close()
            localAudioTrackRef.current = null
        }
        if (agoraClientRef.current) {
            agoraClientRef.current.removeAllListeners()
            await agoraClientRef.current.leave().catch(() => {})
            agoraClientRef.current = null
        }
    }, [])

    // ─── Çalma Sesleri ────────────────────────────────────────────────────────

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
        if (ctx.state === 'suspended') { ctx.resume().catch(() => {}) }
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
                if (!s.stopped) { s.timerId = setTimeout(tick, offMs) }
            }, onMs)
        }
        tick()
    }, [stopCallSounds])

    const startRingbackTone = useCallback(() => playTonePattern(1000, 3000), [playTonePattern])
    const startRingTone = useCallback(() => playTonePattern(2000, 4000), [playTonePattern])

    const teardownCallMedia = useCallback(async () => {
        stopCallSounds()
        await leaveAgoraChannel()
    }, [stopCallSounds, leaveAgoraChannel])

    // ─── Call update handler ──────────────────────────────────────────────────

    const handleCallUpdateEvent = useCallback((payload) => {
        if (!payload?.id) return

        const myParticipant = payload.participants?.find(p => String(p.user_id) === String(currentUser?.id))
        const joined = myParticipant?.status === 'joined'

        applyCallUpdate(payload)
        setIsInCall(joined)

        if (payload.status === 'active') {
            stopCallSounds()
        }

        if (['ended', 'cancelled', 'rejected'].includes(payload.status)) {
            teardownCallMedia()
        }
    }, [currentUser?.id, applyCallUpdate, setIsInCall, stopCallSounds, teardownCallMedia])

    useEffect(() => { applyCallUpdateRef.current = handleCallUpdateEvent }, [handleCallUpdateEvent])

    // ─── Auto-join Agora ──────────────────────────────────────────────────────

    useEffect(() => {
        if (!activeCall?.id || !isInCall || activeCall.status !== 'active') return

        let cancelled = false
        joinAgoraChannel(activeCall.id).catch(err => {
            if (!cancelled) {
                console.error('[Agora] Join error:', err)
                toast.error('Ses kanalına bağlanılamadı.')
            }
        })

        return () => {
            cancelled = true
            leaveAgoraChannel()
        }
    }, [activeCall?.id, activeCall?.status, isInCall, joinAgoraChannel, leaveAgoraChannel])

    // ─── Call Duration Timer ──────────────────────────────────────────────────

    useEffect(() => {
        if (!activeCall?.id || !isInCall || activeCall.status !== 'active') {
            setCallDuration(0)
            return
        }

        const baseTime = activeCall.answered_at || activeCall.started_at
        if (!baseTime) return

        const startedAtMs = new Date(baseTime).getTime()
        const tick = () => setCallDuration(Math.max(Math.floor((Date.now() - startedAtMs) / 1000), 0))

        tick()
        const timer = setInterval(tick, 1000)
        return () => clearInterval(timer)
    }, [activeCall?.id, activeCall?.answered_at, activeCall?.started_at, activeCall?.status, isInCall, setCallDuration])

    // ─── Echo Listeners (calls + chat/message notifications) ────────────────

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
                applyCallUpdateRef.current?.(event)
            })
            .listen('.chat.created', (e) => {
                queryClient.invalidateQueries(['chats'])
                if (!locationRef.current.pathname.startsWith('/chats')) {
                    toast('💬 Yeni bir sohbet başlatıldı', {
                        duration: 4000,
                        style: { cursor: 'pointer' },
                        onClick: () => navigate(`/chats?open=${e?.chat?.id || e?.id || ''}`),
                    })
                }
            })
            .listen('.message.created', (e) => {
                queryClient.invalidateQueries(['chats'])
                if (!locationRef.current.pathname.startsWith('/chats') && e.user?.name) {
                    toast(
                        (t) => (
                            <span
                                style={{ cursor: 'pointer' }}
                                onClick={() => { toast.dismiss(t.id); navigate(`/chats?open=${e.chat_id}`) }}
                            >
                                <strong>{e.user.name}</strong>: {e.content?.slice(0, 60) || 'Yeni mesaj'}
                            </span>
                        ),
                        { icon: '💬', duration: 5000, id: `chat-msg-${e.chat_id}` },
                    )
                }
            })

        return () => {
            window.Echo.leave(`user.chats.${currentUser.id}`)
        }
    }, [currentUser?.id, setIncomingCall, setActiveCall, startRingTone, queryClient, navigate])

    // ─── Cleanup on unmount ───────────────────────────────────────────────────

    useEffect(() => {
        return () => { teardownCallMedia() }
    }, [teardownCallMedia])

    // ─── Action Handlers ──────────────────────────────────────────────────────

    const handleStartCall = useCallback(async (chatId) => {
        if (!chatId) return

        setIsCallActionPending(true)
        try {
            const response = await api.post(`/chats/${chatId}/calls`, { type: 'audio' })
            const call = response.data?.data
            if (!call) return

            setActiveCall(call)
            setIncomingCall(null)
            startRingbackTone()
            setIsInCall(true)
            toast.success('Arama başlatıldı.')
        } catch (error) {
            const status = error?.response?.status
            if (status === 409 && error?.response?.data?.data) {
                setActiveCall(error.response.data.data)
                toast('Bu sohbette zaten aktif bir görüşme var.')
            } else {
                toast.error(error?.response?.data?.message || 'Arama başlatılamadı.')
            }
        } finally {
            setIsCallActionPending(false)
        }
    }, [setActiveCall, setIncomingCall, setIsInCall, setIsCallActionPending, startRingbackTone])

    const handleAcceptIncomingCall = useCallback(async () => {
        const { incomingCall: ic } = useCallStore.getState()
        if (!ic?.id || !ic?.chat_id) return

        setIsCallActionPending(true)
        try {
            const response = await api.post(`/chats/${ic.chat_id}/calls/${ic.id}/accept`)
            const call = response.data?.data
            if (!call) return

            stopCallSounds()
            setActiveCall(call)
            setIncomingCall(null)
            setIsInCall(true)
            toast.success('Arama kabul edildi.')
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Arama kabul edilemedi.')
        } finally {
            setIsCallActionPending(false)
        }
    }, [setActiveCall, setIncomingCall, setIsInCall, setIsCallActionPending, stopCallSounds])

    const handleRejectIncomingCall = useCallback(async () => {
        const { incomingCall: ic } = useCallStore.getState()
        if (!ic?.id || !ic?.chat_id) return

        setIsCallActionPending(true)
        try {
            await api.post(`/chats/${ic.chat_id}/calls/${ic.id}/reject`)
            toast('Arama reddedildi.')
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Arama reddedilemedi.')
        } finally {
            stopCallSounds()
            setIncomingCall(null)
            setIsCallActionPending(false)
        }
    }, [setIncomingCall, setIsCallActionPending, stopCallSounds])

    const handleEndCall = useCallback(async () => {
        const { activeCall: ac } = useCallStore.getState()
        if (!ac?.id || !ac?.chat_id) return

        setIsCallActionPending(true)
        try {
            await api.post(`/chats/${ac.chat_id}/calls/${ac.id}/end`)
            toast('Görüşmeden ayrıldınız.')
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Görüşme sonlandırılamadı.')
        } finally {
            teardownCallMedia()
            clearCallState()
            setIsCallActionPending(false)
        }
    }, [setIsCallActionPending, teardownCallMedia, clearCallState])

    const handleRejoinCall = useCallback(async () => {
        const { activeCall: ac } = useCallStore.getState()
        if (!ac?.id || !ac?.chat_id) return

        setIsCallActionPending(true)
        try {
            const response = await api.post(`/chats/${ac.chat_id}/calls/${ac.id}/accept`)
            const call = response.data?.data
            if (!call) return

            setActiveCall(call)
            setIsInCall(true)
            toast.success('Görüşmeye tekrar katıldınız.')
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Görüşmeye katılınamadı.')
        } finally {
            setIsCallActionPending(false)
        }
    }, [setActiveCall, setIsInCall, setIsCallActionPending])

    // Expose handlers via ref on window for ChatPage to access
    useEffect(() => {
        window.__callManager = {
            handleStartCall,
            handleEndCall,
            handleAcceptIncomingCall,
            handleRejectIncomingCall,
            handleRejoinCall,
        }
        return () => { delete window.__callManager }
    }, [handleStartCall, handleEndCall, handleAcceptIncomingCall, handleRejectIncomingCall, handleRejoinCall])

    return (
        <>
            <IncomingCallModal
                call={incomingCall}
                pending={isCallActionPending}
                onAccept={handleAcceptIncomingCall}
                onReject={handleRejectIncomingCall}
            />

            <FloatingCallWidget
                activeCall={activeCall}
                isInCall={isInCall}
                callDuration={callDuration}
                onEndCall={handleEndCall}
                isCallActionPending={isCallActionPending}
            />
        </>
    )
}
