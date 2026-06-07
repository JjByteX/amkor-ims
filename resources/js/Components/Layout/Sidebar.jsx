import { useState, useEffect, useRef } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import {
    PanelLeftClose, PanelLeftOpen,
    LayoutDashboard,
    BookOpen, FileSearch, Globe,
    TrendingUp,
    CreditCard, DollarSign, Wallet, ShieldCheck, Receipt, Banknote, FileText,
    Users, Clock, Megaphone,
    Bell, BookUser,
    Sun, Moon, LogOut,
} from 'lucide-react';
import NavItem from './NavItem';

/* ─────────────────────────────────────────────────────────────────────────────
   Nav structure definition
   Each entry: { key, href, icon, label, roles: string[] | 'all' }
   ───────────────────────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
    {
        key  : 'dashboard',
        href : '/dashboard',
        icon : <LayoutDashboard size={20} />,
        label: 'Dashboard',
        roles: 'all',
    },
    {
        key  : 'reservation',
        href : '/reservation',
        icon : <BookOpen size={20} />,
        label: 'Reservation & Booking',
        roles: ['general_manager', 'resa_officer', 'ormoc_branch_officer', 'accounting_officer', 'admin_auditor', 'chief_operations_officer', 'general_sales_manager'],
    },
    {
        key  : 'reservation-sales',
        href : '/reservation-sales',
        icon : <TrendingUp size={20} />,
        label: 'RESA Sales Report',
        roles: ['general_manager', 'resa_officer', 'ormoc_branch_officer', 'accounting_officer', 'admin_auditor', 'chief_operations_officer', 'general_sales_manager'],
    },
    {
        key  : 'visa',
        href : '/visa',
        icon : <FileSearch size={20} />,
        label: 'Visa & Documentation',
        roles: ['general_manager', 'visa_documentation_officer', 'disbursement_officer', 'admin_auditor'],
    },
    {
        key  : 'ormoc',
        href : '/ormoc',
        icon : <Globe size={20} />,
        label: 'Ormoc Branch',
        roles: ['general_manager', 'ormoc_branch_officer'],
    },
    {
        key  : 'sales',
        href : '/sales',
        icon : <TrendingUp size={20} />,
        label: 'Sales Summary',
        roles: ['general_manager', 'chief_operations_officer', 'general_sales_manager', 'accounting_officer', 'admin_auditor', 'resa_officer', 'ormoc_branch_officer', 'visa_documentation_officer'],
    },
    {
        key  : 'ar',
        href : '/ar',
        icon : <Receipt size={20} />,
        label: 'Accounts Receivable',
        roles: ['general_manager', 'chief_operations_officer', 'general_sales_manager', 'accounting_officer', 'admin_auditor', 'resa_officer', 'ormoc_branch_officer', 'visa_documentation_officer'],
    },
    {
        key  : 'payables',
        href : '/payables',
        icon : <DollarSign size={20} />,
        label: 'Accounts Payable',
        roles: ['general_manager', 'accounting_officer', 'disbursement_officer', 'admin_auditor'],
    },
    {
        key  : 'disbursement',
        href : '/disbursement',
        icon : <Wallet size={20} />,
        label: 'Disbursement Ledger',
        roles: ['general_manager', 'disbursement_officer', 'admin_auditor'],
    },
    {
        key  : 'cashbond',
        href : '/cashbond',
        icon : <ShieldCheck size={20} />,
        label: 'Cashbond Monitoring',
        roles: ['general_manager', 'disbursement_officer', 'admin_auditor'],
    },
    {
        key  : 'bills',
        href : '/bills',
        icon : <FileText size={20} />,
        label: 'Bills & On-Ques',
        roles: ['general_manager', 'hr_admin_officer', 'disbursement_officer', 'admin_auditor'],
    },
    {
        key  : 'creditcard',
        href : '/credit-cards',
        icon : <CreditCard size={20} />,
        label: 'Credit Cards',
        roles: ['general_manager', 'hr_admin_officer', 'disbursement_officer', 'admin_auditor'],
    },
    {
        key  : 'iata',
        href : '/iata',
        icon : <Banknote size={20} />,
        label: 'IATA Payments',
        roles: ['general_manager', 'disbursement_officer', 'admin_auditor'],
    },
    {
        key  : 'bir',
        href : '/bir',
        icon : <FileText size={20} />,
        label: 'BIR / Compliance',
        roles: ['general_manager', 'disbursement_officer', 'accounting_officer', 'admin_auditor'],
    },
    {
        key  : 'hr',
        href : '/hr',
        icon : <Users size={20} />,
        label: 'HR & Records',
        roles: ['general_manager', 'hr_admin_officer'],
    },
    {
        key  : 'attendance',
        href : '/attendance',
        icon : <Clock size={20} />,
        label: 'Attendance',
        roles: ['general_manager', 'hr_admin_officer', 'resa_officer', 'ormoc_branch_officer', 'visa_documentation_officer', 'accounting_officer', 'disbursement_officer', 'admin_auditor', 'liaison_officer', 'marketing_officer'],
    },
    {
        key  : 'marketing',
        href : '/marketing',
        icon : <Megaphone size={20} />,
        label: 'Marketing',
        roles: ['general_manager', 'chief_operations_officer', 'marketing_officer'],
    },
    {
        key  : 'contacts',
        href : '/contacts',
        icon : <BookUser size={20} />,
        label: 'Contacts',
        roles: 'all',
    },
    {
        key  : 'notifications',
        href : '/notifications',
        icon : <Bell size={20} />,
        label: 'Notifications',
        roles: 'all',
    },
];

/** Map role slugs to human-readable labels */
const ROLE_LABELS = {
    general_manager            : 'General Manager',
    chief_operations_officer   : 'Chief Operations Officer',
    general_sales_manager      : 'General Sales Manager',
    accounting_officer         : 'Accounting Officer',
    disbursement_officer       : 'Disbursement Officer',
    admin_auditor              : 'Admin Auditor',
    hr_admin_officer           : 'HR & Admin Officer',
    liaison_officer            : 'Liaison Officer',
    resa_officer               : 'RESA Officer',
    ormoc_branch_officer       : 'Ormoc Branch Officer',
    visa_documentation_officer : 'Visa & Documentation Officer',
    marketing_officer          : 'Marketing Officer',
};

