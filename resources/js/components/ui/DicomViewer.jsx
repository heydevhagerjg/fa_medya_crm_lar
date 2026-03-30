import { useRef, useEffect, useState, useCallback } from 'react'
import dicomParser from 'dicom-parser'
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, SunDim, Contrast, FlipVertical2, HelpCircle, X, Ruler, Trash2, Hand } from 'lucide-react'

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

const TOOL = { PAN: 'pan', MEASURE: 'measure' }

export default function DicomViewer({ fileUrl }) {
    const wrapperRef = useRef(null)
    const canvasRef = useRef(null)
    const windowedImageRef = useRef(null)
    const dicomDataRef = useRef(null)
    const rafRef = useRef(null)

    const viewRef = useRef({ zoom: 1, panX: 0, panY: 0, ww: 0, wc: 0, inverted: false })
    const defaultsRef = useRef({ ww: 0, wc: 0 })
    const isDraggingRef = useRef(false)
    const lastPosRef = useRef({ x: 0, y: 0 })
    const isWindowingRef = useRef(false)
    const windowStartRef = useRef({ x: 0, y: 0, ww: 0, wc: 0 })

    const pixelSpacingRef = useRef({ row: 1, col: 1 })

    const annotationsRef = useRef({
        measurements: [],
    })
    const tempPointRef = useRef(null)
    const measureFirstRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [fullscreen, setFullscreen] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const [info, setInfo] = useState(null)
    const [hud, setHud] = useState({ wc: 0, ww: 0, zoom: 100 })
    const [activeTool, setActiveTool] = useState(TOOL.PAN)
    const [annotationCount, setAnnotationCount] = useState(0)

    const hudTimerRef = useRef(null)
    const activeToolRef = useRef(TOOL.PAN)

    const dirtyRef = useRef(false)
    const windowDirtyRef = useRef(false)

    const scheduleRender = useCallback(() => { dirtyRef.current = true }, [])
    const scheduleWindowRender = useCallback(() => { windowDirtyRef.current = true; dirtyRef.current = true }, [])

    const changeTool = useCallback((tool) => {
        activeToolRef.current = tool
        measureFirstRef.current = null
        tempPointRef.current = null
        setActiveTool(tool)
        dirtyRef.current = true
    }, [])

    const updateHud = useCallback(() => {
        if (hudTimerRef.current) return
        hudTimerRef.current = setTimeout(() => {
            hudTimerRef.current = null
            const v = viewRef.current
            setHud({ wc: Math.round(v.wc), ww: Math.round(v.ww), zoom: Math.round(v.zoom * 100) })
        }, 100)
    }, [])

    const screenToImage = useCallback((sx, sy) => {
        const canvas = canvasRef.current
        const img = windowedImageRef.current
        if (!canvas || !img) return null
        const cw = canvas.width, ch = canvas.height
        const v = viewRef.current
        const aspect = img.cols / img.rows
        let drawW, drawH
        if (cw / ch > aspect) { drawH = ch; drawW = ch * aspect }
        else { drawW = cw; drawH = cw / aspect }
        const ix = (sx - cw / 2 - v.panX) / v.zoom + drawW / 2
        const iy = (sy - ch / 2 - v.panY) / v.zoom + drawH / 2
        return { x: (ix / drawW) * img.cols, y: (iy / drawH) * img.rows }
    }, [])

    const imageToScreen = useCallback((imgX, imgY) => {
        const canvas = canvasRef.current
        const img = windowedImageRef.current
        if (!canvas || !img) return null
        const cw = canvas.width, ch = canvas.height
        const v = viewRef.current
        const aspect = img.cols / img.rows
        let drawW, drawH
        if (cw / ch > aspect) { drawH = ch; drawW = ch * aspect }
        else { drawW = cw; drawH = cw / aspect }
        const sx = ((imgX / img.cols) * drawW - drawW / 2) * v.zoom + cw / 2 + v.panX
        const sy = ((imgY / img.rows) * drawH - drawH / 2) * v.zoom + ch / 2 + v.panY
        return { x: sx, y: sy }
    }, [])

    const distanceMm = useCallback((p1, p2) => {
        const ps = pixelSpacingRef.current
        const dx = (p2.x - p1.x) * ps.col
        const dy = (p2.y - p1.y) * ps.row
        return Math.sqrt(dx * dx + dy * dy)
    }, [])

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
                pixels[j] = n; pixels[j | 1] = n; pixels[j | 2] = n; pixels[j | 3] = 255
            }
        } else {
            for (let i = 0; i < pixelCount && i * 3 + 2 < rawPixels.length; i++) {
                const j = i << 2
                pixels[j] = rawPixels[i * 3]; pixels[j | 1] = rawPixels[i * 3 + 1]; pixels[j | 2] = rawPixels[i * 3 + 2]; pixels[j | 3] = 255
            }
        }
        const offCanvas = new OffscreenCanvas(cols, rows)
        offCanvas.getContext('2d').putImageData(imageData, 0, 0)
        windowedImageRef.current = { bitmap: offCanvas, cols, rows }
    }, [])

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const img = windowedImageRef.current
        if (!canvas || !img) return

        const ctx = canvas.getContext('2d')
        const cw = canvas.width, ch = canvas.height
        const v = viewRef.current
        const dpr = window.devicePixelRatio || 1

        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, cw, ch)

        ctx.save()
        ctx.translate(cw / 2 + v.panX, ch / 2 + v.panY)
        ctx.scale(v.zoom, v.zoom)
        const aspect = img.cols / img.rows
        let drawW, drawH
        if (cw / ch > aspect) { drawH = ch; drawW = ch * aspect }
        else { drawW = cw; drawH = cw / aspect }
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img.bitmap, -drawW / 2, -drawH / 2, drawW, drawH)
        ctx.restore()

        // --- Overlay ---
        const ann = annotationsRef.current
        const lineW = 2 * dpr
        const fontSize = 12 * dpr
        ctx.lineWidth = lineW
        ctx.font = `bold ${fontSize}px sans-serif`
        ctx.textBaseline = 'bottom'

        // Measurements
        ann.measurements.forEach(m => {
            const s1 = imageToScreen(m.p1.x, m.p1.y)
            const s2 = imageToScreen(m.p2.x, m.p2.y)
            if (!s1 || !s2) return
            ctx.strokeStyle = '#00ff88'
            ctx.lineWidth = lineW
            ctx.setLineDash([])
            ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke()
            const r = 4 * dpr
            ctx.fillStyle = '#00ff88'
            ctx.beginPath(); ctx.arc(s1.x, s1.y, r, 0, Math.PI * 2); ctx.fill()
            ctx.beginPath(); ctx.arc(s2.x, s2.y, r, 0, Math.PI * 2); ctx.fill()
            const dist = distanceMm(m.p1, m.p2)
            const mx = (s1.x + s2.x) / 2, my = (s1.y + s2.y) / 2
            const label = dist.toFixed(1) + ' mm'
            const tw = ctx.measureText(label).width
            ctx.fillStyle = 'rgba(0,0,0,0.7)'
            ctx.fillRect(mx - tw / 2 - 4, my - fontSize - 4, tw + 8, fontSize + 6)
            ctx.fillStyle = '#00ff88'
            ctx.fillText(label, mx - tw / 2, my - 2)
        })

        // Active measurement line
        if (measureFirstRef.current && tempPointRef.current) {
            const s1 = imageToScreen(measureFirstRef.current.x, measureFirstRef.current.y)
            const s2 = tempPointRef.current
            if (s1 && s2) {
                const imgP2 = screenToImage(s2.x, s2.y)
                ctx.strokeStyle = '#00ff88'
                ctx.lineWidth = lineW
                ctx.setLineDash([6 * dpr, 4 * dpr])
                ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke()
                ctx.setLineDash([])
                if (imgP2) {
                    const dist = distanceMm(measureFirstRef.current, imgP2)
                    const label = dist.toFixed(1) + ' mm'
                    const tw = ctx.measureText(label).width
                    ctx.fillStyle = 'rgba(0,0,0,0.7)'
                    ctx.fillRect(s2.x + 10, s2.y - fontSize - 2, tw + 8, fontSize + 6)
                    ctx.fillStyle = '#00ff88'
                    ctx.fillText(label, s2.x + 14, s2.y + 2)
                }
            }
        }
    }, [imageToScreen, screenToImage, distanceMm])

    // Render loop
    useEffect(() => {
        let running = true
        const loop = () => {
            if (!running) return
            if (windowDirtyRef.current) { windowDirtyRef.current = false; buildWindowedImage() }
            if (dirtyRef.current) { dirtyRef.current = false; drawCanvas() }
            rafRef.current = requestAnimationFrame(loop)
        }
        rafRef.current = requestAnimationFrame(loop)
        return () => { running = false; cancelAnimationFrame(rafRef.current) }
    }, [buildWindowedImage, drawCanvas])

    // Load DICOM
    useEffect(() => {
        if (!fileUrl) return
        let cancelled = false
        setLoading(true); setError(null)

        ;(async () => {
            try {
                const signedUrl = await getSignedUrl(fileUrl)
                const res = await fetch(signedUrl)
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const buffer = await res.arrayBuffer()
                if (cancelled) return

                const byteArray = new Uint8Array(buffer)
                let dataSet = null
                const tryParse = (opts) => { try { return opts ? dicomParser.parseDicom(byteArray, opts) : dicomParser.parseDicom(byteArray) } catch { return null } }
                dataSet = tryParse()
                if (!dataSet?.elements?.x7fe00010) dataSet = tryParse({ TransferSyntaxUID: '1.2.840.10008.1.2.1' })
                if (!dataSet?.elements?.x7fe00010) dataSet = tryParse({ TransferSyntaxUID: '1.2.840.10008.1.2' })
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

                // Pixel Spacing
                const psStr = dataSet.string('x00280030') || ''
                const psParts = psStr.split('\\').map(Number).filter(n => n > 0)
                if (psParts.length >= 2) {
                    pixelSpacingRef.current = { row: psParts[0], col: psParts[1] }
                } else {
                    const ipsStr = dataSet.string('x00181164') || ''
                    const ipsParts = ipsStr.split('\\').map(Number).filter(n => n > 0)
                    if (ipsParts.length >= 2) {
                        pixelSpacingRef.current = { row: ipsParts[0], col: ipsParts[1] }
                    }
                }

                const pixelDataElement = dataSet.elements.x7fe00010
                if (!pixelDataElement) { setError('Pixel verisi bulunamadı.'); setLoading(false); return }

                const isCompressed = pixelDataElement.encapsulatedPixelData === true || transferSyntax.startsWith('1.2.840.10008.1.2.4')
                let rawPixels, finalRows = rows, finalCols = cols

                if (isCompressed && pixelDataElement.fragments?.length > 0) {
                    const fragments = pixelDataElement.fragments
                    let frameData
                    if (fragments.length === 1) {
                        frameData = byteArray.slice(fragments[0].position, fragments[0].position + fragments[0].length)
                    } else {
                        let totalLen = 0; fragments.forEach(f => totalLen += f.length)
                        frameData = new Uint8Array(totalLen); let offset = 0
                        fragments.forEach(f => { frameData.set(byteArray.slice(f.position, f.position + f.length), offset); offset += f.length })
                    }
                    const decoded = await new Promise((resolve, reject) => {
                        const types = ['image/jpeg', 'image/jp2', 'image/png']
                        const tryNext = (i) => {
                            if (i >= types.length) { reject(new Error('Decode failed')); return }
                            const blob = new Blob([frameData], { type: types[i] }); const url = URL.createObjectURL(blob)
                            const imgEl = new Image()
                            imgEl.onload = () => { URL.revokeObjectURL(url); resolve(imgEl) }
                            imgEl.onerror = () => { URL.revokeObjectURL(url); tryNext(i + 1) }
                            imgEl.src = url
                        }; tryNext(0)
                    })
                    finalRows = decoded.height; finalCols = decoded.width
                    const tmp = document.createElement('canvas'); tmp.width = finalCols; tmp.height = finalRows
                    const tc = tmp.getContext('2d'); tc.drawImage(decoded, 0, 0)
                    const imgD = tc.getImageData(0, 0, finalCols, finalRows)
                    rawPixels = new Uint8Array(finalRows * finalCols)
                    for (let i = 0; i < rawPixels.length; i++) rawPixels[i] = imgD.data[i * 4]
                } else {
                    if (!rows || !cols) { setError('Görüntü boyutu bulunamadı.'); setLoading(false); return }
                    const off = pixelDataElement.dataOffset; const total = rows * cols * samplesPerPixel
                    const bpp = bitsAllocated / 8; const end = off + Math.min(total * bpp, byteArray.length - off)
                    const ab = byteArray.buffer.slice(off, end)
                    if (bitsAllocated === 16) rawPixels = pixelRepresentation === 1 ? new Int16Array(ab) : new Uint16Array(ab)
                    else if (bitsAllocated === 8) rawPixels = new Uint8Array(ab)
                    else rawPixels = new Int32Array(ab)
                }

                let calcWc = fileWc, calcWw = fileWw
                if (!calcWw) {
                    let min = Infinity, max = -Infinity; const len = Math.min(finalRows * finalCols, rawPixels.length)
                    for (let i = 0; i < len; i++) { const val = rawPixels[i] * rescaleSlope + rescaleIntercept; if (val < min) min = val; if (val > max) max = val }
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

                const psInfo = pixelSpacingRef.current
                setInfo({
                    rows: finalRows, cols: finalCols,
                    studyDate: studyDate ? `${studyDate.slice(0,4)}-${studyDate.slice(4,6)}-${studyDate.slice(6,8)}` : '',
                    bitsAllocated,
                    pixelSpacing: psInfo.row !== 1 ? `${psInfo.row.toFixed(2)}×${psInfo.col.toFixed(2)} mm/px` : null,
                })
                setHud({ wc: Math.round(calcWc), ww: Math.round(calcWw), zoom: 100 })
                setLoading(false)
                scheduleWindowRender()
            } catch (e) {
                if (!cancelled) { setError('DICOM yüklenemedi: ' + String(e?.message || e)); setLoading(false) }
            }
        })()
        return () => { cancelled = true }
    }, [fileUrl, scheduleWindowRender])

    // Canvas resize
    useEffect(() => {
        const canvas = canvasRef.current; const wrapper = wrapperRef.current
        if (!canvas || !wrapper) return
        const update = () => {
            const rect = wrapper.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1
            canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
            canvas.style.width = rect.width + 'px'; canvas.style.height = rect.height + 'px'
            scheduleRender()
        }
        update()
        const obs = new ResizeObserver(update); obs.observe(wrapper)
        return () => obs.disconnect()
    }, [scheduleRender])

    // Mouse handlers
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio || 1

        const getCanvasPos = (e) => {
            const rect = canvas.getBoundingClientRect()
            return { x: (e.clientX - rect.left) * dpr, y: (e.clientY - rect.top) * dpr }
        }

        const onDown = (e) => {
            e.preventDefault()
            const pos = getCanvasPos(e)
            const tool = activeToolRef.current

            if (tool === TOOL.PAN) {
                if (e.button === 2) {
                    isWindowingRef.current = true
                    const v = viewRef.current
                    windowStartRef.current = { x: e.clientX, y: e.clientY, ww: v.ww, wc: v.wc }
                } else {
                    isDraggingRef.current = true
                    lastPosRef.current = { x: e.clientX, y: e.clientY }
                }
            } else if (tool === TOOL.MEASURE) {
                if (e.button === 0) {
                    const imgP = screenToImage(pos.x, pos.y)
                    if (!imgP) return
                    if (!measureFirstRef.current) {
                        measureFirstRef.current = imgP
                    } else {
                        annotationsRef.current.measurements.push({ p1: measureFirstRef.current, p2: imgP })
                        measureFirstRef.current = null
                        tempPointRef.current = null
                        setAnnotationCount(c => c + 1)
                        dirtyRef.current = true
                    }
                }
            }
        }

        const onMove = (e) => {
            const tool = activeToolRef.current
            if (tool === TOOL.PAN) {
                if (isDraggingRef.current) {
                    viewRef.current.panX += e.clientX - lastPosRef.current.x
                    viewRef.current.panY += e.clientY - lastPosRef.current.y
                    lastPosRef.current = { x: e.clientX, y: e.clientY }
                    dirtyRef.current = true
                }
                if (isWindowingRef.current) {
                    const dx = e.clientX - windowStartRef.current.x, dy = e.clientY - windowStartRef.current.y
                    const sens = Math.max(1, defaultsRef.current.ww / 500)
                    viewRef.current.ww = Math.max(1, windowStartRef.current.ww + dx * sens)
                    viewRef.current.wc = windowStartRef.current.wc + dy * sens
                    windowDirtyRef.current = true; dirtyRef.current = true; updateHud()
                }
            } else if (tool === TOOL.MEASURE) {
                const pos = getCanvasPos(e)
                tempPointRef.current = pos
                dirtyRef.current = true
            }
        }

        const onUp = () => {
            isDraggingRef.current = false; isWindowingRef.current = false
            updateHud()
        }

        const onWheel = (e) => {
            e.preventDefault()
            viewRef.current.zoom = Math.max(0.1, Math.min(20, viewRef.current.zoom * (e.deltaY > 0 ? 0.9 : 1.1)))
            dirtyRef.current = true; updateHud()
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
    }, [updateHud, imageToScreen, screenToImage])

    // Toolbar actions
    const zoomBtn = (f) => { viewRef.current.zoom = Math.max(0.1, Math.min(20, viewRef.current.zoom * f)); dirtyRef.current = true; updateHud() }
    const toggleInvert = () => { viewRef.current.inverted = !viewRef.current.inverted; windowDirtyRef.current = true; dirtyRef.current = true; updateHud() }
    const resetView = () => {
        viewRef.current = { zoom: 1, panX: 0, panY: 0, ww: defaultsRef.current.ww, wc: defaultsRef.current.wc, inverted: false }
        windowDirtyRef.current = true; dirtyRef.current = true; updateHud()
    }
    const clearAnnotations = () => {
        annotationsRef.current = { measurements: [] }
        measureFirstRef.current = null; tempPointRef.current = null
        setAnnotationCount(0); dirtyRef.current = true
    }
    const toggleFullscreen = () => {
        const el = wrapperRef.current?.parentElement
        if (!fullscreen) el?.requestFullscreen?.(); else document.exitFullscreen?.()
        setFullscreen(!fullscreen)
    }
    useEffect(() => {
        const fn = () => { if (!document.fullscreenElement) setFullscreen(false) }
        document.addEventListener('fullscreenchange', fn)
        return () => document.removeEventListener('fullscreenchange', fn)
    }, [])

    const hasAnnotations = annotationCount > 0
    const toolBtnClass = (tool) => `p-1.5 rounded-lg transition-colors ${activeTool === tool ? 'text-emerald-400 bg-emerald-400/15 ring-1 ring-emerald-400/30' : 'text-gray-300 hover:text-white hover:bg-white/10'}`

    return (
        <div className={`relative rounded-xl overflow-hidden bg-black select-none ${fullscreen ? 'fixed inset-0 z-[9999]' : ''}`}>
            {/* Toolbar */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-2 py-1.5">
                <div className="flex items-center justify-center gap-1 flex-wrap">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded mr-1">DICOM</span>
                    <button type="button" onClick={() => zoomBtn(1.2)} className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Yakınlaştır"><ZoomIn size={15} /></button>
                    <button type="button" onClick={() => zoomBtn(0.8)} className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Uzaklaştır"><ZoomOut size={15} /></button>
                    <button type="button" onClick={toggleInvert} className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Ters Çevir"><FlipVertical2 size={15} /></button>
                    <div className="w-px h-4 bg-gray-600 mx-0.5" />
                    <button type="button" onClick={() => changeTool(TOOL.PAN)} className={toolBtnClass(TOOL.PAN)} title="Kaydır / Kontrast"><Hand size={15} /></button>
                    <button type="button" onClick={() => changeTool(TOOL.MEASURE)} className={toolBtnClass(TOOL.MEASURE)} title="Ölçüm"><Ruler size={15} /></button>
                    {hasAnnotations && (
                        <button type="button" onClick={clearAnnotations} className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors" title="Tümünü Sil"><Trash2 size={15} /></button>
                    )}
                    <div className="w-px h-4 bg-gray-600 mx-0.5" />
                    <button type="button" onClick={resetView} className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Sıfırla"><RotateCcw size={15} /></button>
                    <button type="button" onClick={toggleFullscreen} className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Tam Ekran">{fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
                    <button type="button" onClick={() => setShowHelp(v => !v)} className={`p-1.5 rounded-lg transition-colors ${showHelp ? 'text-emerald-400 bg-emerald-400/10' : 'text-gray-300 hover:text-white hover:bg-white/10'}`} title="Yardım"><HelpCircle size={15} /></button>
                </div>
            </div>

            {/* Active tool indicator */}
            {activeTool === TOOL.MEASURE && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 text-[10px] px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-gray-700 text-gray-300 pointer-events-none whitespace-nowrap">
                    📏 Ölçüm: İki nokta tıklayın
                </div>
            )}

            {/* Bottom HUD */}
            <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5"><SunDim size={12} className="text-gray-400" /><span className="text-[10px] text-gray-400 font-mono">WC: {hud.wc}</span></div>
                    <div className="flex items-center gap-1.5"><Contrast size={12} className="text-gray-400" /><span className="text-[10px] text-gray-400 font-mono">WW: {hud.ww}</span></div>
                    <span className="text-[10px] text-gray-500 font-mono">Zoom: {hud.zoom}%</span>
                </div>
                {info && (
                    <span className="text-[10px] text-gray-500">
                        {info.cols}×{info.rows} • {info.bitsAllocated}bit
                        {info.pixelSpacing && ` • ${info.pixelSpacing}`}
                        {info.studyDate && ` • ${info.studyDate}`}
                    </span>
                )}
            </div>

            {/* Help panel */}
            {showHelp && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2"><HelpCircle size={18} className="text-emerald-400" /> Röntgen Görüntüleme Kılavuzu</h3>
                            <button type="button" onClick={() => setShowHelp(false)} className="p-1 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"><X size={16} /></button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="p-3 bg-gray-800/50 rounded-xl">
                                <p className="font-semibold text-white mb-1 flex items-center gap-2"><Hand size={14} className="text-blue-400" /> Kaydır / Kontrast Modu</p>
                                <p className="text-gray-400"><span className="text-blue-300">Sol tık + sürükle:</span> Görüntüyü kaydır<br/><span className="text-amber-300">Sağ tık + sürükle:</span> Sağa-sola kontrast, yukarı-aşağı parlaklık<br/><span className="text-purple-300">Fare tekerleği:</span> Yakınlaştır / uzaklaştır</p>
                            </div>
                            <div className="p-3 bg-gray-800/50 rounded-xl">
                                <p className="font-semibold text-white mb-1 flex items-center gap-2"><Ruler size={14} className="text-emerald-400" /> Ölçüm Aracı</p>
                                <p className="text-gray-400">İki nokta tıklayarak mesafe ölçün (mm). Kemik yüksekliği, diş kökü uzunluğu vb. ölçümler için.</p>
                            </div>
                            <div className="border-t border-gray-700 pt-3">
                                <p className="font-semibold text-gray-300 mb-2">Araç Çubuğu</p>
                                <div className="grid grid-cols-2 gap-1.5 text-gray-400">
                                    <span className="flex items-center gap-1.5"><ZoomIn size={13} className="text-gray-500" /> Yakınlaştır</span>
                                    <span className="flex items-center gap-1.5"><ZoomOut size={13} className="text-gray-500" /> Uzaklaştır</span>
                                    <span className="flex items-center gap-1.5"><FlipVertical2 size={13} className="text-gray-500" /> Negatif/Pozitif</span>
                                    <span className="flex items-center gap-1.5"><RotateCcw size={13} className="text-gray-500" /> Sıfırla</span>
                                    <span className="flex items-center gap-1.5"><Maximize2 size={13} className="text-gray-500" /> Tam Ekran</span>
                                    <span className="flex items-center gap-1.5"><Trash2 size={13} className="text-red-500" /> Tüm çizimleri sil</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-400">Görüntü yükleniyor...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
                    <p className="text-sm text-red-400 font-medium p-4">{error}</p>
                </div>
            )}

            <div ref={wrapperRef} className={`w-full ${fullscreen ? 'h-screen' : 'h-[500px]'} ${activeTool === TOOL.PAN ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}>
                <canvas ref={canvasRef} className="block w-full h-full" />
            </div>
        </div>
    )
}
