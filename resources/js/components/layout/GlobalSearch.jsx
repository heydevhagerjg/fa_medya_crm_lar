import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, X, Loader2, Users, Briefcase, FileText, Clock, CreditCard, TrendingDown, FolderOpen } from 'lucide-react'
import api from '../../lib/api.js'

const moduleIcons = {
    customer: { icon: Users, label: 'Müşteri', color: 'text-blue-500' },
    job: { icon: Briefcase, label: 'İş', color: 'text-purple-500' },
    proposal: { icon: FileText, label: 'Teklif', color: 'text-orange-500' },
    service_tracking: { icon: Clock, label: 'Hizmet Takibi', color: 'text-cyan-500' },
    payment: { icon: CreditCard, label: 'Tahsilat', color: 'text-green-500' },
    expense: { icon: TrendingDown, label: 'Masraf', color: 'text-red-500' },
    file: { icon: FolderOpen, label: 'Dosya', color: 'text-gray-500' },
}

export default function GlobalSearch() {
    const [search, setSearch] = useState('')
    const [results, setResults] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const searchRef = useRef(null)
    const timeoutRef = useRef(null)
    const navigate = useNavigate()

    // Perform search
    const performSearch = async (query) => {
        if (query.length < 2) {
            setResults([])
            setIsOpen(false)
            return
        }

        setIsLoading(true)
        try {
            const response = await api.get('/search', {
                params: { q: query }
            })
            const data = response.data || []
            setResults(Array.isArray(data) ? data : [])
            setIsOpen(data && data.length > 0)
            setSelectedIndex(-1)
        } catch (error) {
            console.error('Search error:', error)
            setResults([])
            setIsOpen(true) // Açık tut böylece hata görülür
        } finally {
            setIsLoading(false)
        }
    }

    // Debounce search input
    const handleSearchChange = (e) => {
        const value = e.target.value
        setSearch(value)
        setSelectedIndex(-1)

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Set new timeout for 200ms debounce
        if (value.length >= 2) {
            timeoutRef.current = setTimeout(() => {
                performSearch(value)
            }, 200)
        } else {
            setResults([])
            setIsOpen(false)
        }
    }

    // Handle result selection
    const handleSelectResult = (result) => {
        let path = ''
        switch (result.type) {
            case 'customer':
                path = `/customers/${result.id}`
                break
            case 'job':
                path = `/jobs/${result.id}`
                break
            case 'proposal':
                path = `/proposals?id=${result.id}`
                break
            case 'service_tracking':
                path = `/service-trackings?id=${result.id}`
                break
            case 'payment':
                path = `/payments?id=${result.id}`
                break
            case 'expense':
                path = `/expenses?id=${result.id}`
                break
            case 'file':
                path = `/files/${result.id}`
                break
            default:
                return
        }
        navigate(path)
        setSearch('')
        setResults([])
        setIsOpen(false)
    }

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!isOpen) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
                break
            case 'Enter':
                e.preventDefault()
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    handleSelectResult(results[selectedIndex])
                }
                break
            case 'Escape':
                setIsOpen(false)
                setSelectedIndex(-1)
                break
            default:
                break
        }
    }

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative w-full max-w-md" ref={searchRef}>
            {/* Search Input */}
            <div className="relative">
                <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9097A6] pointer-events-none" />
                <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => search.length >= 2 && setIsOpen(true)}
                    placeholder="Arama yapın..."
                    className="w-full bg-[#F4F5F7] dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-full py-2.5 pl-10 pr-5 text-sm text-[#1A1A2E] dark:text-white placeholder-[#9097A6] focus:outline-none focus:ring-2 focus:ring-[#905EFC]/25 focus:border-[#905EFC]/40 transition-all"
                />
                {search && (
                    <button
                        onClick={() => {
                            setSearch('')
                            setResults([])
                            setIsOpen(false)
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9097A6] hover:text-[#1A1A2E] dark:hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
                {isLoading && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <Loader2 size={18} className="animate-spin text-[#905EFC]" />
                    </div>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && search.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111111] border border-[#E5E9F0] dark:border-white/10 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                    {results.length > 0 ? (
                        <div className="divide-y divide-[#E5E9F0] dark:divide-white/5">
                            {results.map((result, idx) => {
                                const ModuleIcon = moduleIcons[result.type]?.icon
                                const moduleLabel = moduleIcons[result.type]?.label
                                const moduleColor = moduleIcons[result.type]?.color

                                return (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSelectResult(result)}
                                        className={`
                                            w-full text-left px-4 py-3 transition-colors
                                            ${idx === selectedIndex
                                                ? 'bg-[#905EFC]/10 dark:bg-[#905EFC]/10'
                                                : 'hover:bg-[#F4F5F7] dark:hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start gap-3">
                                            {ModuleIcon && (
                                                <div className={`mt-0.5 p-2 rounded-lg bg-${moduleColor.split('-')[1]}-50 dark:bg-white/5`}>
                                                    <ModuleIcon size={16} className={moduleColor} />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-[#1A1A2E] dark:text-white truncate">
                                                        {result.name || result.title || 'Untitled'}
                                                    </h4>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#E5E9F0] dark:bg-white/10 text-[#9097A6] whitespace-nowrap">
                                                        {moduleLabel}
                                                    </span>
                                                </div>
                                                {result.description && (
                                                    <p className="text-xs text-[#9097A6] mt-1 truncate">
                                                        {result.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center">
                            <SearchIcon size={32} className="mx-auto text-[#E5E9F0] dark:text-white/10 mb-3" />
                            <p className="text-sm text-[#9097A6]">Sonuç bulunamadı</p>
                            <p className="text-xs text-[#9097A6]/70 mt-1">"{search}" için sonuç yok</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
