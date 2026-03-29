import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const PREDEFINED_FIELDS = [
    {
        category: 'Web & Dijital',
        fields: [
            { label: 'Demo URL', type: 'text' },
            { label: 'Taslak URL', type: 'text' },
            { label: 'Canlı URL', type: 'text' },
            { label: 'Hosting Bilgisi', type: 'text' },
            { label: 'Domain Adı', type: 'text' },
            { label: 'Domain Bitiş Tarihi', type: 'date' },
            { label: 'Hosting Bitiş Tarihi', type: 'date' },
            { label: 'SSL Bitiş Tarihi', type: 'date' },
            { label: 'Sayfa Sayısı', type: 'number' },
            { label: 'CMS/Platform', type: 'select' },
            { label: 'FTP/Panel Bilgileri', type: 'textarea' },
            { label: 'Teknik Notlar', type: 'textarea' },
        ],
    },
    {
        category: 'Sosyal Medya',
        fields: [
            { label: 'Instagram Kullanıcı Adı', type: 'text' },
            { label: 'Facebook Sayfa URL', type: 'text' },
            { label: 'Twitter/X Kullanıcı Adı', type: 'text' },
            { label: 'LinkedIn Sayfa URL', type: 'text' },
            { label: 'TikTok Kullanıcı Adı', type: 'text' },
            { label: 'YouTube Kanal URL', type: 'text' },
            { label: 'Aylık İçerik Sayısı', type: 'number' },
            { label: 'Hikaye Sayısı (Aylık)', type: 'number' },
            { label: 'Reel/Video Sayısı (Aylık)', type: 'number' },
            { label: 'Hedef Kitle Notu', type: 'textarea' },
            { label: 'İçerik Stratejisi', type: 'textarea' },
            { label: 'Platform Seçimi', type: 'select' },
        ],
    },
    {
        category: 'Grafik Tasarım',
        fields: [
            { label: 'Tasarım Boyutu', type: 'text' },
            { label: 'Renk Paleti', type: 'text' },
            { label: 'Dosya Formatı', type: 'select' },
            { label: 'Revizyon Hakkı', type: 'number' },
            { label: 'Marka Kılavuzu URL', type: 'text' },
            { label: 'Tasarım Briefi', type: 'textarea' },
            { label: 'Baskı/Dijital', type: 'select' },
        ],
    },
    {
        category: 'Video Prodüksiyon',
        fields: [
            { label: 'Video Süresi (dk)', type: 'number' },
            { label: 'Çözünürlük', type: 'select' },
            { label: 'Çekim Tarihi', type: 'date' },
            { label: 'Senaryo/Storyboard', type: 'textarea' },
            { label: 'Müzik/Ses Tercihi', type: 'text' },
            { label: 'Altyazı Gerekli mi', type: 'select' },
            { label: 'Mekan Bilgisi', type: 'text' },
            { label: 'Video Adedi', type: 'number' },
        ],
    },
    {
        category: 'SEO & Dijital Pazarlama',
        fields: [
            { label: 'Hedef Anahtar Kelimeler', type: 'textarea' },
            { label: 'Google Analytics ID', type: 'text' },
            { label: 'Search Console URL', type: 'text' },
            { label: 'Mevcut DA/DR Skoru', type: 'number' },
            { label: 'Aylık Blog Yazısı Sayısı', type: 'number' },
            { label: 'Hedef Bölge', type: 'text' },
            { label: 'Backlink Hedefi (Aylık)', type: 'number' },
            { label: 'Rakip Siteler', type: 'textarea' },
            { label: 'Raporlama Periyodu', type: 'select' },
        ],
    },
    {
        category: 'Reklam Yönetimi',
        fields: [
            { label: 'Reklam Hesap ID', type: 'text' },
            { label: 'Aylık Bütçe (₺)', type: 'number' },
            { label: 'Hedef CPA (₺)', type: 'number' },
            { label: 'Hedef ROAS', type: 'number' },
            { label: 'Reklam Platformu', type: 'select' },
            { label: 'Hedef Kitle Yaş Aralığı', type: 'text' },
            { label: 'Hedef Konum', type: 'text' },
            { label: 'Kampanya Başlangıç Tarihi', type: 'date' },
            { label: 'Kampanya Bitiş Tarihi', type: 'date' },
            { label: 'Dönüşüm Hedefi', type: 'select' },
            { label: 'Pixel/Tag ID', type: 'text' },
        ],
    },
    {
        category: 'Fotoğraf Çekimi',
        fields: [
            { label: 'Çekim Mekanı', type: 'text' },
            { label: 'Fotoğraf Adedi', type: 'number' },
            { label: 'Çekim Türü', type: 'select' },
            { label: 'Retouching Dahil mi', type: 'select' },
            { label: 'Teslim Formatı', type: 'select' },
            { label: 'Özel İstekler', type: 'textarea' },
        ],
    },
    {
        category: 'Mimarlık & İnşaat',
        fields: [
            { label: 'Proje Adresi', type: 'textarea' },
            { label: 'Metrekare (m²)', type: 'number' },
            { label: 'Kat Sayısı', type: 'number' },
            { label: 'İmar Durumu', type: 'select' },
            { label: 'Proje Başlangıç Tarihi', type: 'date' },
            { label: 'Tahmini Bitiş Tarihi', type: 'date' },
            { label: 'Yapı Türü', type: 'select' },
            { label: 'Ruhsat No', type: 'text' },
        ],
    },
    {
        category: 'Hukuk & Danışmanlık',
        fields: [
            { label: 'Dosya/Dava No', type: 'text' },
            { label: 'Dava Türü', type: 'select' },
            { label: 'Mahkeme Adı', type: 'text' },
            { label: 'Duruşma Tarihi', type: 'date' },
            { label: 'Karşı Taraf Bilgisi', type: 'text' },
            { label: 'Dava Özeti', type: 'textarea' },
            { label: 'TC Kimlik No', type: 'text' },
        ],
    },
    {
        category: 'Sağlık & Klinik',
        fields: [
            { label: 'Hasta Adı', type: 'text' },
            { label: 'Doğum Tarihi', type: 'date' },
            { label: 'Randevu Tarihi', type: 'date' },
            { label: 'Tedavi Türü', type: 'select' },
            { label: 'Seans Sayısı', type: 'number' },
            { label: 'Doktor Adı', type: 'text' },
            { label: 'Hasta Notu', type: 'textarea' },
            { label: '3D Diş Röntgeni', type: '3d_viewer' },
            { label: '3D Model Dosyası', type: '3d_viewer' },
        ],
    },
    {
        category: 'Eğitim & Kurs',
        fields: [
            { label: 'Öğrenci/Katılımcı Sayısı', type: 'number' },
            { label: 'Kurs Başlangıç Tarihi', type: 'date' },
            { label: 'Kurs Bitiş Tarihi', type: 'date' },
            { label: 'Eğitim Seviyesi', type: 'select' },
            { label: 'Eğitim Formatı', type: 'select' },
            { label: 'Sertifika Verilecek mi', type: 'select' },
            { label: 'Ders Saati', type: 'number' },
            { label: 'Müfredat', type: 'textarea' },
        ],
    },
    {
        category: 'Otomotiv & Araç Servisi',
        fields: [
            { label: 'Plaka No', type: 'text' },
            { label: 'Marka/Model', type: 'text' },
            { label: 'Model Yılı', type: 'number' },
            { label: 'Kilometre', type: 'number' },
            { label: 'Şasi No', type: 'text' },
            { label: 'Arıza Tanımı', type: 'textarea' },
            { label: 'Servis Türü', type: 'select' },
        ],
    },
    {
        category: 'Gayrimenkul',
        fields: [
            { label: 'İlan No', type: 'text' },
            { label: 'Oda Sayısı', type: 'text' },
            { label: 'Bulunduğu Kat', type: 'number' },
            { label: 'Fiyat (₺)', type: 'number' },
            { label: 'Adres', type: 'textarea' },
            { label: 'Emlak Tipi', type: 'select' },
            { label: 'Tapu Durumu', type: 'select' },
        ],
    },
    {
        category: 'Etkinlik & Organizasyon',
        fields: [
            { label: 'Kişi Sayısı', type: 'number' },
            { label: 'Etkinlik Tarihi', type: 'date' },
            { label: 'Menü Tercihi', type: 'select' },
            { label: 'Alerji/Diyet Notu', type: 'textarea' },
            { label: 'Mekan Adresi', type: 'text' },
            { label: 'Organizasyon Türü', type: 'select' },
        ],
    },
    {
        category: 'Genel',
        fields: [
            { label: 'Referans Kodu', type: 'text' },
            { label: 'Öncelik Seviyesi', type: 'select' },
            { label: 'Garanti Bitiş Tarihi', type: 'date' },
            { label: 'Sözleşme No', type: 'text' },
            { label: 'Sözleşme Başlangıcı', type: 'date' },
            { label: 'Sözleşme Bitişi', type: 'date' },
            { label: 'Aylık Tutar (₺)', type: 'number' },
            { label: 'Ödeme Periyodu', type: 'select' },
            { label: 'Müşteri Notu', type: 'textarea' },
            { label: 'Sorumlu Kişi', type: 'text' },
            { label: 'Revizyon Sayısı', type: 'number' },
            { label: 'Teslim Tarihi', type: 'date' },
        ],
    },
]

