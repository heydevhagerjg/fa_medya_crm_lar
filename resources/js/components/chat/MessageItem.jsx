import React from 'react'
import { FileText, Download, Check, CheckCheck, Shield, Info, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function MessageItem({ message, isOwn, isSystem, isSequential = false, onImageClick, onDelete, canDeleteAll }) {
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

  // Format time
  const timeStr = message.created_at
    ? (() => { try { return format(new Date(message.created_at), 'HH:mm') } catch { return '' } })()
    : ''

  const isImageOnly = !message.content && 
                     message.attachments?.length === 1 && 
                     message.attachments[0].file_type === 'image';

  const renderTimestamp = (overlay = false) => (
    <div className={`flex items-center gap-1 ${overlay ? 'absolute bottom-1.5 right-2 z-10' : 'mt-1'} ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <span className={`text-[10px] ${overlay ? 'text-white font-semibold drop-shadow-md' : isOwn ? 'text-white/60' : 'text-[#9097A6]'}`}>
        {timeStr}
      </span>
      {isOwn && (
        message.read_count > 0
          ? <CheckCheck size={12} className={overlay ? 'text-white drop-shadow-md' : 'text-white/80'} />
          : <Check size={12} className={overlay ? 'text-white/70 drop-shadow-md' : 'text-white/60'} />
      )}
    </div>
  )

  const renderAttachments = () => {
    if (!message.attachments?.length) return null
    return (
      <div className={`${message.content ? 'mt-2' : ''} space-y-2`}>
        {message.attachments.map((file) => (
          <div key={file.id} className="group relative">
            {file.file_type === 'image' ? (
              <AttachmentImage 
                file={file} 
                onClick={() => onImageClick && onImageClick(file.id)} 
                overlay={isImageOnly ? renderTimestamp(true) : null}
                isImageOnly={isImageOnly}
              />
            ) : (
              <div className="bg-white/10 border border-white/20 p-2.5 rounded-xl flex items-center gap-2.5 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="text-white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate text-inherit">{file.file_name}</div>
                  <div className="text-[10px] opacity-60">{(file.file_size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <a href={file.download_url || file.url} download={file.file_name} rel="noopener noreferrer" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 transition-all">
                  <Download size={14} className="text-white" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isSequential ? 'mt-0.5 mb-0.5' : 'mt-3 mb-0.5'} group`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2.5 max-w-[75%]`}>

        {/* Avatar */}
        {!isOwn && (
          <div className="flex-shrink-0 w-8 h-8 self-end mb-0.5 border-transparent">
            {!isSequential && (
              <div className="w-8 h-8 rounded-full bg-[#1A1A2E]/10 dark:bg-white/10 flex items-center justify-center text-[11px] font-bold text-[#1A1A2E] dark:text-white border border-[#E5E9F0] dark:border-white/10 self-end">
                {message.user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Bubble */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name (for received messages) */}
          {!isOwn && !isSequential && (
            <div className="text-[11px] font-semibold text-[#905efc] mb-1 px-1 flex items-center gap-1">
              {message.user?.name}
              {message.user?.role === 'ADMIN' && <Shield size={9} className="text-[#905efc]" />}
            </div>
          )}

          <div className="relative group/bubble">
            {/* Delete Action */}
            {(isOwn || canDeleteAll) && !isSystem && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Bu mesajı silmek istediğinize emin misiniz?')) onDelete(message.id);
                }}
                className={`absolute top-1/2 -translate-y-1/2 p-2 rounded-full h-8 w-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10 ${isOwn ? '-left-10' : '-right-10'
                  }`}
                title="Sil"
              >
                <Trash2 size={14} />
              </button>
            )}

            <div className={`relative transition-all duration-200 ${isImageOnly ? 'p-1' : 'px-4 py-2.5'} rounded-2xl ${isOwn
              ? `bg-[#905efc] text-white shadow-[#905efc]/20 ${isSequential ? 'rounded-tr-sm rounded-br-sm' : 'rounded-br-sm shadow-lg'}`
              : `bg-white dark:bg-[#12122A] text-[#1A1A2E] dark:text-white border border-[#E5E9F0] dark:border-white/5 ${isSequential ? 'rounded-tl-sm rounded-bl-sm' : 'rounded-bl-sm shadow-sm'}`
              }`}>
              {message.content && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              )}
              {renderAttachments()}

              {/* Standard Timestamp (if not image-only) */}
              {!isImageOnly && renderTimestamp()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AttachmentImage({ file, onClick, overlay, isImageOnly }) {
  const [loaded, setLoaded] = React.useState(false)

  return (
    <div
      onClick={onClick}
      className={`rounded-xl overflow-hidden border border-white/10 shadow-md ${isImageOnly ? 'w-[240px] h-[180px]' : 'w-[150px] h-[107px]'} bg-black/20 relative flex items-center justify-center cursor-pointer group/img transition-all`}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
          <div className="w-10 h-10 border-2 border-white/20 border-t-[#905efc] rounded-full animate-spin"></div>
        </div>
      )}

      <img
        src={file.preview_signed || file.url}
        alt={file.file_name}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* WhatsApp style gradient for overlay visibility */}
      {overlay && (
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      )}
      
      {overlay}

      <a
        href={file.download_url || file.url}
        download={file.file_name}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[#905efc] hover:scale-110 z-20 shadow-lg border border-white/10"
        title="İndir"
      >
        <Download className="text-white" size={14} />
      </a>
    </div>
  )
}
