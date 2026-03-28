import React, { useEffect, useRef, useState } from 'react'
import MessageItem from './MessageItem'
import MessageInput from './MessageInput'
import { Info, Phone, Search, ChevronLeft, UserPlus, Hash, Shield, BellOff, MessageCircle } from 'lucide-react'

export default function ChatWindow({
  chat,
  messages,
  onSendMessage,
  onFileUpload,
  isUploading,
  isLoading,
  onBack,
  currentUser
}) {
  const scrollRef = useRef(null)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#F4F5F7] dark:bg-[#080812]">
        <div className="w-20 h-20 rounded-3xl bg-white dark:bg-white/5 shadow-xl flex items-center justify-center mb-6 border border-[#E5E9F0] dark:border-white/5">
          <MessageCircle size={40} className="text-[#905efc]" />
        </div>
        <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white mb-2">Sohbet Seçin</h2>
        <p className="text-sm text-[#9097A6] text-center max-w-xs leading-relaxed">
          Devam etmek için soldaki listeden bir sohbet seçin veya yeni sohbet başlatın.
        </p>
      </div>
    )
  }

  const onlineCount = chat.participants?.filter(p => p.is_online)?.length || 0
  const totalCount = chat.participants?.length || 0

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white dark:bg-[#0A0A18]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Chat Header */}
        <header className="px-6 py-4 border-b border-[#E5E9F0] dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0A0A18] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="md:hidden p-1.5 -ml-1 text-[#9097A6] hover:text-[#905efc] transition-colors">
              <ChevronLeft size={22} />
            </button>

            <div>
              <h3 className="text-lg font-bold text-[#1A1A2E] dark:text-white leading-tight">{chat.name}</h3>
              <p className="text-xs text-[#9097A6] mt-0.5">
                {totalCount > 0
                  ? `${totalCount} üye${onlineCount > 0 ? `, ${onlineCount} çevrimiçi` : ''}`
                  : 'Sohbet'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[#9097A6] hover:text-[#905efc] hover:bg-[#905efc]/8 transition-all">
              <Search size={18} />
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[#9097A6] hover:text-[#905efc] hover:bg-[#905efc]/8 transition-all">
              <Phone size={18} />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                showInfo
                  ? 'text-[#905efc] bg-[#905efc]/10'
                  : 'text-[#9097A6] hover:text-[#905efc] hover:bg-[#905efc]/8'
              }`}
            >
              <Info size={18} />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-5 bg-[#F4F5F7] dark:bg-[#08081A] space-y-1"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Start marker */}
          <div className="flex flex-col items-center py-6 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 shadow-md flex items-center justify-center mb-3 border border-[#E5E9F0] dark:border-white/5">
              <MessageCircle size={24} className="text-[#905efc]" />
            </div>
            <p className="text-xs font-semibold text-[#9097A6] mb-1">Sohbet Başladı</p>
            <p className="text-[11px] text-[#9097A6]/70 text-center max-w-[200px] leading-relaxed">
              Uçtan uca şifrelenmiş, güvenli mesajlaşma
            </p>
          </div>

          {messages.map((msg) => {
            const isOwn = msg.user_id === currentUser?.id
            const isSystem = msg.type === 'system'
            return (
              <MessageItem
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                isSystem={isSystem}
              />
            )
          })}

          {isLoading && (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-[#905efc]/30 border-t-[#905efc] rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Message Input */}
        <MessageInput
          onSendMessage={onSendMessage}
          onFileUpload={onFileUpload}
          isUploading={isUploading}
        />
      </div>

      {/* Chat Info Panel */}
      {showInfo && (
        <aside className="w-72 flex-shrink-0 border-l border-[#E5E9F0] dark:border-white/5 bg-white dark:bg-[#0A0A18] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E9F0] dark:border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1A1A2E] dark:text-white">Sohbet Bilgisi</h3>
            <button
              onClick={() => setShowInfo(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9097A6] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Chat Avatar + Name */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#905efc]/10 text-[#905efc] flex items-center justify-center text-2xl font-bold mb-3">
                {chat.name?.charAt(0).toUpperCase() || <Hash size={28} />}
              </div>
              <h4 className="text-base font-bold text-[#1A1A2E] dark:text-white">{chat.name}</h4>
              {chat.description && (
                <p className="text-xs text-[#9097A6] mt-1 leading-relaxed">{chat.description}</p>
              )}
            </div>

            {/* Members */}
            {chat.participants?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold text-[#9097A6] uppercase tracking-wider">
                    Üyeler ({chat.participants.length})
                  </h5>
                  <button className="text-[#905efc] hover:opacity-70 transition-opacity">
                    <UserPlus size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {chat.participants.map(p => (
                    <div key={p.user_id} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F4F5F7] dark:bg-white/5 flex items-center justify-center text-xs font-bold text-[#1A1A2E] dark:text-white border border-[#E5E9F0] dark:border-white/10">
                        {p.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#1A1A2E] dark:text-white truncate flex items-center gap-1">
                          {p.user?.name}
                          {p.role === 'owner' && <Shield size={10} className="text-[#905efc]" />}
                        </div>
                        <div className="text-[10px] text-[#9097A6]">{p.role === 'owner' ? 'Sahip' : 'Üye'}</div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[#1ED2A7] shadow-[0_0_6px_rgba(30,210,167,0.5)]" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-[#E5E9F0] dark:border-white/5 space-y-2">
              <button className="w-full py-2.5 px-3 rounded-xl bg-[#F4F5F7] dark:bg-white/5 text-[#9097A6] text-xs font-semibold flex items-center justify-between hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-all">
                Sessize Al <BellOff size={14} />
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
