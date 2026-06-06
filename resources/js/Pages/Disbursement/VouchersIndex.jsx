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

const APPROVAL_VARIANT = {
    pending:  'warning',
    checked:  'info',
    approved: 'success',
    released: 'neutral',
};

const TYPE_VARIANT = {
    cash:  'info',
    check: 'neutral',
};

export default function VouchersIndex({
    vouchers, summary, filters,
    types, approvalStatuses,
    canWrite, canCheck, canApprove,
}) {
    const { flash } = usePage().props;

    const [searchInput,  setSearchInput ] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting    ] = useState(false);

    function applyFilter(overrides = {}) {
        router.get(
            route('disbursement.vouchers.index'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true },
        );
    }

    function handleSearchKey(e) { if (e.key === 'Enter') applyFilter(); }

    function clearFilters() {
        setSearchInput('');
        router.get(route('disbursement.vouchers.index'), {}, { preserveState: false });
    }

    function handleDelete() {
        setDeleting(true);
        router.delete(route('disbursement.vouchers.destroy', deleteTarget.id), {
            onFinish: () => { setDeleting(false); setDeleteTarget(null); },
        });
    }

    const columns = [
        {
            key: 'date', label: 'Date',
            render: (row) => (
                <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {row.date
                        ? new Date(row.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                </span>
            ),
        },
        {
            key: 'voucher_no', label: 'Voucher #',
            render: (row) => (
                <span className="font-heading" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {row.voucher_no}
                </span>
            ),
        },
        {
            key: 'type', label: 'Type',
            render: (row) => (
                <Badge variant={TYPE_VARIANT[row.type] ?? 'neutral'}>
                    {types[row.type] ?? row.type}
                </Badge>
            ),
        },
        {
            key: 'payee', label: 'Payee',
            render: (row) => (
                <div>
                    <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', fontWeight: 600 }}>
                        {row.payee}
                    </p>
                    {row.details && (
                        <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>
                            {row.details.length > 60 ? row.details.substring(0, 60) + '…' : row.details}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'amount', label: 'Amount',
            render: (row) => (
                <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    <CurrencyDisplay amount={row.amount ?? 0} currency={row.currency ?? 'PHP'} />
                </span>
            ),
        },
        {
            key: 'approval_status', label: 'Status',
            render: (row) => (
                <Badge variant={APPROVAL_VARIANT[row.approval_status] ?? 'neutral'}>
                    {approvalStatuses[row.approval_status] ?? row.approval_status}
                </Badge>
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
                        onClick={() => router.get(route('disbursement.vouchers.show', row.id))}
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
                    title="Cash &amp; Check Vouchers"
                    subtitle="Disbursement vouchers — approval chain"
                    actions={
                        canWrite && (
                            <Button
                                variant="primary"
                                icon={<Plus size={16} />}
                                onClick={() => router.get(route('disbursement.vouchers.create'))}
                            >
                                New Voucher
                            </Button>
                        )
                    }
                />

                {flash?.message && (
                    <div style={{
                        padding     : 'var(--space-2)',
                        borderRadius: 'var(--radius-md)',
                        background  : flash.type === 'error' ? 'var(--color-error)' : flash.type === 'success' ? 'var(--color-success)' : 'var(--color-info)',
                        color       : '#fff',
                        fontSize    : 'var(--font-size-small)',
                        fontFamily  : 'var(--font-body)',
                    }}>
                        {flash.message}
                    </div>
                )}

                {/* Summary cards */}
                {summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)' }}>
                        <Card>
                            <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>Total Amount</p>
                            <p className="font-heading" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-text)', marginTop: 4 }}>
                                <CurrencyDisplay amount={summary.total_amount ?? 0} currency="PHP" />
                            </p>
                        </Card>
                        <Card>
                            <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>Total Vouchers</p>
                            <p className="font-heading" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-text)', marginTop: 4 }}>
                                {summary.total_count ?? 0}
                            </p>
                        </Card>
                        <Card>
                            <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>Pending</p>
                            <p className="font-heading" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-warning)', marginTop: 4 }}>
                                {summary.pending_count ?? 0}
                            </p>
                        </Card>
                        <Card>
                            <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>Approved</p>
                            <p className="font-heading" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-success)', marginTop: 4 }}>
                                {summary.approved_count ?? 0}
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
                            placeholder="Voucher #, payee, details..."
                        />
                    </div>
                    <div style={{ flex: '0 0 160px' }}>
                        <Select
                            value={filters.type ?? ''}
                            onChange={(e) => applyFilter({ type: e.target.value || undefined })}
                            options={[
                                { value: '', label: 'All Types' },
                                ...Object.entries(types).map(([v, l]) => ({ value: v, label: l })),
                            ]}
                        />
                    </div>
                    <div style={{ flex: '0 0 160px' }}>
                        <Select
                            value={filters.approval ?? ''}
                            onChange={(e) => applyFilter({ approval_status: e.target.value || undefined })}
                            options={[
                                { value: '', label: 'All Statuses' },
                                ...Object.entries(approvalStatuses).map(([v, l]) => ({ value: v, label: l })),
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
                    rows={vouchers.data ?? []}
                    pagination={vouchers}
                    onPageChange={(page) => applyFilter({ page })}
                />

            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Remove Voucher"
                description={`Remove voucher ${deleteTarget?.voucher_no}? This cannot be undone.`}
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </AppShell>
    );
}