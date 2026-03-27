import React, { useState } from 'react'
import { Plus, Search, MessageSquare, Filter, MoreVertical, Shield, User, Clock, CheckCheck, Hash } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function ChatSidebar({ chats, selectedChatId, onSelectChat, onNewChat }) {
  const [search, setSearch] = useState('')

  const filtered = chats.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-80 border-r border-gray-100 dark:border-white/5 bg-white dark:bg-[#0A0A0A] flex flex-col h-full z-30 shadow-[4px_0_32px_0_rgba(26,26,46,0.02)] transition-all duration-300">
      
      {/* Header Area */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6 group">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <MessageSquare size={22} className="group-hover:rotate-12 transition-transform duration-500" />
             </div>
             <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Mesajlar</h2>
          </div>
          <button 
            onClick={onNewChat}
            className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all border border-transparent shadow-sm active:scale-95 flex items-center justify-center"
            title="Yeni Sohbet"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Mesajlarda ara..."
            className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-[10px] placeholder:font-black placeholder:uppercase placeholder:tracking-widest dark:text-white dark:placeholder:text-gray-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar scroll-smooth">
            <button className="px-5 py-2 rounded-full border border-primary bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest min-w-fit shadow-lg shadow-primary/5">Hepsi</button>
            <button className="px-5 py-2 rounded-full border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-all min-w-fit">Okunmamış</button>
            <button className="px-5 py-2 rounded-full border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-all min-w-fit flex items-center gap-1.5 min-w-fit"><Shield size={10} /> Admin</button>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5 custom-scrollbar">
        {filtered.map((chat) => (
          <div 
            key={chat.id} 
            onClick={() => onSelectChat(chat)}
            className={`flex items-center gap-3.5 p-3.5 rounded-3xl cursor-pointer transition-all duration-500 border group ${
                selectedChatId === chat.id 
                    ? 'bg-primary border-primary shadow-xl shadow-primary/20 translate-x-1' 
                    : 'bg-white dark:bg-[#0A0A0A] border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:border-gray-100 dark:hover:border-white/5'
            }`}
          >
            {/* Avatar block with status */}
            <div className="relative flex-shrink-0">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black border group-hover:scale-105 transition-transform duration-500 ${selectedChatId === chat.id ? 'bg-white/20 text-white border-white/10 backdrop-blur-sm' : 'bg-gray-100 dark:bg-white/5 dark:text-white dark:border-white/10'}`}>
                    {chat.icon ? <i className={chat.icon} /> : (chat.name?.charAt(0).toUpperCase() || <Hash size={20} />)}
               </div>
               {chat.unread_count > 0 && (
                 <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-xl border-[3px] border-white dark:border-[#0A0A0A] shadow-lg animate-bounce animate-duration-[2000ms]">
                   {chat.unread_count}
                 </span>
               )}
            </div>

            {/* Content block */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-black text-sm truncate tracking-tight transition-colors duration-300 ${selectedChatId === chat.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {chat.name}
                    </h3>
                    {chat.last_message_at && (
                        <span className={`text-[8px] font-black uppercase tracking-tighter opacity-60 transition-colors duration-300 ${selectedChatId === chat.id ? 'text-white' : 'text-gray-400'}`}>
                            {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: false, locale: tr })}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between gap-1">
                    <p className={`text-[11px] truncate leading-tight font-medium opacity-70 transition-colors duration-300 ${selectedChatId === chat.id ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {chat.last_message ? chat.last_message.content : (chat.description || 'Henüz mesaj yok...')}
                    </p>
                    {chat.last_message && selectedChatId !== chat.id && (
                        <CheckCheck size={12} className={chat.last_message.read_count > 0 ? 'text-primary' : 'text-gray-300'} />
                    )}
                </div>
            </div>
          </div>
        ))}

        {!filtered.length && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4 text-gray-300 dark:text-gray-700">
                    <Search size={32} />
                </div>
                <p className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-loose">Hata! Sohbet bulunamadı.</p>
            </div>
        )}
      </div>
    </div>
  )
}