const TYPE_LABELS = {
    text: 'Metin',
    number: 'Sayı',
    date: 'Tarih',
    textarea: 'Çok Satırlı',
    select: 'Seçim',
    file: 'Dosya',
    '3d_viewer': '3D Görüntü',
}

export default function FieldLabelCombobox({ value, onChange, onSelect, className }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [dropdownStyle, setDropdownStyle] = useState({})
    const wrapperRef = useRef(null)
    const inputRef = useRef(null)
    const dropdownRef = useRef(null)

    const updatePosition = useCallback(() => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect()
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            })
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                wrapperRef.current && !wrapperRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (open) {
            updatePosition()
            window.addEventListener('scroll', updatePosition, true)
            window.addEventListener('resize', updatePosition)
            return () => {
                window.removeEventListener('scroll', updatePosition, true)
                window.removeEventListener('resize', updatePosition)
            }
        }
    }, [open, updatePosition])

    const toLowerTR = (str) => str.toLocaleLowerCase('tr-TR')
    const query = toLowerTR(search || value || '').replace(/\s+/g, ' ').trim()

    const filtered = PREDEFINED_FIELDS.map(group => ({
        ...group,
        fields: group.fields.filter(f => toLowerTR(f.label).includes(query)),
    })).filter(group => group.fields.length > 0)

    const handleInputChange = (e) => {
        const val = e.target.value
        setSearch(val)
        onChange(val)
        if (!open) setOpen(true)
    }

    const handleSelect = (field) => {
        onChange(field.label)
        setSearch('')
        onSelect(field.type)
        setOpen(false)
        inputRef.current?.blur()
    }

    const handleFocus = () => {
        setSearch('')
        setOpen(true)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setOpen(false)
            inputRef.current?.blur()
        }
    }

    return (
        <div ref={wrapperRef} className="relative flex-1">
            <input
                ref={inputRef}
                type="text"
                value={search !== '' ? search : value}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder="Alan adı yazın veya seçin"
                className={className}
                autoComplete="off"
            />
            {open && filtered.length > 0 && createPortal(
                <div
                    ref={dropdownRef}
                    style={dropdownStyle}
                    className="bg-white dark:bg-[#1A1A2E] border border-[#E5E9F0] dark:border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                >
                    {filtered.map((group) => (
                        <div key={group.category}>
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#905EFC] bg-[#F8F9FB] dark:bg-white/5 sticky top-0">
                                {group.category}
                            </div>
                            {group.fields.map((field) => (
                                <button
                                    key={field.label}
                                    type="button"
                                    onClick={() => handleSelect(field)}
                                    className="w-full text-left px-3 py-1.5 text-sm text-[#1A1A2E] dark:text-white hover:bg-[#905EFC]/10 dark:hover:bg-[#905EFC]/10 flex items-center justify-between gap-2 transition-colors"
                                >
                                    <span className="truncate">{field.label}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E5E9F0] dark:bg-white/10 text-[#9097A6] shrink-0">
                                        {TYPE_LABELS[field.type]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    )
}
