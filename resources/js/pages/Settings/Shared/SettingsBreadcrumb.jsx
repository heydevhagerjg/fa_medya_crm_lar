import { ChevronRight } from 'lucide-react'

export default function SettingsBreadcrumb({ items }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-[#1A1A2E] dark:text-white">Ayarlar</span>
            {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <ChevronRight size={16} className="text-[#E5E9F0] dark:text-white/20" />
                    <span className="font-semibold text-[#1A1A2E] dark:text-white">{item}</span>
                </div>
            ))}
        </div>
    )
}
