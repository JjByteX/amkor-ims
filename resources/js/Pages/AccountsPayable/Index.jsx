import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import DetailPanel, { TableWithPanel, useDetailPanel } from '../../Components/Shared/DetailPanel';
import { APContent } from './Show';

import { Plus, Search, Eye, Trash2, Banknote, Receipt, WalletCards, Files } from 'lucide-react';
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
    pending:  'warning',
    overdue:  'error',
    paid:     'success',
    received: 'info',
    filed:    'neutral',
};

const APPROVAL_VARIANT = {
    pending:  'warning',
    checked:  'info',
    approved: 'success',
    released: 'neutral',
};

function MultiCurrencyValue({ php, usd, jpy }) {
    const extras = [];
    if (parseFloat(usd) > 0) extras.push(<CurrencyDisplay key="usd" amount={usd} currency="USD" />);
    if (parseFloat(jpy) > 0) extras.push(<CurrencyDisplay key="jpy" amount={jpy} currency="JPY" />);

    return (
        <span>
            <CurrencyDisplay amount={php} currency="PHP" />
            {extras.length > 0 && (
                <span className="block font-body" style={{ marginTop: 4, fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                    {extras.map((extra, index) => (
                        <span key={index}>{index > 0 ? ' / ' : ''}{extra}</span>
                    ))}
                </span>
            )}
        </span>
    );
}

export default function APIndex({
    payables, summary, filters,
    statuses, currencies, approvalStatuses,
    canWrite, canCheck, canApprove,
}) {
    const { flash } = usePage().props;

    const [searchInput,  setSearchInput ] = useState(filters.search ?? '');

    // ─── Detail panel ──────────────────────────────────────────────────────────
    const panel = useDetailPanel((id) => route('ap.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;
    function openPanel(row) { setShowPanel(true); panel.open(row); }

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting    ] = useState(false);

    const hasActiveFilters = filters.search || filters.status || filters.currency || filters.month;

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

                {summary && (
                    <StatGrid>
                        <StatCard
                            icon={Receipt}
                            label="Total Invoice"
                            value={<MultiCurrencyValue php={summary.total_invoice_php ?? 0} usd={summary.total_invoice_usd ?? 0} jpy={summary.total_invoice_jpy ?? 0} />}
                        />
                        <StatCard
                            icon={Banknote}
                            label="Total Paid"
                            value={<MultiCurrencyValue php={summary.total_paid_php ?? 0} usd={summary.total_paid_usd ?? 0} jpy={summary.total_paid_jpy ?? 0} />}
                            tone="success"
                        />
                        <StatCard
                            icon={WalletCards}
                            label="Total Balance"
                            value={<MultiCurrencyValue php={summary.total_balance_php ?? 0} usd={summary.total_balance_usd ?? 0} jpy={summary.total_balance_jpy ?? 0} />}
                            tone="warning"
                        />
                        <StatCard icon={Files} label="Total Records" value={summary.total_count ?? 0} />
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
                title={d?.payable?.supplier_name ?? ''}
                subtitle={d?.payable ? `${d.payable.voucher_no ?? ''}${d.payable.invoice_no ? ` · Inv# ${d.payable.invoice_no}` : ''}` : ''}
                badges={d?.payable && (
                <>
                    <Badge variant={STATUS_VARIANT[d.payable.status] ?? 'neutral'}>
                        {d.statuses?.[d.payable.status] ?? d.payable.status}
                    </Badge>
                    <Badge variant={APPROVAL_VARIANT[d.payable.approval_status] ?? 'neutral'}>
                        {d.approvalStatuses?.[d.payable.approval_status] ?? d.payable.approval_status}
                    </Badge>
                    {d.payable.days_outstanding > 0 && (
                        <Badge variant="error">{d.payable.days_outstanding} days overdue</Badge>
                    )}
                </>
            )}
            >
                {d?.payable && <APContent payable={d.payable} currencies={d.currencies} statuses={d.statuses} approvalStatuses={d.approvalStatuses} paymentModes={d.paymentModes} canWrite={d.canWrite} canCheck={d.canCheck} canApprove={d.canApprove} />}
            </DetailPanel>
                    }
                >
                    <DataTable
                        panelOpen={showPanel}
                        selectedKey={panel.id}
                    columns={columns}
                    rows={payables.data ?? []}
                    pagination={payables}
                    onPageChange={(page) => applyFilter({ page })}
                    toolbar={
                        <FilterStrip>
                            <FilterField grow>
                                <Input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKey}
                                    icon={Search}
                                    placeholder="Supplier, invoice#, ACR..."
                                />
                            </FilterField>
                            <FilterField width={150}>
                                <Select
                                    value={filters.status ?? ''}
                                    onChange={(e) => applyFilter({ status: e.target.value || undefined })}
                                    options={[
                                        { value: '', label: 'All Statuses' },
                                        ...Object.entries(statuses).map(([v, l]) => ({ value: v, label: l })),
                                    ]}
                                />
                            </FilterField>
                            <FilterField width={140}>
                                <Select
                                    value={filters.currency ?? ''}
                                    onChange={(e) => applyFilter({ currency: e.target.value || undefined })}
                                    options={[
                                        { value: '', label: 'All Currencies' },
                                        ...Object.entries(currencies).map(([v, l]) => ({ value: v, label: l })),
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
                                <Button variant="ghost" onClick={clearFilters}>Clear</Button>
                            )}
                        </FilterStrip>
                    }
                />
                </TableWithPanel>

            
        </PageStack>

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
