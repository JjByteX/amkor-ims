import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Plus, Search, Eye,
    Wallet, AlertTriangle, Clock, CircleCheck,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import DetailPanel, { TableWithPanel, useDetailPanel } from '../../Components/Shared/DetailPanel';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import StatCard from '../../Components/Shared/StatCard';
import StatGrid from '../../Components/Shared/StatGrid';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Badge from '../../Components/UI/Badge';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';
import { ReloadContent } from './ReloadShow';

const APPROVAL_VARIANT = {
    pending  : 'warning',
    checked  : 'info',
    approved : 'success',
    released : 'neutral',
};

export default function CashbondIndex({
    portals, reloads, summary, filters,
    approvalStatuses,
    canWrite, canCheck, canApprove,
    balanceOnly = false,
}) {
    const { flash } = usePage().props;

    const [searchInput, setSearchInput] = useState(filters.search ?? '');

    // ─── Detail panel ─────────────────────────────────────────────────────────
    const panel = useDetailPanel((id) => route('cashbond.reloads.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;
    function openPanel(row) { setShowPanel(true); panel.open(row); }

    // ─── Filters ──────────────────────────────────────────────────────────────
    function applyFilter(overrides = {}) {
        router.get(
            route('cashbond.index'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true },
        );
    }

    function handleSearchKey(e) { if (e.key === 'Enter') applyFilter(); }

    // ─── Table columns ────────────────────────────────────────────────────────
    const fmt = (d) => d
        ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

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
                        onClick={(e) => { e.stopPropagation(); openPanel(row); }}
                        title="View"
                    />
                </div>
            ),
        },
    ];

    const portalOptions = [
        { value: '', label: 'All Portals' },
        ...portals.map((p) => ({ value: p.id, label: p.name })),
    ];
    const approvalOptions = [
        { value: '', label: 'All Statuses' },
        ...Object.entries(approvalStatuses).map(([v, l]) => ({ value: v, label: l })),
    ];

    return (
        <AppShell>
            <PageStack>

                <PageHeader
                    title="Cashbond Monitoring"
                    subtitle="Portal balances and reload requests"
                    actions={canWrite && (
                        <Button variant="primary" icon={Plus} onClick={() => router.visit(route('cashbond.reloads.create'))}>
                            New Reload Request
                        </Button>
                    )}
                />

                {flash?.message && (
                    <div style={{
                        padding     : 'var(--space-2)',
                        borderRadius: 'var(--radius-md)',
                        background  : flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                        color       : '#fff',
                        fontSize    : 'var(--font-size-small)',
                        fontFamily  : 'var(--font-body)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <StatGrid>
                    <StatCard
                        icon={Wallet}
                        label="Total Portal Balance"
                        value={<CurrencyDisplay amount={summary.total_balance ?? 0} currency="PHP" />}
                        tone="primary"
                    />
                    <StatCard
                        icon={AlertTriangle}
                        label="Below Threshold"
                        value={summary.below_threshold ?? 0}
                        tone={summary.below_threshold > 0 ? 'error' : 'success'}
                        sub={summary.below_threshold > 0 ? 'portal(s) need reloading' : 'All portals healthy'}
                    />
                    <StatCard
                        icon={Clock}
                        label="Pending Reloads"
                        value={summary.pending_count ?? 0}
                        tone={summary.pending_count > 0 ? 'warning' : 'default'}
                    />
                    <StatCard
                        icon={CircleCheck}
                        label="Released This Month"
                        value={summary.released_month ?? 0}
                        tone="success"
                    />
                </StatGrid>

                {!balanceOnly && <TableWithPanel
                    panelOpen={showPanel}
                    panel={
                        <DetailPanel
                            open={showPanel}
                            onClose={() => { setShowPanel(false); panel.close(); }}
                            loading={panel.loading}
                            error={panel.error}
                            title={d?.reload?.reload_no ?? ''}
                            subtitle={d?.reload ? `${d.reload.portal?.name ?? ''} · ${fmt(d.reload.request_date)}` : ''}
                            badges={d?.reload && (
                                <Badge variant={APPROVAL_VARIANT[d.reload.approval_status] ?? 'neutral'}>
                                    {d.approvalStatuses?.[d.reload.approval_status] ?? d.reload.approval_status}
                                </Badge>
                            )}
                        >
                            {d?.reload && (
                                <ReloadContent
                                    reload={d.reload}
                                    approvalStatuses={d.approvalStatuses}
                                    canWrite={d.canWrite}
                                    canCheck={d.canCheck}
                                    canApprove={d.canApprove}
                                />
                            )}
                        </DetailPanel>
                    }
                >
                    <DataTable
                        panelOpen={showPanel}
                        selectedKey={panel.id}
                        columns={columns}
                        rows={reloads.data ?? []}
                        pagination={reloads}
                        onPageChange={(page) => applyFilter({ page })}

                        toolbar={
                            <FilterStrip>
                                <FilterField grow>
                                    <Input
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={handleSearchKey}
                                        icon={Search}
                                        placeholder="Ref no., portal..."
                                    />
                                </FilterField>
                                <FilterField width={190}>
                                    <Select
                                        options={portalOptions}
                                        value={filters.portal_id ?? ''}
                                        onChange={(e) => applyFilter({ portal_id: e.target.value || undefined, page: 1 })}
                                    />
                                </FilterField>
                                <FilterField width={175}>
                                    <Select
                                        options={approvalOptions}
                                        value={filters.approval_status ?? ''}
                                        onChange={(e) => applyFilter({ approval_status: e.target.value || undefined, page: 1 })}
                                    />
                                </FilterField>
                                <FilterField width={160}>
                                    <Input
                                        type="month"
                                        value={filters.month ?? ''}
                                        onChange={(e) => applyFilter({ month: e.target.value || undefined, page: 1 })}
                                    />
                                </FilterField>
                            </FilterStrip>
                        }
                    />
                </TableWithPanel>}

            </PageStack>
        </AppShell>
    );
}
