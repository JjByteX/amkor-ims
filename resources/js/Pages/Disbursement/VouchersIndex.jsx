import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import DetailPanel, { TableWithPanel, useDetailPanel } from '../../Components/Shared/DetailPanel';
import { VoucherContent } from './VoucherShow';

import { Plus, Search, Eye, Trash2, BanknoteArrowUp, ClipboardList, FileClock, CircleCheckBig } from 'lucide-react';
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

const APPROVAL_VARIANT = {
    pending:  'warning',
    checked:  'info',
    approved: 'success',
    released: 'neutral',
};

const TYPE_VARIANT = {
    cash:  'neutral',
    check: 'neutral',
};

export default function VouchersIndex({
    vouchers, summary, filters,
    types, approvalStatuses,
    canWrite, canCheck, canApprove,
}) {
    const { flash } = usePage().props;

    const [searchInput,  setSearchInput ] = useState(filters.search ?? '');

    // ─── Detail panel ──────────────────────────────────────────────────────────
    const panel = useDetailPanel((id) => route('disbursement.vouchers.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;
    function openPanel(row) { setShowPanel(true); panel.open(row); }

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

    const hasActiveFilters = !!(searchInput || filters.search || filters.type || filters.approval || filters.month);

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
                        <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                            {row.details.length > 60 ? row.details.substring(0, 60) + '…' : row.details}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'amount', label: 'Amount', align: 'right',
            render: (row) => (
                <CurrencyDisplay amount={row.amount ?? 0} currency={row.currency ?? 'PHP'} />
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
                        onClick={(e) => { e.stopPropagation(); openPanel(row); }}
                    />
                    {canWrite && row.approval_status === 'pending' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => setDeleteTarget(row)}
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppShell>
            <PageStack>

                <PageHeader
                    title="Cash &amp; Check Vouchers"
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

                {summary && (
                    <StatGrid>
                        <StatCard icon={BanknoteArrowUp} label="Total Amount" value={<CurrencyDisplay amount={summary.total_amount ?? 0} currency="PHP" />} />
                        <StatCard icon={ClipboardList} label="Total Vouchers" value={summary.total_count ?? 0} />
                        <StatCard icon={FileClock} label="Pending" value={summary.pending_count ?? 0} tone="warning" />
                        <StatCard icon={CircleCheckBig} label="Approved" value={summary.approved_count ?? 0} tone="success" />
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
                title={d?.voucher ? `${d.types?.[d.voucher.type] ?? d.voucher.type} — ${d.voucher.voucher_no}` : ''}
                subtitle={d?.voucher ? `Payee: ${d.voucher.payee}` : ''}
                badges={d?.voucher && (
                <>
                    <Badge variant={TYPE_VARIANT[d.voucher.type] ?? 'neutral'}>
                        {d.types?.[d.voucher.type] ?? d.voucher.type}
                    </Badge>
                    <Badge variant={APPROVAL_VARIANT[d.voucher.approval_status] ?? 'neutral'}>
                        {d.approvalStatuses?.[d.voucher.approval_status] ?? d.voucher.approval_status}
                    </Badge>
                </>
            )}
            >
                {d?.voucher && <VoucherContent voucher={d.voucher} types={d.types} approvalStatuses={d.approvalStatuses} currencies={d.currencies} canWrite={d.canWrite} canCheck={d.canCheck} canApprove={d.canApprove} />}
            </DetailPanel>
                    }
                >
                    <DataTable
                        panelOpen={showPanel}
                    columns={columns}
                    rows={vouchers.data ?? []}
                    pagination={vouchers}
                    onPageChange={(page) => applyFilter({ page })}
                    autoPageSize
                    onPageSizeChange={(n) => applyFilter({ per_page: n, page: 1 })}
                    toolbar={
                        <FilterStrip>
                            <FilterField grow>
                                <Input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKey}
                                    icon={Search}
                                    placeholder="Voucher #, payee, details..."
                                />
                            </FilterField>
                            <FilterField>
                                <Select
                                    value={filters.type ?? ''}
                                    onChange={(e) => applyFilter({ type: e.target.value || undefined })}
                                    options={[
                                        { value: '', label: 'All Types' },
                                        ...Object.entries(types).map(([v, l]) => ({ value: v, label: l })),
                                    ]}
                                />
                            </FilterField>
                            <FilterField>
                                <Select
                                    value={filters.approval ?? ''}
                                    onChange={(e) => applyFilter({ approval_status: e.target.value || undefined })}
                                    options={[
                                        { value: '', label: 'All Statuses' },
                                        ...Object.entries(approvalStatuses).map(([v, l]) => ({ value: v, label: l })),
                                    ]}
                                />
                            </FilterField>
                            <FilterField width={150}>
                                <Input
                                    type="month"
                                    value={filters.month ?? ''}
                                    onChange={(e) => applyFilter({ month: e.target.value || undefined })}
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
