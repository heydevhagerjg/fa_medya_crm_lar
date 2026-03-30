import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore, useThemeStore } from "../../stores/index.js";
import { useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";
import toast from "react-hot-toast";
import DropdownMenu from "./DropdownMenu.jsx";
import GlobalSearch from "./GlobalSearch.jsx";
import {
    LayoutDashboard,
    Users,
    Briefcase,
    CreditCard,
    TrendingDown,
    Settings,
    FileText,
    MessageSquare,
    Database,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
    Bell,
    User,
    FolderOpen,
    FileCode,
    LayoutList,
    Calendar,
    Clock,
    AlertCircle,
    Lock,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    LogOutIcon,
    Layers,
    ListTodo,
    ClipboardList,
    Wallet,
    Activity,
    CalendarCheck,
    Key,
    ShieldAlert,
} from "lucide-react";

const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Ana Sayfa" },
    {
        to: "/customers",
        icon: Users,
        label: "Müşteriler",
        permission: "customers.view",
    },
    { to: "/jobs", icon: Briefcase, label: "İşler", permission: "jobs.view" },
    {
        to: "/kanban",
        icon: LayoutList,
        label: "İş Takip (Kanban)",
        permission: "jobs.view",
    },
    {
        to: "/appointments",
        icon: Calendar,
        label: "Randevular",
        permission: "appointments.view",
        feature: "appointment",
    },
    {
        to: "/proposals",
        icon: FileText,
        label: "Teklifler",
        feature: "proposal",
    },
    {
        to: "/service-trackings",
        icon: Clock,
        label: "Hizmet Takibi",
        feature: "service_tracking",
    },
    {
        to: "/payments",
        icon: CreditCard,
        label: "Tahsilatlar",
        permission: "payments.view",
    },
    {
        to: "/expenses",
        icon: TrendingDown,
        label: "Masraflar",
        permission: "expenses.view",
    },
    {
        to: "/files",
        icon: FolderOpen,
        label: "Dosyalar",
        permission: "files.view",
    },
    {
        to: "/chats",
        icon: MessageSquare,
        label: "Sohbetler",
        feature: "chat",
    },
    {
        to: "/backup",
        icon: Database,
        label: "Yedek",
        permission: "settings.manage",
        feature: "backup",
    },
    {
        to: "/api-docs",
        icon: FileCode,
        label: "API Dokümanı",
        permission: "admin_only",
        feature: "api_key",
    },
];

const settingsMenuGroups = [
    { id: "general", label: "Genel Bilgiler", icon: Settings },
    {
        group: "İş Akışı",
        items: [
            { id: "services", label: "Hizmet Tanımları", icon: Layers },
            { id: "statuses", label: "İş Akış Durumları", icon: ListTodo },
            { id: "templates", label: "Adım Şablonları", icon: ClipboardList },
            { id: "workflows", label: "İş Otomasyonları", icon: Activity },
        ],
    },
    {
        group: "Mali İşler",
        items: [
            { id: "cash-registers", label: "Kasa Yönetimi", icon: Wallet },
            {
                id: "expense-categories",
                label: "Gider Kategorileri",
                icon: FolderOpen,
            },
        ],
    },
    {
        group: "Yönetim",
        items: [
            {
                id: "appointment-titles",
                label: "Randevu Başlıkları",
                icon: CalendarCheck,
            },
            {
                id: "service-tracking",
                label: "Hizmet Takip Kategorileri",
                icon: Activity,
            },
            { id: "users", label: "Personel Yönetimi", icon: Users },
            { id: "roles", label: "Yetki Grupları (Roller)", icon: Lock },
        ],
    },
    {
        group: "Sistem",
        items: [
            { id: "api-keys", label: "API / Entegrasyon", icon: Key },
            { id: "backups", label: "Veri Yedekleme", icon: Database },
            { id: "logs", label: "Denetim Kayıtları", icon: ShieldAlert },
        ],
    },
    {
        group: "Abonelik",
        items: [
            { id: "subscription", label: "Abonelik & Ödeme", icon: CreditCard },
            { id: "plan-usage", label: "Paket Kullanımı", icon: Activity },
        ],
    },
];

