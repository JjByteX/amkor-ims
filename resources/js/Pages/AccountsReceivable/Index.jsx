import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import DetailPanel, { TableWithPanel, useDetailPanel } from '../../Components/Shared/DetailPanel';
import { ARContent } from './Show';

import { Plus, Search, Eye, Trash2, Banknote, Receipt, WalletCards } from 'lucide-react';
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

const STATUS_VARIANT = {
    current : 'info',
    overdue : 'error',
    paid    : 'success',
};

const APPROVAL_VARIANT = {
    pending      : 'warning',
    coo_approved : 'info',
    gsm_approved : 'info',
    approved     : 'success',
    rejected     : 'error',
};

export default function ARIndex({
    collectibles, summary, filters,
    departments, statuses, approvalStatuses,
    canWrite, canApprove,
}) {
    const { flash } = usePage().props;

    const [searchInput,  setSearchInput ] = useState(filters.search ?? '');

    // ─── Detail panel ──────────────────────────────────────────────────────────
    const panel = useDetailPanel((id) => route('ar.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;
    function openPanel(row) { setShowPanel(true); panel.open(row); }

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting    ] = useState(false);

    function applyFilter(overrides = {}) {
        router.get(
            route('ar.index'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true },
        );
    }

    function handleSearchKey(e) { if (e.key === 'Enter') applyFilter(); }

    function clearFilters() {
        setSearchInput('');
        router.get(route('ar.index'), {}, { preserveState: false });
    }

    function handleDelete() {
        setDeleting(true);
        router.delete(route('ar.destroy', deleteTarget.id), {
            onFinish: () => { setDeleting(false); setDeleteTarget(null); },
        });
    }

    const columns = [
        {
            key: 'date', label: 'Date',
            render: (row) => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {new Date(row.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            ),
        },
        {
            key: 'department', label: 'Dept',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {departments[row.department] ?? row.department}
                </span>
            ),
        },
        {
            key: 'agent_code', label: 'Agent',
            render: (row) => row.agent_code ? (
                <span
                    className="inline-flex items-center justify-center font-body font-semibold"
                    style={{
                        fontSize     : 'var(--font-size-small)',
                        background   : 'var(--color-primary)',
                        color        : '#fff',
                        borderRadius: "var(--radius-md)",
                        padding      : '2px 8px',
                    }}
                >
                    {row.agent_code}
                </span>
            ) : <span className="text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>—</span>,
        },
        {
            key: 'customer_name', label: 'Customer',
            render: (row) => (
                <div>
                    <div className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                        {row.customer_name}
                    </div>
                    {row.corporate_account && (
                        <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                            {row.corporate_account}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'collectible_amount_php', label: 'Amount (PHP)',
            render: (row) => <CurrencyDisplay amount={row.collectible_amount_php} currency="PHP" />,
        },
        {
            key: 'balance_php', label: 'Balance (PHP)',
            render: (row) => (
                <span style={{
                    color      : parseFloat(row.balance_php) > 0 ? 'var(--color-error)' : 'var(--color-success)',
                    fontSize   : 'var(--font-size-small)',
                    fontFamily : 'var(--font-body)',
                    fontWeight : 600,
                }}>
                    <CurrencyDisplay amount={row.balance_php} currency="PHP" />
                </span>
            ),
        },
        {
            key: 'due_date', label: 'Due',
            render: (row) => row.due_date ? (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: row.status === 'overdue' ? 'var(--color-error)' : 'var(--color-text)' }}>
                    {new Date(row.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {row.days_outstanding > 0 && (
                        <span className="ml-1 text-[var(--color-error)]">({row.days_outstanding}d)</span>
                    )}
                </span>
            ) : <span className="text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>—</span>,
        },
        {
            key: 'status', label: 'Status',
            render: (row) => (
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
            key: 'actions', label: '',
            render: (row) => (
                <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                    <Button variant="ghost" size="sm" icon={Eye}
                        onClick={(e) => { e.stopPropagation(); openPanel(row); }} title="View" />
                    {canWrite && (
                        <Button variant="ghost" size="sm" icon={Trash2}
                            onClick={() => setDeleteTarget(row)} title="Remove" />
                    )}
                </div>
            ),
        },
    ];

    const deptOptions = [
        { value: '', label: 'All Departments' },
        ...Object.entries(departments).map(([v, l]) => ({ value: v, label: l })),
    ];
    const statusOptions = [
        { value: '', label: 'All Statuses' },
        ...Object.entries(statuses).map(([v, l]) => ({ value: v, label: l })),
    ];

    const hasActiveFilters = filters.search || filters.dept || filters.status || filters.agent;

    return (
        <AppShell>
            <PageStack>

                {flash?.message && (
                    <div
                        className="rounded font-body"
                        style={{
                            padding     : 'var(--space-2)',
                            background  : flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                            color       : '#fff',
                            fontSize    : 'var(--font-size-small)',
                            borderRadius: 'var(--radius-md)',
                        }}
                    >
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title="Accounts Receivable / Collectibles"
                    subtitle={`${collectibles.total} record${collectibles.total !== 1 ? 's' : ''}`}
                    actions={canWrite && (
                        <Button variant="primary" icon={Plus} onClick={() => router.visit(route('ar.create'))}>
                            New Collectible
                        </Button>
                    )}
                />

                {summary && (
                    <StatGrid>
                        <StatCard icon={Receipt} label="Collectible PHP" value={<CurrencyDisplay amount={summary.total_collectible_php ?? 0} currency="PHP" />} />
                        <StatCard icon={Banknote} label="Received PHP" value={<CurrencyDisplay amount={summary.total_received_php ?? 0} currency="PHP" />} tone="success" />
                        <StatCard icon={WalletCards} label="Balance PHP" value={<CurrencyDisplay amount={summary.total_balance_php ?? 0} currency="PHP" />} tone={parseFloat(summary.total_balance_php) > 0 ? 'error' : 'success'} />
                        <StatCard icon={Receipt} label="Collectible USD" value={<CurrencyDisplay amount={summary.total_collectible_usd ?? 0} currency="USD" />} />
                        <StatCard icon={WalletCards} label="Balance USD" value={<CurrencyDisplay amount={summary.total_balance_usd ?? 0} currency="USD" />} tone={parseFloat(summary.total_balance_usd) > 0 ? 'error' : 'success'} />
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
                title={d?.collectible?.customer_name ?? ''}
                subtitle={d?.collectible ? `${d.departments?.[d.collectible.department] ?? d.collectible.department} · ${new Date(d.collectible.date).toLocaleDateString('en-PH', {month:'short',day:'numeric',year:'numeric'})}` : ''}
                badges={d?.collectible && (
                <>
                    <Badge variant={STATUS_VARIANT[d.collectible.status] ?? 'neutral'}>
                        {d.statuses?.[d.collectible.status] ?? d.collectible.status}
                    </Badge>
                    <Badge variant={APPROVAL_VARIANT[d.collectible.approval_status] ?? 'neutral'}>
                        {d.approvalStatuses?.[d.collectible.approval_status] ?? d.collectible.approval_status}
                    </Badge>
                    {d.collectible.days_outstanding > 0 && (
                        <Badge variant="error">{d.collectible.days_outstanding} days overdue</Badge>
                    )}
                </>
            )}
            >
                {d?.collectible && <ARContent collectible={d.collectible} departments={d.departments} statuses={d.statuses} approvalStatuses={d.approvalStatuses} canWrite={d.canWrite} canApprove={d.canApprove} canApproveCoo={d.canApproveCoo} canApproveGsm={d.canApproveGsm} canAudit={d.canAudit} hydrating={panel.hydrating} onApprove={() => { panel.invalidate(panel.id); panel.open(panel.id); }} />}
            </DetailPanel>
                    }
                >
                    <DataTable
                        panelOpen={showPanel}
                        selectedKey={panel.id}
                    columns={columns}
                    rows={collectibles.data}
                    pagination={collectibles}
                    onPageChange={(page) => applyFilter({ page })}
                    toolbar={
                        <FilterStrip>
                            <FilterField grow>
                                <Input
                                    placeholder="Customer, particulars, OR#, AR#..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKey}
                                    icon={Search}
                                />
                            </FilterField>
                            <FilterField>
                                <Select
                                    options={deptOptions}
                                    value={filters.dept ?? ''}
                                    onChange={(e) => applyFilter({ dept: e.target.value, page: 1 })}
                                />
                            </FilterField>
                            <FilterField>
                                <Select
                                    options={statusOptions}
                                    value={filters.status ?? ''}
                                    onChange={(e) => applyFilter({ status: e.target.value, page: 1 })}
                                />
                            </FilterField>
                            {hasActiveFilters && (
                                <Button variant="ghost" onClick={clearFilters}>Clear</Button>
                            )}
                        </FilterStrip>
                    }
                />
                </TableWithPanel>

            
        </PageStack>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Remove Collectible"
                message={`Remove collectible for ${deleteTarget?.customer_name}? This can be undone by an admin.`}
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppShell>
    );
}
