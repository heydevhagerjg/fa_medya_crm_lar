import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Sun, Moon } from 'lucide-react'

// S3 path'ini URL'den çıkar
function extractS3Path(url) {
    if (!url) return null
    try {
        const u = new URL(url)
        // s3 URL: https://bucket.s3.region.amazonaws.com/tenants/xxx/...
        const path = decodeURIComponent(u.pathname.replace(/^\//, ''))
        if (path.startsWith('tenants/')) return path
        return null
    } catch {
        return null
    }
}

// Backend'den signed URL al
async function getSignedUrl(originalUrl) {
    const path = extractS3Path(originalUrl)
    if (!path) return originalUrl

    try {
        const { default: api } = await import('../../lib/api.js')
        const res = await api.post('/custom-field-download', { path })
        return res.data.url
    } catch (e) {
        console.warn('Signed URL alınamadı, direkt URL deneniyor:', e)
        return originalUrl
    }
}

const COLORS = {
    light: { bg: 0xf0f0f0, model: 0xe8d0b8, grid: 0xcccccc },
    dark: { bg: 0x1a1a2e, model: 0xe8d0b8, grid: 0x444444 },
}

export default function ThreeDViewer({ fileUrl, fileName }) {
    const containerRef = useRef(null)
    const rendererRef = useRef(null)
    const sceneRef = useRef(null)
    const cameraRef = useRef(null)
    const controlsRef = useRef(null)
    const animFrameRef = useRef(null)
    const modelRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [fullscreen, setFullscreen] = useState(false)
    const [darkMode, setDarkMode] = useState(false)

    const getExtension = useCallback(() => {
        if (!fileName) return 'stl'
        return fileName.split('.').pop().toLowerCase()
    }, [fileName])

    const resetCamera = useCallback(() => {
        if (!controlsRef.current || !cameraRef.current || !modelRef.current) return
        const box = new THREE.Box3().setFromObject(modelRef.current)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const dist = maxDim * 2

        cameraRef.current.position.set(center.x + dist * 0.5, center.y + dist * 0.5, center.z + dist)
        cameraRef.current.lookAt(center)
        controlsRef.current.target.copy(center)
        controlsRef.current.update()
    }, [])

    useEffect(() => {
        if (!containerRef.current || !fileUrl) return

        const container = containerRef.current
        const width = container.clientWidth
        const height = container.clientHeight || 400

        // Scene
        const scene = new THREE.Scene()
        const colors = darkMode ? COLORS.dark : COLORS.light
        scene.background = new THREE.Color(colors.bg)
        sceneRef.current = scene

        // Camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 10000)
        cameraRef.current = camera

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        container.innerHTML = ''
        container.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.08
        controls.enablePan = true
        controls.minDistance = 0.1
        controls.maxDistance = 5000
        controlsRef.current = controls

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.6)
        scene.add(ambient)
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
        dirLight1.position.set(1, 2, 1)
        dirLight1.castShadow = true
        scene.add(dirLight1)
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
        dirLight2.position.set(-1, -1, -1)
        scene.add(dirLight2)

        // Grid
        const gridHelper = new THREE.GridHelper(200, 50, colors.grid, colors.grid)
        gridHelper.material.opacity = 0.3
        gridHelper.material.transparent = true
        scene.add(gridHelper)

        // Load model
        setLoading(true)
        setError(null)

        const ext = getExtension()
        let loader

        if (ext === 'stl') loader = new STLLoader()
        else if (ext === 'obj') loader = new OBJLoader()
        else if (ext === 'ply') loader = new PLYLoader()
        else {
            setError('Desteklenmeyen dosya formatı: ' + ext)
            setLoading(false)
            return
        }

        const onLoad = (result) => {
            let mesh

            if (ext === 'obj') {
                // OBJ returns Group
                result.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            color: colors.model,
                            specular: 0x333333,
                            shininess: 30,
                        })
                    }
                })
                mesh = result
            } else {
                // STL/PLY return BufferGeometry
                const geometry = result
                geometry.computeVertexNormals()
                const material = new THREE.MeshPhongMaterial({
                    color: colors.model,
                    specular: 0x333333,
                    shininess: 30,
                })
                mesh = new THREE.Mesh(geometry, material)
            }

            mesh.castShadow = true
            mesh.receiveShadow = true
            scene.add(mesh)
            modelRef.current = mesh

            // Auto-center & fit camera
            const box = new THREE.Box3().setFromObject(mesh)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            const dist = maxDim * 2

            camera.position.set(center.x + dist * 0.5, center.y + dist * 0.5, center.z + dist)
            camera.lookAt(center)
            controls.target.copy(center)
            controls.update()

            setLoading(false)
        }

        const onError = (err) => {
            console.error('3D model yükleme hatası:', err)
            setError('3D model yüklenemedi.')
            setLoading(false)
        }

        // STL, OBJ, PLY için signed URL alıp yükle
        getSignedUrl(fileUrl).then(signedUrl => {
            loader.load(signedUrl, onLoad, undefined, onError)
        }).catch(err => {
            onError(err)
        })

        // Animation loop
        const animate = () => {
            animFrameRef.current = requestAnimationFrame(animate)
            controls.update()
            renderer.render(scene, camera)
        }
        animate()

        // Resize handler
        const handleResize = () => {
            const w = container.clientWidth
            const h = container.clientHeight || 400
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }
        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(container)

        return () => {
            cancelAnimationFrame(animFrameRef.current)
            resizeObserver.disconnect()
            controls.dispose()
            renderer.dispose()
            scene.clear()
            container.innerHTML = ''
        }
    }, [fileUrl, darkMode, getExtension])

    const toggleFullscreen = () => {
        if (!fullscreen) {
            containerRef.current?.parentElement?.requestFullscreen?.()
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

    const zoom = (factor) => {
        if (!cameraRef.current || !controlsRef.current) return
        cameraRef.current.position.lerp(controlsRef.current.target, factor > 0 ? 0.2 : -0.25)
        controlsRef.current.update()
    }

    return (
        <div className={`relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${fullscreen ? 'fixed inset-0 z-[9999]' : ''}`}>
            {/* Toolbar */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                <button type="button" onClick={() => zoom(1)} className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors" title="Yakınlaştır">
                    <ZoomIn size={16} />
                </button>
                <button type="button" onClick={() => zoom(-1)} className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors" title="Uzaklaştır">
                    <ZoomOut size={16} />
                </button>
                <button type="button" onClick={resetCamera} className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors" title="Sıfırla">
                    <RotateCcw size={16} />
                </button>
                <button type="button" onClick={() => setDarkMode(!darkMode)} className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors" title="Tema">
                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button type="button" onClick={toggleFullscreen} className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors" title="Tam Ekran">
                    {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* Info badge */}
            <div className="absolute top-2 left-2 z-10 text-[10px] px-2 py-1 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow text-gray-500 dark:text-gray-400 font-medium">
                🦷 3D Röntgen — Fareyle döndür, kaydır, yakınlaştır
            </div>

            {/* Loading state */}
            {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">3D model yükleniyor...</span>
                    </div>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-red-50/80 dark:bg-red-900/20">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            {/* Canvas container */}
            <div
                ref={containerRef}
                className={`w-full ${fullscreen ? 'h-screen' : 'h-[400px]'}`}
            />
        </div>
    )
}
