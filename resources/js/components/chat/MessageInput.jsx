import React, { useState, useRef, useEffect } from 'react'
import { Send, Plus, Smile, Mic } from 'lucide-react'

function LoaderIcon() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/>
      <path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/>
      <path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/>
    </svg>
  )
}

export default function MessageInput({ onSendMessage, onFileUpload, isUploading, uploadProgress }) {
  const [content, setContent] = useState('')
  const textareaRef = useRef(null)

  const handleSend = () => {
    if (!content.trim() && !isUploading) return
    onSendMessage(content.trim())
    setContent('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e) => {
    setContent(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  const canSend = content.trim() || isUploading

  return (
    <div className="theme-surface px-3 md:px-5 py-3 md:py-4 pb-[calc(12px+env(safe-area-inset-bottom))] border-t theme-divider shrink-0">
      {/* Upload progress bar */}
      {isUploading && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider animate-pulse">Dosyalar Yükleniyor...</span>
            {uploadProgress?.total > 0 && (
              <span className="theme-muted-badge text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300">
                {uploadProgress.current} / {uploadProgress.total}
              </span>
            )}
          </div>
          <div className="theme-progress-track h-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(144,94,252,0.4)]" 
              style={{ width: `${uploadProgress?.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 50}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Attach Button */}
        <label className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center theme-text-secondary hover:text-primary hover:bg-primary/8 cursor-pointer transition-all">
          <Plus size={20} />
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                onFileUpload(Array.from(e.target.files))
                e.target.value = null
              }
            }}
            disabled={isUploading}
          />
        </label>

        {/* Input */}
        <div className="theme-surface-alt flex-1 flex items-end border theme-divider rounded-2xl px-4 py-2.5 gap-2 focus-within:border-primary transition-all">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Mesajınızı yazın..."
            rows={1}
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm resize-none max-h-40 theme-text-primary placeholder:theme-text-secondary leading-relaxed py-0"
          />
          <button className="shrink-0 theme-text-secondary hover:text-amber-400 transition-colors pb-0.5">
            <Smile size={18} />
          </button>
        </div>

        {/* Mic / Send Button */}
        {canSend ? (
          <button
            onClick={handleSend}
            disabled={isUploading}
            className="theme-button-primary shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
          >
            {isUploading ? <LoaderIcon /> : <Send size={18} className="translate-x-px" />}
          </button>
        ) : (
          <button className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center theme-text-secondary hover:text-primary hover:bg-primary/8 transition-all">
            <Mic size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
