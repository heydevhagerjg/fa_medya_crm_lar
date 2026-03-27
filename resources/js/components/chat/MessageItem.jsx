import React from 'react'
import { FileText, Download, Check, CheckCheck, User, Shield, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function MessageItem({ message, isOwn, isSystem }) {
  if (isSystem) {
    return (
      <div className="flex justify-center my-4 animate-in fade-in zoom-in duration-500">
        <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 overflow-hidden backdrop-blur-md">
          <Info size={14} className="text-primary" />
          <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{message.content}</span>
        </div>
      </div>
    )
  }

  const renderAttachments = () => {
    if (!message.attachments?.length) return null;

    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map((file) => (
          <div key={file.id} className="group relative">
            {file.file_type === 'image' ? (
              <div className="rounded-2xl overflow-hidden border border-white/20 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                <img 
                  src={file.preview_url || file.s3_url} 
                  alt={file.file_name} 
                  className="max-w-full max-h-60 object-cover hover:scale-105 transition-transform duration-500"
                />
                <a 
                  href={file.s3_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Download className="text-white" size={24} />
                </a>
              </div>
            ) : (
              <div className="bg-white/10 border border-white/20 p-3 rounded-2xl flex items-center gap-3 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <FileText className="text-primary" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate text-inherit">{file.file_name}</div>
                  <div className="text-[10px] opacity-60 uppercase font-black">{(file.file_size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <a href={file.s3_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                  <Download size={16} />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex group ${isOwn ? 'justify-end' : 'justify-start'} mb-4 animate-in ${isOwn ? 'slide-in-from-right-4' : 'slide-in-from-left-4'} fade-in duration-300`}>
      <div className={`flex max-w-[80%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        {/* Avatar */}
        <div className="flex-shrink-0 self-end mb-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-transform group-hover:scale-110 ${
            isOwn ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-gray-200 dark:bg-white/10 dark:text-white border-gray-300 dark:border-white/10'
          }`}>
            {message.user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && (
             <div className="text-[10px] font-black text-gray-500 dark:text-gray-400 mb-1 px-1 uppercase tracking-widest flex items-center gap-1.5">
                {message.user?.name}
                {message.user?.role === 'ADMIN' && <Shield size={10} className="text-primary" />}
             </div>
          )}
          
          <div className={`relative px-4 py-3 rounded-3xl shadow-sm transition-all duration-300 ${
            isOwn 
              ? 'bg-primary text-white rounded-tr-none shadow-primary/10 hover:shadow-xl hover:shadow-primary/20' 
              : 'bg-white dark:bg-[#111111] dark:border dark:border-white/5 text-gray-900 dark:text-white rounded-tl-none hover:bg-gray-50 dark:hover:bg-white/[0.03]'
          }`}>
            {message.content && <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>}
            {renderAttachments()}
            
            <div className={`flex items-center gap-1.5 mt-1.5 opacity-60 text-[9px] font-bold uppercase tracking-tighter ${isOwn ? 'text-white' : 'text-gray-500'}`}>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: tr })}
              {isOwn && (
                message.read_count > 0 ? <CheckCheck size={12} className="text-white" /> : <Check size={12} className="text-white" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
