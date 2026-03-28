import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import ChatSidebar from '../components/chat/ChatSidebar'
import ChatWindow from '../components/chat/ChatWindow'
import { useAuthStore } from '../stores/index.js'
import { Toaster, toast } from 'react-hot-toast'
import { Search as SearchIcon, Users, User, Check, X } from 'lucide-react'

// ─── New Chat Modal ────────────────────────────────────────────────────────────
function NewChatModal({ open, onClose, currentUser, onCreated }) {
    const [tab, setTab] = useState('direct') // 'direct' | 'group'
    const [search, setSearch] = useState('')
    const [groupName, setGroupName] = useState('')
    const [groupDesc, setGroupDesc] = useState('')
    const [selected, setSelected] = useState([])

    const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
        queryKey: ['users-list'],
        queryFn: () => api.get('/settings/users').then(r => {
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
        onError: () => toast.error('Sohbet başlatılamadı.')
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
                className="relative w-full max-w-md bg-white dark:bg-[#0D0D1A] rounded-3xl shadow-2xl border border-[#E5E9F0] dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E9F0] dark:border-white/5">
                    <h2 className="text-base font-bold text-[#1A1A2E] dark:text-white">Yeni Sohbet</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9097A6] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-1 mx-6 mt-4 p-1 bg-[#F4F5F7] dark:bg-white/5 rounded-2xl">
                    <button
                        onClick={() => setTab('direct')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            tab === 'direct'
                                ? 'bg-white dark:bg-white/10 text-[#905efc] shadow-sm'
                                : 'text-[#9097A6] hover:text-[#1A1A2E] dark:hover:text-white'
                        }`}
                    >
                        <User size={14} /> Bireysel
                    </button>
                    <button
                        onClick={() => setTab('group')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            tab === 'group'
                                ? 'bg-white dark:bg-white/10 text-[#905efc] shadow-sm'
                                : 'text-[#9097A6] hover:text-[#1A1A2E] dark:hover:text-white'
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
                                className="w-full px-4 py-2.5 rounded-2xl border border-[#E5E9F0] dark:border-white/10 bg-[#F4F5F7] dark:bg-white/5 text-sm text-[#1A1A2E] dark:text-white placeholder:text-[#9097A6] focus:outline-none focus:ring-2 focus:ring-[#905efc]/20 focus:border-[#905efc]/40"
                            />
                            <input
                                type="text"
                                placeholder="Açıklama (isteğe bağlı)"
                                value={groupDesc}
                                onChange={e => setGroupDesc(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-2xl border border-[#E5E9F0] dark:border-white/10 bg-[#F4F5F7] dark:bg-white/5 text-sm text-[#1A1A2E] dark:text-white placeholder:text-[#9097A6] focus:outline-none focus:ring-2 focus:ring-[#905efc]/20 focus:border-[#905efc]/40"
                            />
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9097A6]" size={14} />
                        <input
                            type="text"
                            placeholder={tab === 'group' ? 'Katılımcı ara... (en az 2)' : 'Personel ara...'}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E5E9F0] dark:border-white/10 bg-[#F4F5F7] dark:bg-white/5 text-sm text-[#1A1A2E] dark:text-white placeholder:text-[#9097A6] focus:outline-none focus:ring-2 focus:ring-[#905efc]/20 focus:border-[#905efc]/40"
                        />
                    </div>

                    {/* Selected chips (group) */}
                    {tab === 'group' && selected.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {selected.map(id => {
                                const u = users.find(u => u.id === id)
                                return u ? (
                                    <span key={id} className="flex items-center gap-1 pl-2.5 pr-1 py-1 bg-[#905efc]/10 text-[#905efc] rounded-full text-xs font-semibold">
                                        {u.name}
                                        <button onClick={() => toggleSelect(id)} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#905efc]/20 transition-colors">
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
                                <div className="w-5 h-5 border-2 border-[#905efc]/30 border-t-[#905efc] rounded-full animate-spin" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <p className="text-center text-xs text-[#9097A6] py-6">Kullanıcı bulunamadı</p>
                        ) : filteredUsers.map(u => {
                            const isSelected = selected.includes(u.id)
                            return (
                                <div
                                    key={u.id}
                                    onClick={() => tab === 'direct' ? handleDirectChat(u) : toggleSelect(u.id)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${
                                        isSelected
                                            ? 'bg-[#905efc]/8 dark:bg-[#905efc]/15'
                                            : 'hover:bg-[#F4F5F7] dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="w-9 h-9 rounded-xl bg-[#905efc]/10 text-[#905efc] flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-[#1A1A2E] dark:text-white truncate">{u.name}</div>
                                        <div className="text-[11px] text-[#9097A6] truncate">{u.email}</div>
                                    </div>
                                    {tab === 'group' && (
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                            isSelected ? 'bg-[#905efc] border-[#905efc]' : 'border-[#E5E9F0] dark:border-white/20'
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
                            className="w-full py-3 rounded-2xl bg-[#905efc] text-white text-sm font-bold hover:bg-[#7c4ef0] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#905efc]/25"
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

// ─── ChatPage ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
    const { user: currentUser } = useAuthStore()
    const queryClient = useQueryClient()
    const [selectedChat, setSelectedChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
    const [searchParams, setSearchParams] = useSearchParams()
    const openChatId = searchParams.get('open')

    const { data: chats = [] } = useQuery({
        queryKey: ['chats'],
        queryFn: () => api.get('/chats').then(r => {
            const raw = r.data?.data || []
            return Array.isArray(raw) ? raw : Object.values(raw)
        }),
    })

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
        if (!selectedChat?.id || !files?.length) return
        
        const filesArray = Array.isArray(files) ? files : [files]
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

    return (
        <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-3xl border border-[#E5E9F0] dark:border-white/5 bg-white dark:bg-[#0A0A18] shadow-[0_8px_40px_-8px_rgba(144,94,252,0.12)] dark:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.4)] animate-in fade-in zoom-in-95 duration-500">
            <Toaster position="top-right" />

            <ChatSidebar
                chats={chats}
                selectedChatId={selectedChat?.id}
                onSelectChat={setSelectedChat}
                onNewChat={() => setIsNewChatModalOpen(true)}
                onDeleteChat={(chat) => deleteChatMutation.mutate(chat.id)}
            />

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
            />

            <NewChatModal
                open={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
                currentUser={currentUser}
                onCreated={handleChatCreated}
            />
        </div>
    )
}
