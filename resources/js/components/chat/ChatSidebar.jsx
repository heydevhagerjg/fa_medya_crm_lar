import React, { useState } from 'react'
import { Plus, Search, CheckCheck, Hash, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function ChatSidebar({ chats, selectedChatId, onSelectChat, onNewChat, onDeleteChat }) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const filtered = chats.filter(c => {
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase())
    if (activeFilter === 'unread') return matchSearch && c.unread_count > 0
    return matchSearch
  })

  const handleDeleteClick = (e, chatId) => {
    e.stopPropagation()
    setConfirmDeleteId(chatId)
  }

  const handleConfirmDelete = (e, chat) => {
    e.stopPropagation()
    onDeleteChat(chat)
    setConfirmDeleteId(null)
  }

  const handleCancelDelete = (e) => {
    e.stopPropagation()
    setConfirmDeleteId(null)
  }

  return (
    <div className="w-[320px] flex-shrink-0 flex flex-col h-full bg-[#F4F5F7] dark:bg-[#0D0D1A] border-r border-[#E5E9F0] dark:border-white/5">
      
      {/* Search Bar */}
      <div className="px-4 pt-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9097A6]" size={15} />
          <input
            type="text"
            placeholder="Ara..."
            className="w-full bg-white dark:bg-white/[0.06] border border-[#E5E9F0] dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-[#1A1A2E] dark:text-white placeholder:text-[#9097A6] focus:outline-none focus:ring-2 focus:ring-[#905efc]/20 focus:border-[#905efc]/40 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {[
          { key: 'all', label: 'Hepsi' },
          { key: 'unread', label: 'Okunmamış' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === f.key
                ? 'bg-[#905efc] text-white shadow-lg shadow-[#905efc]/25'
                : 'bg-white dark:bg-white/5 text-[#9097A6] hover:text-[#1A1A2E] dark:hover:text-white border border-[#E5E9F0] dark:border-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {filtered.map((chat) => {
          const isActive = selectedChatId === chat.id
          const isConfirming = confirmDeleteId === chat.id

          return (
            <div
              key={chat.id}
              onClick={() => !isConfirming && onSelectChat(chat)}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 group ${
                isActive
                  ? 'bg-white dark:bg-white/10 shadow-sm'
                  : chat.unread_count > 0
                    ? 'bg-[#905efc]/5 dark:bg-[#905efc]/10 hover:bg-[#905efc]/8 dark:hover:bg-[#905efc]/15'
                    : 'hover:bg-white/70 dark:hover:bg-white/5'
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold ${
                  isActive
                    ? 'bg-[#905efc]/15 text-[#905efc]'
                    : chat.unread_count > 0
                      ? 'bg-[#905efc]/10 text-[#905efc]'
                      : 'bg-[#1A1A2E]/10 dark:bg-white/10 text-[#1A1A2E] dark:text-white'
                }`}>
                  {chat.icon
                    ? <i className={chat.icon} />
                    : <span>{chat.name?.charAt(0).toUpperCase() || <Hash size={18} />}</span>
                  }
                </div>
                {chat.unread_count > 0 && !isActive && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-[#905efc] text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 border-2 border-[#F4F5F7] dark:border-[#0D0D1A]">
                    {chat.unread_count}
                  </span>
                )}
              </div>

              {/* Content */}
              {isConfirming ? (
                /* Confirm Delete UI */
                <div className="flex-1 flex flex-col gap-1.5">
                  <p className="text-xs font-semibold text-red-500">Sohbet silinsin mi?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleConfirmDelete(e, chat)}
                      className="flex-1 py-1 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-colors"
                    >
                      Evet, Sil
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="flex-1 py-1 rounded-lg bg-[#E5E9F0] dark:bg-white/10 text-[#1A1A2E] dark:text-white text-[11px] font-bold hover:bg-[#d5d9e0] dark:hover:bg-white/20 transition-all"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal Content */
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`text-sm truncate leading-tight ${
                        chat.unread_count > 0 && !isActive
                          ? 'font-bold text-[#1A1A2E] dark:text-white' 
                          : 'font-semibold text-[#1A1A2E]/80 dark:text-white/80'
                      }`}>
                        {chat.name}
                      </h3>
                      {chat.last_message_at && (
                        <span className={`text-[10px] flex-shrink-0 ml-2 ${
                          chat.unread_count > 0 && !isActive ? 'text-[#905efc] font-bold' : 'text-[#9097A6]'
                        }`}>
                          {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: false, locale: tr })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {chat.last_message && !chat.unread_count && !isActive && (
                        <CheckCheck size={12} className={chat.last_message.read_count > 0 ? 'text-[#905efc] flex-shrink-0' : 'text-[#9097A6] flex-shrink-0'} />
                      )}
                      <p className={`text-[12px] truncate leading-tight ${
                        chat.unread_count > 0 && !isActive ? 'text-[#1A1A2E] dark:text-white font-medium' : 'text-[#9097A6]'
                      }`}>
                        {chat.last_message
                          ? chat.last_message.content
                          : (chat.description || 'Henüz mesaj yok...')
                        }
                      </p>
                    </div>
                  </div>

                  {/* Delete button — visible on hover */}
                  <button
                    onClick={(e) => handleDeleteClick(e, chat.id)}
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[#9097A6] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Sohbeti Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          )
        })}

        {!filtered.length && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center mb-3 text-[#9097A6]">
              <Search size={24} />
            </div>
            <p className="text-xs text-[#9097A6]">Sohbet bulunamadı</p>
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-3 border-t border-[#E5E9F0] dark:border-white/5">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#905efc] text-white text-sm font-semibold hover:bg-[#7c4ef0] active:scale-95 transition-all shadow-lg shadow-[#905efc]/25"
        >
          <Plus size={18} />
          Yeni Sohbet
        </button>
      </div>
    </div>
  )
}
