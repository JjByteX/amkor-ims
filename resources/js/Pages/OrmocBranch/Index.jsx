import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import DetailPanel, { TableWithPanel, useDetailPanel } from '../../Components/Shared/DetailPanel';
import { OrmocContent } from './Show';

import { Plus, Search, Eye, Pencil, Trash2, ArrowUpRight, Package, AlertTriangle } from 'lucide-react';
import AppShell        from '../../Components/Layout/AppShell';
import PageHeader      from '../../Components/Shared/PageHeader';
import DataTable       from '../../Components/Shared/DataTable';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack       from '../../Components/Shared/PageStack';
import Button          from '../../Components/UI/Button';
import Input           from '../../Components/UI/Input';
import Select          from '../../Components/UI/Select';
import Badge           from '../../Components/UI/Badge';
import ConfirmDialog   from '../../Components/Shared/ConfirmDialog';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const STATUS_VARIANT = {
    inquiry  : 'info',
    quoted   : 'warning',
    confirmed: 'success',
    cancelled: 'error',
};

export default function OrmocBranchIndex({
    bookings,
    filters,
    statuses,
    bookingTypes,
    agentCodes,
    canWrite,
}) {
    const { flash } = usePage().props;

    const [searchInput,  setSearchInput ] = useState(filters.search ?? '');

    // ─── Detail panel ──────────────────────────────────────────────────────────
    const panel = useDetailPanel((id) => route('ormoc.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;
    function openPanel(row) { setShowPanel(true); panel.open(row); }

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting    ] = useState(false);

    function applyFilter(overrides = {}) {
        router.get(
            route('ormoc.index'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true },
        );
    }

    function handleSearchKey(e) { if (e.key === 'Enter') applyFilter(); }

    function clearFilters() {
        setSearchInput('');
        router.get(route('ormoc.index'), {}, { preserveState: false });
    }

    function handleDelete() {
        setDeleting(true);
        router.delete(route('ormoc.destroy', deleteTarget.id), {
            onFinish: () => { setDeleting(false); setDeleteTarget(null); },
        });
    }

    const columns = [
        {
            key   : 'date',
            label : 'Date',
            render: (row) => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {new Date(row.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            ),
        },
        {
            key   : 'agent_code',
            label : 'Agent',
            render: (row) => (
                <span
                    className="inline-flex items-center justify-center font-body font-semibold"
                    style={{
                        fontSize     : 'var(--font-size-small)',
                        background   : 'var(--color-primary)',
                        color        : '#fff',
                        borderRadius: "var(--radius-md)",
                        padding      : '2px 10px',
                        minWidth     : 36,
                    }}
                >
                    {row.agent_code}
                </span>
            ),
        },
        {
            key   : 'client_name',
            label : 'Client',
            render: (row) => (
                <div>
                    <p className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)', margin: 0 }}>
                        {row.client_name}
                    </p>
                    {row.destination && (
                        <p className="font-body text-[var(--color-text)]" style={{ fontSize: 11, opacity: 0.55, margin: 0 }}>
                            {row.destination}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key   : 'booking_type',
            label : 'Type',
            render: (row) => (
                <Badge variant={row.booking_type === 'international' ? 'info' : 'neutral'}>
                    {bookingTypes[row.booking_type] ?? row.booking_type}
                </Badge>
            ),
        },
        {
            key   : 'status',
            label : 'Status',
            render: (row) => (
                <div className="flex flex-col" style={{ gap: 4 }}>
                    <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>
                        {statuses[row.status] ?? row.status}
                    </Badge>
                    {row.escalated_to_head_office && (
                        <span
                            className="inline-flex items-center gap-1 font-body"
                            style={{ fontSize: 11, color: 'var(--color-info)' }}
                        >
                            <ArrowUpRight size={11} /> Escalated
                        </span>
                    )}
                    {row.passport_expiry_flagged && (
                        <span
                            className="inline-flex items-center gap-1 font-body"
                            style={{ fontSize: 11, color: 'var(--color-warning)' }}
                        >
                            <AlertTriangle size={11} /> Passport ⚠
                        </span>
                    )}
                </div>
            ),
        },
        {
            key   : 'selling_price',
            label : 'Selling Price',
            render: (row) => row.selling_price
                ? <CurrencyDisplay amount={row.selling_price} currency="PHP" />
                : <span style={{ fontSize: 'var(--font-size-small)', opacity: 0.4 }}>—</span>,
        },
        {
            key   : 'income',
            label : 'Income',
            render: (row) => row.income
                ? <CurrencyDisplay amount={row.income} currency="PHP" />
                : <span style={{ fontSize: 'var(--font-size-small)', opacity: 0.4 }}>—</span>,
        },
        {
            key   : 'forwarded_to_accounting',
            label : 'Forwarded',
            render: (row) => (
                <Badge variant={row.forwarded_to_accounting ? 'success' : 'neutral'}>
                    {row.forwarded_to_accounting ? 'Yes' : 'No'}
                </Badge>
            ),
        },
        {
            key   : '_actions',
            label : '',
            render: (row) => (
                <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
                    <Button variant="ghost" size="sm" icon={Eye}
                        onClick={(e) => { e.stopPropagation(); openPanel(row); }} />
                    {canWrite && (
                        <>
                            <Button variant="ghost" size="sm" icon={Pencil}
                                onClick={() => router.get(route('ormoc.edit', row.id))} />
                            <Button variant="ghost" size="sm" icon={Trash2}
                                onClick={() => setDeleteTarget(row)} />
                        </>
                    )}
                </div>
            ),
        },
    ];

    const agentOptions = [
        { value: '', label: 'All Agents' },
        ...agentCodes.map((c) => ({ value: c, label: c })),
    ];
    const statusOptions = [
        { value: '', label: 'All Statuses' },
        ...Object.entries(statuses).map(([v, l]) => ({ value: v, label: l })),
    ];
    const typeOptions = [
        { value: '', label: 'All Types' },
        ...Object.entries(bookingTypes).map(([v, l]) => ({ value: v, label: l })),
    ];

    return (
        <AppShell>
            <PageStack>

                {flash?.message && (
                    <div
                        className="font-body"
                        style={{
                            padding     : 'var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            background  : flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                            color       : '#fff',
                            fontSize    : 'var(--font-size-small)',
                        }}
                    >
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title="Ormoc Branch Bookings"
                    actions={
                        canWrite && (
                            <Button variant="primary" icon={Plus} onClick={() => router.get(route('ormoc.create'))}>
                                New Booking
                            </Button>
                        )
                    }
                />

                                <TableWithPanel
                    panelOpen={showPanel}
                    panel={
                        <DetailPanel
                open={showPanel}
                onClose={() => { setShowPanel(false); panel.close(); }}
                loading={panel.loading}
                error={panel.error}
                title={d?.booking?.client_name ?? ''}
                subtitle={''}
                badges={d?.booking && (
                <>
                    <Badge variant={STATUS_VARIANT[d.booking.status] ?? 'neutral'}>{d.statuses?.[d.booking.status] ?? d.booking.status}</Badge>
                    <Badge variant="neutral">{d.bookingTypes?.[d.booking.booking_type] ?? d.booking.booking_type}</Badge>
                </>
            )}
            >
                {d?.booking && <OrmocContent booking={d.booking} statuses={d.statuses} bookingTypes={d.bookingTypes} paymentModes={d.paymentModes} canWrite={d.canWrite} />}
            </DetailPanel>
                    }
                >
                    <DataTable
                        panelOpen={showPanel}
                        selectedKey={panel.id}
                    columns={columns}
                    rows={bookings.data}
                    pagination={bookings}
                    onPageChange={(page) => applyFilter({ page })}
                    emptyIcon={<Package size={32} />}
                    emptyTitle="No bookings found"
                    emptyDescription="Create a new booking or adjust your filters."
                    toolbar={
                        <FilterStrip>
                            <FilterField grow>
                                <Input
                                    placeholder="Search client, destination, ref numbers..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKey}
                                    icon={Search}
                                />
                            </FilterField>
                            <FilterField width={140}>
                                <Select
                                    options={agentOptions}
                                    value={filters.agent ?? ''}
                                    onChange={(e) => applyFilter({ agent: e.target.value, page: 1 })}
                                />
                            </FilterField>
                            <FilterField width={150}>
                                <Select
                                    options={statusOptions}
                                    value={filters.status ?? ''}
                                    onChange={(e) => applyFilter({ status: e.target.value, page: 1 })}
                                />
                            </FilterField>
                            <FilterField width={140}>
                                <Select
                                    options={typeOptions}
                                    value={filters.booking_type ?? ''}
                                    onChange={(e) => applyFilter({ booking_type: e.target.value, page: 1 })}
                                />
                            </FilterField>
                            {(filters.search || filters.agent || filters.status || filters.booking_type) && (
                                <Button variant="ghost" onClick={clearFilters}>Clear</Button>
                            )}
                        </FilterStrip>
                    }
                />
                </TableWithPanel>

            
        </PageStack>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Remove Booking"
                message={`Remove booking for "${deleteTarget?.client_name}"? This is a soft delete — it can be recovered if needed.`}
                confirmLabel="Remove"
                confirmVariant="danger"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppShell>
    );
}
