import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import {
    Plus, Search, ArrowLeft, ChevronLeft, ChevronRight,
    CheckCircle, DollarSign, Download, Pencil,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import SharedStatCard from '../../Components/Shared/StatCard';
import StatGrid from '../../Components/Shared/StatGrid';
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

// ── New/Edit Expense Form (inline modal) ──────────────────────────────────────

function ExpenseModal({ open, onClose, categories, currencies, platforms, expense = null }) {
    const isEdit = !!expense;
    const today = new Date();
    const { data, setData, post, put, processing, errors, reset } = useForm({
        campaign_name:  expense?.campaign_name  ?? '',
        category:       expense?.category       ?? '',
        platform:       expense?.platform       ?? '',
        amount:         expense?.amount         ?? '',
        budget:         expense?.budget         ?? '',
        currency:       expense?.currency       ?? 'PHP',
        expense_date:   expense?.expense_date?.substring(0, 10) ?? today.toISOString().slice(0, 10),
        vendor:         expense?.vendor         ?? '',
        payee:          expense?.payee          ?? '',
        invoice_number: expense?.invoice_number ?? '',
        voucher_number: expense?.voucher_number ?? '',
        remarks:        expense?.remarks        ?? '',
    });

    function handleSubmit() {
        if (isEdit) {
            put(route('marketing.expenses.update', expense.id), {
                onSuccess: () => { onClose(); },
            });
        } else {
            post(route('marketing.expenses.store'), {
                onSuccess: () => { reset(); onClose(); },
            });
        }
    }

    const catOptions = [
        { value: '', label: 'Select category…' },
        ...Object.entries(categories).map(([v, l]) => ({ value: v, label: l })),
    ];

    const platformOptions = [
        { value: '', label: 'N/A' },
        ...Object.entries(platforms).map(([v, l]) => ({ value: v, label: l })),
    ];

    const showPlatform = data.category === 'paid_ads';

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit Expense' : 'Record Expense'}
            size="wide"
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button icon={CheckCircle} loading={processing} onClick={handleSubmit}>
                        {isEdit ? 'Save Changes' : 'Save Expense'}
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
                {showPlatform ? (
                    <Select
                        label="Platform"
                        options={platformOptions}
                        value={data.platform}
                        onChange={(e) => setData('platform', e.target.value)}
                        error={errors.platform}
                    />
                ) : (
                    <Input
                        label="Vendor"
                        value={data.vendor}
                        onChange={(e) => setData('vendor', e.target.value)}
                        error={errors.vendor}
                        placeholder="Optional"
                    />
                )}
                <Input
                    label="Payee"
                    value={data.payee}
                    onChange={(e) => setData('payee', e.target.value)}
                    error={errors.payee}
                    placeholder="Who received the payment"
                />
                <Input
                    label="Expense Date"
                    type="date"
                    value={data.expense_date}
                    onChange={(e) => setData('expense_date', e.target.value)}
                    error={errors.expense_date}
                />
                <Input
                    label="Amount"
                    type="number"
                    value={data.amount}
                    onChange={(e) => setData('amount', e.target.value)}
                    error={errors.amount}
                    placeholder="0.00"
                />
                <Input
                    label="Budget"
                    type="number"
                    value={data.budget}
                    onChange={(e) => setData('budget', e.target.value)}
                    error={errors.budget}
                    placeholder="0.00 (optional)"
                />
                <Select
                    label="Currency"
                    options={currencies.map((c) => ({ value: c, label: c }))}
                    value={data.currency}
                    onChange={(e) => setData('currency', e.target.value)}
                />
                <Input
                    label="Invoice #"
                    value={data.invoice_number}
                    onChange={(e) => setData('invoice_number', e.target.value)}
                    error={errors.invoice_number}
                    placeholder="Optional"
                />
                <Input
                    label="Voucher #"
                    value={data.voucher_number}
                    onChange={(e) => setData('voucher_number', e.target.value)}
                    error={errors.voucher_number}
                    placeholder="Optional"
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
    platforms,
    canCreate,
    canApprove,
    currentYear,
}) {
    const { flash } = usePage().props;
    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [expenseOpen, setExpenseOpen] = useState(false);
    const [editExpense, setEditExpense] = useState(null);

    function openEdit(expense) { setEditExpense(expense); setExpenseOpen(true); }
    function closeModal()      { setExpenseOpen(false); setEditExpense(null); }
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
            key  : 'amount',
            label: 'Amount',
            align: 'right',
            render: (row) => (
                <span className="font-body tabular-nums" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)', display: 'block', textAlign: 'right' }}>
                    {row.currency === 'PHP' ? '₱' : row.currency === 'USD' ? '$' : row.currency === 'JPY' ? '¥' : row.currency + ' '}
                    {Number(row.amount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    {canCreate && (
                        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => { setEditExpense(row); setExpenseOpen(true); }}>
                            Edit
                        </Button>
                    )}
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
            <PageStack>

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
                            <Button variant="primary" icon={Download} onClick={() => {}}>
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

                <StatGrid>
                    <SharedStatCard icon={DollarSign} label="Year Total" value={PHP(yearTotal)} tone="primary" />
                </StatGrid>

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

                <DataTable
                    columns={columns}
                    rows={expenses.data ?? []}
                    pagination={expenses}
                    onPageChange={(page) =>
                        router.get(route('marketing.expenses'), { ...filters, search: searchInput, page }, { preserveState: true })
                    }
                    toolbar={
                        <FilterStrip>
                            <FilterField grow>
                                <Input
                                    placeholder="Campaign, vendor..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKey}
                                    icon={Search}
                                />
                            </FilterField>
                            <FilterField width={180}>
                                <Select
                                    options={[
                                        { value: '', label: 'All Categories' },
                                        ...Object.entries(categories).map(([v, l]) => ({ value: v, label: l })),
                                    ]}
                                    value={filters.category ?? ''}
                                    onChange={(e) => applyFilter({ category: e.target.value || undefined, page: 1 })}
                                />
                            </FilterField>
                            <FilterField>
                                <Select
                                    options={[
                                        { value: '', label: 'All Statuses' },
                                        ...Object.entries(statuses).map(([v, l]) => ({ value: v, label: l })),
                                    ]}
                                    value={filters.status ?? ''}
                                    onChange={(e) => applyFilter({ status: e.target.value || undefined, page: 1 })}
                                />
                            </FilterField>
                            {hasActiveFilters && (
                                <Button variant="ghost" onClick={clearFilters} style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-container)', color: 'var(--color-text)' }}>Clear</Button>
                            )}
                        </FilterStrip>
                    }
                />
            </PageStack>

            <ExpenseModal
                open={expenseOpen}
                onClose={() => { setExpenseOpen(false); setEditExpense(null); }}
                categories={categories}
                currencies={currencies}
                platforms={platforms}
                expense={editExpense}
            />
        </AppShell>
    );
}
