import { useRef, useEffect, useState, useCallback } from 'react'
import dicomParser from 'dicom-parser'
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, SunDim, Contrast, FlipVertical2, HelpCircle, X, Mouse, ScrollText } from 'lucide-react'

function extractS3Path(url) {
    if (!url) return null
    try {
        const u = new URL(url)
        const path = decodeURIComponent(u.pathname.replace(/^\//, ''))
        if (path.startsWith('tenants/')) return path
        return null
    } catch { return null }
}

async function getSignedUrl(originalUrl) {
    const path = extractS3Path(originalUrl)
    if (!path) return originalUrl
    try {
        const { default: api } = await import('../../lib/api.js')
        const res = await api.post('/custom-field-download', { path })
        return res.data.url
    } catch { return originalUrl }
}

export default function DicomViewer({ fileUrl }) {
    const wrapperRef = useRef(null)
    const canvasRef = useRef(null)
    // Windowed image cache — sadece wc/ww/invert değişince yeniden hesaplanır
    const windowedImageRef = useRef(null)
    const dicomDataRef = useRef(null)
    const rafRef = useRef(null)

    // Tüm interaktif değerler ref'te → React re-render yok
    const viewRef = useRef({ zoom: 1, panX: 0, panY: 0, ww: 0, wc: 0, inverted: false })
    const defaultsRef = useRef({ ww: 0, wc: 0 })
    const isDraggingRef = useRef(false)
    const lastPosRef = useRef({ x: 0, y: 0 })
    const isWindowingRef = useRef(false)
    const windowStartRef = useRef({ x: 0, y: 0, ww: 0, wc: 0 })

    // Sadece UI için state (loading, error, info, fullscreen)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [fullscreen, setFullscreen] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const [info, setInfo] = useState(null)
    // HUD göstergeleri için (düşük frekanslı güncelleme)
    const [hud, setHud] = useState({ wc: 0, ww: 0, zoom: 100 })
    const hudTimerRef = useRef(null)

    const updateHud = useCallback(() => {
        if (hudTimerRef.current) return
        hudTimerRef.current = setTimeout(() => {
            hudTimerRef.current = null
            const v = viewRef.current
            setHud({ wc: Math.round(v.wc), ww: Math.round(v.ww), zoom: Math.round(v.zoom * 100) })
        }, 100)
    }, [])

    // Windowed pixel verisi oluştur (sadece wc/ww/invert değiştiğinde)
    const buildWindowedImage = useCallback(() => {
        const data = dicomDataRef.current
        if (!data) return
        const { rawPixels, rows, cols, samplesPerPixel, rescaleSlope, rescaleIntercept, photometric } = data
        const v = viewRef.current

        const imageData = new ImageData(cols, rows)
        const pixels = imageData.data
        const pixelCount = rows * cols
        const lower = v.wc - v.ww / 2
        const range = v.ww || 1
        const shouldInvert = (photometric === 'MONOCHROME1') !== v.inverted

        if (samplesPerPixel === 1) {
            const scale = 255 / range
            for (let i = 0; i < pixelCount && i < rawPixels.length; i++) {
                let n = (rawPixels[i] * rescaleSlope + rescaleIntercept - lower) * scale
                n = n < 0 ? 0 : n > 255 ? 255 : n | 0
                if (shouldInvert) n = 255 - n
                const j = i << 2
                pixels[j] = n
                pixels[j | 1] = n
                pixels[j | 2] = n
                pixels[j | 3] = 255
            }
        } else {
            for (let i = 0; i < pixelCount && i * 3 + 2 < rawPixels.length; i++) {
                const j = i << 2
                pixels[j] = rawPixels[i * 3]
                pixels[j | 1] = rawPixels[i * 3 + 1]
                pixels[j | 2] = rawPixels[i * 3 + 2]
                pixels[j | 3] = 255
            }
        }

        // Offscreen bitmap oluştur
        const offCanvas = new OffscreenCanvas(cols, rows)
        offCanvas.getContext('2d').putImageData(imageData, 0, 0)
        windowedImageRef.current = { bitmap: offCanvas, cols, rows }
    }, [])

    // Canvas'a sadece pan/zoom ile çiz — çok hızlı
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const img = windowedImageRef.current
        if (!canvas || !img) return

        const ctx = canvas.getContext('2d')
        const cw = canvas.width
        const ch = canvas.height
        const v = viewRef.current

        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, cw, ch)

        ctx.save()
        ctx.translate(cw / 2 + v.panX, ch / 2 + v.panY)
        ctx.scale(v.zoom, v.zoom)

        const aspect = img.cols / img.rows
        let drawW, drawH
        if (cw / ch > aspect) {
            drawH = ch
            drawW = ch * aspect
        } else {
            drawW = cw
            drawH = cw / aspect
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img.bitmap, -drawW / 2, -drawH / 2, drawW, drawH)
        ctx.restore()
    }, [])

    // Animation loop — sürekli çalışmaz, sadece dirty flag ile
    const dirtyRef = useRef(false)
    const windowDirtyRef = useRef(false)

    const scheduleRender = useCallback(() => {
        dirtyRef.current = true
    }, [])

    const scheduleWindowRender = useCallback(() => {
        windowDirtyRef.current = true
        dirtyRef.current = true
    }, [])

    useEffect(() => {
        let running = true
        const loop = () => {
            if (!running) return
            if (windowDirtyRef.current) {
                windowDirtyRef.current = false
                buildWindowedImage()
            }
            if (dirtyRef.current) {
                dirtyRef.current = false
                drawCanvas()
            }
            rafRef.current = requestAnimationFrame(loop)
        }
        rafRef.current = requestAnimationFrame(loop)
        return () => { running = false; cancelAnimationFrame(rafRef.current) }
    }, [buildWindowedImage, drawCanvas])

    // DICOM dosyasını yükle
    useEffect(() => {
        if (!fileUrl) return
        let cancelled = false

        setLoading(true)
        setError(null)

        ;(async () => {
            try {
                const signedUrl = await getSignedUrl(fileUrl)
                const res = await fetch(signedUrl)
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const buffer = await res.arrayBuffer()
                if (cancelled) return

                const byteArray = new Uint8Array(buffer)
                let dataSet = null

                const tryParse = (opts) => {
                    try { return opts ? dicomParser.parseDicom(byteArray, opts) : dicomParser.parseDicom(byteArray) }
                    catch { return null }
                }

                dataSet = tryParse()
                if (!dataSet?.elements?.x7fe00010)
                    dataSet = tryParse({ TransferSyntaxUID: '1.2.840.10008.1.2.1' })
                if (!dataSet?.elements?.x7fe00010)
                    dataSet = tryParse({ TransferSyntaxUID: '1.2.840.10008.1.2' })

                if (!dataSet) { setError('DICOM dosyası parse edilemedi.'); setLoading(false); return }

                const rows = dataSet.uint16('x00280010')
                const cols = dataSet.uint16('x00280011')
                const bitsAllocated = dataSet.uint16('x00280100') || 16
                const pixelRepresentation = dataSet.uint16('x00280103') || 0
                const samplesPerPixel = dataSet.uint16('x00280002') || 1
                const rescaleIntercept = parseFloat(dataSet.string('x00281052') || '0')
                const rescaleSlope = parseFloat(dataSet.string('x00281053') || '1')
                const fileWc = parseFloat(dataSet.string('x00281050')?.split('\\')[0] || '0')
                const fileWw = parseFloat(dataSet.string('x00281051')?.split('\\')[0] || '0')
                const photometric = (dataSet.string('x00280004') || 'MONOCHROME2').trim()
                const transferSyntax = (dataSet.string('x00020010') || '').trim()
                const studyDate = dataSet.string('x00080020') || ''

                const pixelDataElement = dataSet.elements.x7fe00010
                if (!pixelDataElement) { setError('Pixel verisi bulunamadı.'); setLoading(false); return }

                const isCompressed = pixelDataElement.encapsulatedPixelData === true ||
                    transferSyntax.startsWith('1.2.840.10008.1.2.4')

                let rawPixels, finalRows = rows, finalCols = cols

                if (isCompressed && pixelDataElement.fragments?.length > 0) {
                    const fragments = pixelDataElement.fragments
                    let frameData
                    if (fragments.length === 1) {
                        frameData = byteArray.slice(fragments[0].position, fragments[0].position + fragments[0].length)
                    } else {
                        let totalLen = 0
                        fragments.forEach(f => totalLen += f.length)
                        frameData = new Uint8Array(totalLen)
                        let offset = 0
                        fragments.forEach(f => {
                            frameData.set(byteArray.slice(f.position, f.position + f.length), offset)
                            offset += f.length
                        })
                    }

                    const decoded = await new Promise((resolve, reject) => {
                        const types = ['image/jpeg', 'image/jp2', 'image/png']
                        const tryNext = (i) => {
                            if (i >= types.length) { reject(new Error('Decode failed')); return }
                            const blob = new Blob([frameData], { type: types[i] })
                            const url = URL.createObjectURL(blob)
                            const img = new Image()
                            img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
                            img.onerror = () => { URL.revokeObjectURL(url); tryNext(i + 1) }
                            img.src = url
                        }
                        tryNext(0)
                    })

                    finalRows = decoded.height
                    finalCols = decoded.width
                    const tmp = document.createElement('canvas')
                    tmp.width = finalCols; tmp.height = finalRows
                    const tc = tmp.getContext('2d')
                    tc.drawImage(decoded, 0, 0)
                    const imgD = tc.getImageData(0, 0, finalCols, finalRows)
                    rawPixels = new Uint8Array(finalRows * finalCols)
                    for (let i = 0; i < rawPixels.length; i++) rawPixels[i] = imgD.data[i * 4]
                } else {
                    if (!rows || !cols) { setError('Görüntü boyutu bulunamadı.'); setLoading(false); return }
                    const off = pixelDataElement.dataOffset
                    const total = rows * cols * samplesPerPixel
                    const bpp = bitsAllocated / 8
                    const end = off + Math.min(total * bpp, byteArray.length - off)
                    const ab = byteArray.buffer.slice(off, end)
                    if (bitsAllocated === 16) {
                        rawPixels = pixelRepresentation === 1 ? new Int16Array(ab) : new Uint16Array(ab)
                    } else if (bitsAllocated === 8) {
                        rawPixels = new Uint8Array(ab)
                    } else {
                        rawPixels = new Int32Array(ab)
                    }
                }

                let calcWc = fileWc, calcWw = fileWw
                if (!calcWw) {
                    let min = Infinity, max = -Infinity
                    const len = Math.min(finalRows * finalCols, rawPixels.length)
                    for (let i = 0; i < len; i++) {
                        const v = rawPixels[i] * rescaleSlope + rescaleIntercept
                        if (v < min) min = v; if (v > max) max = v
                    }
                    calcWc = (min + max) / 2; calcWw = max - min || 1
                }

                dicomDataRef.current = {
                    rawPixels, rows: finalRows, cols: finalCols,
                    samplesPerPixel: isCompressed ? 1 : samplesPerPixel,
                    rescaleSlope: isCompressed ? 1 : rescaleSlope,
                    rescaleIntercept: isCompressed ? 0 : rescaleIntercept,
                    photometric: isCompressed ? 'MONOCHROME2' : photometric,
                }

                viewRef.current = { ...viewRef.current, ww: calcWw, wc: calcWc }
                defaultsRef.current = { ww: calcWw, wc: calcWc }

                setInfo({
                    rows: finalRows, cols: finalCols,
                    studyDate: studyDate ? `${studyDate.slice(0,4)}-${studyDate.slice(4,6)}-${studyDate.slice(6,8)}` : '',
                    bitsAllocated,
                })
                setHud({ wc: Math.round(calcWc), ww: Math.round(calcWw), zoom: 100 })
                setLoading(false)

                // İlk render
                scheduleWindowRender()
            } catch (e) {
                if (!cancelled) { setError('DICOM yüklenemedi: ' + String(e?.message || e)); setLoading(false) }
            }
        })()
        return () => { cancelled = true }
    }, [fileUrl, scheduleWindowRender])

    // Canvas boyutu
    useEffect(() => {
        const canvas = canvasRef.current
        const wrapper = wrapperRef.current
        if (!canvas || !wrapper) return
        const update = () => {
            const rect = wrapper.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            canvas.style.width = rect.width + 'px'
            canvas.style.height = rect.height + 'px'
            scheduleRender()
        }
        update()
        const obs = new ResizeObserver(update)
        obs.observe(wrapper)
        return () => obs.disconnect()
    }, [scheduleRender])

    // Mouse handlers — tüm değerler ref'te, setState yok
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const onDown = (e) => {
            e.preventDefault()
            if (e.button === 2) {
                isWindowingRef.current = true
                const v = viewRef.current
                windowStartRef.current = { x: e.clientX, y: e.clientY, ww: v.ww, wc: v.wc }
            } else {
                isDraggingRef.current = true
                lastPosRef.current = { x: e.clientX, y: e.clientY }
            }
        }

        const onMove = (e) => {
            if (isDraggingRef.current) {
                const dx = e.clientX - lastPosRef.current.x
                const dy = e.clientY - lastPosRef.current.y
                lastPosRef.current = { x: e.clientX, y: e.clientY }
                viewRef.current.panX += dx
                viewRef.current.panY += dy
                scheduleRender()
            }
            if (isWindowingRef.current) {
                const dx = e.clientX - windowStartRef.current.x
                const dy = e.clientY - windowStartRef.current.y
                const sens = Math.max(1, defaultsRef.current.ww / 500)
                viewRef.current.ww = Math.max(1, windowStartRef.current.ww + dx * sens)
                viewRef.current.wc = windowStartRef.current.wc + dy * sens
                scheduleWindowRender()
                updateHud()
            }
        }

        const onUp = () => {
            isDraggingRef.current = false
            isWindowingRef.current = false
            updateHud()
        }

        const onWheel = (e) => {
            e.preventDefault()
            const factor = e.deltaY > 0 ? 0.9 : 1.1
            viewRef.current.zoom = Math.max(0.1, Math.min(20, viewRef.current.zoom * factor))
            scheduleRender()
            updateHud()
        }

        const onCtx = (e) => e.preventDefault()

        canvas.addEventListener('mousedown', onDown)
        canvas.addEventListener('mousemove', onMove)
        canvas.addEventListener('mouseup', onUp)
        canvas.addEventListener('mouseleave', onUp)
        canvas.addEventListener('wheel', onWheel, { passive: false })
        canvas.addEventListener('contextmenu', onCtx)

        return () => {
            canvas.removeEventListener('mousedown', onDown)
            canvas.removeEventListener('mousemove', onMove)
            canvas.removeEventListener('mouseup', onUp)
            canvas.removeEventListener('mouseleave', onUp)
            canvas.removeEventListener('wheel', onWheel)
            canvas.removeEventListener('contextmenu', onCtx)
        }
    }, [scheduleRender, scheduleWindowRender, updateHud])

    // Toolbar actions
    const zoomBtn = (factor) => {
        viewRef.current.zoom = Math.max(0.1, Math.min(20, viewRef.current.zoom * factor))
        scheduleRender(); updateHud()
    }

    const toggleInvert = () => {
        viewRef.current.inverted = !viewRef.current.inverted
        scheduleWindowRender(); updateHud()
    }

    const resetView = () => {
        viewRef.current = { zoom: 1, panX: 0, panY: 0, ww: defaultsRef.current.ww, wc: defaultsRef.current.wc, inverted: false }
        scheduleWindowRender(); updateHud()
    }

    const toggleFullscreen = () => {
        const el = wrapperRef.current?.parentElement
        if (!fullscreen) el?.requestFullscreen?.()
        else document.exitFullscreen?.()
        setFullscreen(!fullscreen)
    }

    useEffect(() => {
        const fn = () => { if (!document.fullscreenElement) setFullscreen(false) }
        document.addEventListener('fullscreenchange', fn)
        return () => document.removeEventListener('fullscreenchange', fn)
    }, [])

    return (
        <div className={`relative rounded-xl overflow-hidden bg-black ${fullscreen ? 'fixed inset-0 z-[9999]' : ''}`}>
            {/* Üst toolbar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">DICOM</span>
                    {info && (
                        <span className="text-[11px] text-gray-400">
                            {info.cols}×{info.rows} • {info.bitsAllocated}bit
                            {info.studyDate && ` • ${info.studyDate}`}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => zoomBtn(1.2)} className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Yakınlaştır"><ZoomIn size={16} /></button>
                    <button type="button" onClick={() => zoomBtn(0.8)} className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Uzaklaştır"><ZoomOut size={16} /></button>
                    <div className="w-px h-4 bg-gray-600 mx-1" />
                    <button type="button" onClick={toggleInvert} className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Ters Çevir"><FlipVertical2 size={16} /></button>
                    <button type="button" onClick={resetView} className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Sıfırla"><RotateCcw size={16} /></button>
                    <button type="button" onClick={toggleFullscreen} className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Tam Ekran">{fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
                    <div className="w-px h-4 bg-gray-600 mx-1" />
                    <button type="button" onClick={() => setShowHelp(v => !v)} className={`p-1.5 rounded-lg transition-colors ${showHelp ? 'text-emerald-400 bg-emerald-400/10' : 'text-gray-300 hover:text-white hover:bg-white/10'}`} title="Yardım"><HelpCircle size={16} /></button>
                </div>
            </div>

            {/* Alt bilgi */}
            <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5"><SunDim size={13} className="text-gray-400" /><span className="text-[10px] text-gray-400 font-mono">WC: {hud.wc}</span></div>
                    <div className="flex items-center gap-1.5"><Contrast size={13} className="text-gray-400" /><span className="text-[10px] text-gray-400 font-mono">WW: {hud.ww}</span></div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-mono">Zoom: {hud.zoom}%</span>
                    <span className="text-[10px] text-gray-600">Sol: Kaydır • Sağ: Parlaklık/Kontrast • Tekerlek: Yakınlaştır</span>
                </div>
            </div>

            {/* Yardım paneli */}
            {showHelp && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <HelpCircle size={18} className="text-emerald-400" />
                                Röntgen Görüntüleme Kılavuzu
                            </h3>
                            <button type="button" onClick={() => setShowHelp(false)} className="p-1 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl">
                                <div className="p-2 bg-blue-500/10 rounded-lg shrink-0"><Mouse size={18} className="text-blue-400" /></div>
                                <div>
                                    <p className="text-sm font-semibold text-white mb-1">Sol Tık + Sürükle</p>
                                    <p className="text-xs text-gray-400">Görüntüyü kaydırın. Röntgenin farklı bölgelerini incelemek için kullanın.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl">
                                <div className="p-2 bg-amber-500/10 rounded-lg shrink-0"><Mouse size={18} className="text-amber-400" /></div>
                                <div>
                                    <p className="text-sm font-semibold text-white mb-1">Sağ Tık + Sürükle</p>
                                    <p className="text-xs text-gray-400">
                                        <span className="text-amber-300">Sağa-Sola:</span> Kontrast (Window Width) ayarı<br/>
                                        <span className="text-amber-300">Yukarı-Aşağı:</span> Parlaklık (Window Center) ayarı<br/>
                                        Kemik, yumuşak doku ve diş detaylarını görmek için ayarlayın.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl">
                                <div className="p-2 bg-purple-500/10 rounded-lg shrink-0"><ScrollText size={18} className="text-purple-400" /></div>
                                <div>
                                    <p className="text-sm font-semibold text-white mb-1">Fare Tekerleği</p>
                                    <p className="text-xs text-gray-400">Yakınlaştırma / uzaklaştırma. Detaylı inceleme için kullanın.</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-3">
                                <p className="text-[11px] font-semibold text-gray-300 mb-2">Araç Çubuğu Butonları</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <ZoomIn size={14} className="text-gray-500 shrink-0" /> Yakınlaştır
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <ZoomOut size={14} className="text-gray-500 shrink-0" /> Uzaklaştır
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <FlipVertical2 size={14} className="text-gray-500 shrink-0" /> Negatif/Pozitif
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <RotateCcw size={14} className="text-gray-500 shrink-0" /> Görünümü Sıfırla
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Maximize2 size={14} className="text-gray-500 shrink-0" /> Tam Ekran
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-3">
                                <p className="text-[11px] font-semibold text-gray-300 mb-1">Alt Bilgi Çubuğu</p>
                                <p className="text-xs text-gray-400">
                                    <span className="text-gray-300">WC</span> (Window Center): Parlaklık değeri &nbsp;•&nbsp;
                                    <span className="text-gray-300">WW</span> (Window Width): Kontrast değeri &nbsp;•&nbsp;
                                    <span className="text-gray-300">Zoom</span>: Yakınlaştırma oranı
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-400">DICOM yükleniyor...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
                    <p className="text-sm text-red-400 font-medium p-4">{error}</p>
                </div>
            )}

            <div ref={wrapperRef} className={`w-full ${fullscreen ? 'h-screen' : 'h-[500px]'} cursor-grab active:cursor-grabbing`}>
                <canvas ref={canvasRef} className="block w-full h-full" />
            </div>
        </div>
    )
}
