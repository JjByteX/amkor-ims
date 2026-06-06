import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Badge from '../../Components/UI/Badge';
import Card from '../../Components/UI/Card';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const STATUS_VARIANT = {
    pending: 'warning',
    overdue: 'error',
    paid:    'success',
    filed:   'neutral',
};

const APPROVAL_VARIANT = {
    pending:  'warning',
    checked:  'info',
    approved: 'success',
    released: 'neutral',
};

function SummaryCard({ label, php, usd, jpy }) {
    return (
        <Card>
            <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>
                {label}
            </p>
            <p className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginTop: 4 }}>
                <CurrencyDisplay amount={php} currency="PHP" />
            </p>
            {parseFloat(usd) > 0 && (
                <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.7, marginTop: 2 }}>
                    <CurrencyDisplay amount={usd} currency="USD" />
                </p>
            )}
            {parseFloat(jpy) > 0 && (
                <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.7, marginTop: 2 }}>
                    <CurrencyDisplay amount={jpy} currency="JPY" />
                </p>
            )}
        </Card>
    );
}

export default function APIndex({
    payables, summary, filters,
    statuses, currencies, approvalStatuses,
    canWrite, canCheck, canApprove,
}) {
    const { flash } = usePage().props;

    const [searchInput,  setSearchInput ] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting    ] = useState(false);

    function applyFilter(overrides = {}) {
        router.get(
            route('ap.index'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true },
        );
    }

    function handleSearchKey(e) { if (e.key === 'Enter') applyFilter(); }

    function clearFilters() {
        setSearchInput('');
        router.get(route('ap.index'), {}, { preserveState: false });
    }

    function handleDelete() {
        setDeleting(true);
        router.delete(route('ap.destroy', deleteTarget.id), {
            onFinish: () => { setDeleting(false); setDeleteTarget(null); },
        });
    }

    const columns = [
        {
            key: 'invoice_date', label: 'Invoice Date',
            render: (row) => (
                <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {row.invoice_date
                        ? new Date(row.invoice_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                </span>
            ),
        },
        {
            key: 'supplier_name', label: 'Supplier',
            render: (row) => (
                <div>
                    <p className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', fontWeight: 600 }}>
                        {row.supplier_name}
                    </p>
                    {row.invoice_no && (
                        <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>
                            Inv# {row.invoice_no}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'currency', label: 'Currency',
            render: (row) => (
                <Badge variant={row.currency === 'USD' ? 'info' : row.currency === 'JPY' ? 'warning' : 'neutral'}>
                    {row.currency}
                </Badge>
            ),
        },
        {
            key: 'invoice_amount', label: 'Invoice',
            render: (row) => (
                <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {row.currency === 'USD'
                        ? <CurrencyDisplay amount={row.invoice_amount_usd} currency="USD" />
                        : row.currency === 'JPY'
                        ? <CurrencyDisplay amount={row.invoice_amount_jpy} currency="JPY" />
                        : <CurrencyDisplay amount={row.invoice_amount_php} currency="PHP" />}
                </span>
            ),
        },
        {
            key: 'balance', label: 'Balance',
            render: (row) => (
                <span style={{
                    fontSize: 'var(--font-size-small)',
                    color: row.status === 'overdue' ? 'var(--color-error)' : 'var(--color-text)',
                    fontWeight: row.status === 'overdue' ? 600 : 400,
                }}>
                    {row.currency === 'USD'
                        ? <CurrencyDisplay amount={row.balance_usd} currency="USD" />
                        : row.currency === 'JPY'
                        ? <CurrencyDisplay amount={row.balance_jpy} currency="JPY" />
                        : <CurrencyDisplay amount={row.balance_php} currency="PHP" />}
                </span>
            ),
        },
        {
            key: 'due_date', label: 'Due',
            render: (row) => (
                <span style={{ fontSize: 'var(--font-size-small)', color: row.status === 'overdue' ? 'var(--color-error)' : 'var(--color-text)' }}>
                    {row.due_date
                        ? new Date(row.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
                        : '—'}
                    {row.days_outstanding > 0 && (
                        <span style={{ display: 'block', color: 'var(--color-error)', fontSize: 11 }}>
                            {row.days_outstanding}d overdue
                        </span>
                    )}
                </span>
            ),
        },
        {
            key: 'status', label: 'Status',
            render: (row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>
                        {statuses[row.status] ?? row.status}
                    </Badge>
                    <Badge variant={APPROVAL_VARIANT[row.approval_status] ?? 'neutral'}>
                        {approvalStatuses[row.approval_status] ?? row.approval_status}
                    </Badge>
                </div>
            ),
        },
        {
            key: 'actions', label: '',
            render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={16} />}
                        onClick={() => router.get(route('ap.show', row.id))}
                    >
                        View
                    </Button>
                    {canWrite && row.approval_status === 'pending' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => setDeleteTarget(row)}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: "var(--space-section)" }}>

                <PageHeader
                    title="Accounts Payable"
                    subtitle="Operator payables — PHP, USD, JPY"
                    actions={
                        canWrite && (
                            <Button
                                variant="primary"
                                icon={<Plus size={16} />}
                                onClick={() => router.get(route('ap.create'))}
                            >
                                New Payable
                            </Button>
                        )
                    }
                />

                {flash?.message && (
                    <div style={{
                        padding      : 'var(--space-2)',
                        borderRadius: "var(--radius-md)",
                        background   : flash.type === 'error' ? 'var(--color-error)' : flash.type === 'success' ? 'var(--color-success)' : 'var(--color-info)',
                        color        : '#fff',
                        fontSize     : 'var(--font-size-small)',
                        fontFamily   : 'var(--font-body)',
                    }}>
                        {flash.message}
                    </div>
                )}

                {/* Summary cards */}
                {summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)' }}>
                        <SummaryCard
                            label="Total Invoice"
                            php={summary.total_invoice_php ?? 0}
                            usd={summary.total_invoice_usd ?? 0}
                            jpy={summary.total_invoice_jpy ?? 0}
                        />
                        <SummaryCard
                            label="Total Paid"
                            php={summary.total_paid_php ?? 0}
                            usd={summary.total_paid_usd ?? 0}
                            jpy={summary.total_paid_jpy ?? 0}
                        />
                        <SummaryCard
                            label="Total Balance"
                            php={summary.total_balance_php ?? 0}
                            usd={summary.total_balance_usd ?? 0}
                            jpy={summary.total_balance_jpy ?? 0}
                        />
                        <Card>
                            <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>Total Records</p>
                            <p className="font-heading" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-text)', marginTop: 4 }}>
                                {summary.total_count ?? 0}
                            </p>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 220px' }}>
                        <Input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKey}
                            icon={<Search size={16} />}
                            placeholder="Supplier, invoice#, ACR..."
                        />
                    </div>
                    <div style={{ flex: '0 0 140px' }}>
                        <Select
                            value={filters.status ?? ''}
                            onChange={(e) => applyFilter({ status: e.target.value || undefined })}
                            options={[
                                { value: '', label: 'All Statuses' },
                                ...Object.entries(statuses).map(([v, l]) => ({ value: v, label: l })),
                            ]}
                        />
                    </div>
                    <div style={{ flex: '0 0 120px' }}>
                        <Select
                            value={filters.currency ?? ''}
                            onChange={(e) => applyFilter({ currency: e.target.value || undefined })}
                            options={[
                                { value: '', label: 'All Currencies' },
                                ...Object.entries(currencies).map(([v, l]) => ({ value: v, label: l })),
                            ]}
                        />
                    </div>
                    <div style={{ flex: '0 0 140px' }}>
                        <Input
                            type="month"
                            value={filters.month ?? ''}
                            onChange={(e) => applyFilter({ month: e.target.value || undefined })}
                        />
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
                </div>

                <DataTable
                    columns={columns}
                    rows={payables.data ?? []}
                    pagination={payables}
                    onPageChange={(page) => applyFilter({ page })}
                />

            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Remove Payable"
                description={`Remove payable from ${deleteTarget?.supplier_name}? This cannot be undone.`}
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </AppShell>
    );
}