import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Eye, ArrowLeft } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import Button from '../../Components/UI/Button';
import Select from '../../Components/UI/Select';
import Input from '../../Components/UI/Input';
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
            <PageStack>

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

                <DataTable
                    columns={columns}
                    rows={reloads.data}
                    pagination={reloads}
                    onPageChange={(page) => applyFilter({ page })}
                    toolbar={
                        <FilterStrip>
                            <FilterField width={190}>
                                <Select
                                    options={portalOptions}
                                    value={filters.portal_id ?? ''}
                                    onChange={(e) => applyFilter({ portal_id: e.target.value, page: 1 })}
                                />
                            </FilterField>
                            <FilterField width={190}>
                                <Select
                                    options={approvalOptions}
                                    value={filters.approval_status ?? ''}
                                    onChange={(e) => applyFilter({ approval_status: e.target.value, page: 1 })}
                                />
                            </FilterField>
                            <FilterField width={160}>
                                <Input
                                    type="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    onBlur={() => applyFilter({ month })}
                                />
                            </FilterField>
                            <Button variant="secondary" onClick={() => applyFilter()}>Apply</Button>
                        </FilterStrip>
                    }
                />
            </PageStack>
        </AppShell>
    );
}
