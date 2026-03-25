import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

export default function DropdownMenu({
    icon: Icon,
    label,
    groups,
    permission,
    isActive,
    storageKey = 'dropdown-expanded',
    groupStorageKey = 'dropdown-groups-expanded',
    onClose,
    expanded,
    isMobile,
    setMobileOpen,
}) {
    const location = useLocation()
    const [isDropdownOpen, setIsDropdownOpen] = useState(() => {
        return localStorage.getItem(storageKey) === 'true'
    })
    const [expandedGroups, setExpandedGroups] = useState(() => {
        const saved = localStorage.getItem(groupStorageKey)
        return saved ? JSON.parse(saved) : {}
    })

    const toggleDropdown = () => {
        setIsDropdownOpen(prev => {
            localStorage.setItem(storageKey, String(!prev))
            return !prev
        })
    }

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => {
            if (prev[groupName]) {
                const newState = { ...prev }
                delete newState[groupName]
                localStorage.setItem(groupStorageKey, JSON.stringify(newState))
                return newState
            }
            const newState = { [groupName]: true }
            localStorage.setItem(groupStorageKey, JSON.stringify(newState))
            return newState
        })
    }

    // Dropdown dışında herhangi bir yere gidildiyse kapat
    const dropdownActive = isActive ? isActive(location) : false

    return (
        <div className="flex flex-col gap-0.5">
            <button
                onClick={toggleDropdown}
                className={`
                    relative group flex items-center gap-3 transition-all duration-200 shrink-0 rounded-xl
                    ${expanded ? 'px-3 py-2.5' : 'w-11 h-11 mx-auto justify-center'}
                    ${dropdownActive
                        ? 'bg-[#1A1A2E] dark:bg-white text-white dark:text-[#1A1A2E] shadow-md'
                        : 'text-[#9097A6] hover:bg-[#E5E9F0] dark:hover:bg-white/10 hover:text-[#1A1A2E] dark:hover:text-white'
                    }
                `}
                title=""
            >
                <Icon size={18} strokeWidth={dropdownActive ? 2.5 : 1.8} className="shrink-0" />
                {expanded && (
                    <div className="flex-1 flex items-center justify-between">
                        <span className={`text-sm font-semibold ${dropdownActive ? 'text-white dark:text-[#1A1A2E]' : 'text-[#1A1A2E] dark:text-white'}`}>
                            {label}
                        </span>
                        <ChevronDown size={16} className={`ml-auto transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                )}
                {!expanded && <span className="nav-tooltip">{label}</span>}
            </button>

            {expanded && isDropdownOpen && (
                <div className="flex flex-col gap-0.5 pl-2 mt-0.5 border-l-2 border-[#E5E9F0] dark:border-white/5 ml-1.5">
                    {groups.map((item) => {
                        // Tekli menu item (group property'si yok)
                        if (!item.group) {
                            const IconComp = item.icon
                            const itemActive = item.isActive 
                                ? item.isActive(location) 
                                : location.search === `?tab=${item.id}`
                            return (
                                <NavLink
                                    key={item.id}
                                    to={item.to || `/settings?tab=${item.id}`}
                                    onClick={() => isMobile && setMobileOpen(false)}
                                    className={`
                                        flex items-center gap-2.5 transition-all duration-200 px-3 py-1.5 rounded-lg text-xs font-semibold
                                        ${itemActive
                                            ? 'bg-[#905EFC]/10 text-[#905EFC] dark:text-[#905EFC]'
                                            : 'text-[#9097A6] hover:text-[#1A1A2E] dark:hover:text-white hover:bg-[#E5E9F0]/50 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <IconComp size={14} className="shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </NavLink>
                            )
                        }

                        // Gruplu menu items
                        return (
                            <div key={item.group} className="flex flex-col gap-0.5">
                                <button
                                    onClick={() => toggleGroup(item.group)}
                                    className={`
                                        flex items-center gap-2 transition-all duration-200 px-3 py-1.5 rounded-lg text-xs font-semibold
                                        ${expandedGroups[item.group] 
                                            ? 'text-[#905EFC] bg-[#905EFC]/5' 
                                            : 'text-[#9097A6] hover:text-[#1A1A2E] dark:hover:text-white hover:bg-[#E5E9F0]/50 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <ChevronDown size={14} className={`shrink-0 transition-transform ${expandedGroups[item.group] ? 'rotate-180' : ''}`} />
                                    <span className="truncate">{item.group}</span>
                                </button>

                                {expandedGroups[item.group] && (
                                    <div className="flex flex-col gap-0.5 pl-2 border-l-2 border-[#E5E9F0] dark:border-white/5 ml-1.5">
                                        {item.items.map((subItem) => {
                                            const IconComp = subItem.icon
                                            const subItemActive = subItem.isActive 
                                                ? subItem.isActive(location) 
                                                : location.search === `?tab=${subItem.id}`
                                            return (
                                                <NavLink
                                                    key={subItem.id}
                                                    to={subItem.to || `/settings?tab=${subItem.id}`}
                                                    onClick={() => isMobile && setMobileOpen(false)}
                                                    className={`
                                                        flex items-center gap-2.5 transition-all duration-200 px-3 py-1.5 rounded-lg text-xs font-semibold
                                                        ${subItemActive
                                                            ? 'bg-[#905EFC]/10 text-[#905EFC] dark:text-[#905EFC]'
                                                            : 'text-[#9097A6] hover:text-[#1A1A2E] dark:hover:text-white hover:bg-[#E5E9F0]/50 dark:hover:bg-white/5'
                                                        }
                                                    `}
                                                >
                                                    <IconComp size={14} className="shrink-0" />
                                                    <span className="truncate">{subItem.label}</span>
                                                </NavLink>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
