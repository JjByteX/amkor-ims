import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
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
import DetailPanel, { TableWithPanel, useDetailPanel, PanelSection, PanelField, PanelFieldRow, PanelDivider, PanelColumns, PanelCol, PanelColRight } from '../../Components/Shared/DetailPanel';

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

// ── Inline panel content (mirrors Show layout, read-only) ─────────────────────

function BillPanelContent({ data }) {
    const { bill, billTypes, statuses, approvalStatuses, paymentModes } = data;

    const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const fmtDt = (d) => d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    return (
        <PanelColumns>
            <PanelCol>
                <PanelSection title="Bill Details">
                    <PanelField label="Bill Type"       value={billTypes?.[bill.bill_type] ?? bill.bill_type} />
                    <PanelField label="Provider"        value={bill.provider} />
                    <PanelField label="Account No."     value={bill.account_no} mono />
                    <PanelFieldRow>
                        <PanelField label="Due Date"     value={fmt(bill.due_date)} />
                        <PanelField label="Payment Date" value={fmt(bill.payment_date)} />
                    </PanelFieldRow>
                    <PanelField label="Mode of Payment" value={paymentModes?.[bill.mode_of_payment] ?? bill.mode_of_payment} />
                    {bill.remarks && <PanelField label="Remarks" value={bill.remarks} />}
                </PanelSection>

                <PanelDivider />

                <PanelSection title="Audit">
                    <PanelField label="Created by"  value={bill.created_by  ? `${bill.created_by.name} · ${fmtDt(bill.created_at)}`  : fmtDt(bill.created_at)} />
                    <PanelField label="Updated by"  value={bill.updated_by  ? `${bill.updated_by.name} · ${fmtDt(bill.updated_at)}`  : fmtDt(bill.updated_at)} />
                </PanelSection>
            </PanelCol>

            <PanelColRight>
                <PanelSection title="Amount">
                    <PanelField label="Total" value={<CurrencyDisplay amount={bill.amount} currency="PHP" />} highlight />
                </PanelSection>

                <PanelDivider />

                <PanelSection title="Approval Chain">
                    {/* Check */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Badge variant={bill.checked_at ? 'info' : 'warning'}>{bill.checked_at ? 'Checked' : 'Awaiting Check'}</Badge>
                        {bill.checked_at && (
                            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                                {bill.checker?.name ?? '—'} · {fmtDt(bill.checked_at)}
                            </span>
                        )}
                    </div>

                    {/* Approve */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Badge variant={bill.approved_at ? 'success' : 'warning'}>{bill.approved_at ? 'Approved' : 'Awaiting Approval'}</Badge>
                        {bill.approved_at && (
                            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                                {bill.approver?.name ?? '—'} · {fmtDt(bill.approved_at)}
                            </span>
                        )}
                    </div>

                    {/* Release */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Badge variant={bill.released_at ? 'neutral' : 'warning'}>{bill.released_at ? 'Paid / Released' : 'Awaiting Payment'}</Badge>
                        {bill.released_at && (
                            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                                {bill.releaser?.name ?? '—'} · {fmtDt(bill.released_at)}
                            </span>
                        )}
                    </div>
                </PanelSection>

                {bill.audit_remarks && (
                    <>
                        <PanelDivider />
                        <PanelSection title="Audit Remarks">
                            <PanelField value={bill.audit_remarks} />
                        </PanelSection>
                    </>
                )}

                <PanelDivider />

                <PanelSection title="Actions">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.visit(route('bills.show', bill.id))}
                        style={{ width: '100%' }}
                    >
                        Open Full Page
                    </Button>
                </PanelSection>
            </PanelColRight>
        </PanelColumns>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function BillsIndex({ bills, summary, filters, billTypes, statuses, approvalStatuses, paymentModes, canWrite }) {
    const { flash } = usePage().props;
    const [searchInput,  setSearchInput ] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting    ] = useState(false);

    // ─── Detail panel ──────────────────────────────────────────────────────────
    const panel = useDetailPanel((id) => route('bills.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;

    function openPanel(row) { setShowPanel(true); panel.open(row); }

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
                    <Button variant="ghost" size="sm" icon={Eye} onClick={(e) => { e.stopPropagation(); openPanel(row); }} title="View" />
                    {canWrite && (
                        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)} title="Remove" />
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
                    title="Bills & On-Ques Monitoring"
                    subtitle={`${bills.total} bill${bills.total !== 1 ? 's' : ''}`}
                    actions={canWrite && (
                        <Button variant="primary" icon={Plus} onClick={() => router.visit(route('bills.create'))}>
                            Add Bill
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
                title={d?.bill?.name ?? ''}
                subtitle={d?.bill ? `${d.billTypes?.[d.bill.bill_type] ?? d.bill.bill_type}` : ''}
                badges={d?.bill && (
                    <>
                        <Badge variant={STATUS_VARIANT[d.bill.status] ?? 'neutral'}>{d.statuses?.[d.bill.status] ?? d.bill.status}</Badge>
                        <Badge variant={APPROVAL_VARIANT[d.bill.approval_status] ?? 'neutral'}>{d.approvalStatuses?.[d.bill.approval_status] ?? d.bill.approval_status}</Badge>
                    </>
                )}
            >
                {d?.bill && <BillPanelContent data={d} />}
            </DetailPanel>
                    }
                >
                    <DataTable
                        panelOpen={showPanel}
                        selectedKey={panel.id}
                    columns={columns}
                    rows={bills.data}
                    pagination={bills}
                    onPageChange={(page) => applyFilter({ page })}
                    toolbar={
                        <FilterStrip>
                            <FilterField grow>
                                <Input
                                    placeholder="Bill name, provider, account no..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKey}
                                    icon={Search}
                                />
                            </FilterField>
                            <FilterField>
                                <Select
                                    options={typeOptions}
                                    value={filters.bill_type ?? ''}
                                    onChange={(e) => applyFilter({ bill_type: e.target.value, page: 1 })}
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
