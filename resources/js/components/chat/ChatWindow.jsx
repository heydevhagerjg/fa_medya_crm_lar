import React, { useEffect, useRef, useState } from 'react'
import MessageItem from './MessageItem'
import MessageInput from './MessageInput'
import { Info, MoreVertical, Phone, Video, Search, ChevronLeft, UserPlus, Hash, Shield, Pin, BellOff, MessageCircleCode, CheckCircle2 } from 'lucide-react'

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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-[#080808] animate-in fade-in zoom-in duration-700 relative overflow-hidden group">
        <div className="absolute inset-0 opacity-5 pointer-events-none transition-transform group-hover:scale-110 duration-[10s] ease-linear">
            <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-[100px]" />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-[40px] bg-white dark:bg-white/5 shadow-2xl dark:shadow-none flex items-center justify-center mb-8 border border-gray-100 dark:border-white/5 group-hover:rotate-6 transition-transform duration-500">
                <MessageCircleCode size={48} className="text-primary animate-pulse shadow-primary/20 drop-shadow-lg" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight text-center uppercase mb-3">Sohbet Seçin</h2>
            <p className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-loose max-w-sm text-center">İletişime devam etmek için yan menüden bir sohbet seçin veya yeni bir grup başlatın.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0A0A0A] relative animate-in fade-in slide-in-from-right-10 duration-500 overflow-hidden shadow-2xl dark:shadow-none">
      
      {/* Window Header */}
      <header className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between backdrop-blur-xl bg-white/80 dark:bg-[#0A0A0A]/80 z-20 sticky top-0 shadow-sm border-white/5 transition-all duration-300">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-primary transition-colors">
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setShowInfo(!showInfo)}>
             <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 group-hover:scale-105 transition-transform shadow-lg shadow-primary/5">
                    {chat.icon ? <i className={chat.icon} /> : (chat.name?.charAt(0).toUpperCase() || <Hash size={20} />)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-white dark:border-[#0A0A0A] rounded-full shadow-lg" />
             </div>
             <div>
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">{chat.name}</h3>
                    <Pin size={14} className="text-primary opacity-60" />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 opacity-60 text-[10px] font-black uppercase tracking-widest text-[#9097A6] dark:text-gray-500">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    Çevrimiçi • {chat.participants?.length || 0} Üye
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
             <button className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-primary hover:bg-primary/10 transition-all border border-gray-100 dark:border-white/5 h-11 w-11 flex items-center justify-center group active:scale-95 shadow-sm">
                <Search size={18} className="group-hover:scale-110 transition-transform" />
             </button>
             <button className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all border border-gray-100 dark:border-white/5 h-11 w-11 flex items-center justify-center group active:scale-95 shadow-sm">
                <Phone size={18} className="group-hover:scale-110 transition-transform" />
             </button>
             <button 
                onClick={() => setShowInfo(!showInfo)}
                className={`w-10 h-10 rounded-xl transition-all border h-11 w-11 flex items-center justify-center group active:scale-95 shadow-sm ${showInfo ? 'bg-primary text-white border-primary shadow-primary/30' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-primary hover:bg-primary/10 border-gray-100 dark:border-white/5'}`}
             >
                <Info size={18} className="group-hover:rotate-12 transition-transform" />
             </button>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 bg-gray-50/50 dark:bg-[#080808]/10 custom-scrollbar-thin scroll-smooth relative"
      >
        <div className="max-w-7xl mx-auto flex flex-col min-h-full">
            <div className="mb-auto" /> {/* Spacer to push messages to bottom if few */}
            
            {/* Start marker */}
            <div className="flex flex-col items-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="w-16 h-16 rounded-[28px] bg-white dark:bg-white/5 shadow-xl flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5">
                    <CheckCircle2 size={32} className="text-primary opacity-80" />
                </div>
                <h4 className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mb-2">Güvenli Sohbet Başlatıldı</h4>
                <p className="text-[10px] font-bold text-gray-400/60 uppercase tracking-widest max-w-[200px] text-center leading-relaxed">Uçtan uca şifreleme ve tenant bazlı izolasyon aktif.</p>
                <div className="w-px h-12 bg-gradient-to-b from-gray-200 dark:from-white/10 to-transparent mt-6" />
            </div>

            {messages.map((msg, i) => {
                const isOwn = msg.user_id === currentUser?.id;
                const isSystem = msg.type === 'system';
                
                return (
                    <MessageItem 
                        key={msg.id} 
                        message={msg} 
                        isOwn={isOwn} 
                        isSystem={isSystem} 
                    />
                );
            })}

            {isLoading && (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            )}
        </div>
      </div>

      {/* Input Area */}
      <MessageInput 
        onSendMessage={onSendMessage} 
        onFileUpload={onFileUpload} 
        isUploading={isUploading}
      />

      {/* Chat Info Overlay (Sidebar style) */}
      {showInfo && (
        <aside className="absolute top-0 right-0 w-80 h-full bg-white dark:bg-[#0A0A0A] border-l border-gray-100 dark:border-white/5 z-50 animate-in slide-in-from-right duration-500 shadow-2xl flex flex-col p-8">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Sohbet Bilgisi</h3>
                <button onClick={() => setShowInfo(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                </button>
            </div>
            
            <div className="flex flex-col items-center mb-10 group">
                <div className="w-24 h-24 rounded-[40px] bg-primary/10 text-primary flex items-center justify-center mb-6 border-2 border-primary/20 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-primary/10">
                    <Hash size={40} />
                </div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight text-center mb-2">{chat.name}</h4>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 text-center uppercase tracking-widest leading-relaxed opacity-70 italic">"{chat.description || 'Açıklama belirtilmemiş.'}"</p>
            </div>

            <div className="space-y-6">
                <div>
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                        Üyeler ({chat.participants?.length})
                        <button className="text-primary hover:opacity-70 transition-opacity"><UserPlus size={14}/></button>
                    </h5>
                    <div className="space-y-3">
                        {chat.participants?.map(p => (
                            <div key={p.user_id} className="flex items-center gap-3 group">
                                <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-xs font-black dark:text-white group-hover:scale-110 transition-transform">
                                    {p.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-black text-gray-800 dark:text-white truncate flex items-center gap-1.5">
                                        {p.user?.name}
                                        {p.role === 'owner' && <Shield size={10} className="text-primary" />}
                                    </div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{p.role === 'owner' ? 'Sahip' : 'Üye'}</div>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-white/5 space-y-2">
                    <button className="w-full py-3 px-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-between hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
                        Sessize Al <BellOff size={14} />
                    </button>
                    <button className="w-full py-3 px-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-between hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
                        Şikayet Et <Info size={14} />
                    </button>
                </div>
            </div>
        </aside>
      )}
    </div>
  )
}

function X({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> }
function Loader2({ className, size }) { return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg> }
