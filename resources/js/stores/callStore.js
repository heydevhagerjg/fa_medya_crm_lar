import { create } from 'zustand'

export const useCallStore = create((set, get) => ({
    activeCall: null,
    incomingCall: null,
    isInCall: false,
    isCallActionPending: false,
    callDuration: 0,

    setActiveCall: (call) => set({ activeCall: call }),
    setIncomingCall: (call) => set({ incomingCall: call }),
    setIsInCall: (v) => set({ isInCall: v }),
    setIsCallActionPending: (v) => set({ isCallActionPending: v }),
    setCallDuration: (v) => set({ callDuration: v }),

    clearCallState: () => set({
        activeCall: null,
        incomingCall: null,
        isInCall: false,
        isCallActionPending: false,
        callDuration: 0,
    }),

    applyCallUpdate: (payload) => {
        if (!payload?.id) return
        const { activeCall, incomingCall } = get()

        // Update activeCall
        let nextActive = activeCall
        if (!activeCall) {
            nextActive = payload
        } else if (String(activeCall.id) === String(payload.id)) {
            nextActive = payload
        }

        // Clear incoming if it matches and is terminal
        let nextIncoming = incomingCall
        if (incomingCall && String(incomingCall.id) === String(payload.id)) {
            if (['ended', 'cancelled', 'rejected'].includes(payload.status)) {
                nextIncoming = null
            }
        }

        set({ activeCall: nextActive, incomingCall: nextIncoming })

        if (payload.status === 'active') {
            // Stop sounds handled externally via callback
        }

        if (['ended', 'cancelled', 'rejected'].includes(payload.status)) {
            set({
                isInCall: false,
                callDuration: 0,
                incomingCall: null,
            })
            // If the ended call matches active, clear it
            if (String(nextActive?.id) === String(payload.id)) {
                set({ activeCall: null })
            }
        }
    },

    // Check if current user can rejoin a call
    canRejoinCall: (userId) => {
        const { activeCall, isInCall } = get()
        if (!activeCall || isInCall) return false
        if (!['ringing', 'active'].includes(activeCall.status)) return false
        const myP = activeCall.participants?.find(p => String(p.user_id) === String(userId))
        return myP?.status === 'left'
    },
}))
