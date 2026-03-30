import React, { useState } from 'react'
import { Plus, Search, CheckCheck, Hash, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function ChatSidebar({ chats, selectedChatId, onSelectChat, onNewChat, onDeleteChat, currentUser }) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'
  const canCreate = currentUser?.permissions?.includes('chat.create')
  const canDeleteGlobal = currentUser?.permissions?.includes('chat.delete')

  const filtered = chats.filter((chat) => {
    const searchLower = (search || '').toString().toLowerCase()
    const nameMatch = (chat.name || '').toString().toLowerCase().includes(searchLower)
    const descMatch = (chat.description || '').toString().toLowerCase().includes(searchLower)
    const matchSearch = nameMatch || descMatch

    if (activeFilter === 'unread') return matchSearch && chat.unread_count > 0
    return matchSearch
  })

  const handleDeleteClick = (event, chatId) => {
    event.stopPropagation()
    setConfirmDeleteId(chatId)
  }

  const handleConfirmDelete = (event, chat) => {
    event.stopPropagation()
    onDeleteChat(chat)
    setConfirmDeleteId(null)
  }

  const handleCancelDelete = (event) => {
    event.stopPropagation()
    setConfirmDeleteId(null)
  }

  return (
    <div className="theme-surface w-full shrink-0 flex flex-col h-full border-r theme-divider">
      <div className="px-4 pt-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-secondary" size={15} />
          <input
            type="text"
            placeholder="Ara..."
            className="theme-input w-full border rounded-2xl pl-10 pr-4 py-2.5 text-sm transition-all"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {[
          { key: 'all', label: 'Hepsi' },
          { key: 'unread', label: 'Okunmamış' },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeFilter === filter.key
              ? 'theme-button-primary text-white shadow-lg'
              : 'theme-button-secondary theme-text-secondary hover:theme-text-primary border theme-divider'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {filtered.map((chat) => {
          const isActive = selectedChatId === chat.id
          const isConfirming = confirmDeleteId === chat.id

          return (
            <div
              key={chat.id}
              onClick={() => !isConfirming && onSelectChat(chat)}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 group ${isActive
                ? 'theme-surface-alt shadow-sm'
                : chat.unread_count > 0
                  ? 'bg-primary/8 dark:bg-primary/15'
                  : 'hover:theme-surface-alt'
              }`}
            >
              <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold ${isActive
                  ? 'bg-primary/15 text-primary'
                  : chat.unread_count > 0
                    ? 'bg-primary/10 text-primary'
                    : 'theme-surface-alt theme-text-primary border theme-divider'
                }`}>
                  {chat.icon ? <i className={chat.icon} /> : <span>{chat.name?.charAt(0).toUpperCase() || <Hash size={18} />}</span>}
                </div>
                {chat.unread_count > 0 && !isActive && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 theme-button-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 border-2 border-(--theme-bg-app)">
                    {chat.unread_count}
                  </span>
                )}
              </div>

              {isConfirming ? (
                <div className="flex-1 flex flex-col gap-1.5">
                  <p className="text-xs font-semibold text-red-500">Sohbet silinsin mi?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={(event) => handleConfirmDelete(event, chat)}
                      className="flex-1 py-1 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-colors"
                    >
                      Evet, Sil
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="theme-button-secondary flex-1 py-1 rounded-lg text-[11px] font-bold transition-all"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`text-sm truncate leading-tight ${chat.unread_count > 0 && !isActive
                        ? 'font-bold theme-text-primary'
                        : 'font-semibold theme-text-primary opacity-80'
                      }`}>
                        {chat.name}
                      </h3>
                      {chat.last_message_at && (
                        <span className={`text-[10px] shrink-0 ml-2 ${chat.unread_count > 0 && !isActive ? 'text-primary font-bold' : 'theme-text-secondary'}`}>
                          {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: false, locale: tr })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {chat.last_message && !chat.unread_count && !isActive && (
                        <CheckCheck size={12} className={chat.last_message.read_count > 0 ? 'text-primary shrink-0' : 'theme-text-secondary shrink-0'} />
                      )}
                      <p className={`text-[12px] truncate leading-tight ${chat.unread_count > 0 && !isActive ? 'theme-text-primary font-medium' : 'theme-text-secondary'}`}>
                        {chat.last_message ? chat.last_message.content : (chat.description || 'Henüz mesaj yok...')}
                      </p>
                    </div>
                  </div>

                  {(chat.created_by === currentUser?.id || isAdmin || canDeleteGlobal) && (
                    <button
                      onClick={(event) => handleDeleteClick(event, chat.id)}
                      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center theme-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Sohbeti Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}

        {!filtered.length && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="theme-surface-alt w-14 h-14 rounded-2xl flex items-center justify-center mb-3 theme-text-secondary border theme-divider">
              <Search size={24} />
            </div>
            <p className="text-xs theme-text-secondary">Sohbet bulunamadı</p>
          </div>
        )}
      </div>

      {(canCreate || isAdmin) && (
        <div className="p-3 border-t theme-divider">
          <button
            onClick={onNewChat}
            className="theme-button-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold active:scale-95 transition-all shadow-lg"
          >
            <Plus size={18} />
            Yeni Sohbet
          </button>
        </div>
      )}
    </div>
  )
}
