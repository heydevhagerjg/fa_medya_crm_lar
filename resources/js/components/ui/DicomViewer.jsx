import { useRef, useEffect, useState, useCallback } from 'react'
import dicomParser from 'dicom-parser'
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, SunDim, Contrast, FlipVertical2 } from 'lucide-react'

// S3 path'ini URL'den çıkar
function extractS3Path(url) {
    if (!url) return null
    try {
        const u = new URL(url)
        const path = decodeURIComponent(u.pathname.replace(/^\//, ''))
        if (path.startsWith('tenants/')) return path
        return null
    } catch {
        return null
    }
}

async function getSignedUrl(originalUrl) {
    const path = extractS3Path(originalUrl)
    if (!path) return originalUrl
    try {
        const { default: api } = await import('../../lib/api.js')
        const res = await api.post('/custom-field-download', { path })
        return res.data.url
    } catch (e) {
        console.warn('Signed URL alınamadı:', e)
        return originalUrl
    }
}

export default function DicomViewer({ fileUrl, fileName }) {
    const wrapperRef = useRef(null)
    const canvasRef = useRef(null)
    const offscreenRef = useRef(null)

    // DICOM raw data
    const dicomDataRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [fullscreen, setFullscreen] = useState(false)
    const [inverted, setInverted] = useState(false)
    const [info, setInfo] = useState(null)

    // Windowing
    const [ww, setWw] = useState(0)
    const [wc, setWc] = useState(0)
    const [defaultWw, setDefaultWw] = useState(0)
    const [defaultWc, setDefaultWc] = useState(0)

    // Pan & zoom
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const isDraggingRef = useRef(false)
    const lastPosRef = useRef({ x: 0, y: 0 })
    const isWindowingRef = useRef(false)
    const windowStartRef = useRef({ x: 0, y: 0, ww: 0, wc: 0 })

    // Render image on canvas with current windowing
    const renderImage = useCallback(() => {
        const data = dicomDataRef.current
        const canvas = canvasRef.current
        const offscreen = offscreenRef.current
        if (!data || !canvas || !offscreen) return

        const { rawPixels, rows, cols, samplesPerPixel, rescaleSlope, rescaleIntercept, photometric } = data

        const octx = offscreen.getContext('2d')
        const imageData = octx.createImageData(cols, rows)
        const pixels = imageData.data
        const pixelCount = rows * cols

        const lower = wc - ww / 2
        const upper = wc + ww / 2
        const range = upper - lower || 1
        const shouldInvert = (photometric === 'MONOCHROME1') !== inverted

        if (samplesPerPixel === 1) {
            for (let i = 0; i < pixelCount && i < rawPixels.length; i++) {
                const hu = rawPixels[i] * rescaleSlope + rescaleIntercept
                let n = ((hu - lower) / range) * 255
                n = Math.max(0, Math.min(255, Math.round(n)))
                if (shouldInvert) n = 255 - n
                pixels[i * 4] = n
                pixels[i * 4 + 1] = n
                pixels[i * 4 + 2] = n
                pixels[i * 4 + 3] = 255
            }
        } else {
            for (let i = 0; i < pixelCount && i * 3 + 2 < rawPixels.length; i++) {
                pixels[i * 4] = rawPixels[i * 3]
                pixels[i * 4 + 1] = rawPixels[i * 3 + 1]
                pixels[i * 4 + 2] = rawPixels[i * 3 + 2]
                pixels[i * 4 + 3] = 255
            }
        }

        offscreen.width = cols
        offscreen.height = rows
        octx.putImageData(imageData, 0, 0)

        // Ana canvas'a çiz (zoom + pan)
        const ctx = canvas.getContext('2d')
        const cw = canvas.width
        const ch = canvas.height
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, cw, ch)

        ctx.save()
        ctx.translate(cw / 2 + pan.x, ch / 2 + pan.y)
        ctx.scale(zoom, zoom)

        const aspect = cols / rows
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
        ctx.drawImage(offscreen, -drawW / 2, -drawH / 2, drawW, drawH)
        ctx.restore()
    }, [ww, wc, zoom, pan, inverted])

    // DICOM dosyasını yükle ve parse et
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

                // Parse denemeleri
                const tryParse = (opts) => {
                    try {
                        return opts ? dicomParser.parseDicom(byteArray, opts) : dicomParser.parseDicom(byteArray)
                    } catch { return null }
                }

                dataSet = tryParse()
                if (!dataSet?.elements?.x7fe00010)
                    dataSet = tryParse({ TransferSyntaxUID: '1.2.840.10008.1.2.1' })
                if (!dataSet?.elements?.x7fe00010)
                    dataSet = tryParse({ TransferSyntaxUID: '1.2.840.10008.1.2' })

                if (!dataSet) {
                    setError('DICOM dosyası parse edilemedi.')
                    setLoading(false)
                    return
                }

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
                const patientName = dataSet.string('x00100010') || ''
                const studyDate = dataSet.string('x00080020') || ''

                const pixelDataElement = dataSet.elements.x7fe00010
                if (!pixelDataElement) {
                    console.error('DICOM elements:', Object.keys(dataSet.elements))
                    setError('DICOM dosyasında pixel verisi bulunamadı.')
                    setLoading(false)
                    return
                }

                const isCompressed = pixelDataElement.encapsulatedPixelData === true ||
                    transferSyntax.startsWith('1.2.840.10008.1.2.4')

                let rawPixels, finalRows = rows, finalCols = cols

                if (isCompressed && pixelDataElement.fragments?.length > 0) {
                    // Sıkıştırılmış: JPEG frame çıkar ve Image ile decode et
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

                    // Tarayıcıda JPEG/JP2 olarak decode et
                    const decoded = await new Promise((resolve, reject) => {
                        const mimeTypes = ['image/jpeg', 'image/jp2', 'image/png']
                        const tryNext = (idx) => {
                            if (idx >= mimeTypes.length) { reject(new Error('Decode failed')); return }
                            const blob = new Blob([frameData], { type: mimeTypes[idx] })
                            const url = URL.createObjectURL(blob)
                            const img = new Image()
                            img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
                            img.onerror = () => { URL.revokeObjectURL(url); tryNext(idx + 1) }
                            img.src = url
                        }
                        tryNext(0)
                    })

                    finalRows = decoded.height
                    finalCols = decoded.width
                    const tmpCanvas = document.createElement('canvas')
                    tmpCanvas.width = finalCols
                    tmpCanvas.height = finalRows
                    const tmpCtx = tmpCanvas.getContext('2d')
                    tmpCtx.drawImage(decoded, 0, 0)
                    const imgData = tmpCtx.getImageData(0, 0, finalCols, finalRows)
                    // Grayscale olarak sakla (R kanalını al)
                    rawPixels = new Uint8Array(finalRows * finalCols)
                    for (let i = 0; i < rawPixels.length; i++) {
                        rawPixels[i] = imgData.data[i * 4]
                    }
                } else {
                    // Sıkıştırılmamış
                    if (!rows || !cols) {
                        setError('DICOM: Görüntü boyutu bulunamadı.')
                        setLoading(false)
                        return
                    }

                    const pixelDataOffset = pixelDataElement.dataOffset
                    const totalPixels = rows * cols * samplesPerPixel
                    const bytesPerPixel = bitsAllocated / 8
                    const neededBytes = totalPixels * bytesPerPixel
                    const sliceEnd = pixelDataOffset + Math.min(neededBytes, byteArray.length - pixelDataOffset)
                    const pixelSlice = new Uint8Array(byteArray.buffer.slice(pixelDataOffset, sliceEnd))
                    const ab = pixelSlice.buffer

                    if (bitsAllocated === 16) {
                        rawPixels = pixelRepresentation === 1 ? new Int16Array(ab) : new Uint16Array(ab)
                    } else if (bitsAllocated === 8) {
                        rawPixels = new Uint8Array(ab)
                    } else {
                        rawPixels = new Int32Array(ab)
                    }
                }

                // Windowing hesapla
                let calcWc = fileWc, calcWw = fileWw
                if (!calcWw) {
                    let min = Infinity, max = -Infinity
                    for (let i = 0; i < Math.min(finalRows * finalCols, rawPixels.length); i++) {
                        const v = rawPixels[i] * rescaleSlope + rescaleIntercept
                        if (v < min) min = v
                        if (v > max) max = v
                    }
                    calcWc = (min + max) / 2
                    calcWw = max - min || 1
                }

                dicomDataRef.current = {
                    rawPixels, rows: finalRows, cols: finalCols,
                    samplesPerPixel: isCompressed ? 1 : samplesPerPixel,
                    rescaleSlope: isCompressed ? 1 : rescaleSlope,
                    rescaleIntercept: isCompressed ? 0 : rescaleIntercept,
                    photometric: isCompressed ? 'MONOCHROME2' : photometric,
                }

                setWw(calcWw)
                setWc(calcWc)
                setDefaultWw(calcWw)
                setDefaultWc(calcWc)
                setInfo({
                    rows: finalRows, cols: finalCols,
                    patientName: patientName.replace(/\^/g, ' ').trim(),
                    studyDate: studyDate ? `${studyDate.slice(0,4)}-${studyDate.slice(4,6)}-${studyDate.slice(6,8)}` : '',
                    bitsAllocated,
                })
                setLoading(false)
            } catch (e) {
                console.error('DICOM error:', e)
                if (!cancelled) {
                    setError('DICOM dosyası yüklenemedi: ' + String(e?.message || e))
                    setLoading(false)
                }
            }
        })()

        return () => { cancelled = true }
    }, [fileUrl])

    // Canvas boyutunu güncelle
    useEffect(() => {
        const canvas = canvasRef.current
        const wrapper = wrapperRef.current
        if (!canvas || !wrapper) return

        const updateSize = () => {
            const rect = wrapper.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            canvas.style.width = rect.width + 'px'
            canvas.style.height = rect.height + 'px'
            renderImage()
        }

        updateSize()
        const obs = new ResizeObserver(updateSize)
        obs.observe(wrapper)
        return () => obs.disconnect()
    }, [renderImage])

    // Render on windowing/zoom/pan change
    useEffect(() => { renderImage() }, [renderImage])

    // Offscreen canvas oluştur
    useEffect(() => {
        offscreenRef.current = document.createElement('canvas')
    }, [])

    // Mouse: sol tıklama=pan, sağ tıklama=windowing
    const handleMouseDown = useCallback((e) => {
        e.preventDefault()
        if (e.button === 2) {
            // Sağ tık: windowing
            isWindowingRef.current = true
            windowStartRef.current = { x: e.clientX, y: e.clientY, ww, wc }
        } else {
            isDraggingRef.current = true
            lastPosRef.current = { x: e.clientX, y: e.clientY }
        }
    }, [ww, wc])

    const handleMouseMove = useCallback((e) => {
        if (isDraggingRef.current) {
            const dx = e.clientX - lastPosRef.current.x
            const dy = e.clientY - lastPosRef.current.y
            lastPosRef.current = { x: e.clientX, y: e.clientY }
            setPan(p => ({ x: p.x + dx, y: p.y + dy }))
        }
        if (isWindowingRef.current) {
            const dx = e.clientX - windowStartRef.current.x
            const dy = e.clientY - windowStartRef.current.y
            const sensitivity = Math.max(1, defaultWw / 500)
            setWw(Math.max(1, windowStartRef.current.ww + dx * sensitivity))
            setWc(windowStartRef.current.wc + dy * sensitivity)
        }
    }, [defaultWw])

    const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false
        isWindowingRef.current = false
    }, [])

    const handleWheel = useCallback((e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoom(z => Math.max(0.1, Math.min(20, z * delta)))
    }, [])

    const handleContextMenu = useCallback((e) => e.preventDefault(), [])

    const resetView = useCallback(() => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
        setWw(defaultWw)
        setWc(defaultWc)
        setInverted(false)
    }, [defaultWw, defaultWc])

    const toggleFullscreen = () => {
        const el = wrapperRef.current?.parentElement
        if (!fullscreen) {
            el?.requestFullscreen?.()
        } else {
            document.exitFullscreen?.()
        }
        setFullscreen(!fullscreen)
    }

    useEffect(() => {
        const onFsChange = () => {
            if (!document.fullscreenElement) setFullscreen(false)
        }
        document.addEventListener('fullscreenchange', onFsChange)
        return () => document.removeEventListener('fullscreenchange', onFsChange)
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
                    <button type="button" onClick={() => setZoom(z => Math.min(20, z * 1.2))}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Yakınlaştır">
                        <ZoomIn size={16} />
                    </button>
                    <button type="button" onClick={() => setZoom(z => Math.max(0.1, z * 0.8))}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Uzaklaştır">
                        <ZoomOut size={16} />
                    </button>
                    <div className="w-px h-4 bg-gray-600 mx-1" />
                    <button type="button" onClick={() => setInverted(v => !v)}
                        className={`p-1.5 rounded-lg transition-colors ${inverted ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                        title="Ters Çevir (Negatif)">
                        <FlipVertical2 size={16} />
                    </button>
                    <button type="button" onClick={resetView}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Sıfırla">
                        <RotateCcw size={16} />
                    </button>
                    <button type="button" onClick={toggleFullscreen}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Tam Ekran">
                        {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </div>

            {/* Alt bilgi çubuğu */}
            <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <SunDim size={13} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-mono">WC: {Math.round(wc)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Contrast size={13} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-mono">WW: {Math.round(ww)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-mono">Zoom: {(zoom * 100).toFixed(0)}%</span>
                    <span className="text-[10px] text-gray-600">Sol: Kaydır • Sağ: Parlaklık/Kontrast • Tekerlek: Yakınlaştır</span>
                </div>
            </div>

            {/* Tam ekran uyarısı */}
            {fullscreen && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 text-[11px] text-gray-400 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm transition-opacity pointer-events-none">
                    {document.fullscreenElement ? 'ESC tuşuna basın' : ''}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-400">DICOM yükleniyor...</span>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
                    <div className="text-center p-4">
                        <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Canvas */}
            <div ref={wrapperRef} className={`w-full ${fullscreen ? 'h-screen' : 'h-[500px]'} cursor-grab active:cursor-grabbing`}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onContextMenu={handleContextMenu}
                    className="block w-full h-full"
                />
            </div>
        </div>
    )
}
