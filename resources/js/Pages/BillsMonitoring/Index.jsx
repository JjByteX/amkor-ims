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
    pending : 'warning',
    paid    : 'success',
    overdue : 'error',
};

const APPROVAL_VARIANT = {
    pending  : 'warning',
    checked  : 'info',
    approved : 'success',
    released : 'neutral',
};

export default function BillsIndex({ bills, summary, filters, billTypes, statuses, approvalStatuses, paymentModes, canWrite }) {
    const { flash } = usePage().props;
    const [searchInput,  setSearchInput ] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting    ] = useState(false);

    function applyFilter(overrides = {}) {
        router.get(route('bills.index'), { ...filters, search: searchInput, ...overrides }, { preserveState: true, preserveScroll: true });
    }

    function handleSearchKey(e) { if (e.key === 'Enter') applyFilter(); }

    function clearFilters() {
        setSearchInput('');
        router.get(route('bills.index'), {}, { preserveState: false });
    }

    function handleDelete() {
        setDeleting(true);
        router.delete(route('bills.destroy', deleteTarget.id), {
            onFinish: () => { setDeleting(false); setDeleteTarget(null); },
        });
    }

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    const typeOptions = [
        { value: '', label: 'All Types' },
        ...Object.entries(billTypes).map(([v, l]) => ({ value: v, label: l })),
    ];
    const statusOptions = [
        { value: '', label: 'All Statuses' },
        ...Object.entries(statuses).map(([v, l]) => ({ value: v, label: l })),
    ];

    const hasActiveFilters = filters.search || filters.bill_type || filters.status;

    const columns = [
        {
            key: 'name', label: 'Bill',
            render: (row) => (
                <div>
                    <div className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>{row.name}</div>
                    {row.provider && (
                        <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>{row.provider}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'bill_type', label: 'Type',
            render: (row) => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {billTypes[row.bill_type] ?? row.bill_type}
                </span>
            ),
        },
        {
            key: 'amount', label: 'Amount',
            render: (row) => <CurrencyDisplay amount={row.amount} currency="PHP" />,
        },
        {
            key: 'due_date', label: 'Due Date',
            render: (row) => (
                <span className="font-body" style={{
                    fontSize : 'var(--font-size-small)',
                    color    : row.status === 'overdue' ? 'var(--color-error)' : 'var(--color-text)',
                }}>
                    {fmt(row.due_date)}
                </span>
            ),
        },
        {
            key: 'status', label: 'Status',
            render: (row) => (
                <div className="flex flex-col" style={{ gap: 4 }}>
                    <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>{statuses[row.status] ?? row.status}</Badge>
                    <Badge variant={APPROVAL_VARIANT[row.approval_status] ?? 'neutral'}>{approvalStatuses[row.approval_status] ?? row.approval_status}</Badge>
                </div>
            ),
        },
        {
            key: 'actions', label: '',
            render: (row) => (
                <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                    <Button variant="ghost" size="sm" icon={Eye} onClick={() => router.visit(route('bills.show', row.id))} title="View" />
                    {canWrite && (
                        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)} title="Remove" />
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

                {flash?.message && (
                    <div className="rounded font-body" style={{
                        padding     : 'var(--space-2)',
                        background  : flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                        color       : '#fff',
                        fontSize    : 'var(--font-size-small)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title="Bills & On-Ques Monitoring"
                    subtitle={`${bills.total} bill${bills.total !== 1 ? 's' : ''}`}
                    actions={canWrite && (
                        <Button variant="primary" icon={Plus} onClick={() => router.visit(route('bills.create'))}>
                            Add Bill
                        </Button>
                    )}
                />

                {/* Summary */}
                {summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-2)' }}>
                        {[
                            { label: 'Total Amount',  value: summary.total_amount,  color: 'var(--color-text)' },
                            { label: 'Total Records', value: summary.total_count,   color: 'var(--color-text)', isCount: true },
                            { label: 'Pending',       value: summary.pending_count, color: 'var(--color-warning)', isCount: true },
                            { label: 'Overdue',       value: summary.overdue_count, color: 'var(--color-error)', isCount: true },
                            { label: 'Paid',          value: summary.paid_count,    color: 'var(--color-success)', isCount: true },
                        ].map((s) => (
                            <Card key={s.label}>
                                <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>{s.label}</div>
                                <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color: s.color, marginTop: 4 }}>
                                    {s.isCount ? (s.value ?? 0) : <CurrencyDisplay amount={s.value ?? 0} currency="PHP" />}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-center" style={{ gap: 'var(--space-2)' }}>
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder="Bill name, provider, account no…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKey}
                            icon={Search}
                        />
                    </div>
                    <div className="min-w-[160px]">
                        <Select
                            options={typeOptions}
                            value={filters.bill_type ?? ''}
                            onChange={(e) => applyFilter({ bill_type: e.target.value, page: 1 })}
                        />
                    </div>
                    <div className="min-w-[160px]">
                        <Select
                            options={statusOptions}
                            value={filters.status ?? ''}
                            onChange={(e) => applyFilter({ status: e.target.value, page: 1 })}
                        />
                    </div>
                    {hasActiveFilters && (
                        <Button variant="ghost" onClick={clearFilters}>Clear</Button>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    rows={bills.data}
                    pagination={bills}
                    onPageChange={(page) => applyFilter({ page })}
                />
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Remove Bill"
                message={`Remove "${deleteTarget?.name}"? This can be undone by an admin.`}
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppShell>
    );
}
