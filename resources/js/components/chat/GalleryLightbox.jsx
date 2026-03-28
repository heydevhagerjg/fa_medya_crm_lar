import React, { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2 } from 'lucide-react'

export default function GalleryLightbox({ open, images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [fullLoaded, setFullLoaded] = useState(false)

  useEffect(() => {
    setCurrentIndex(initialIndex)
    setFullLoaded(false)
  }, [initialIndex, open])

  // Preload Logic
  useEffect(() => {
    if (!open || !images || images.length <= 1) return

    const preload = (idx) => {
      const img = new Image()
      img.src = images[idx].url
    }

    // Preload next and previous
    const nextIdx = (currentIndex + 1) % images.length
    const prevIdx = (currentIndex - 1 + images.length) % images.length
    
    preload(nextIdx)
    preload(prevIdx)
  }, [currentIndex, open, images])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, currentIndex])

  if (!open || !images || images.length === 0) return null

  const currentImage = images[currentIndex]

  const handlePrev = () => {
    setFullLoaded(false)
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setFullLoaded(false)
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 z-30 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm truncate max-w-[200px] md:max-w-md">
            {currentImage.file_name}
          </span>
          <span className="text-white/50 text-[10px] uppercase tracking-widest font-black mt-0.5">
             {currentIndex + 1} / {images.length}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <a 
            href={currentImage.download_url || currentImage.url} 
            download={currentImage.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full bg-white/10 hover:bg-[#905efc] text-white transition-all transform active:scale-90"
            title="İndir"
          >
            <Download size={20} />
          </a>
          
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full bg-red-500/20 hover:bg-red-500 text-white transition-all transform active:scale-90 ml-2"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden" onClick={onClose}>
        {images.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-6 z-40 p-5 rounded-full bg-black/20 hover:bg-[#905efc] text-white transition-all transform active:scale-75 backdrop-blur-md border border-white/10"
              title="Önceki"
            >
              <ChevronLeft size={36} />
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-6 z-40 p-5 rounded-full bg-black/20 hover:bg-[#905efc] text-white transition-all transform active:scale-75 backdrop-blur-md border border-white/10"
              title="Sonraki"
            >
              <ChevronRight size={36} />
            </button>
          </>
        )}

        {/* Image Display - Always Full Size */}
        <div 
          className="relative transition-all duration-500 ease-in-out flex items-center justify-center w-full h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Low-res background (Thumbnail) - Shown immediately */}
          <img
            src={currentImage.preview_signed || currentImage.url}
            className="absolute shadow-2xl blur-lg scale-105 opacity-40 w-full h-full object-contain"
            alt=""
          />

          {/* High-res Main Image */}
          <img
            key={currentImage.id}
            src={currentImage.url}
            alt={currentImage.file_name}
            onLoad={() => setFullLoaded(true)}
            className={`shadow-2xl select-none transition-all duration-500 w-full h-full object-contain p-4 ${
              fullLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />

          {!fullLoaded && (
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-12 h-12 border-4 border-white/10 border-t-[#905efc] rounded-full animate-spin"></div>
             </div>
          )}
        </div>
      </div>

      {/* Thumbnails Strip */}
      {images.length > 1 && (
        <div className="h-28 bg-black/60 backdrop-blur-xl border-t border-white/10 px-6 flex items-center justify-center gap-3 overflow-x-auto py-4 z-30">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => {
                setFullLoaded(false)
                setCurrentIndex(idx)
              }}
              className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all transform hover:scale-110 active:scale-90 ${
                currentIndex === idx ? 'border-[#905efc] scale-110 shadow-[0_0_20px_rgba(144,94,252,0.4)]' : 'border-transparent opacity-40 hover:opacity-100'
              }`}
            >
              <img src={img.preview_signed || img.url} className="w-full h-full object-cover" alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
