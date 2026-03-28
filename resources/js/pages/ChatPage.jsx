import React, { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import ChatSidebar from '../components/chat/ChatSidebar'
import ChatWindow from '../components/chat/ChatWindow'
import { useAuthStore } from '../stores/index.js'
import { Toaster, toast } from 'react-hot-toast'
import { MessageSquare, Layout, Activity, BellRing, UserPlus, Search as SearchIcon, Loader2 } from 'lucide-react'
import Modal from '../components/ui/Modal'

export default function ChatPage() {
    const { user: currentUser } = useAuthStore()
    const queryClient = useQueryClient()
    const [selectedChat, setSelectedChat] = useState(null)
    const selectedChatIdRef = React.useRef(selectedChat?.id)

    useEffect(() => {
        selectedChatIdRef.current = selectedChat?.id;
    }, [selectedChat?.id]);
    const [messages, setMessages] = useState([])
    const [isUploading, setIsUploading] = useState(false)
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
    const [userSearch, setUserSearch] = useState('')

    // Fetch user's chats
    const { data: chats = [], isLoading: isChatsLoading } = useQuery({
        queryKey: ['chats'],
        queryFn: () => api.get('/chats').then(r => {
            const raw = r.data?.data || [];
            return Array.isArray(raw) ? raw : Object.values(raw);
        }),
    })

    // Fetch potential participants (users)
    const { data: users = [] } = useQuery({
        queryKey: ['users-list'],
        queryFn: () => api.get('/settings/users').then(r => {
            const raw = r.data?.data || r.data || [];
            return Array.isArray(raw) ? raw : [];
        }),
        enabled: isNewChatModalOpen
    })

    // Create chat mutation
    const createChatMutation = useMutation({
        mutationFn: (data) => api.post('/chats', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['chats']);
            setSelectedChat(res.data.data);
            setIsNewChatModalOpen(false);
            toast.success('Sohbet başlatıldı.');
        },
        onError: () => toast.error('Sohbet başlatılamadı.')
    })

    // Delete chat mutation
    const deleteChatMutation = useMutation({
        mutationFn: (chatId) => api.delete(`/chats/${chatId}`),
        onSuccess: (_, chatId) => {
            queryClient.invalidateQueries(['chats']);
            if (selectedChat?.id === chatId) {
                setSelectedChat(null);
                setMessages([]);
            }
            toast.success('Sohbet silindi.');
        },
        onError: (err) => {
            const msg = err?.response?.data?.message || 'Sohbet silinemedi.';
            toast.error(msg);
        }
    })

    // Fetch messages for selected chat
    const fetchMessages = useCallback(async (chatId) => {
        try {
            const res = await api.get(`/chats/${chatId}/messages`);
            setMessages(res.data?.data || []);
        } catch (err) {
            toast.error('Mesajlar yüklenemedi.');
        }
    }, [])

    useEffect(() => {
        if (selectedChat?.id) {
            fetchMessages(selectedChat.id);
            // Mark as read
            api.post(`/chats/${selectedChat.id}/read`);
        } else {
            setMessages([]);
        }
    }, [selectedChat, fetchMessages])

    // Echo Listeners
    useEffect(() => {
        if (!currentUser?.id) return;

        // Listen for new chats
        if (!window.Echo) {
            console.error('Laravel Echo is not initialized. Notifications and real-time updates may not work.');
            return;
        }

        const userChannel = window.Echo.private(`user.chats.${currentUser.id}`)
            .listen('.chat.created', (e) => {
                queryClient.invalidateQueries(['chats']);
                toast('Yeni Sohbet!', { icon: <BellRing className="text-primary" size={16} /> });
            })
            .listen('.message.created', (e) => {
                if (e.user_id !== currentUser.id) {
                    if (e.chat_id !== selectedChatIdRef.current) {
                        toast(`Yeni mesaj: ${e.user?.name || 'Biri'}`, { icon: <MessageSquare className="text-primary" size={16} /> });
                    }
                    queryClient.invalidateQueries(['chats']);
                }
            });

        return () => {
            window.Echo.leave(`user.chats.${currentUser.id}`);
        }
    }, [currentUser, queryClient])

    useEffect(() => {
        if (!selectedChat?.id) return;

        // Listen for new messages in current chat
        if (!window.Echo) return;

        const chatChannel = window.Echo.private(`chat.${selectedChat.id}`)
            .listen('.message.created', (e) => {
                setMessages(prev => {
                    // Deduplicate: if sender already added optimistically, skip
                    const exists = prev.some(m => m.id === e.id);
                    return exists ? prev : [...prev, e];
                });
                // Auto-read
                api.post(`/chats/${selectedChat.id}/read`);
            });

        return () => {
            window.Echo.leave(`chat.${selectedChat.id}`);
        }
    }, [selectedChat])

    // Handlers
    const handleSendMessage = async (content) => {
        if (!selectedChat?.id) return;
        
        try {
            const res = await api.post(`/chats/${selectedChat.id}/messages`, { content });
            // Optimistic update: Immediately add message to local state
            // Echo event will trigger for OTHER users; sender sees it right away
            if (res.data?.data) {
                setMessages(prev => {
                    // Deduplicate by id in case Echo also fires for sender
                    const exists = prev.some(m => m.id === res.data.data.id);
                    return exists ? prev : [...prev, res.data.data];
                });
            }
        } catch (err) {
            toast.error('Mesaj gönderilemedi.');
        }
    }

    const handleFileUpload = async (file) => {
        if (!selectedChat?.id) return;
        
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/chats/${selectedChat.id}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Dosya yüklendi.');
        } catch (err) {
            toast.error('Dosya yüklenemedi.');
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-3xl border border-[#E5E9F0] dark:border-white/5 bg-white dark:bg-[#0A0A18] shadow-[0_8px_40px_-8px_rgba(144,94,252,0.12)] dark:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.4)] animate-in fade-in zoom-in-95 duration-500">
            <Toaster position="top-right" />
            
            <ChatSidebar 
                chats={chats} 
                selectedChatId={selectedChat?.id}
                onSelectChat={(chat) => setSelectedChat(chat)}
                onNewChat={() => setIsNewChatModalOpen(true)}
                onDeleteChat={(chat) => deleteChatMutation.mutate(chat.id)}
            />

            <ChatWindow 
                chat={selectedChat}
                messages={messages}
                onSendMessage={handleSendMessage}
                onFileUpload={handleFileUpload}
                isUploading={isUploading}
                isLoading={false}
                currentUser={currentUser}
                onBack={() => setSelectedChat(null)}
            />

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/2 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/2 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* New Chat Modal */}
            <Modal 
                open={isNewChatModalOpen} 
                onClose={() => setIsNewChatModalOpen(false)} 
                title="Yeni Sohbet Başlat"
                size="md"
            >
                <div className="space-y-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary"
                            placeholder="Personel ara..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                        />
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                        {users
                            .filter(u => u.id !== currentUser?.id && u.name.toLowerCase().includes(userSearch.toLowerCase()))
                            .map(u => (
                            <div 
                                key={u.id}
                                onClick={() => createChatMutation.mutate({
                                    entity_type: 'User',
                                    entity_id: u.id,
                                    participant_ids: [u.id],
                                    name: u.name
                                })}
                                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-white/10 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black group-hover:scale-110 transition-transform">
                                    {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-black text-gray-900 dark:text-white truncate">{u.name}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{u.email}</div>
                                </div>
                                <UserPlus size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                            </div>
                        ))}

                        {users.length === 0 && <div className="py-8 text-center text-gray-400 text-xs font-black uppercase tracking-widest">Kullanıcı bulunamadı.</div>}
                    </div>
                </div>
            </Modal>
        </div>
    )
}