/* ─────────────────────────────────────────────────────────────────────────────
   Shared inline styles (avoids repetition)
   ───────────────────────────────────────────────────────────────────────────── */
const iconBtnBase = [
    'flex items-center justify-center',
    'w-10 h-10',
    'text-gray-400 hover:text-[var(--color-text)]',
    'hover:bg-black/5 dark:hover:bg-white/6',
    'transition-colors duration-0',  /* instant — no hover animation */
].join(' ');

/* ─────────────────────────────────────────────────────────────────────────────
   Sidebar
   ───────────────────────────────────────────────────────────────────────────── */
export default function Sidebar() {
    const { auth } = usePage().props;
    const user      = auth?.user;
    const role      = user?.role ?? '';
    const roleLabel = ROLE_LABELS[role] ?? role;
    const unreadNotifications = auth?.unread_notifications ?? 0;

    /* ── Collapsed state ─────────────────────────────────────────────────────── */
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem('amkor_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('amkor_sidebar_collapsed', String(collapsed));
        } catch { /* ignore */ }
    }, [collapsed]);

    /* ── Dark mode ───────────────────────────────────────────────────────────── */
    const [dark, setDark] = useState(() => {
        try {
            const stored = localStorage.getItem('amkor_dark_mode');
            if (stored !== null) return stored === 'true';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch {
            return false;
        }
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        try { localStorage.setItem('amkor_dark_mode', String(dark)); } catch { /* ignore */ }
    }, [dark]);

    /* ── Profile menu ────────────────────────────────────────────────────────── */
    const [menuOpen, setMenuOpen]   = useState(false);
    const menuRef                   = useRef(null);
    const triggerRef                = useRef(null);

    useEffect(() => {
        if (!menuOpen) return;
        function handler(e) {
            if (
                menuRef.current    && !menuRef.current.contains(e.target) &&
                triggerRef.current && !triggerRef.current.contains(e.target)
            ) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    /* ── Logout ──────────────────────────────────────────────────────────────── */
    const handleLogout = () => {
        setMenuOpen(false);
        router.post(route('auth.logout'));
    };

    const visibleItems = NAV_ITEMS.filter(
        (item) => item.roles === 'all' || item.roles.includes(role)
    );

    /* ── Shared border style (matches --border-container token) ─────────────── */
    const borderColor = 'var(--color-border)';

    return (
        <aside
            className={[
                'flex flex-col',
                'h-screen sticky top-0',
                'bg-[var(--color-card)]',
                'transition-[width] duration-200 ease-in-out',
                'shrink-0 overflow-visible',   /* overflow-visible so popup isn't clipped */
                'relative',
            ].join(' ')}
            style={{
                width       : collapsed ? 'var(--width-sidebar-collapsed)' : 'var(--width-sidebar)',
                borderRight : 'var(--border-container)',
                boxShadow   : 'var(--shadow-card)',
            }}
        >
            {/* ── Top area: logo row (expanded) OR expand button (collapsed) ──── */}
            <div
                className="flex items-center shrink-0"
                style={{
                    height       : 'var(--height-header)',
                    padding      : '0 var(--space-2)',
                    borderBottom : `1px solid ${borderColor}`,
                }}
            >
                {collapsed ? (
                    /* Collapsed header: only the expand/open button, centred */
                    <div className="flex items-center justify-center w-full">
                        <button
                            onClick={() => setCollapsed(false)}
                            data-tooltip="Expand sidebar"
                            className={iconBtnBase}
                            style={{ borderRadius: 'var(--radius-md)' }}
                        >
                            <PanelLeftOpen size={20} />
                        </button>
                    </div>
                ) : (
                    /* Expanded header: brand left, collapse button right */
                    <>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Brand mark — full-circle intentional (brand identity) */}
                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
                                <span className="text-white text-xs font-bold font-heading">AT</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-heading font-semibold text-[var(--color-text)] truncate leading-tight">
                                    Amkor Travel
                                </p>
                                <p style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: '1.2' }}>
                                    & Tours Inc.
                                </p>
                            </div>
                        </div>

                        {/* Collapse button — top right */}
                        <button
                            onClick={() => setCollapsed(true)}
                            className={iconBtnBase}
                            style={{ borderRadius: 'var(--radius-md)' }}
                            title="Collapse sidebar"
                        >
                            <PanelLeftClose size={20} />
                        </button>
                    </>
                )}
            </div>

            {/* ── Nav ─────────────────────────────────────────────────────────── */}
            <nav
                className="flex-1 overflow-y-auto overflow-x-hidden"
                style={{ padding: 'var(--space-1) var(--space-2)' }}
            >
                <ul className={`flex flex-col gap-0.5 ${collapsed ? 'items-center' : ''}`}>
                    {visibleItems.map((item) => (
                        <NavItem
                            key={item.key}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                            collapsed={collapsed}
                        />
                    ))}
                </ul>
            </nav>

            {/* ── Account row — pinned bottom ──────────────────────────────────── */}
            <div
                className="shrink-0"
                style={{
                    padding    : 'var(--space-1) var(--space-2)',
                    borderTop  : 'var(--border-container)',
                }}
            >
                {collapsed ? (
                    /* Collapsed account row: Bell on top, avatar below */
                    <div className="flex flex-col items-center gap-1">
                        {/* Notifications bell */}
                        <Link
                            href="/notifications"
                            data-tooltip="Notifications"
                            className={[
                                'relative flex items-center justify-center',
                                'w-10 h-10',
                                'text-gray-400 hover:text-[var(--color-text)]',
                                'hover:bg-black/5 dark:hover:bg-white/6',
                                'transition-colors duration-0',
                            ].join(' ')}
                            style={{ borderRadius: 'var(--radius-md)' }}
                        >
                            <Bell size={20} />
                            {unreadNotifications > 0 && (
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--color-error)]" />
                            )}
                        </Link>

                        {/* Avatar — opens profile menu */}
                        <button
                            ref={triggerRef}
                            onClick={() => setMenuOpen((v) => !v)}
                            data-tooltip={user?.name ?? 'Account'}
                            className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center hover:opacity-85 transition-opacity duration-0"
                        >
                            <span className="text-white text-xs font-bold font-heading">
                                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </span>
                        </button>
                    </div>
                ) : (
                    /* Expanded account row: avatar + name/role + bell */
                    <button
                        ref={triggerRef}
                        onClick={() => setMenuOpen((v) => !v)}
                        className={[
                            'w-full flex items-center',
                            'hover:bg-black/5 dark:hover:bg-white/6',
                            'transition-colors duration-0',
                            'cursor-pointer text-left',
                        ].join(' ')}
                        style={{
                            gap          : 'var(--space-1)',
                            padding      : '6px var(--space-1)',
                            borderRadius : 'var(--radius-md)',
                            minHeight    : '40px',
                        }}
                    >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold font-heading">
                                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </span>
                        </div>

                        {/* Name + role */}
                        <div className="flex-1 min-w-0">
                            <p
                                className="font-semibold font-body text-[var(--color-text)] truncate leading-tight"
                                style={{ fontSize: '13px' }}
                            >
                                {user?.name ?? '—'}
                            </p>
                            <p
                                className="truncate leading-tight"
                                style={{ fontSize: '11px', color: '#9CA3AF' }}
                            >
                                {roleLabel}
                            </p>
                        </div>

                        {/* Notifications bell — separate click target */}
                        <div
                            role="button"
                            tabIndex={0}
                            className={[
                                'relative flex items-center justify-center shrink-0',
                                'w-8 h-8',
                                'text-gray-400 hover:text-[var(--color-text)]',
                                'hover:bg-black/8 dark:hover:bg-white/8',
                                'transition-colors duration-0',
                            ].join(' ')}
                            onClick={(e) => {
                                e.stopPropagation();
                                router.visit('/notifications');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    router.visit('/notifications');
                                }
                            }}
                            style={{ borderRadius: 'var(--radius-md)' }}
                            title="Notifications"
                        >
                            <Bell size={16} />
                            {unreadNotifications > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-error)] px-1 text-[10px] font-bold text-white">
                                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                </span>
                            )}
                        </div>
                    </button>
                )}
            </div>

            {/* ── Profile popup menu ───────────────────────────────────────────── */}
            {menuOpen && (
                <div
                    ref={menuRef}
                    className="absolute bg-[var(--color-card)] z-50"
                    style={{
                        left         : 'var(--space-2)',
                        right        : 'var(--space-2)',
                        bottom       : collapsed ? '106px' : '68px',
                        borderRadius : 'var(--radius-lg)',
                        border       : 'var(--border-container)',
                        boxShadow    : '0 -2px 8px rgba(0,0,0,0.08), var(--shadow-card)',
                        padding      : '4px',
                    }}
                >
                    {/* Dark mode toggle */}
                    <button
                        onClick={() => { setDark((d) => !d); setMenuOpen(false); }}
                        className={[
                            'w-full flex items-center gap-3',
                            'h-9 px-3',
                            'font-body text-[var(--color-text)]',
                            'hover:bg-black/5 dark:hover:bg-white/6',
                            'transition-colors duration-0',
                        ].join(' ')}
                        style={{ fontSize: '13px', borderRadius: 'var(--radius-md)' }}
                    >
                        {dark
                            ? <Sun  size={15} className="shrink-0 text-gray-400" />
                            : <Moon size={15} className="shrink-0 text-gray-400" />
                        }
                        <span>{dark ? 'Light mode' : 'Dark mode'}</span>
                    </button>

                    {/* Divider */}
                    <div style={{ margin: '4px 0', height: '1px', background: borderColor }} />

                    {/* Sign out */}
                    <button
                        onClick={handleLogout}
                        className={[
                            'w-full flex items-center gap-3',
                            'h-9 px-3',
                            'font-body text-[var(--color-error)]',
                            'hover:bg-red-50 dark:hover:bg-red-900/15',
                            'transition-colors duration-0',
                        ].join(' ')}
                        style={{ fontSize: '13px', borderRadius: 'var(--radius-md)' }}
                    >
                        <LogOut size={15} className="shrink-0" />
                        <span>Sign out</span>
                    </button>
                </div>
            )}
        </aside>
    );
}
