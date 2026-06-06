import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Eye, Filter, ArrowLeft } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import Button from '../../Components/UI/Button';
import Select from '../../Components/UI/Select';
import Badge from '../../Components/UI/Badge';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const APPROVAL_VARIANT = {
    pending  : 'warning',
    checked  : 'info',
    approved : 'success',
    released : 'neutral',
};

export default function CashbondReloads({ reloads, portals, filters, approvalStatuses, canWrite }) {
    const { flash } = usePage().props;

    const [month, setMonth] = useState(filters.month ?? '');

    function applyFilter(overrides = {}) {
        router.get(route('cashbond.reloads.index'), { ...filters, month, ...overrides }, { preserveState: true, preserveScroll: true });
    }

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    const portalOptions = [
        { value: '', label: 'All Portals' },
        ...portals.map((p) => ({ value: p.id, label: p.name })),
    ];
    const approvalOptions = [
        { value: '', label: 'All Statuses' },
        ...Object.entries(approvalStatuses).map(([v, l]) => ({ value: v, label: l })),
    ];

    const columns = [
        {
            key: 'reload_no', label: 'Ref No.',
            render: (row) => (
                <span className="font-body font-semibold text-[var(--color-primary)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.reload_no}
                </span>
            ),
        },
        {
            key: 'portal', label: 'Portal',
            render: (row) => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.portal?.name ?? '—'}
                </span>
            ),
        },
        {
            key: 'amount', label: 'Amount',
            render: (row) => <CurrencyDisplay amount={row.amount} currency="PHP" />,
        },
        {
            key: 'request_date', label: 'Request Date',
            render: (row) => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {fmt(row.request_date)}
                </span>
            ),
        },
        {
            key: 'deposit_date', label: 'Deposit Date',
            render: (row) => (
                <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                    {fmt(row.deposit_date)}
                </span>
            ),
        },
        {
            key: 'created_by', label: 'Prepared by',
            render: (row) => (
                <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.created_by?.name ?? '—'}
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
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" icon={Eye}
                        onClick={() => router.visit(route('cashbond.reloads.show', row.id))} title="View" />
                </div>
            ),
        },
    ];

    return (
        <AppShell>
            <div className="flex flex-col" style={{ gap: 'var(--space-3)' }}>

                {flash?.message && (
                    <div className="rounded font-body" style={{
                        padding: 'var(--space-2)', background: flash.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                        color: '#fff', fontSize: 'var(--font-size-small)', borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <Button variant="ghost" icon={ArrowLeft} onClick={() => router.visit(route('cashbond.index'))}>
                        Portals
                    </Button>
                </div>

                <PageHeader
                    title="Reload Requests"
                    subtitle={`${reloads.total} request${reloads.total !== 1 ? 's' : ''}`}
                    actions={canWrite && (
                        <Button variant="primary" icon={Plus} onClick={() => router.visit(route('cashbond.reloads.create'))}>
                            New Request
                        </Button>
                    )}
                />

                {/* Filters */}
                <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2) var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="flex flex-wrap items-end" style={{ gap: 'var(--space-2)' }}>
                        <div className="min-w-[180px]">
                            <Select
                                label="Portal"
                                options={portalOptions}
                                value={filters.portal_id ?? ''}
                                onChange={(e) => applyFilter({ portal_id: e.target.value, page: 1 })}
                            />
                        </div>
                        <div className="min-w-[180px]">
                            <Select
                                label="Approval Status"
                                options={approvalOptions}
                                value={filters.approval_status ?? ''}
                                onChange={(e) => applyFilter({ approval_status: e.target.value, page: 1 })}
                            />
                        </div>
                        <div className="min-w-[160px]">
                            <label className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)', display: 'block', marginBottom: 4 }}>Month</label>
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                onBlur={() => applyFilter({ month })}
                                style={{
                                    height: 40, borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db',
                                    padding: '0 12px', fontFamily: 'var(--font-body)', fontSize: 'var(--font-size-small)',
                                    background: 'var(--color-bg)', color: 'var(--color-text)', width: '100%',
                                }}
                            />
                        </div>
                        <Button variant="secondary" icon={Filter} onClick={() => applyFilter()}>Apply</Button>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    rows={reloads.data}
                    pagination={reloads}
                    onPageChange={(page) => applyFilter({ page })}
                />
            </div>
        </AppShell>
    );
}
