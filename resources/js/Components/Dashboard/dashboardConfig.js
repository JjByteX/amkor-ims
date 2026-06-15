/**
 * dashboardConfig.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for every role's dashboard.
 *
 * All section keys, card labels, and chart dataKeys are verified against
 * the actual ContributeDashboardSummary listeners in every Module.
 *
 * VERIFIED SECTION MAP (from listeners):
 *   finance    → Payables, Payable balance, BIR records, Net amount due,
 *                IATA payments, Cashbond portals, Credit cards, Bills,
 *                Receivable balance, Disbursed, Vouchers
 *   sales      → Sales MTD, Sales YTD
 *                charts: monthly_by_department, progress_curve, top_performers
 *   operations → Bookings, Confirmed, RESA income, Ormoc bookings, Ormoc sales
 *   visa       → Open applications, Pending, On process, Completed, Embassy payments
 *                charts: status_breakdown, status_by_month, individual_income
 *   marketing  → Total spend, Total budget, Budget variance, Active campaigns,
 *                Pending approvals, Scheduled blasts
 *                charts: budget_vs_spend, pre_post_revenue
 *   people     → Employees, Active employees, Contacts
 *   today      → Present today, Unread notices
 *
 * ROLE → SECTIONS THEY RECEIVE (from listener ->can() guards):
 *   general_manager      → all sections
 *   chief_operations_officer → finance(AR), sales, marketing, operations
 *   general_sales_manager    → finance(AR), sales, operations
 *   accounting_officer       → finance, sales, operations, visa, today
 *   disbursement_officer     → finance, visa, today
 *   admin_auditor            → finance, sales, operations, visa, today
 *   hr_admin_officer         → people, today, finance(bills/cc)
 *   resa_officer             → sales, operations, finance(AR), today
 *   ormoc_branch_officer     → sales, operations, finance(AR)
 *   visa_documentation_officer → visa, finance(AR), today
 *   liaison_officer          → visa, today
 *   marketing_officer        → marketing, today
 *
 * Widget counts per role use clean grid divisors (4 or 6) so auto-fill
 * never leaves trailing whitespace.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const ROLE_CONFIG = {

    /* ── General Manager — 8 widgets (4 cols × 2 rows) ──────────────────── */
    general_manager: {
        label    : 'General Manager',
        attention: ['finance', 'operations'],
        widgets  : [
            // Row 1 — money first
            { section: 'finance',    label: 'Payable balance',   icon: 'BanknoteArrowDown', href: '/payables' },
            { section: 'finance',    label: 'Receivable balance', icon: 'ReceiptText',       href: '/ar' },
            { section: 'sales',      label: 'Sales MTD',          icon: 'ChartSpline',       href: '/sales' },
            { section: 'sales',      label: 'Sales YTD',          icon: 'Target',            href: '/sales' },
            // Row 2 — operational
            { section: 'finance',    label: 'Payables',           icon: 'Landmark',          href: '/payables' },
            { section: 'operations', label: 'Bookings',           icon: 'PlaneTakeoff',      href: '/reservation' },
            { section: 'people',     label: 'Active employees',   icon: 'UsersRound',        href: '/hr' },
            { section: 'today',      label: 'Present today',      icon: 'CalendarClock',     href: '/attendance' },
        ],
        charts: [
            {
                type   : 'bar',
                section: 'sales',
                dataKey: 'monthly_by_department',
                title  : 'Monthly sales by department',
                span   : 'full',
            },
            {
                type   : 'line',
                section: 'sales',
                dataKey: 'progress_curve',
                title  : 'Progress curve — target vs achieved',
                span   : 'full',
            },
            {
                type   : 'bar',
                section: 'sales',
                dataKey: 'top_performers',
                title  : 'Top performers this month',
                span   : 'half',
            },
            {
                type   : 'bar',
                section: 'marketing',
                dataKey: 'budget_vs_spend',
                title  : 'Marketing spend by category',
                span   : 'half',
            },
        ],
    },

    /* ── Chief Operations Officer — 6 widgets (3 cols × 2 rows) ─────────── */
    chief_operations_officer: {
        label    : 'Chief Operations Officer',
        attention: ['finance', 'operations'],
        widgets  : [
            { section: 'sales',      label: 'Sales MTD',          icon: 'ChartSpline',       href: '/sales' },
            { section: 'sales',      label: 'Sales YTD',          icon: 'Target',            href: '/sales' },
            { section: 'finance',    label: 'Receivable balance',  icon: 'ReceiptText',       href: '/ar' },
            { section: 'marketing',  label: 'Active campaigns',    icon: 'Megaphone',         href: '/marketing' },
            { section: 'marketing',  label: 'Total spend',         icon: 'BanknoteArrowDown', href: '/marketing' },
            { section: 'operations', label: 'Bookings',            icon: 'PlaneTakeoff',      href: '/reservation' },
        ],
        charts: [
            {
                type   : 'area',
                section: 'sales',
                dataKey: 'progress_curve',
                title  : 'Sales progress — target vs achieved',
                span   : 'full',
            },
            {
                type   : 'bar',
                section: 'sales',
                dataKey: 'monthly_by_department',
                title  : 'Monthly sales by department',
                span   : 'full',
            },
        ],
    },

    /* ── General Sales Manager — 6 widgets (3 cols × 2 rows) ────────────── */
    general_sales_manager: {
        label    : 'General Sales Manager',
        attention: ['finance', 'operations'],
        widgets  : [
            { section: 'sales',      label: 'Sales MTD',          icon: 'ChartSpline',    href: '/sales' },
            { section: 'sales',      label: 'Sales YTD',          icon: 'Target',         href: '/sales' },
            { section: 'finance',    label: 'Receivable balance',  icon: 'ReceiptText',    href: '/ar' },
            { section: 'operations', label: 'Bookings',            icon: 'PlaneTakeoff',   href: '/reservation' },
            { section: 'operations', label: 'Confirmed',           icon: 'CircleCheckBig', href: '/reservation' },
            { section: 'operations', label: 'RESA income',         icon: 'ChartSpline',    href: '/reservation/sales-report' },
        ],
        charts: [
            {
                type   : 'bar',
                section: 'sales',
                dataKey: 'monthly_by_department',
                title  : 'Monthly sales by department',
                span   : 'full',
            },
            {
                type   : 'bar',
                section: 'sales',
                dataKey: 'top_performers',
                title  : 'Top performers this month',
                span   : 'half',
            },
            {
                type   : 'line',
                section: 'sales',
                dataKey: 'progress_curve',
                title  : 'Progress curve — target vs achieved',
                span   : 'half',
            },
        ],
    },

    /* ── Accounting Officer — 6 widgets (3 cols × 2 rows) ───────────────── */
    accounting_officer: {
        label    : 'Accounting Officer',
        attention: ['finance', 'operations'],
        widgets  : [
            { section: 'finance',    label: 'Payable balance',    icon: 'BanknoteArrowDown', href: '/payables' },
            { section: 'finance',    label: 'Receivable balance',  icon: 'ReceiptText',       href: '/ar' },
            { section: 'finance',    label: 'Payables',            icon: 'Landmark',          href: '/payables' },
            { section: 'sales',      label: 'Sales MTD',           icon: 'ChartSpline',       href: '/sales' },
            { section: 'finance',    label: 'BIR records',         icon: 'ClipboardCheck',    href: '/bir' },
            { section: 'today',      label: 'Present today',       icon: 'CalendarClock',     href: '/attendance' },
        ],
        charts: [
            {
                type   : 'bar',
                section: 'sales',
                dataKey: 'monthly_by_department',
                title  : 'Monthly sales by department',
                span   : 'full',
            },
        ],
    },

    /* ── Disbursement Officer — 6 widgets (3 cols × 2 rows) ─────────────── */
    disbursement_officer: {
        label    : 'Disbursement Officer',
        attention: ['finance'],
        widgets  : [
            { section: 'finance', label: 'Payable balance',  icon: 'BanknoteArrowDown', href: '/payables' },
            { section: 'finance', label: 'Payables',         icon: 'Landmark',          href: '/payables' },
            { section: 'finance', label: 'Bills',            icon: 'Files',             href: '/bills' },
            { section: 'finance', label: 'IATA payments',    icon: 'PlaneTakeoff',      href: '/iata' },
            { section: 'finance', label: 'Credit cards',     icon: 'CreditCard',        href: '/credit-cards' },
            { section: 'finance', label: 'Cashbond portals', icon: 'WalletCards',       href: '/cashbond' },
        ],
        charts: [
            {
                type   : 'donut',
                section: 'visa',
                dataKey: 'status_breakdown',
                title  : 'Visa application status',
                span   : 'half',
            },
            {
                type   : 'bar',
                section: 'visa',
                dataKey: 'individual_income',
                title  : 'Visa income by agent YTD',
                span   : 'half',
            },
        ],
    },

    /* ── Admin Auditor — 8 widgets (4 cols × 2 rows) ─────────────────────── */
    admin_auditor: {
        label    : 'Admin Auditor',
        attention: ['finance', 'operations'],
        widgets  : [
            { section: 'finance',    label: 'Payable balance',    icon: 'BanknoteArrowDown', href: '/payables' },
            { section: 'finance',    label: 'Receivable balance',  icon: 'ReceiptText',       href: '/ar' },
            { section: 'sales',      label: 'Sales MTD',           icon: 'ChartSpline',       href: '/sales' },
            { section: 'operations', label: 'Bookings',            icon: 'PlaneTakeoff',      href: '/reservation' },
            { section: 'finance',    label: 'Payables',            icon: 'Landmark',          href: '/payables' },
            { section: 'visa',       label: 'Open applications',   icon: 'FileCheck2',        href: '/visa' },
            { section: 'today',      label: 'Present today',       icon: 'CalendarClock',     href: '/attendance' },
            { section: 'finance',    label: 'BIR records',         icon: 'ClipboardCheck',    href: '/bir' },
        ],
        charts: [
            {
                type   : 'bar',
                section: 'sales',
                dataKey: 'monthly_by_department',
                title  : 'Monthly sales by department',
                span   : 'full',
            },
        ],
    },

    /* ── HR & Admin Officer — 6 widgets (3 cols × 2 rows) ───────────────── */
    hr_admin_officer: {
        label    : 'HR & Admin Officer',
        attention: ['today', 'people'],
        widgets  : [
            { section: 'today',   label: 'Present today',    icon: 'CalendarClock',  href: '/attendance' },
            { section: 'people',  label: 'Active employees', icon: 'UsersRound',     href: '/hr' },
            { section: 'people',  label: 'Employees',        icon: 'UserRoundCheck', href: '/hr' },
            { section: 'finance', label: 'Bills',            icon: 'Files',          href: '/bills' },
            { section: 'finance', label: 'Credit cards',     icon: 'CreditCard',     href: '/credit-cards' },
            { section: 'today',   label: 'Unread notices',   icon: 'BellDot',        href: '/notifications' },
        ],
        charts: [],
    },

    /* ── RESA Officer — 6 widgets (3 cols × 2 rows) ──────────────────────── */
    resa_officer: {
        label    : 'RESA Officer',
        attention: ['operations'],
        widgets  : [
            { section: 'sales',      label: 'Sales MTD',          icon: 'ChartSpline',    href: '/sales' },
            { section: 'sales',      label: 'Sales YTD',          icon: 'Target',         href: '/sales' },
            { section: 'operations', label: 'Bookings',           icon: 'PlaneTakeoff',   href: '/reservation' },
            { section: 'operations', label: 'Confirmed',          icon: 'CircleCheckBig', href: '/reservation' },
            { section: 'operations', label: 'RESA income',        icon: 'ChartSpline',    href: '/reservation/sales-report' },
            { section: 'finance',    label: 'Receivable balance', icon: 'ReceiptText',    href: '/ar' },
        ],
        charts: [
            {
                type   : 'line',
                section: 'sales',
                dataKey: 'progress_curve',
                title  : 'Progress curve — target vs achieved',
                span   : 'full',
            },
            {
                type   : 'bar',
                section: 'sales',
                dataKey: 'top_performers',
                title  : 'Top performers this month',
                span   : 'half',
            },
        ],
    },

    /* ── Ormoc Branch Officer — 6 widgets (3 cols × 2 rows) ─────────────── */
    ormoc_branch_officer: {
        label    : 'Ormoc Branch Officer',
        attention: ['operations'],
        widgets  : [
            { section: 'sales',      label: 'Sales MTD',          icon: 'ChartSpline',    href: '/sales' },
            { section: 'sales',      label: 'Sales YTD',          icon: 'Target',         href: '/sales' },
            { section: 'operations', label: 'Ormoc bookings',     icon: 'MapPinned',      href: '/ormoc' },
            { section: 'operations', label: 'Ormoc sales',        icon: 'BanknoteArrowUp', href: '/ormoc' },
            { section: 'operations', label: 'Bookings',           icon: 'PlaneTakeoff',   href: '/reservation' },
            { section: 'finance',    label: 'Receivable balance', icon: 'ReceiptText',    href: '/ar' },
        ],
        charts: [
            {
                type   : 'line',
                section: 'sales',
                dataKey: 'progress_curve',
                title  : 'Progress curve — target vs achieved',
                span   : 'full',
            },
            {
                type   : 'bar',
                section: 'sales',
                dataKey: 'monthly_by_department',
                title  : 'Monthly sales by department',
                span   : 'full',
            },
        ],
    },

    /* ── Visa & Documentation Officer — 6 widgets (3 cols × 2 rows) ─────── */
    visa_documentation_officer: {
        label    : 'Visa & Documentation Officer',
        attention: ['visa'],
        widgets  : [
            { section: 'visa',    label: 'Open applications', icon: 'FileCheck2',      href: '/visa' },
            { section: 'visa',    label: 'Pending',           icon: 'FileClock',       href: '/visa' },
            { section: 'visa',    label: 'On process',        icon: 'ClipboardList',   href: '/visa' },
            { section: 'visa',    label: 'Embassy payments',  icon: 'BanknoteArrowUp', href: '/visa' },
            { section: 'visa',    label: 'Completed',         icon: 'CircleCheckBig',  href: '/visa' },
            { section: 'finance', label: 'Receivable balance', icon: 'ReceiptText',    href: '/ar' },
        ],
        charts: [
            {
                type   : 'bar',
                section: 'visa',
                dataKey: 'status_by_month',
                title  : 'Applications by status — monthly',
                span   : 'full',
            },
            {
                type   : 'donut',
                section: 'visa',
                dataKey: 'status_breakdown',
                title  : 'Current application breakdown',
                span   : 'half',
            },
            {
                type   : 'bar',
                section: 'visa',
                dataKey: 'individual_income',
                title  : 'Individual income YTD',
                span   : 'half',
            },
        ],
    },

    /* ── Liaison Officer — 4 widgets (4 cols × 1 row) ────────────────────── */
    liaison_officer: {
        label    : 'Liaison Officer',
        attention: ['visa'],
        widgets  : [
            { section: 'visa',  label: 'Open applications', icon: 'FileCheck2',    href: '/visa' },
            { section: 'visa',  label: 'Pending',           icon: 'FileClock',     href: '/visa' },
            { section: 'visa',  label: 'On process',        icon: 'ClipboardList', href: '/visa' },
            { section: 'today', label: 'Unread notices',    icon: 'BellDot',       href: '/notifications' },
        ],
        charts: [],
    },

    /* ── Marketing Officer — 6 widgets (3 cols × 2 rows) ────────────────── */
    marketing_officer: {
        label    : 'Marketing Officer',
        attention: ['marketing'],
        widgets  : [
            { section: 'marketing', label: 'Total spend',       icon: 'BanknoteArrowDown', href: '/marketing' },
            { section: 'marketing', label: 'Active campaigns',  icon: 'Megaphone',         href: '/marketing' },
            { section: 'marketing', label: 'Pending approvals', icon: 'CircleCheckBig',    href: '/marketing' },
            { section: 'marketing', label: 'Scheduled blasts',  icon: 'Send',              href: '/marketing' },
            { section: 'marketing', label: 'Total budget',      icon: 'Landmark',          href: '/marketing' },
            { section: 'marketing', label: 'Budget variance',   icon: 'Target',            href: '/marketing' },
        ],
        charts: [
            {
                type   : 'bar',
                section: 'marketing',
                dataKey: 'budget_vs_spend',
                title  : 'Spend by category',
                span   : 'full',
            },
            {
                type   : 'bar',
                section: 'marketing',
                dataKey: 'pre_post_revenue',
                title  : 'Monthly spend',
                span   : 'half',
            },
        ],
    },
};

/**
 * getRoleConfig
 * Returns the config for the given role, or a safe default for unknown roles.
 */
export function getRoleConfig(role) {
    return ROLE_CONFIG[role] ?? {
        label    : role?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) ?? 'Staff',
        attention: [],
        widgets  : [],
        charts   : [],
    };
}