export default function DashboardLayout({ children, isRestoring = false }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [expanded, setExpanded] = useState(() => {
        return localStorage.getItem("sidebar-expanded") === "true";
    });
    const [expandedSettings, setExpandedSettings] = useState(() => {
        return localStorage.getItem("settings-menu-expanded") === "true";
    });
    const [isRecalculating, setIsRecalculating] = useState(false);
    const { user, setAuth, clearAuth, updateUser } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const LinkComponent = isRestoring ? "div" : NavLink;
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    useEffect(() => {
        api.get("/auth/me")
            .then((res) => {
                updateUser(res.data);
            })
            .catch(() => { });
    }, []);

    // ─── Global Chat Notifications ───────────────────────────────────────────
    useEffect(() => {
        if (!user?.id || !window.Echo) return;

        const channel = window.Echo.private(`user.chats.${user.id}`)
            .listen('.chat.created', (e) => {
                queryClient.invalidateQueries(['chats']);
                if (!location.pathname.startsWith('/chats')) {
                    toast('💬 Yeni bir sohbet başlatıldı', {
                        duration: 4000,
                        style: { cursor: 'pointer' },
                        onClick: () => navigate(`/chats?open=${e?.chat?.id || e?.id || ''}`),
                    });
                }
            })
            .listen('.message.created', (e) => {
                queryClient.invalidateQueries(['chats']);
                if (!location.pathname.startsWith('/chats') && e.user?.name) {
                    toast(
                        (t) => (
                            <span
                                style={{ cursor: 'pointer' }}
                                onClick={() => { toast.dismiss(t.id); navigate(`/chats?open=${e.chat_id}`); }}
                            >
                                <strong>{e.user.name}</strong>: {e.content?.slice(0, 60) || 'Yeni mesaj'}
                            </span>
                        ),
                        {
                            icon: '💬',
                            duration: 5000,
                            id: `chat-msg-${e.chat_id}`,  // prevent duplicate toasts per chat
                        }
                    );
                }
            });

        return () => {
            window.Echo.leave(`user.chats.${user.id}`);
        };
    }, [user?.id, location.pathname, navigate, queryClient]);

    // Auto-expand sidebar and settings dropdown when on settings page
    useEffect(() => {
        const isSettingsPage =
            location.pathname === "/settings" ||
            location.pathname.startsWith("/settings?");
        if (isSettingsPage) {
            if (!expandedSettings) {
                setExpandedSettings(true);
            }
            if (!expanded) {
                setExpanded(true);
                localStorage.setItem("sidebar-expanded", "true");
            }
        } else if (expandedSettings) {
            setExpandedSettings(false);
            localStorage.removeItem("settings-groups-expanded");
        }
    }, [location.pathname, location.search]);

    const toggleExpanded = () => {
        setExpanded((prev) => {
            localStorage.setItem("sidebar-expanded", String(!prev));
            return !prev;
        });
    };

    const hasPermission = (p) => {
        if (!p) return true;
        if (p === "admin_only") return user?.role === "ADMIN";
        if (user?.role === "ADMIN") return true;
        return user?.permissions?.includes(p) || false;
    };

    const isFeatureDisabled = (f) => {
        if (!f || !user?.tenant) return false;
        return (
            user.tenant[`plan_${f}_feature`] === false ||
            user.tenant[`plan_${f}_feature`] === 0
        );
    };

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
        } catch { }
        clearAuth();
        navigate("/login");
        toast.success("Çıkış yapıldı.");
    };

    const handleRecalculateStorage = async () => {
        if (isRecalculating) return;
        setIsRecalculating(true);
        const loadingToast = toast.loading('Depolama alanı hesaplanıyor...');
        try {
            const res = await api.post('/tenant/recalculate-storage');
            updateUser({
                ...user,
                tenant: {
                    ...user.tenant,
                    storage_used: res.data.storage_used
                }
            });
            toast.success('Depolama alanı güncellendi.', { id: loadingToast });
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Hesaplama hatası', { id: loadingToast });
        } finally {
            setIsRecalculating(false);
        }
    };

    const todayStr = new Date().toLocaleDateString("tr-TR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const buildSidebarContent = (isMobile = false) => (
        <div className="flex flex-col h-full">
            {/* Logo + toggle */}
            <div
                className={`theme-divider flex h-17.5 shrink-0 items-center border-b ${expanded ? "px-5 justify-between" : "justify-center px-0"}`}
            >
                <div
                    className={`flex items-center gap-3 min-w-0 ${expanded ? "" : "justify-center w-full"}`}
                >
                    {!expanded && (
                        <img
                            src={theme === 'dark' ? "/logo/small-logo.png" : "/logo/small-logo-dark.png"}
                            alt="Logo"
                            width={32}
                            height={32}
                            className="rounded-full"
                        />
                    )}
                    {expanded && (
                        <img
                            src={theme === 'dark' ? "/logo/big-logo.png" : "/logo/big-logo-dark.png"}
                            alt="Logo"
                            style={{ width: 'auto', height: 40 }}
                            className="rounded-full"
                        />
                    )}
                </div>
                {expanded && !isMobile && (
                    <button
                        onClick={toggleExpanded}
                        className="theme-icon-button flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all"
                        title="Daralt"
                    >
                        <ChevronLeft size={14} />
                    </button>
                )}
            </div>

            {/* Nav items */}
            <nav
                className={`flex-1 flex flex-col gap-0.5 py-3 px-3 ${expanded || isMobile ? "overflow-y-auto" : "overflow-visible"}`}
            >
                {navItems
                    .filter((item) => hasPermission(item.permission))
                    .map((item) => {
                        const IconComp = item.icon;
                        const isDisabled = isFeatureDisabled(item.feature);
                        const isActive =
                            location.pathname === item.to ||
                            (item.to !== "/dashboard" &&
                                location.pathname.startsWith(item.to));
                        return (
                            <LinkComponent
                                key={item.to}
                                {...(!isRestoring ? { to: item.to } : {})}
                                onClick={() => !isRestoring && isMobile && setMobileOpen(false)}
                                className={`
                                    relative group flex items-center gap-3 transition-all duration-200 shrink-0 rounded-xl
                                    ${expanded ? "px-3 py-2.5" : "w-11 h-11 mx-auto justify-center"}
                                    ${isActive && !isRestoring
                                        ? "theme-nav-item-active shadow-md"
                                        : "theme-nav-item"
                                    }
                                    ${isRestoring ? "cursor-not-allowed opacity-70 pointer-events-none" : ""}
                                `}
                                title=""
                            >
                                <IconComp
                                    size={18}
                                    strokeWidth={isActive && !isRestoring ? 2.5 : 1.8}
                                    className="shrink-0"
                                />
                                {expanded && (
                                    <span
                                        className={`truncate text-sm font-semibold ${isActive && !isRestoring ? "theme-nav-label-active" : "theme-nav-label"}`}
                                    >
                                        {item.label}
                                    </span>
                                )}
                                {isDisabled && (
                                    <span
                                        className={`${expanded ? "ml-auto" : "absolute -top-0.5 -right-0.5"} theme-muted-badge flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full`}
                                    >
                                        <Lock size={8} className="theme-text-secondary" />
                                    </span>
                                )}
                                {!expanded && (
                                    <span className="nav-tooltip">
                                        {item.label}
                                    </span>
                                )}
                            </LinkComponent>
                        );
                    })}

                {/* Settings Dropdown Menu */}
                {hasPermission("settings.view") && (
                    <DropdownMenu
                        icon={Settings}
                        label="Ayarlar"
                        groups={settingsMenuGroups}
                        isActive={(loc) => loc.pathname.startsWith("/settings")}
                        storageKey="settings-menu-expanded"
                        groupStorageKey="settings-groups-expanded"
                        expanded={expanded}
                        isMobile={isMobile}
                        setMobileOpen={setMobileOpen}
                        onExpandSidebar={() => {
                            setExpanded(true)
                            localStorage.setItem("sidebar-expanded", "true")
                        }}
                    />
                )}
            </nav>

            {/* Bottom section */}
            <div
                className={`theme-divider flex flex-col gap-0.5 border-t px-3 pb-4 pt-3 ${expanded ? "" : "items-center"}`}
            >
                {/* Storage indicator */}
                {user?.tenant?.storage_limit > 0 &&
                    (() => {
                        const pct = Math.min(
                            100,
                            (user.tenant.storage_used /
                                1024 /
                                1024 /
                                user.tenant.storage_limit) *
                            100,
                        );
                        const color =
                            pct > 90
                                ? "#ef4444"
                                : pct > 70
                                    ? "#f59e0b"
                                    : "#905EFC";
                        const usedMb = Math.round(
                            user.tenant.storage_used / 1024 / 1024,
                        );
                        return expanded ? (
                            <div
                                onClick={handleRecalculateStorage}
                                className={`theme-nav-item mb-1 cursor-pointer rounded-xl px-3 py-2.5 transition-all group/storage ${isRecalculating ? 'opacity-50 pointer-events-none' : ''}`}
                                title="Depolama alanını yeniden hesaplamak için tıklayın"
                            >
                                <div className="theme-text-secondary mb-1.5 flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <span>Depolama</span>
                                        {isRecalculating && <Activity size={10} className="animate-pulse text-[#905EFC]" />}
                                    </div>
                                    <span className="group-hover/storage:text-[#905EFC] transition-colors">
                                        {usedMb} / {user.tenant.storage_limit}{" "}
                                        MB
                                    </span>
                                </div>
                                <div className="theme-progress-track h-1.5 w-full overflow-hidden rounded-full shadow-inner">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ease-out ${isRecalculating ? 'animate-pulse' : ''}`}
                                        style={{
                                            width: `${pct}%`,
                                            backgroundColor: color,
                                            boxShadow: `0 0 8px ${color}40`
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={handleRecalculateStorage}
                                className={`theme-nav-item relative group mb-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl transition-all ${isRecalculating ? 'animate-spin-slow' : ''}`}
                            >
                                <svg
                                    width="44"
                                    height="44"
                                    viewBox="0 0 44 44"
                                    className="-rotate-90"
                                >
                                    <circle
                                        cx="22"
                                        cy="22"
                                        r="18"
                                        fill="none"
                                        stroke="var(--theme-border-subtle)"
                                        strokeWidth="3"
                                    />
                                    <circle
                                        cx="22"
                                        cy="22"
                                        r="18"
                                        fill="none"
                                        stroke={color}
                                        strokeWidth="3"
                                        strokeDasharray={`${2 * Math.PI * 18}`}
                                        strokeDashoffset={`${2 * Math.PI * 18 * (1 - pct / 100)}`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className="theme-text-secondary absolute text-[8px] font-black">
                                    {Math.round(pct)}%
                                </span>
                                <span className="nav-tooltip">
                                    {usedMb} / {user.tenant.storage_limit} MB
                                </span>
                            </div>
                        );
                    })()}

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className={`relative group flex items-center gap-3 rounded-xl transition-all text-[#9097A6] hover:bg-[#E5E9F0] dark:hover:bg-white/10 hover:text-[#1A1A2E] dark:hover:text-white
                        ${expanded ? "px-3 py-2.5 w-full" : "w-11 h-11 mx-auto justify-center"}`}
                >
                    {theme === "dark" ? (
                        <Sun size={18} strokeWidth={1.8} className="shrink-0" />
                    ) : (
                        <Moon
                            size={18}
                            strokeWidth={1.8}
                            className="shrink-0"
                        />
                    )}
                    {expanded && (
                        <span className="text-sm font-semibold text-[#1A1A2E] dark:text-white">
                            {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
                        </span>
                    )}
                    {!expanded && (
                        <span className="nav-tooltip">
                            {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
                        </span>
                    )}
                </button>

                {/* Profile */}
                <NavLink
                    to="/profile"
                    onClick={() => isMobile && setMobileOpen(false)}
                    className={`relative group flex items-center gap-3 rounded-xl transition-all
                        ${expanded ? "px-3 py-2.5 w-full" : "w-11 h-11 mx-auto justify-center"}
                        ${location.pathname === "/profile"
                            ? "bg-[#1A1A2E] dark:bg-white text-white dark:text-[#1A1A2E] shadow-md"
                            : "text-[#9097A6] hover:bg-[#E5E9F0] dark:hover:bg-white/10 hover:text-[#1A1A2E] dark:hover:text-white"
                        }`}
                >
                    <User size={18} strokeWidth={1.8} className="shrink-0" />
                    {expanded && (
                        <span
                            className={`text-sm font-semibold ${location.pathname === "/profile" ? "text-white dark:text-[#1A1A2E]" : "text-[#1A1A2E] dark:text-white"}`}
                        >
                            Profilim
                        </span>
                    )}
                    {!expanded && <span className="nav-tooltip">Profilim</span>}
                </NavLink>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className={`relative group flex items-center gap-3 rounded-xl transition-all text-[#9097A6] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500
                        ${expanded ? "px-3 py-2.5 w-full" : "w-11 h-11 mx-auto justify-center"}`}
                >
                    <div
                        className={`w-7 h-7 rounded-full bg-[#E5E9F0] dark:bg-white/10 flex items-center justify-center text-xs font-black text-[#1A1A2E] dark:text-white shrink-0 group-hover:bg-red-100 group-hover:text-red-500 transition-all`}
                    >
                        <LogOutIcon size={14} />
                    </div>
                    {expanded && (
                        <div className="flex-1 text-left min-w-0">
                            <div className="text-sm font-semibold text-[#1A1A2E] dark:text-white truncate group-hover:text-red-500 transition-colors">
                                {user?.name}
                            </div>
                            <div className="text-[10px] text-[#9097A6] group-hover:text-red-400 transition-colors">
                                Çıkış Yap
                            </div>
                        </div>
                    )}
                    {!expanded && (
                        <span className="nav-tooltip">
                            {user?.name} — Çıkış Yap
                        </span>
                    )}
                </button>

                {/* Expand toggle (collapsed state) */}
                {!expanded && !isMobile && (
                    <button
                        onClick={toggleExpanded}
                        className="relative group w-11 h-11 mx-auto flex items-center justify-center rounded-xl text-[#9097A6] hover:bg-[#E5E9F0] dark:hover:bg-white/10 hover:text-[#1A1A2E] dark:hover:text-white transition-all mt-1"
                        title="Genişlet"
                    >
                        <ChevronRight size={16} />
                        <span className="nav-tooltip">Genişlet</span>
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="theme-app-shell flex h-screen overflow-hidden">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar — Desktop */}
            <aside
                className="theme-sidebar-surface hidden shrink-0 flex-col overflow-visible border-r z-30 transition-all duration-300 lg:flex"
                style={{ width: expanded ? "240px" : "80px" }}
            >
                {buildSidebarContent(false)}
            </aside>

            {/* Sidebar — Mobile (overlay, always expanded) */}
            <aside
                className={`
                lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-60
                theme-sidebar-surface border-r
                transform transition-transform duration-300 ease-in-out
                ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
            `}
            >
                <button
                    onClick={() => setMobileOpen(false)}
                    className="theme-icon-button absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-all"
                >
                    <X size={14} />
                </button>
                {/* Mobile sidebar always shows expanded layout */}
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="theme-divider flex h-17.5 shrink-0 items-center border-b px-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#905EFC] to-[#6B3FD4] text-base font-black text-white shadow-lg shadow-[#905EFC]/30 select-none">
                                V
                            </div>
                            <span className="theme-text-primary text-base font-black tracking-widest uppercase">
                                Vistore
                            </span>
                        </div>
                    </div>
                    <nav className="flex-1 flex flex-col gap-0.5 py-3 px-3 overflow-y-auto">
                        {navItems
                            .filter((i) => hasPermission(i.permission))
                            .map((item) => {
                                const IconComp = item.icon;
                                const isActive =
                                    location.pathname === item.to ||
                                    (item.to !== "/dashboard" &&
                                        location.pathname.startsWith(item.to));
                                return (
                                    <LinkComponent
                                        key={item.to}
                                        {...(!isRestoring ? { to: item.to } : {})}
                                        onClick={() => !isRestoring && setMobileOpen(false)}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${isActive && !isRestoring ? "theme-nav-item-active shadow-md" : "theme-nav-item"} ${isRestoring ? "cursor-not-allowed opacity-70 pointer-events-none" : ""}`}
                                    >
                                        <IconComp
                                            size={18}
                                            strokeWidth={isActive && !isRestoring ? 2.5 : 1.8}
                                            className="shrink-0"
                                        />
                                        <span className={`text-sm font-semibold ${isActive && !isRestoring ? "theme-nav-label-active" : "theme-nav-label"}`}>
                                            {item.label}
                                        </span>
                                    </LinkComponent>
                                );
                            })}
                    </nav>
                    <div className="theme-divider flex flex-col gap-0.5 border-t px-3 pb-4 pt-3">
                        <button
                            onClick={toggleTheme}
                            className="theme-nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
                        >
                            {theme === "dark" ? (
                                <Sun size={18} strokeWidth={1.8} />
                            ) : (
                                <Moon size={18} strokeWidth={1.8} />
                            )}
                            <span className="theme-nav-label text-sm font-semibold">
                                {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
                            </span>
                        </button>
                        <NavLink
                            to="/profile"
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${location.pathname === "/profile" ? "theme-nav-item-active" : "theme-nav-item"}`}
                        >
                            <User size={18} strokeWidth={1.8} />
                            <span className={`text-sm font-semibold ${location.pathname === "/profile" ? "theme-nav-label-active" : "theme-nav-label"}`}>
                                Profilim
                            </span>
                        </NavLink>
                        <button
                            onClick={handleLogout}
                            className="theme-nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500"
                        >
                            <div className="theme-muted-badge theme-text-primary flex h-7 w-7 items-center justify-center rounded-full text-xs font-black">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="theme-text-primary text-sm font-semibold">
                                    {user?.name}
                                </div>
                                <div className="theme-text-secondary text-[10px]">
                                    Çıkış Yap
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="theme-header-surface theme-divider sticky top-0 z-30 flex h-17.5 shrink-0 items-center gap-4 border-b px-5 lg:px-7">
                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="theme-icon-button lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all"
                    >
                        <Menu size={18} />
                    </button>

                    {/* Search */}
                    <div className="flex-1 max-w-sm hidden md:block">
                        {!isRestoring && <GlobalSearch />}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Date */}
                    <span className="theme-text-secondary select-none text-sm font-semibold">
                        {todayStr}
                    </span>

                    {/* Bell */}
                    <button className="theme-icon-button theme-divider relative flex h-9 w-9 items-center justify-center rounded-full border transition-all hover:text-[#905EFC] hover:border-[#905EFC]/30">
                        <Bell size={16} strokeWidth={1.8} />
                    </button>

                    {/* User info */}
                    <div className="theme-divider flex items-center gap-2.5 border-l pl-3">
                        <div className="text-right hidden sm:block">
                            <div className="theme-text-primary text-sm font-bold leading-tight">
                                {user?.name}
                            </div>
                            <div className="theme-text-secondary text-[11px] font-medium">
                                {user?.role === "ADMIN"
                                    ? "Yönetici"
                                    : "Kullanıcı"}
                            </div>
                        </div>
                        <div className="theme-nav-item-active flex h-9 w-9 items-center justify-center rounded-full text-sm font-black select-none shadow-sm">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Subscription warning banner */}
                {user?.tenant &&
                    user.tenant.id &&
                    !user.tenant.is_subscribed &&
                    !user.tenant.on_trial &&
                    !user.tenant.is_gifted &&
                    !user.tenant.is_free && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 px-6 py-3 flex flex-wrap items-center justify-between gap-3 z-20">
                            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                                <AlertCircle size={18} className="shrink-0" />
                                <span className="text-sm font-medium">
                                    Abonelik süreniz dolmuştur. Yeni işlem
                                    yapabilmek için abone olmanız gerekmektedir.
                                </span>
                            </div>
                            <button
                                onClick={() =>
                                    navigate("/settings/subscription")
                                }
                                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm whitespace-nowrap"
                            >
                                Şimdi Abone Ol
                            </button>
                        </div>
                    )}

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-5 lg:p-8">
                        {isRestoring ? children : <Outlet />}
                    </div>
                </main>
            </div>
        </div>
    );
}
