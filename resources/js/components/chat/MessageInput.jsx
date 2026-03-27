import React, { useState, useRef, useEffect } from 'react'
import { Send, Plus, X, Image as ImageIcon, File as FileIcon, Loader2, Smile } from 'lucide-react'

export default function MessageInput({ onSendMessage, onFileUpload, isUploading }) {
  const [content, setContent] = useState('')
  const textareaRef = useRef(null)

  const handleSend = () => {
    if (!content.trim() && !isUploading) return;
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
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  return (
    <div className="p-5 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#0A0A0A] relative z-20 shadow-[0_-8px_32px_0_rgba(26,26,46,0.04)] dark:shadow-none">
      <div className="max-w-7xl mx-auto flex items-end gap-3 transition-all duration-300">
        
        {/* Upload Button */}
        <label className="flex-shrink-0 cursor-pointer p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-primary hover:bg-primary/10 transition-all group active:scale-95 shadow-sm border border-gray-100 dark:border-white/5 h-12 w-12 flex items-center justify-center">
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            <input 
                type="file" 
                className="hidden" 
                onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])}
                disabled={isUploading}
            />
        </label>

        {/* Text Input area */}
        <div className="flex-1 relative bg-gray-50 dark:bg-white/[0.04] rounded-3xl border border-gray-100 dark:border-white/5 px-2 py-2 flex items-end transition-all hover:border-primary/20 focus-within:border-primary/50 shadow-inner group">
            <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Yazmaya başlayın..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm py-2.5 px-3 max-h-48 resize-none dark:text-gray-100 placeholder:text-gray-400 placeholder:font-bold placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                rows={1}
            />
            
            <div className="flex items-center gap-1.5 p-1 pr-2 pb-1.5">
                <button className="p-2 text-gray-400 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100 duration-300">
                    <Smile size={18} />
                </button>
            </div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!content.trim() && !isUploading}
          className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg ${
            content.trim() || isUploading
              ? 'bg-primary text-white shadow-primary/30 rotate-0'
              : 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 shadow-none'
          }`}
        >
          {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className={content.trim() ? 'translate-x-[1px]' : ''} />}
        </button>
      </div>

      {isUploading && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-white/10 overflow-hidden">
          <div className="h-full bg-primary animate-progress-indeterminate w-1/3 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
        </div>
      )}
    </div>
  )
}
