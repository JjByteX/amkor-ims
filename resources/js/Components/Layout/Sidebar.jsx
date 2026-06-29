import { useState, useEffect, useRef } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PanelLeftOpen,
    Gauge,
    PlaneTakeoff, FileCheck2, Ticket, MapPin,
    ChartNoAxesCombined,
    CreditCard, Landmark, WalletCards, ShieldCheck, ReceiptText, Building2, Files,
    UsersRound, CalendarClock, Megaphone,
    Bell, BellDot, ContactRound, ClipboardCheck, UserCheck,
    Sun, Moon, LogOut, ChevronsUpDown,
    CalendarOff, Timer,
} from 'lucide-react';
import NavItem from './NavItem';
import NavGroup from './NavGroup';
import AmkorLogo from '../UI/AmkorLogo';
import Tooltip from './Tooltip';

/* ─────────────────────────────────────────────────────────────────────────────
   Nav structure definition
   Each section: { key, label, items: [{ key, href, icon, label, roles }] }

   Role slugs are sourced from the Roles & Permissions Matrix.
   17 roles total — see AuthDatabaseSeeder for the canonical list.

   Access rules per section mirror the MD file exactly:
     'all'  → every authenticated user sees this item
     array  → only the listed roles see this item

   MERGE NOTE (2026-06-23):
   The standalone "Ormoc Branch" nav item (M2, /ormoc) has been removed.
   branch_supervisor and branch_sales_officer are now included in the
   Reservation & Booking item (M1, /reservation) — same page, branch-scoped.
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
                roles: 'all',   // All roles have contacts.view per M16
            },
            {
                key  : 'notifications',
                href : '/notifications',
                icon : <BellDot size={20} />,
                label: 'Notifications',
                roles: 'all',   // All roles receive own notifications per M17
            },
        ],
    },
    {
        key  : 'operations',
        label: 'Operations',
        items: [
            {
                // M1 — Reservation & Booking (all branches: QC and Ormoc)
                // Branch-scoped automatically by the controller based on role.
                // QC roles see QC bookings; Ormoc roles see Ormoc bookings;
                // all-access roles see everything.
                key  : 'reservation',
                href : '/reservation',
                icon : <PlaneTakeoff size={20} />,
                label: 'Reservation & Booking',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'administrative_assistant',
                    'accounting_assistant',
                    'general_sales_manager',
                    'sales_reservation_officer',
                    'sales_ticketing_officer',
                    'group_sales_officer',
                    'business_development_manager',
                    // Ormoc branch roles — added as part of OrmocBranch merge
                    'branch_supervisor',
                    'branch_sales_officer',
                ],
            },
            {
                // M3 — Visa & Documentation
                key  : 'visa',
                href : '/visa',
                icon : <FileCheck2 size={20} />,
                label: 'Visa & Documentation',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'administrative_assistant',
                    'accounting_assistant',
                    'general_sales_manager',
                    'business_development_manager',
                    'visa_documentation_supervisor',
                    'liaison_officer_visa',
                    'visa_documentation_officer',
                ],
            },
            {
                // Airline Rates — managed by GSM and above; viewed by all RESA + Ormoc roles
                key  : 'airline-rates',
                href : '/airline-rates',
                icon : <Ticket size={20} />,
                label: 'Airline Rates',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'administrative_assistant',
                    'accounting_assistant',
                    'general_sales_manager',
                    'sales_reservation_officer',
                    'sales_ticketing_officer',
                    'group_sales_officer',
                    'branch_supervisor',
                    'branch_sales_officer',
                ],
            },
            {
                // Tour Packages — managed by president/COO/GSM; viewed by all booking + Ormoc roles
                key  : 'tour-packages',
                href : '/tour-packages',
                icon : <MapPin size={20} />,
                label: 'Tour Packages',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'administrative_assistant',
                    'accounting_assistant',
                    'general_sales_manager',
                    'sales_reservation_officer',
                    'sales_ticketing_officer',
                    'group_sales_officer',
                    'branch_supervisor',
                    'branch_sales_officer',
                ],
            },
            {
                // M12 — Sales Summary Report
                key  : 'sales',
                href : '/sales',
                icon : <ChartNoAxesCombined size={20} />,
                label: 'Sales Summary',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'accounting_assistant',
                    'general_sales_manager',
                    'sales_reservation_officer',
                    'sales_ticketing_officer',
                    'group_sales_officer',
                    'business_development_manager',
                    'visa_documentation_supervisor',
                    'visa_documentation_officer',
                    // Only branch supervisor sees Sales Summary — per workflow doc,
                    // individual Ormoc sales officers don't review summary reports.
                    'branch_supervisor',
                ],
            },
        ],
    },
    {
        key  : 'finance',
        label: 'Finance',
        items: [
            {
                // M4 — Accounts Receivable / Collectibles
                key  : 'ar',
                href : '/ar',
                icon : <ReceiptText size={20} />,
                label: 'Accounts Receivable',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'administrative_assistant',
                    'accounting_assistant',
                    'general_sales_manager',
                    'business_development_manager',
                    'sales_reservation_officer',
                    'sales_ticketing_officer',
                    'group_sales_officer',
                    'visa_documentation_supervisor',
                    'branch_supervisor',
                ],
            },
            {
                // M5 — Accounts Payable / Payables to Operators
                key  : 'payables',
                href : '/payables',
                icon : <Landmark size={20} />,
                label: 'Accounts Payable',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'administrative_assistant',
                    'accounting_assistant',
                    'general_sales_manager',
                    'liaison_officer_finance',
                    'liaison_officer_visa',
                    'visa_documentation_supervisor',
                ],
            },
            {
                // M6 — Disbursement
                key  : 'disbursement',
                href : '/disbursement',
                icon : <WalletCards size={20} />,
                label: 'Disbursement',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'administrative_assistant',
                    'accounting_assistant',
                    'liaison_officer_finance',
                ],
            },
            {
                // M8 — Cashbond Monitoring
                key  : 'cashbond',
                href : '/cashbond',
                icon : <ShieldCheck size={20} />,
                label: 'Cashbond Monitoring',
                // Cashbond portals (AirAsia, Jetstar, SupercatB2B, Airswift,
                // Cebuana Lhuillier) are managed and reloaded exclusively by
                // QC Disbursement (Dalle). Ormoc uses the bonds but does not
                // monitor or reload them — per Amkor workflow doc.
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'administrative_assistant',
                    'accounting_assistant',
                    'general_sales_manager',
                    'liaison_officer_finance',
                    'sales_reservation_officer',
                    'sales_ticketing_officer',
                    'group_sales_officer',
                ],
            },
            {
                // M7 — Bills & On-Ques Monitoring
                key  : 'bills',
                href : '/bills',
                icon : <Files size={20} />,
                label: 'Bills & On-Ques',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'administrative_assistant',
                    'accounting_assistant',
                    'liaison_officer_finance',
                ],
            },
            {
                // M9 — Credit Card Monitoring
                key  : 'creditcard',
                href : '/credit-cards',
                icon : <CreditCard size={20} />,
                label: 'Credit Cards',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'administrative_assistant',
                    'accounting_assistant',
                ],
            },
            {
                // M10 — IATA Payments
                key  : 'iata',
                href : '/iata',
                icon : <Building2 size={20} />,
                label: 'IATA Payments',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'administrative_assistant',
                    'accounting_assistant',
                    'general_sales_manager',
                    'liaison_officer_finance',
                ],
            },
            {
                // M11 — BIR / Compliance
                key  : 'bir',
                href : '/bir',
                icon : <ClipboardCheck size={20} />,
                label: 'BIR / Compliance',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'finance_admin_supervisor',
                    'administrative_assistant',
                    'accounting_assistant',
                    'general_sales_manager',
                ],
            },
        ],
    },
    {
        key  : 'admin',
        label: 'Admin',
        items: [
            {
                key     : 'hr-group',
                type    : 'group',
                icon    : <UsersRound size={20} />,
                label   : 'Human Resources',
                roles   : 'all',
                children: [
                    {
                        key     : 'employees',
                        href    : '/hr/employees',
                        icon    : <ContactRound size={16} />,
                        label   : 'Employees',
                        roles: [
                            'president',
                            'chief_operating_officer',
                            'finance_admin_supervisor',
                            'administrative_assistant',
                            // Ormoc branch supervisor (Anjelly) manages 3 direct reports
                            // (Louie, Rhea, Kay) — needs read access to their records
                            // per org chart. Edit/create remains QC HR only.
                            'branch_supervisor',
                        ],
                    },
                    {
                        // Team attendance view — HR/supervisor roles only
                        key       : 'attendance',
                        href      : '/attendance',
                        activeOn  : ['/hr/attendance'],
                        inactiveOn: ['/hr/attendance/me'],
                        icon      : <CalendarClock size={16} />,
                        label     : 'Attendance',
                        roles     : [
                            'president',
                            'chief_operating_officer',
                            'finance_admin_supervisor',
                            'administrative_assistant',
                            'general_sales_manager',
                            'branch_supervisor',
                            'visa_documentation_supervisor',
                            'business_development_manager',
                        ],
                    },
                    {
                        // Personal attendance / self-service — all users
                        key  : 'my-attendance',
                        href : '/hr/attendance/me',
                        icon : <UserCheck size={16} />,
                        label: 'My Attendance',
                        roles: 'all',
                    },
                    {
                        key       : 'leave',
                        href      : '/leave',
                        activeOn  : ['/hr/leave'],
                        inactiveOn: [],
                        icon      : <CalendarOff size={16} />,
                        label     : 'Leave Requests',
                        roles     : 'all',
                    },
                    {
                        key      : 'overtime',
                        href     : '/overtime',
                        activeOn : ['/hr/overtime'],
                        icon     : <Timer size={16} />,
                        label    : 'Overtime',
                        roles    : 'all',
                    },
                ],
            },
            {
                // M13 — Marketing
                key  : 'marketing',
                href : '/marketing',
                icon : <Megaphone size={20} />,
                label: 'Marketing',
                roles: [
                    'president',
                    'chief_operating_officer',
                    'general_sales_manager',
                    'business_development_manager',
                    'sales_marketing_officer',
                    'accounting_assistant',
                    'visa_documentation_supervisor',
                    'visa_documentation_officer',
                    'sales_reservation_officer',
                    'sales_ticketing_officer',
                    'group_sales_officer',
                    'branch_supervisor',
                    'branch_sales_officer',
                ],
            },
        ],
    },
];

/** Map role slugs to human-readable labels (sourced from Roles & Permissions Matrix) */
const ROLE_LABELS = {
    president                    : 'President',
    chief_operating_officer      : 'Chief Operating Officer',
    finance_admin_supervisor     : 'Finance & Admin Supervisor',
    administrative_assistant     : 'Administrative Assistant',
    accounting_assistant         : 'Accounting Assistant',
    liaison_officer_finance      : 'Liaison Officer (Finance)',
    general_sales_manager        : 'General Sales Manager',
    sales_reservation_officer    : 'Sales & Reservation Officer',
    sales_ticketing_officer      : 'Sales & Ticketing Officer',
    group_sales_officer          : 'Group Sales Officer',
    business_development_manager : 'Business Development Manager',
    sales_marketing_officer      : 'Sales & Marketing Officer',
    visa_documentation_supervisor: 'Visa & Documentation Supervisor',
    liaison_officer_visa         : 'Liaison Officer (Visa)',
    visa_documentation_officer   : 'Visa & Documentation Officer',
    branch_supervisor            : 'Branch Supervisor',
    branch_sales_officer         : 'Branch Sales Officer',
};

