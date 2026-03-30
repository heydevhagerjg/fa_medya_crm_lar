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
    childrenPlacement = 'below', // 'below' | 'actions'
}) {
    const trail = ['Anasayfa', ...breadcrumbs.filter(Boolean)]
    const hasBreadcrumbs = trail.length > 1

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                {hasBreadcrumbs ? (
                    <div className="min-w-0 flex-1">
                        <ol className="theme-text-secondary flex items-center gap-1.5 text-xs font-semibold sm:hidden">
                            <li className="max-w-30 truncate">{trail[0]}</li>
                            {trail.length > 2 && (
                                <>
                                    <li className="opacity-60">
                                        <ChevronRight size={14} />
                                    </li>
                                    <li className="theme-text-secondary">...</li>
                                </>
                            )}
                            <li className="opacity-60">
                                <ChevronRight size={14} />
                            </li>
                            <li className="theme-text-primary max-w-42.5 truncate">{trail[trail.length - 1]}</li>
                        </ol>

                        <ol className="theme-text-secondary hidden items-center gap-1.5 text-sm font-semibold sm:flex">
                            {trail.map((item, idx) => {
                                const isLast = idx === trail.length - 1
                                return (
                                    <li key={`${item}-${idx}`} className="flex min-w-0 items-center gap-1.5">
                                        {idx > 0 && <ChevronRight size={14} className="opacity-60" />}
                                        <span
                                            className={`max-w-55 truncate ${isLast ? 'theme-text-primary' : 'opacity-85'}`}
                                            title={item}
                                        >
                                            {item}
                                        </span>
                                    </li>
                                )
                            })}
                        </ol>
                    </div>
                ) : (
                    <div className="flex-1" />
                )}

                {actions.length > 0 && (
                    <div className="relative flex shrink-0 items-center justify-end gap-2">
                        {actions.map((action, idx) => {
                            const ActionIcon = action.icon
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={action.onClick}
                                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${action.variant === 'secondary'
                                        ? 'theme-button-secondary'
                                        : action.variant === 'outline'
                                        ? 'theme-button-outline border'
                                        : 'theme-button-primary shadow-lg shadow-[#905EFC]/20'
                                        }`}
                                >
                                    {ActionIcon && <ActionIcon size={16} />}
                                    {action.label}
                                </button>
                            )
                        })}

                        {children && childrenPlacement === 'actions' && children}
                    </div>
                )}
            </div>

            {!hasBreadcrumbs && (
                <div className="flex items-start gap-2.5">
                    {Icon && (
                        <div className="bg-(--theme-accent-soft) flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9">
                            <Icon size={18} className={iconColor} />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h1 className="theme-text-primary truncate text-xl font-bold leading-tight sm:text-2xl">{title}</h1>
                        {subtitle && <p className="theme-text-secondary mt-1 line-clamp-2 text-sm">{subtitle}</p>}
                    </div>
                </div>
            )}

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

            {children && childrenPlacement !== 'actions' && <div className="relative">{children}</div>}
        </div>
    )
}
