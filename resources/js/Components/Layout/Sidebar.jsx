import { useState, useEffect, useRef } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PanelLeftOpen,
    Gauge,
    PlaneTakeoff, FileCheck2, MapPinned, Ticket,
    ChartNoAxesCombined,
    CreditCard, Landmark, WalletCards, ShieldCheck, ReceiptText, Building2, Files,
    UsersRound, CalendarClock, Megaphone,
    Bell, BellDot, ContactRound, ClipboardCheck,
    Sun, Moon, LogOut,
} from 'lucide-react';
import NavItem from './NavItem';
import AmkorLogo from '../UI/AmkorLogo';
import Tooltip from './Tooltip';

/* ─────────────────────────────────────────────────────────────────────────────
   Nav structure definition
   Each section: { key, label, items: [{ key, href, icon, label, roles }] }
   ───────────────────────────────────────────────────────────────────────────── */
const NAV_SECTIONS = [
    {
        key  : 'main',
        label: null,
        items: [
            {
                key  : 'dashboard',
                href : '/dashboard',
                icon : <Gauge size={20} />,
                label: 'Dashboard',
                roles: 'all',
            },
            {
                key  : 'contacts',
                href : '/contacts',
                icon : <ContactRound size={20} />,
                label: 'Contacts',
                roles: 'all',
            },
            {
                key  : 'notifications',
                href : '/notifications',
                icon : <BellDot size={20} />,
                label: 'Notifications',
                roles: 'all',
            },
        ],
    },
    {
        key  : 'operations',
        label: 'Operations',
        items: [
            {
                key       : 'reservation',
                href      : '/reservation',
                icon      : <PlaneTakeoff size={20} />,
                label     : 'Reservation & Booking',
                inactiveOn: ['/reservation/sales-report'],
                roles     : ['general_manager', 'resa_officer', 'ormoc_branch_officer', 'accounting_officer', 'admin_auditor', 'chief_operations_officer', 'general_sales_manager'],
            },
            {
                key  : 'reservation-sales',
                href : '/reservation/sales-report',
                icon : <ChartNoAxesCombined size={20} />,
                label: 'RESA Sales Report',
                roles: ['general_manager', 'chief_operations_officer', 'general_sales_manager', 'accounting_officer', 'admin_auditor', 'resa_officer', 'ormoc_branch_officer'],
            },
            {
                key  : 'airline-rates',
                href : '/airline-rates',
                icon : <Ticket size={20} />,
                label: 'Airline Rates',
                roles: ['general_manager', 'chief_operations_officer', 'general_sales_manager', 'accounting_officer', 'resa_officer', 'ormoc_branch_officer', 'admin_auditor', 'visa_documentation_officer'],
            },
            {
                key  : 'visa',
                href : '/visa',
                icon : <FileCheck2 size={20} />,
                label: 'Visa & Documentation',
                roles: ['general_manager', 'visa_documentation_officer', 'disbursement_officer', 'admin_auditor'],
            },
            {
                key  : 'ormoc',
                href : '/ormoc',
                icon : <MapPinned size={20} />,
                label: 'Ormoc Branch',
                roles: ['general_manager', 'ormoc_branch_officer'],
            },
            {
                key  : 'sales',
                href : '/sales',
                icon : <ChartNoAxesCombined size={20} />,
                label: 'Sales Summary',
                roles: ['general_manager', 'chief_operations_officer', 'general_sales_manager', 'accounting_officer', 'admin_auditor', 'resa_officer', 'ormoc_branch_officer', 'visa_documentation_officer'],
            },
        ],
    },
    {
        key  : 'finance',
        label: 'Finance',
        items: [
            {
                key  : 'ar',
                href : '/ar',
                icon : <ReceiptText size={20} />,
                label: 'Accounts Receivable',
                roles: ['general_manager', 'chief_operations_officer', 'general_sales_manager', 'accounting_officer', 'admin_auditor', 'resa_officer', 'ormoc_branch_officer', 'visa_documentation_officer'],
            },
            {
                key  : 'payables',
                href : '/payables',
                icon : <Landmark size={20} />,
                label: 'Accounts Payable',
                roles: ['general_manager', 'accounting_officer', 'disbursement_officer', 'admin_auditor'],
            },
            {
                key  : 'disbursement',
                href : '/disbursement',
                icon : <WalletCards size={20} />,
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
                icon : <Files size={20} />,
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
                icon : <Building2 size={20} />,
                label: 'IATA Payments',
                roles: ['general_manager', 'disbursement_officer', 'admin_auditor'],
            },
            {
                key  : 'bir',
                href : '/bir',
                icon : <ClipboardCheck size={20} />,
                label: 'BIR / Compliance',
                roles: ['general_manager', 'disbursement_officer', 'accounting_officer', 'admin_auditor'],
            },
        ],
    },
    {
        key  : 'admin',
        label: 'Admin',
        items: [
            {
                key  : 'hr',
                href : '/hr',
                icon : <UsersRound size={20} />,
                label: 'HR & Records',
                inactiveOn: ['/hr/attendance'],
                roles: ['general_manager', 'hr_admin_officer'],
            },
            {
                key  : 'attendance',
                href : '/attendance',
                activeOn: ['/hr/attendance'],
                icon : <CalendarClock size={20} />,
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
        ],
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
   Animation constants — single place to tune timing for the whole sidebar.
   ───────────────────────────────────────────────────────────────────────────── */
const SIDEBAR_DURATION = 0.22;          // width transition duration (seconds)
const SIDEBAR_EASE     = [0.4, 0, 0.2, 1]; // standard ease-in-out

// Text/label fade — slightly shorter than the width so labels vanish before
// the sidebar fully closes (avoids text wrapping during collapse).
const LABEL_EXIT_DURATION  = 0.10;
const LABEL_ENTER_DURATION = 0.16;
const LABEL_ENTER_DELAY    = 0.12;     // wait for sidebar to mostly open

/* ─────────────────────────────────────────────────────────────────────────────
   ProfileMenu — portal-rendered popup that escapes the sidebar clip context.
   ───────────────────────────────────────────────────────────────────────────── */
function ProfileMenu({ triggerRef, onClose, dark, onToggleDark, onLogout, borderColor }) {
    const menuRef = useRef(null);
    const [style, setStyle] = useState({});

    useEffect(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const MENU_WIDTH = 216;
        setStyle({
            position    : 'fixed',
            left        : rect.left,
            width       : MENU_WIDTH,
            bottom      : window.innerHeight - rect.top + 8,
            zIndex      : 99999,
        });
    }, [triggerRef]);

    // Close on outside click
    useEffect(() => {
        function handler(e) {
            if (
                menuRef.current    && !menuRef.current.contains(e.target) &&
                triggerRef.current && !triggerRef.current.contains(e.target)
            ) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose, triggerRef]);

    return createPortal(
        <div
            ref={menuRef}
            className="bg-[var(--color-card)]"
            style={{
                ...style,
                borderRadius : 'var(--radius-lg)',
                border       : 'var(--border-container)',
                boxShadow    : '0 18px 48px -28px rgba(15,23,42,0.32), var(--shadow-card)',
                padding      : '6px',
            }}
        >
            {/* Dark mode toggle */}
            <button
                onClick={() => { onToggleDark(); onClose(); }}
                className={[
                    'w-full flex items-center gap-3',
                    'h-10 px-3',
                    'font-body text-[var(--color-text)]',
                    'hover:bg-black/5 dark:hover:bg-white/6',
                    'transition-colors duration-0',
                ].join(' ')}
                style={{ fontSize: '13px', borderRadius: 'var(--radius-md)', fontWeight: 500 }}
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
                onClick={onLogout}
                className={[
                    'w-full flex items-center gap-3',
                    'h-10 px-3',
                    'font-body text-[var(--color-error)]',
                    'hover:bg-red-50 dark:hover:bg-red-900/15',
                    'transition-colors duration-0',
                ].join(' ')}
                style={{ fontSize: '13px', borderRadius: 'var(--radius-md)', fontWeight: 500 }}
            >
                <LogOut size={15} className="shrink-0" />
                <span>Sign out</span>
            </button>
        </div>,
        document.body
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SidebarLabel — animated text wrapper used for section headers and the
   expanded account row. Fades + clips horizontally; never moves the icon.
   ───────────────────────────────────────────────────────────────────────────── */
function SidebarLabel({ children, className, style: extraStyle }) {
    return (
        <motion.span
            className={className}
            style={{ overflow: 'hidden', whiteSpace: 'nowrap', display: 'block', ...extraStyle }}
            initial={false}
            animate={{ opacity: 1, width: 'auto', transition: { duration: LABEL_ENTER_DURATION, delay: LABEL_ENTER_DELAY, ease: SIDEBAR_EASE } }}
            exit={{ opacity: 0, width: 0, transition: { duration: LABEL_EXIT_DURATION, ease: 'easeIn' } }}
        >
            {children}
        </motion.span>
    );
}

/* AmkorLogo is imported from Components/UI/AmkorLogo.jsx */


export default function Sidebar({ dark = false, onToggleDark }) {
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


    /* ── Profile menu ────────────────────────────────────────────────────────── */
    const [menuOpen, setMenuOpen] = useState(false);
    const triggerRef              = useRef(null);

    /* ── Avatar tooltip ──────────────────────────────────────────────────────── */
    const [avatarTip, setAvatarTip] = useState(false);

    /* ── Logout ──────────────────────────────────────────────────────────────── */
    const handleLogout = () => {
        setMenuOpen(false);
        router.post(route('auth.logout'));
    };

    const navSections = NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(
            (item) => item.roles === 'all' || item.roles.includes(role)
        ),
    })).filter((section) => section.items.length > 0);

    /* ── Border color for ProfileMenu's internal divider ────────────────────── */
    const borderColor = 'var(--color-border)';

    return (
        <motion.aside
            className={[
                'flex flex-col',
                'h-screen sticky top-0',
                'bg-[var(--color-card)]',
                'shrink-0 overflow-visible',
                'relative',
            ].join(' ')}
            initial={false}
            animate={{ width: collapsed ? 'var(--width-sidebar-collapsed)' : 'var(--width-sidebar)' }}
            transition={{ duration: SIDEBAR_DURATION, ease: SIDEBAR_EASE }}
            style={{
                borderRight : 'var(--border-container)',
                boxShadow   : 'var(--shadow-card)',
            }}
        >
            {/* ── Top area: logo (always visible; hover → expand icon when collapsed) */}
            <div
                className="flex items-center shrink-0"
                style={{
                    height       : 'var(--height-header)',
                    paddingLeft  : '12px',
                    paddingRight : collapsed ? 0 : 'var(--space-1)',
                }}
            >
                {collapsed ? (
                    /* ── COLLAPSED HEADER ──────────────────────────────────────────
                       Left-anchored — the 40px logo box's center lines up with the
                       nav icons' and avatar's center (all at 32px from the sidebar
                       edge), and
                       this position is fixed regardless of sidebar width, so it
                       never recenters during the collapse/expand transition.
                       On hover: logo hides, expand icon appears. */
                    <button
                        onClick={() => setCollapsed(false)}
                        data-tooltip="Expand sidebar"
                        className="sidebar-logo-toggle flex items-center justify-center text-gray-400 hover:text-[var(--color-text)] transition-colors duration-0 shrink-0"
                        style={{ borderRadius: 'var(--radius-md)', width: 40, height: 40 }}
                    >
                        {/* Brand mark — always visible, hidden on hover via CSS */}
                        <span className="sidebar-logo-brand flex items-center justify-center" style={{ width: 40, height: 40, color: 'var(--color-primary)' }}>
                            <AmkorLogo size={40} />
                        </span>
                        {/* Expand icon — hidden by default, shown on hover via CSS */}
                        <span className="sidebar-logo-expand items-center justify-center">
                            <PanelLeftOpen size={20} />
                        </span>
                    </button>
                ) : (
                    /* ── EXPANDED HEADER ───────────────────────────────────────────
                       Brand left, collapse button right. Icon is locked at the same
                       position as the collapsed state; only the text block next to
                       it is animated.                             */
                    <div className="flex items-center w-full">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Logo icon — never animated, never moves */}
                            <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, color: 'var(--color-primary)' }}>
                                <AmkorLogo size={40} />
                            </div>
                            {/* Text block — fades in after sidebar opens */}
                            <AnimatePresence>
                                {!collapsed && (
                                    <SidebarLabel style={{ minWidth: 0 }}>
                                        <p className="text-sm font-heading font-semibold text-[var(--color-text)] truncate leading-tight">
                                            Amkor Travel
                                        </p>
                                        <p style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: '1.2' }}>
                                            & Tours Inc.
                                        </p>
                                    </SidebarLabel>
                                )}
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={() => setCollapsed(true)}
                            className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/6 transition-colors duration-0"
                            style={{ borderRadius: 'var(--radius-md)' }}
                            title="Collapse sidebar"
                        >
                            <PanelLeftOpen size={20} style={{ transform: 'scaleX(-1)' }} />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Nav ─────────────────────────────────────────────────────────── */}
            <nav
                className="flex-1 overflow-y-auto overflow-x-hidden"
                style={{ padding: '0 var(--space-sidebar-x) var(--space-1)' }}
            >
                <ul className="flex flex-col" style={{ gap: 'var(--nav-item-gap)' }}>
                    {navSections.map((section) => (
                        <li key={section.key} className="w-full">
                            <AnimatePresence>
                                {!collapsed && section.label && (
                                    <SidebarLabel
                                        className="pt-3 font-body font-semibold uppercase"
                                        style={{
                                            paddingLeft  : '10px',
                                            color        : 'var(--color-text-muted)',
                                            fontSize     : '11px',
                                            lineHeight   : 1.2,
                                            letterSpacing: 0,
                                        }}
                                    >
                                        {section.label}
                                    </SidebarLabel>
                                )}
                            </AnimatePresence>
                            <motion.ul
                                className="flex flex-col"
                                initial={false}
                                animate={{
                                    marginTop   : collapsed ? 0 : (section.label ? 6 : 0),
                                    marginBottom: collapsed ? 0 : 10,
                                }}
                                transition={{ duration: SIDEBAR_DURATION, ease: SIDEBAR_EASE }}
                                style={{ gap: 'var(--nav-item-gap)' }}
                            >
                                {section.items.map((item) => (
                                    <NavItem
                                        key={item.key}
                                        href={item.href}
                                        activeOn={item.activeOn}
                                        inactiveOn={item.inactiveOn}
                                        icon={item.icon}
                                        label={item.label}
                                        collapsed={collapsed}
                                    />
                                ))}
                            </motion.ul>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* ── Account row — pinned bottom ──────────────────────────────────── */}
            <div
                className="shrink-0"
                style={{
                    padding   : 'var(--space-1) var(--space-sidebar-x)',
                    borderTop : collapsed ? 'none' : 'var(--border-container)',
                }}
            >
                {collapsed ? (
                    /* ── COLLAPSED ACCOUNT ROW ─────────────────────────────────────
                       Avatar (32px) centered in the 64px collapsed rail: 8px
                       container padding + 8px extra inset = 16px left edge,
                       leaving 16px on each side (64 - 32 = 32, halved). Fixed
                       value, same in expanded, so there's no jump between states. */
                    <div className="flex flex-col gap-1 justify-center" style={{ paddingLeft: '8px', minHeight: '44px' }}>
                        <button
                            ref={triggerRef}
                            onClick={() => setMenuOpen((v) => !v)}
                            onMouseEnter={() => setAvatarTip(true)}
                            onMouseLeave={() => setAvatarTip(false)}
                            className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center hover:opacity-85 transition-opacity duration-0 shrink-0"
                        >
                            <span className="text-white text-xs font-bold font-heading">
                                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </span>
                        </button>
                        {avatarTip && !menuOpen && (
                            <Tooltip label={user?.name ?? 'Account'} anchorRef={triggerRef} />
                        )}
                    </div>
                ) : (
                    /* ── EXPANDED ACCOUNT ROW ────────────────────────────────────── */
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
                            padding      : '6px var(--space-1) 6px 8px',
                            borderRadius : 'var(--radius-md)',
                            minHeight    : '44px',
                            border       : '1px solid transparent',
                        }}
                    >
                        {/* Avatar — locked, never animated */}
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold font-heading">
                                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </span>
                        </div>

                        {/* Name + role — fades in after sidebar opens */}
                        <AnimatePresence>
                            {!collapsed && (
                                <SidebarLabel style={{ flex: 1, minWidth: 0 }}>
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
                                </SidebarLabel>
                            )}
                        </AnimatePresence>
                    </button>
                )}
            </div>

            {/* ── Profile popup menu — rendered as a portal ────────────────────── */}
            {menuOpen && (
                <ProfileMenu
                    triggerRef={triggerRef}
                    onClose={() => setMenuOpen(false)}
                    dark={dark}
                    onToggleDark={onToggleDark}
                    onLogout={handleLogout}
                    borderColor={borderColor}
                />
            )}
        </motion.aside>
    );
}
