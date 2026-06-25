import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import DetailPanel, { TableWithPanel, useDetailPanel } from '../../Components/Shared/DetailPanel';
import { IataContent } from './Show';

import { Plus, Search, Eye, Trash2, BanknoteArrowUp, ClipboardList, FileClock, FileWarning, CircleCheckBig } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import StatCard from '../../Components/Shared/StatCard';
import StatGrid from '../../Components/Shared/StatGrid';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Badge from '../../Components/UI/Badge';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

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

export default function IataPaymentsIndex({ payments, summary, filters, statuses, approvalStatuses, canWrite }) {
    const { flash } = usePage().props;
    const [searchInput,  setSearchInput ] = useState(filters.search ?? '');

    // ─── Detail panel ──────────────────────────────────────────────────────────
    const panel = useDetailPanel((id) => route('iata.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;
    function openPanel(row) { setShowPanel(true); panel.open(row); }

    const [deleteTarget, setDeleteTarget] = useState(null);

    function applyFilter(overrides = {}) {
        router.get(route('iata.index'), { ...filters, search: searchInput, ...overrides }, { preserveState: true, preserveScroll: true });
    }

    function handleSearchKey(e) { if (e.key === 'Enter') applyFilter(); }

    function clearFilters() {
        setSearchInput('');
        router.get(route('iata.index'), {}, { preserveState: false });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(route('iata.destroy', deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    const hasActiveFilters = filters.search || filters.status || filters.month;

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        ...Object.entries(statuses).map(([v, l]) => ({ value: v, label: l })),
    ];

    const columns = [
        {
            key: 'payment_no',
            label: 'Ref No.',
            render: row => (
                <span className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.payment_no}
                </span>
            ),
        },
        {
            key: 'operator_name',
            label: 'Operator',
            render: row => (
                <div>
                    <div className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                        {row.operator_name}
                    </div>
                    {row.billing_reference && (
                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                            Ref: {row.billing_reference}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'Amount',
            align: 'right',
            render: row => <CurrencyDisplay amount={row.amount} currency="PHP" />,
        },
        {
            key: 'due_date',
            label: 'Due Date',
            render: row => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {fmt(row.due_date)}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: row => (
                <div className="flex flex-col" style={{ gap: 4 }}>
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
            key: 'deposit_slip',
            label: 'Deposit Slip',
            render: row => (
                <Badge variant={row.deposit_slip_attached ? 'success' : 'neutral'}>
                    {row.deposit_slip_attached ? 'Attached' : 'Pending'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: row => (
                <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={(e) => { e.stopPropagation(); openPanel(row); }}
                        title="View"
                    />
                    {canWrite && row.approval_status === 'pending' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setDeleteTarget(row)}
                            title="Remove"
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppShell>
            <PageStack>

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
                    title="IATA Payments"
                    subtitle={`${payments.total} payment${payments.total !== 1 ? 's' : ''}`}
                    actions={canWrite && (
                        <Button variant="primary" icon={Plus} onClick={() => router.visit(route('iata.create'))}>
                            Record Payment
                        </Button>
                    )}
                />

                {summary && (
                    <StatGrid>
                        <StatCard icon={BanknoteArrowUp} label="Total Amount" value={<CurrencyDisplay amount={summary.total_amount ?? 0} currency="PHP" />} />
                        <StatCard icon={ClipboardList} label="Total Records" value={summary.total_count ?? 0} />
                        <StatCard icon={FileClock} label="Pending" value={summary.pending_count ?? 0} tone="warning" />
                        <StatCard icon={FileWarning} label="Overdue" value={summary.overdue_count ?? 0} tone="error" />
                        <StatCard icon={CircleCheckBig} label="Paid" value={summary.paid_count ?? 0} tone="success" />
                    </StatGrid>
                )}

                                <TableWithPanel
                    panelOpen={showPanel}
                    panel={
                        <DetailPanel
                open={showPanel}
                onClose={() => { setShowPanel(false); panel.close(); }}
                loading={panel.loading}
                error={panel.error}
                title={d?.payment?.payment_no ?? ''}
                subtitle={d?.payment?.operator_name ?? ''}
                badges={d?.payment && (
                <>
                    <Badge variant={STATUS_VARIANT[d.payment.status] ?? 'neutral'}>
                        {d.statuses?.[d.payment.status] ?? d.payment.status}
                    </Badge>
                    <Badge variant={APPROVAL_VARIANT[d.payment.approval_status] ?? 'neutral'}>
                        {d.approvalStatuses?.[d.payment.approval_status] ?? d.payment.approval_status}
                    </Badge>
                    {d.payment.deposit_slip_attached && <Badge variant="success">Deposit Slip Attached</Badge>}
                    {d.payment.operator_notified && <Badge variant="info">Operator Notified</Badge>}
                </>
            )}
            >
                {d?.payment && <IataContent payment={d.payment} statuses={d.statuses} approvalStatuses={d.approvalStatuses} canWrite={d.canWrite} canCheck={d.canCheck} canApprove={d.canApprove} />}
            </DetailPanel>
                    }
                >
                    <DataTable
                        panelOpen={showPanel}
                        selectedKey={panel.id}
                    columns={columns}
                    rows={payments.data ?? []}
                    pagination={payments}
                    onPageChange={(page) => applyFilter({ page })}
                    toolbar={
                        <FilterStrip>
                            <FilterField grow>
                                <Input
                                    placeholder="Operator name or billing ref..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKey}
                                    icon={Search}
                                />
                            </FilterField>
                            <FilterField>
                                <Select
                                    options={statusOptions}
                                    value={filters.status ?? ''}
                                    onChange={(e) => applyFilter({ status: e.target.value, page: 1 })}
                                />
                            </FilterField>
                            <FilterField width={150}>
                                <Input
                                    type="month"
                                    value={filters.month ?? ''}
                                    onChange={(e) => applyFilter({ month: e.target.value, page: 1 })}
                                />
                            </FilterField>
                            {hasActiveFilters && (
                                <Button variant="ghost" onClick={clearFilters} style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-container)', color: 'var(--color-text)' }}>Clear</Button>
                            )}
                        </FilterStrip>
                    }
                />
                </TableWithPanel>
            
        </PageStack>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Remove IATA Payment"
                message={`Remove payment ${deleteTarget?.payment_no} (${deleteTarget?.operator_name})? This can be undone by an admin.`}
                confirmLabel="Remove"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppShell>
    );
}
