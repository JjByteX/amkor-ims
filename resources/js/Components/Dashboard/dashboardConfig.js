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
 * ROLE → SECTIONS (sourced from Roles & Permissions Matrix):
 *   president                    → all sections
 *   chief_operating_officer      → finance(AR), sales, marketing, operations, people, today
 *   finance_admin_supervisor     → finance, sales, operations, visa, people, today
 *   administrative_assistant     → finance, sales, operations, visa, today
 *   accounting_assistant         → finance, sales, operations, visa, today
 *   liaison_officer_finance      → finance(payables/bills/cashbond/iata), today
 *   general_sales_manager        → finance(AR), sales, operations, today
 *   sales_reservation_officer    → sales(own), operations(own), finance(AR own), today
 *   sales_ticketing_officer      → sales(own), operations(own+ormoc escalated), finance(AR own), today
 *   group_sales_officer          → sales(own), operations(own), finance(AR own), today
 *   business_development_manager → sales(dept), marketing, today
 *   sales_marketing_officer      → marketing(own), today
 *   visa_documentation_supervisor→ visa, finance(AR dept), sales(dept), today
 *   liaison_officer_visa         → visa(payment tasks), today
 *   visa_documentation_officer   → visa(own), sales(own), today
 *   branch_supervisor            → operations(ormoc), finance(AR ormoc), sales(branch), today
 *   branch_sales_officer         → operations(ormoc own), sales(own), today
 *
 * Widget counts per role use clean grid divisors (4 or 6) so auto-fill
 * never leaves trailing whitespace.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const ROLE_CONFIG = {

    /* ── 1. President — 8 widgets (4 cols × 2 rows) ─────────────────────── */
    president: {
        label    : 'President',
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

    /* ── 2. Chief Operating Officer — 6 widgets (3 cols × 2 rows) ───────── */
    chief_operating_officer: {
        label    : 'Chief Operating Officer',
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

    /* ── 3. Finance & Admin Supervisor — 8 widgets (4 cols × 2 rows) ─────── */
    finance_admin_supervisor: {
        label    : 'Finance & Admin Supervisor',
        attention: ['finance', 'people'],
        widgets  : [
            { section: 'finance',    label: 'Payable balance',    icon: 'BanknoteArrowDown', href: '/payables' },
            { section: 'finance',    label: 'Receivable balance',  icon: 'ReceiptText',       href: '/ar' },
            { section: 'sales',      label: 'Sales MTD',           icon: 'ChartSpline',       href: '/sales' },
            { section: 'people',     label: 'Active employees',    icon: 'UsersRound',        href: '/hr' },
            { section: 'finance',    label: 'BIR records',         icon: 'ClipboardCheck',    href: '/bir' },
            { section: 'finance',    label: 'Payables',            icon: 'Landmark',          href: '/payables' },
            { section: 'today',      label: 'Present today',       icon: 'CalendarClock',     href: '/attendance' },
            { section: 'today',      label: 'Unread notices',      icon: 'BellDot',           href: '/notifications' },
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
                type   : 'donut',
                section: 'visa',
                dataKey: 'status_breakdown',
                title  : 'Visa application status',
                span   : 'half',
            },
        ],
    },

    /* ── 4. Administrative Assistant — 8 widgets (4 cols × 2 rows) ──────── */
    administrative_assistant: {
        label    : 'Administrative Assistant',
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

    /* ── 5. Accounting Assistant — 6 widgets (3 cols × 2 rows) ──────────── */
    accounting_assistant: {
        label    : 'Accounting Assistant',
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

    /* ── 6. Liaison Officer (Finance) — 6 widgets (3 cols × 2 rows) ─────── */
    liaison_officer_finance: {
        label    : 'Liaison Officer (Finance)',
        attention: ['finance'],
        widgets  : [
            { section: 'finance', label: 'Payable balance',  icon: 'BanknoteArrowDown', href: '/payables' },
            { section: 'finance', label: 'Payables',         icon: 'Landmark',          href: '/payables' },
            { section: 'finance', label: 'Bills',            icon: 'Files',             href: '/bills' },
            { section: 'finance', label: 'IATA payments',    icon: 'PlaneTakeoff',      href: '/iata' },
            { section: 'finance', label: 'Credit cards',     icon: 'CreditCard',        href: '/credit-cards' },
            { section: 'finance', label: 'Cashbond portals', icon: 'WalletCards',       href: '/cashbond' },
        ],
        charts: [],
    },

    /* ── 7. General Sales Manager — 6 widgets (3 cols × 2 rows) ─────────── */
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

    /* ── 8. Sales & Reservation Officer — 6 widgets (3 cols × 2 rows) ───── */
    sales_reservation_officer: {
        label    : 'Sales & Reservation Officer',
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

    /* ── 9. Sales & Ticketing Officer (OIC) — 6 widgets (3 cols × 2 rows) ─ */
    sales_ticketing_officer: {
        label    : 'Sales & Ticketing Officer',
        attention: ['operations'],
        widgets  : [
            { section: 'sales',      label: 'Sales MTD',          icon: 'ChartSpline',    href: '/sales' },
            { section: 'sales',      label: 'Sales YTD',          icon: 'Target',         href: '/sales' },
            { section: 'operations', label: 'Bookings',           icon: 'PlaneTakeoff',   href: '/reservation' },
            { section: 'operations', label: 'Ormoc bookings',     icon: 'MapPinned',      href: '/ormoc' },
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
        ],
    },

    /* ── 10. Group Sales Officer — 6 widgets (3 cols × 2 rows) ──────────── */
    group_sales_officer: {
        label    : 'Group Sales Officer',
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
        ],
    },

    /* ── 11. Business Development Manager — 6 widgets (3 cols × 2 rows) ─── */
    business_development_manager: {
        label    : 'Business Development Manager',
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
            {
                type   : 'line',
                section: 'sales',
                dataKey: 'progress_curve',
                title  : 'Sales progress (BD + Visa departments)',
                span   : 'half',
            },
        ],
    },

    /* ── 12. Sales & Marketing Officer — 6 widgets (3 cols × 2 rows) ─────── */
    sales_marketing_officer: {
        label    : 'Sales & Marketing Officer',
        attention: ['marketing'],
        widgets  : [
            { section: 'marketing', label: 'Total spend',       icon: 'BanknoteArrowDown', href: '/marketing' },
            { section: 'marketing', label: 'Active campaigns',  icon: 'Megaphone',         href: '/marketing' },
            { section: 'marketing', label: 'Pending approvals', icon: 'CircleCheckBig',    href: '/marketing' },
            { section: 'marketing', label: 'Scheduled blasts',  icon: 'Send',              href: '/marketing' },
            { section: 'marketing', label: 'Total budget',      icon: 'Landmark',          href: '/marketing' },
            { section: 'today',     label: 'Unread notices',    icon: 'BellDot',           href: '/notifications' },
        ],
        charts: [
            {
                type   : 'bar',
                section: 'marketing',
                dataKey: 'budget_vs_spend',
                title  : 'Spend by category',
                span   : 'full',
            },
        ],
    },

    /* ── 13. Visa & Documentation Supervisor — 6 widgets (3 cols × 2 rows) ─ */
    visa_documentation_supervisor: {
        label    : 'Visa & Documentation Supervisor',
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

    /* ── 14. Liaison Officer (Visa) — 4 widgets (4 cols × 1 row) ─────────── */
    liaison_officer_visa: {
        label    : 'Liaison Officer (Visa)',
        attention: ['visa'],
        widgets  : [
            { section: 'visa',  label: 'Open applications', icon: 'FileCheck2',    href: '/visa' },
            { section: 'visa',  label: 'Pending',           icon: 'FileClock',     href: '/visa' },
            { section: 'visa',  label: 'On process',        icon: 'ClipboardList', href: '/visa' },
            { section: 'today', label: 'Unread notices',    icon: 'BellDot',       href: '/notifications' },
        ],
        charts: [],
    },

    /* ── 15. Visa & Documentation Officer — 6 widgets (3 cols × 2 rows) ──── */
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
        ],
    },

    /* ── 16. Branch Supervisor — 6 widgets (3 cols × 2 rows) ─────────────── */
    branch_supervisor: {
        label    : 'Branch Supervisor',
        attention: ['operations'],
        widgets  : [
            { section: 'sales',      label: 'Sales MTD',          icon: 'ChartSpline',     href: '/sales' },
            { section: 'sales',      label: 'Sales YTD',          icon: 'Target',          href: '/sales' },
            { section: 'operations', label: 'Ormoc bookings',     icon: 'MapPinned',       href: '/ormoc' },
            { section: 'operations', label: 'Ormoc sales',        icon: 'BanknoteArrowUp', href: '/ormoc' },
            { section: 'operations', label: 'Bookings',           icon: 'PlaneTakeoff',    href: '/ormoc' },
            { section: 'finance',    label: 'Receivable balance', icon: 'ReceiptText',     href: '/ar' },
        ],
        charts: [
            {
                type   : 'line',
                section: 'sales',
                dataKey: 'progress_curve',
                title  : 'Progress curve — target vs achieved (Ormoc branch)',
                span   : 'full',
            },
            {
                type   : 'bar',
                section: 'sales',
                dataKey: 'monthly_by_department',
                title  : 'Monthly sales — Ormoc branch',
                span   : 'full',
            },
        ],
    },

    /* ── 17. Branch Sales Officer — 6 widgets (3 cols × 2 rows) ─────────── */
    branch_sales_officer: {
        label    : 'Branch Sales Officer',
        attention: ['operations'],
        widgets  : [
            { section: 'sales',      label: 'Sales MTD',      icon: 'ChartSpline',     href: '/sales' },
            { section: 'sales',      label: 'Sales YTD',      icon: 'Target',          href: '/sales' },
            { section: 'operations', label: 'Ormoc bookings', icon: 'MapPinned',       href: '/ormoc' },
            { section: 'operations', label: 'Ormoc sales',    icon: 'BanknoteArrowUp', href: '/ormoc' },
            { section: 'operations', label: 'Bookings',       icon: 'PlaneTakeoff',    href: '/ormoc' },
            { section: 'today',      label: 'Unread notices', icon: 'BellDot',         href: '/notifications' },
        ],
        charts: [
            {
                type   : 'line',
                section: 'sales',
                dataKey: 'progress_curve',
                title  : 'Progress curve — target vs achieved',
                span   : 'full',
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