/* ─────────────────────────────────────────────────────────────────────────────
   Animation constants — single place to tune timing for the whole sidebar.
   ───────────────────────────────────────────────────────────────────────────── */
const SIDEBAR_DURATION = 0.22;
const SIDEBAR_EASE     = [0.4, 0, 0.2, 1];

const LABEL_EXIT_DURATION  = 0.10;
const LABEL_ENTER_DURATION = 0.16;
const LABEL_ENTER_DELAY    = 0.12;

/* ─────────────────────────────────────────────────────────────────────────────
   ProfileMenu — portal-rendered popup that escapes the sidebar clip context.
   ───────────────────────────────────────────────────────────────────────────── */
function ProfileMenu({ triggerRef, onClose, dark, onToggleDark, onLogout, borderColor, activeBranch, branches }) {
    const menuRef = useRef(null);
    const [style, setStyle] = useState({});

    useEffect(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const MENU_WIDTH = 216;
        setStyle({
            position    : 'fixed',
            left        : rect.left + 12,
            width       : MENU_WIDTH,
            bottom      : window.innerHeight - rect.top + 8,
            zIndex      : 99999,
        });
    }, [triggerRef]);

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

    // Gap 8 — branch switcher: only rendered when the server passes `branches`
    // (i.e. the user is one of the four all-access roles).
    const handleBranchChange = (branchId) => {
        router.post(
            route('session.branch'),
            { branch_id: branchId },
            { preserveScroll: true, onSuccess: () => onClose() }
        );
    };

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
            {/* ── Branch switcher — only for all-access roles ──────────────── */}
            {branches && branches.length > 0 && (
                <>
                    <div
                        style={{
                            padding     : '4px 12px 6px 16px',
                            fontSize    : '10px',
                            fontWeight  : 600,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color       : 'var(--color-text-muted)',
                        }}
                    >
                        Active Branch
                    </div>
                    {branches.map((branch) => (
                        <button
                            key={branch.id}
                            onClick={() => handleBranchChange(branch.id)}
                            className={[
                                'w-full flex items-center gap-3',
                                'h-10',
                                'font-body',
                                activeBranch?.id === branch.id
                                    ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft,rgba(var(--color-primary-rgb,99,102,241),0.08))]'
                                    : 'text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/6',
                                'transition-colors duration-0',
                            ].join(' ')}
                            style={{ fontSize: '13px', borderRadius: 'var(--radius-md)', fontWeight: activeBranch?.id === branch.id ? 600 : 500, paddingLeft: '16px', paddingRight: '12px' }}
                        >
                            <ChevronsUpDown size={14} className="shrink-0 text-gray-400" />
                            <span className="truncate">{branch.name}</span>
                            {activeBranch?.id === branch.id && (
                                <span
                                    className="ml-auto shrink-0 rounded-full"
                                    style={{
                                        width     : 6,
                                        height    : 6,
                                        background: 'var(--color-primary)',
                                    }}
                                />
                            )}
                        </button>
                    ))}
                    <div style={{ margin: '4px 0', height: '1px', background: borderColor }} />
                </>
            )}

            <button
                onClick={() => { onToggleDark(); onClose(); }}
                className={[
                    'w-full flex items-center gap-3',
                    'h-10',
                    'font-body text-[var(--color-text)]',
                    'hover:bg-black/5 dark:hover:bg-white/6',
                    'transition-colors duration-0',
                ].join(' ')}
                style={{ fontSize: '13px', borderRadius: 'var(--radius-md)', fontWeight: 500, paddingLeft: '16px', paddingRight: '12px' }}
            >
                {dark
                    ? <Sun  size={15} className="shrink-0 text-gray-400" />
                    : <Moon size={15} className="shrink-0 text-gray-400" />
                }
                <span>{dark ? 'Light mode' : 'Dark mode'}</span>
            </button>

            <div style={{ margin: '4px 0', height: '1px', background: borderColor }} />

            <button
                onClick={onLogout}
                className={[
                    'w-full flex items-center gap-3',
                    'h-10',
                    'font-body text-[var(--color-error)]',
                    'hover:bg-red-50 dark:hover:bg-red-900/15',
                    'transition-colors duration-0',
                ].join(' ')}
                style={{ fontSize: '13px', borderRadius: 'var(--radius-md)', fontWeight: 500, paddingLeft: '16px', paddingRight: '12px' }}
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


