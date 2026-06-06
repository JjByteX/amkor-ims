import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import {
    Plus, Search, ArrowLeft, ChevronLeft, ChevronRight,
    CheckCircle, DollarSign, Download,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import DataTable from '../../Components/Shared/DataTable';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Modal from '../../Components/UI/Modal';
import Textarea from '../../Components/UI/Textarea';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
];

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const PHP = (n) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n ?? 0);

const STATUS_VARIANT = {
    draft:     'neutral',
    submitted: 'warning',
    approved:  'success',
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = 'var(--color-text)' }) {
    return (
        <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{
                    width: 40, height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Icon size={18} style={{ color }} />
                </div>
                <div>
                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55 }}>
                        {label}
                    </div>
                    <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color }}>
                        {value}
                    </div>
                </div>
            </div>
        </Card>
    );
}

// ── New Expense Form (inline modal) ───────────────────────────────────────────

function ExpenseModal({ open, onClose, categories, currencies }) {
    const today = new Date();
    const { data, setData, post, processing, errors, reset } = useForm({
        campaign_name: '',
        category:      '',
        amount:        '',
        currency:      'PHP',
        expense_date:  today.toISOString().slice(0, 10),
        period_month:  String(today.getMonth() + 1),
        period_year:   String(today.getFullYear()),
        vendor:        '',
        remarks:       '',
    });

    function handleSubmit() {
        post(route('marketing.expenses.store'), {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    const monthOptions = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }));
    const currentYear  = today.getFullYear();
    const yearOptions  = [currentYear - 1, currentYear, currentYear + 1].map((y) => ({ value: String(y), label: String(y) }));
    const catOptions   = [
        { value: '', label: 'Select category…' },
        ...Object.entries(categories).map(([v, l]) => ({ value: v, label: l })),
    ];

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Record Expense"
            size="wide"
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button icon={CheckCircle} loading={processing} onClick={handleSubmit}>
                        Save Expense
                    </Button>
                </div>
            }
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                    <Input
                        label="Campaign Name"
                        value={data.campaign_name}
                        onChange={(e) => setData('campaign_name', e.target.value)}
                        error={errors.campaign_name}
                        placeholder="e.g. Japan Summer 2026"
                    />
                </div>
                <Select
                    label="Category"
                    options={catOptions}
                    value={data.category}
                    onChange={(e) => setData('category', e.target.value)}
                    error={errors.category}
                />
                <Input
                    label="Vendor"
                    value={data.vendor}
                    onChange={(e) => setData('vendor', e.target.value)}
                    error={errors.vendor}
                    placeholder="Optional"
                />
                <Input
                    label="Amount"
                    type="number"
                    value={data.amount}
                    onChange={(e) => setData('amount', e.target.value)}
                    error={errors.amount}
                    placeholder="0.00"
                />
                <Select
                    label="Currency"
                    options={currencies.map((c) => ({ value: c, label: c }))}
                    value={data.currency}
                    onChange={(e) => setData('currency', e.target.value)}
                />
                <Input
                    label="Expense Date"
                    type="date"
                    value={data.expense_date}
                    onChange={(e) => setData('expense_date', e.target.value)}
                    error={errors.expense_date}
                />
                <Select
                    label="Period Month"
                    options={monthOptions}
                    value={data.period_month}
                    onChange={(e) => setData('period_month', e.target.value)}
                    error={errors.period_month}
                />
                <Select
                    label="Period Year"
                    options={yearOptions}
                    value={data.period_year}
                    onChange={(e) => setData('period_year', e.target.value)}
                    error={errors.period_year}
                />
                <div style={{ gridColumn: '1 / -1' }}>
                    <Textarea
                        label="Remarks"
                        value={data.remarks}
                        onChange={(e) => setData('remarks', e.target.value)}
                        rows={2}
                        placeholder="Optional notes"
                        error={null}
                    />
                </div>
            </div>
        </Modal>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MarketingExpenses({
    expenses,
    monthlyTotals,
    yearTotal,
    filters,
    categories,
    statuses,
    currencies,
    canCreate,
    canApprove,
    currentYear,
}) {
    const { flash } = usePage().props;
    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [expenseOpen, setExpenseOpen] = useState(false);
    const year = filters.year ?? currentYear;

    function applyFilter(overrides = {}) {
        router.get(
            route('marketing.expenses'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true }
        );
    }

    function handleSearchKey(e) {
        if (e.key === 'Enter') applyFilter();
    }

    function clearFilters() {
        setSearchInput('');
        router.get(route('marketing.expenses'), { year }, { preserveState: false });
    }

    function goYear(delta) {
        applyFilter({ year: year + delta, page: 1, month: undefined });
    }

    function handleApprove(expense) {
        router.post(route('marketing.expenses.approve', expense.id));
    }

    const hasActiveFilters = filters.search || filters.category || filters.status || filters.month;

    // Monthly breakdown bar
    const maxMonthTotal = Math.max(...Object.values(monthlyTotals).map(Number), 1);

    const columns = [
        {
            key: 'campaign_name',
            label: 'Campaign',
            render: (row) => (
                <div>
                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)' }}>
                        {row.campaign_name}
                    </div>
                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5 }}>
                        {categories[row.category] ?? row.category}
                        {row.vendor ? ` · ${row.vendor}` : ''}
                    </div>
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)' }}>
                    {row.currency !== 'PHP' ? `${row.currency} ` : ''}{PHP(row.amount)}
                </span>
            ),
        },
        {
            key: 'period',
            label: 'Period',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {MONTHS[(row.period_month ?? 1) - 1]} {row.period_year}
                </span>
            ),
        },
        {
            key: 'expense_date',
            label: 'Date',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {fmt(row.expense_date)}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>
                    {statuses[row.status] ?? row.status}
                </Badge>
            ),
        },
        {
            key: 'created_by',
            label: 'By',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>
                    {row.created_by_user?.name ?? '—'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                    {canApprove && row.status === 'draft' && (
                        <Button variant="ghost" size="sm" icon={CheckCircle} onClick={() => handleApprove(row)}>
                            Approve
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

                {/* Flash */}
                {flash?.message && (
                    <div className="font-body" style={{
                        padding: 'var(--space-2)',
                        background: flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-info)',
                        color: '#fff',
                        fontSize: 'var(--font-size-small)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title="Marketing Expenses"
                    subtitle={`${year} · ${PHP(yearTotal)} total`}
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                            <Button variant="ghost" icon={ArrowLeft} onClick={() => router.get(route('marketing.index'))}>
                                Materials
                            </Button>
                            <Button variant="secondary" icon={Download} onClick={() => {}}>
                                Export
                            </Button>
                            {canCreate && (
                                <Button icon={Plus} onClick={() => setExpenseOpen(true)}>
                                    Add Expense
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Year total stat */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-2)' }}>
                    <StatCard icon={DollarSign} label="Year Total" value={PHP(yearTotal)} color="var(--color-primary)" />
                </div>

                {/* Monthly breakdown */}
                <Card>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                Monthly Breakdown — {year}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => goYear(-1)} />
                                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)' }}>
                                    {year}
                                </span>
                                <Button variant="ghost" size="sm" icon={ChevronRight} onClick={() => goYear(1)} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4, alignItems: 'end', height: 80 }}>
                            {MONTHS.map((m, i) => {
                                const val = Number(monthlyTotals[i + 1] ?? 0);
                                const pct = maxMonthTotal > 0 ? (val / maxMonthTotal) * 100 : 0;
                                const isActive = filters.month === String(i + 1);
                                return (
                                    <button
                                        key={m}
                                        title={`${m}: ${PHP(val)}`}
                                        onClick={() => applyFilter({ month: isActive ? undefined : String(i + 1), page: 1 })}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                        }}
                                    >
                                        <div style={{
                                            width: '100%',
                                            height: `${Math.max(pct, 4)}%`,
                                            background: isActive ? 'var(--color-primary)' : (val > 0 ? 'var(--color-primary)' : 'var(--color-bg)'),
                                            opacity: isActive ? 1 : (val > 0 ? 0.45 : 1),
                                            borderRadius: 'var(--radius-md)',
                                            minHeight: 4,
                                            transition: 'opacity 0.1s',
                                        }} />
                                        <span className="font-body" style={{ fontSize: 10, color: 'var(--color-text)', opacity: 0.5 }}>
                                            {m}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </Card>

                {/* Filters */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <Input
                            placeholder="Campaign, vendor…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKey}
                            icon={Search}
                        />
                    </div>
                    <div style={{ minWidth: 180 }}>
                        <Select
                            options={[
                                { value: '', label: 'All Categories' },
                                ...Object.entries(categories).map(([v, l]) => ({ value: v, label: l })),
                            ]}
                            value={filters.category ?? ''}
                            onChange={(e) => applyFilter({ category: e.target.value || undefined, page: 1 })}
                        />
                    </div>
                    <div style={{ minWidth: 160 }}>
                        <Select
                            options={[
                                { value: '', label: 'All Statuses' },
                                ...Object.entries(statuses).map(([v, l]) => ({ value: v, label: l })),
                            ]}
                            value={filters.status ?? ''}
                            onChange={(e) => applyFilter({ status: e.target.value || undefined, page: 1 })}
                        />
                    </div>
                    {hasActiveFilters && (
                        <Button variant="ghost" onClick={clearFilters}>Clear</Button>
                    )}
                </div>

                {/* Table */}
                <DataTable
                    columns={columns}
                    rows={expenses.data ?? []}
                    pagination={expenses}
                    onPageChange={(page) =>
                        router.get(route('marketing.expenses'), { ...filters, search: searchInput, page }, { preserveState: true })
                    }
                />
            </div>

            <ExpenseModal
                open={expenseOpen}
                onClose={() => setExpenseOpen(false)}
                categories={categories}
                currencies={currencies}
            />
        </AppShell>
    );
}
