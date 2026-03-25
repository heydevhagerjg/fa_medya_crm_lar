import { ChevronRight } from 'lucide-react'

export default function PageHeader({
    title,
    subtitle,
    icon: Icon,
    iconColor = 'text-indigo-500',
    actions = [], // Array of { label, onClick, icon }
    search,
    children,
    breadcrumbs = [],
}) {
    return (
        <div className="space-y-5">
            {/* Breadcrumb with Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Breadcrumb on Left */}
                {breadcrumbs.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[#9097A6]">
                        <span className="font-medium text-[#1A1A2E] dark:text-white">Anasayfa</span>
                        {breadcrumbs.map((breadcrumb, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <ChevronRight size={16} />
                                <span className="font-medium text-[#1A1A2E] dark:text-white">{breadcrumb}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Buttons on Right */}
                {actions.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                        {actions.map((action, idx) => {
                            const ActionIcon = action.icon
                            return (
                                <button
                                    key={idx}
                                    onClick={action.onClick}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap
                                        ${action.variant === 'secondary'
                                            ? 'bg-[#E5E9F0] dark:bg-white/10 text-[#1A1A2E] dark:text-white hover:bg-[#D0D5E0] dark:hover:bg-white/20'
                                            : action.variant === 'outline'
                                            ? 'border border-[#E5E9F0] dark:border-white/10 text-[#1A1A2E] dark:text-white hover:bg-[#F4F5F7] dark:hover:bg-white/5'
                                            : 'bg-[#905EFC] hover:bg-[#7B4FD4] text-white shadow-lg shadow-[#905EFC]/25'
                                        }
                                    `}
                                >
                                    {ActionIcon && <ActionIcon size={18} />}
                                    {action.label}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Title Section */}
            <div className="flex items-start gap-3">
                {Icon && (
                    <div className="w-10 h-10 rounded-xl bg-[#905EFC]/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={20} className={iconColor} />
                    </div>
                )}
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[#1A1A2E] dark:text-white">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-[#9097A6] dark:text-gray-400 mt-1">{subtitle}</p>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            {search && (
                <div className="relative">
                    <search.icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9097A6]" />
                    <input
                        type="text"
                        value={search.value}
                        onChange={search.onChange}
                        placeholder={search.placeholder}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-sm text-[#1A1A2E] dark:text-white placeholder-[#9097A6] focus:outline-none focus:border-[#905EFC]"
                    />
                </div>
            )}

            {/* Additional Content (filters, badges, etc) */}
            {children && <div>{children}</div>}
        </div>
    )
}
