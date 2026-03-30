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
                    <div className="theme-text-secondary flex items-center gap-2 text-sm">
                        <span className="theme-text-primary font-medium">Anasayfa</span>
                        {breadcrumbs.map((breadcrumb, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <ChevronRight size={16} />
                                <span className="theme-text-primary font-medium">{breadcrumb}</span>
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
                                            ? 'theme-button-secondary'
                                            : action.variant === 'outline'
                                            ? 'theme-button-outline border'
                                            : 'theme-button-primary shadow-lg shadow-[#905EFC]/25'
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--theme-accent-soft)">
                        <Icon size={20} className={iconColor} />
                    </div>
                )}
                <div className="flex-1">
                    <h1 className="theme-text-primary text-2xl font-bold">{title}</h1>
                    {subtitle && (
                        <p className="theme-text-secondary mt-1 text-sm">{subtitle}</p>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            {search && (
                <div className="relative">
                    <search.icon size={16} className="theme-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search.value}
                        onChange={search.onChange}
                        placeholder={search.placeholder}
                        className="theme-input w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm"
                    />
                </div>
            )}

            {/* Additional Content (filters, badges, etc) */}
            {children && <div>{children}</div>}
        </div>
    )
}