export default function Sidebar({ dark = false, onToggleDark }) {
    const { auth, activeBranch, branches } = usePage().props;
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
        items: section.items
            .map((item) => {
                if (item.type === 'group') {
                    const children = item.children.filter(
                        (child) => child.roles === 'all' || child.roles.includes(role)
                    );
                    return { ...item, children };
                }
                return item;
            })
            .filter((item) => {
                if (item.type === 'group') return item.children.length > 0;
                return item.roles === 'all' || item.roles.includes(role);
            }),
    })).filter((section) => section.items.length > 0);

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
            {/* ── Top area: logo */}
            <div
                className="flex items-center shrink-0"
                style={{
                    height       : 'var(--height-header)',
                    paddingLeft  : '12px',
                    paddingRight : collapsed ? 0 : 'var(--space-1)',
                }}
            >
                {collapsed ? (
                    <button
                        onClick={() => setCollapsed(false)}
                        data-tooltip="Expand sidebar"
                        className="sidebar-logo-toggle flex items-center justify-center text-gray-400 hover:text-[var(--color-text)] transition-colors duration-0 shrink-0"
                        style={{ borderRadius: 'var(--radius-md)', width: 40, height: 40 }}
                    >
                        <span className="sidebar-logo-brand flex items-center justify-center" style={{ width: 40, height: 40, color: 'var(--color-primary)' }}>
                            <AmkorLogo size={40} />
                        </span>
                        <span className="sidebar-logo-expand items-center justify-center">
                            <PanelLeftOpen size={20} />
                        </span>
                    </button>
                ) : (
                    <div className="flex items-center w-full">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, color: 'var(--color-primary)' }}>
                                <AmkorLogo size={40} />
                            </div>
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
                                    item.type === 'group' ? (
                                        <NavGroup
                                            key={item.key}
                                            icon={item.icon}
                                            label={item.label}
                                            children={item.children}
                                            collapsed={collapsed}
                                        />
                                    ) : (
                                        <NavItem
                                            key={item.key}
                                            href={item.href}
                                            activeOn={item.activeOn}
                                            inactiveOn={item.inactiveOn}
                                            icon={item.icon}
                                            label={item.label}
                                            collapsed={collapsed}
                                        />
                                    )
                                ))}
                            </motion.ul>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* ── Account row — pinned bottom ──────────────────────────────────── */}
            <div className="shrink-0" style={{ position: 'relative' }}>
                {!collapsed && (
                    <div style={{
                        position  : 'absolute',
                        top       : 0,
                        left      : 0,
                        right     : 0,
                        height    : '1px',
                        background: 'var(--color-border)',
                    }} />
                )}
                <button
                    ref={triggerRef}
                    onClick={() => setMenuOpen((v) => !v)}
                    onMouseEnter={(e) => { setAvatarTip(true); e.currentTarget.style.background = 'var(--color-hover)'; }}
                    onMouseLeave={(e) => { setAvatarTip(false); e.currentTarget.style.background = 'none'; }}
                    className="w-full flex items-center transition-colors duration-0 cursor-pointer text-left"
                    style={{
                        gap          : '10px',
                        paddingLeft  : '18px',
                        paddingRight : '14px',
                        paddingTop   : '10px',
                        paddingBottom: '10px',
                        minHeight    : '52px',
                        border       : 'none',
                        background   : 'none',
                    }}
                >
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold font-heading">
                            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </span>
                    </div>

                    {!collapsed && (
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
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
                                {activeBranch?.name && (
                                    <>
                                        <span style={{ margin: '0 5px' }}>•</span>
                                        {activeBranch.name}
                                    </>
                                )}
                            </p>
                        </div>
                    )}
                </button>
                {avatarTip && !menuOpen && collapsed && (
                    <Tooltip label={user?.name ?? 'Account'} anchorRef={triggerRef} />
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
                    activeBranch={activeBranch}
                    branches={branches}
                />
            )}
        </motion.aside>
    );
}