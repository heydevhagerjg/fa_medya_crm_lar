import React from 'react'
import { FileText, Download, Check, CheckCheck, Shield, Info } from 'lucide-react'
import { format } from 'date-fns'

export default function MessageItem({ message, isOwn, isSystem }) {
  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2">
          <Info size={12} className="text-[#905efc]" />
          <span className="text-[11px] text-[#9097A6]">{message.content}</span>
        </div>
      </div>
    )
  }

  const renderAttachments = () => {
    if (!message.attachments?.length) return null
    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map((file) => (
          <div key={file.id} className="group relative">
            {file.file_type === 'image' ? (
              <div className="rounded-xl overflow-hidden border border-white/10 shadow-md">
                <img
                  src={file.preview_url || file.s3_url}
                  alt={file.file_name}
                  className="max-w-full max-h-56 object-cover"
                />
                <a
                  href={file.s3_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="text-white" size={22} />
                </a>
              </div>
            ) : (
              <div className="bg-white/10 border border-white/20 p-2.5 rounded-xl flex items-center gap-2.5 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="text-white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate text-inherit">{file.file_name}</div>
                  <div className="text-[10px] opacity-60">{(file.file_size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <a href={file.s3_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 transition-all">
                  <Download size={14} className="text-white" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Format time
  const timeStr = message.created_at
    ? (() => { try { return format(new Date(message.created_at), 'HH:mm') } catch { return '' } })()
    : ''

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2.5 max-w-[75%]`}>
        
        {/* Avatar */}
        {!isOwn && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1A1A2E]/10 dark:bg-white/10 flex items-center justify-center text-[11px] font-bold text-[#1A1A2E] dark:text-white border border-[#E5E9F0] dark:border-white/10 self-end mb-0.5">
            {message.user?.name?.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Bubble */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name (for received messages) */}
          {!isOwn && (
            <div className="text-[11px] font-semibold text-[#905efc] mb-1 px-1 flex items-center gap-1">
              {message.user?.name}
              {message.user?.role === 'ADMIN' && <Shield size={9} className="text-[#905efc]" />}
            </div>
          )}

          <div className={`relative px-4 py-2.5 rounded-2xl transition-all duration-200 ${
            isOwn
              ? 'bg-[#905efc] text-white rounded-br-sm shadow-lg shadow-[#905efc]/20'
              : 'bg-white dark:bg-[#12122A] text-[#1A1A2E] dark:text-white rounded-bl-sm shadow-sm border border-[#E5E9F0] dark:border-white/5'
          }`}>
            {message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )}
            {renderAttachments()}

            {/* Timestamp + Read status */}
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-[#9097A6]'}`}>
                {timeStr}
              </span>
              {isOwn && (
                message.read_count > 0
                  ? <CheckCheck size={12} className="text-white/80" />
                  : <Check size={12} className="text-white/60" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
