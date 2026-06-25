import { useState } from 'react';
import { router } from '@inertiajs/react';
import DetailPanel, { TableWithPanel, useDetailPanel } from '../../Components/Shared/DetailPanel';
import { BookingContent } from './Show';

import { BanknoteArrowDown, BanknoteArrowUp, ChartSpline, CircleCheckBig, Eye, Plus, Search, Users } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import StatCard from '../../Components/Shared/StatCard';
import StatGrid from '../../Components/Shared/StatGrid';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';

const money = (v) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(v ?? 0));
const date  = (v) => v ? new Date(v).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

const STATUS_VARIANT  = { inquiry: 'neutral', quoted: 'info', confirmed: 'success', cancelled: 'error' };
const BOOKING_VARIANT = { domestic: 'neutral', international: 'neutral' };

/**
 * ReservationIndex — Reservation & Booking list for ALL branches.
 *
 * Branch-scoped roles (branch_supervisor, branch_sales_officer, QC sales roles)
 * only see their own records — enforced server-side. This page shows/hides the
 * booking_type filter and the Branch column based on the `isOrmocBranch` prop
 * so the UI stays clean for QC staff.
 *
 * All-access roles (president, COO, GSM, etc.) see all rows from all branches.
 */
export default function ReservationIndex({
    bookings,
    summary,
    filters,
    statuses,
    serviceTypes,
    bookingTypes,
    paymentModes,
    agentCodes,
    canWrite,
    isOrmocBranch,
}) {
    const [search, setSearch] = useState(filters.search ?? '');

    const panel = useDetailPanel((id) => route('reservation.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;

    function openPanel(row) { setShowPanel(true); panel.open(row); }

    function apply(overrides = {}) {
        router.get(
            route('reservation.index'),
            { ...filters, search, ...overrides },
            { preserveState: true, preserveScroll: true },
        );
    }

    // All-access roles see rows from all branches → show Branch column.
    // Branch-scoped roles only see their own branch → Branch column is redundant.
    const showBranchColumn = !isOrmocBranch && !['sales_reservation_officer', 'sales_ticketing_officer', 'group_sales_officer'].includes(filters._role);

    const columns = [
        {
            key   : 'booking',
            label : 'Booking',
            render: (row) => (
                <div>
                    <div className="font-semibold text-[var(--color-text)]">{row.booking_no}</div>
                    <div style={{ color: "var(--color-text-muted)" }}>{date(row.date)}</div>
                </div>
            ),
        },
        {
            key   : 'client',
            label : 'Client',
            render: (row) => (
                <div>
                    <div className="font-semibold text-[var(--color-text)]">{row.client_name}</div>
                    <div style={{ color: "var(--color-text-muted)" }}>{row.destination ?? '-'}</div>
                </div>
            ),
        },
        { key: 'agent_code', label: 'Agent' },
        { key: 'travel_date', label: 'Travel', render: (row) => date(row.travel_date) },
        // Ormoc bookings: show booking type badge instead of a separate column
        ...(isOrmocBranch ? [{
            key   : 'booking_type',
            label : 'Type',
            render: (row) => row.booking_type
                ? <Badge variant={BOOKING_VARIANT[row.booking_type] ?? 'neutral'}>{bookingTypes?.[row.booking_type] ?? row.booking_type}</Badge>
                : <span style={{ color: "var(--color-text-muted)" }}>—</span>,
        }] : []),
        // All-access roles: show which branch the booking belongs to
        ...(showBranchColumn ? [{
            key   : 'branch',
            label : 'Branch',
            render: (row) => <span className="text-gray-500" style={{ fontSize: 'var(--font-size-small)' }}>{row.branch?.name ?? '—'}</span>,
        }] : []),
        { key: 'selling_price', label: 'Sales',  align: 'right', render: (row) => money(row.selling_price) },
        { key: 'income',        label: 'Income', align: 'right', render: (row) => money(row.income) },
        {
            key   : 'status',
            label : 'Status',
            render: (row) => (
                <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>
                    {statuses[row.status] ?? row.status}
                </Badge>
            ),
        },
        {
            key   : 'actions',
            label : '',
            render: (row) => (
                <Button
                    size="sm"
                    variant="ghost"
                    icon={Eye}
                    onClick={(e) => { e.stopPropagation(); openPanel(row); }}
                />
            ),
        },
    ];

    return (
        <AppShell>
            <PageStack>
                <PageHeader
                    title="Reservation & Booking"
                    subtitle={`${bookings.total ?? 0} booking${bookings.total === 1 ? '' : 's'}`}
                    actions={canWrite && (
                        <Button icon={Plus} onClick={() => router.get(route('reservation.create'))}>
                            New Booking
                        </Button>
                    )}
                />

                <StatGrid>
                    <StatCard icon={CircleCheckBig}    label="Confirmed"   value={summary.confirmed}              tone="success" />
                    <StatCard icon={Users}             label="Pax"         value={summary.pax ?? 0} />
                    <StatCard icon={BanknoteArrowUp}   label="Gross Sales" value={money(summary.gross)} />
                    <StatCard icon={BanknoteArrowDown} label="Net Payable" value={money(summary.gross - summary.income)} tone="warning" />
                    <StatCard icon={ChartSpline}       label="Income"      value={money(summary.income)}          tone="primary" />
                </StatGrid>

                <TableWithPanel
                    panelOpen={showPanel}
                    panel={
                        <DetailPanel
                            open={showPanel}
                            onClose={() => { setShowPanel(false); panel.close(); }}
                            loading={panel.loading}
                            error={panel.error}
                            title={d?.booking?.booking_no ?? d?.booking?.client_name ?? ''}
                            subtitle={d?.booking?.booking_no ? d.booking.client_name : undefined}
                            badges={d?.booking && (
                                <>
                                    <Badge variant={STATUS_VARIANT[d.booking.status] ?? 'neutral'}>
                                        {d.statuses?.[d.booking.status] ?? d.booking.status}
                                    </Badge>
                                    {d.booking.branch?.code === 'ORMOC' && d.booking.booking_type && (
                                        <Badge variant={BOOKING_VARIANT[d.booking.booking_type] ?? 'neutral'}>
                                            {d.bookingTypes?.[d.booking.booking_type] ?? d.booking.booking_type}
                                        </Badge>
                                    )}
                                    {d.booking.forwarded_to_accounting && (
                                        <Badge variant="success">Forwarded to Accounting</Badge>
                                    )}
                                </>
                            )}
                        >
                            {d?.booking && (
                                <BookingContent
                                    booking={d.booking}
                                    statuses={d.statuses}
                                    serviceTypes={d.serviceTypes}
                                    bookingTypes={d.bookingTypes}
                                    transactionTypes={d.transactionTypes}
                                    paymentModes={d.paymentModes}
                                    canWrite={d.canWrite}
                                    canAcknowledge={d.canAcknowledge}
                                    isOrmocBranch={d.booking.branch?.code === 'ORMOC'}
                                />
                            )}
                        </DetailPanel>
                    }
                >
                    <DataTable
                        rows={bookings.data ?? []}
                        columns={columns}
                        pagination={bookings}
                        onPageChange={(page) => apply({ page })}
                        panelOpen={showPanel}
                        selectedKey={panel.id}
                        toolbar={
                            <FilterStrip>
                                <FilterField grow>
                                    <Input
                                        icon={Search}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && apply()}
                                        placeholder="Booking #, client, destination..."
                                    />
                                </FilterField>
                                <FilterField>
                                    <Select
                                        value={filters.status ?? ''}
                                        onChange={(e) => apply({ status: e.target.value })}
                                        placeholder="All statuses"
                                        options={[
                                            { value: '', label: 'All statuses' },
                                            ...Object.entries(statuses).map(([value, label]) => ({ value, label })),
                                        ]}
                                    />
                                </FilterField>
                                {/* Booking type filter — shown to Ormoc branch users and all-access roles */}
                                {(isOrmocBranch || showBranchColumn) && bookingTypes && (
                                    <FilterField>
                                        <Select
                                            value={filters.booking_type ?? ''}
                                            onChange={(e) => apply({ booking_type: e.target.value })}
                                            placeholder="All types"
                                            options={[
                                                { value: '', label: 'All types' },
                                                ...Object.entries(bookingTypes).map(([value, label]) => ({ value, label })),
                                            ]}
                                        />
                                    </FilterField>
                                )}
                                <FilterField>
                                    <Select
                                        value={filters.agent ?? ''}
                                        onChange={(e) => apply({ agent: e.target.value })}
                                        placeholder="All agents"
                                        options={[
                                            { value: '', label: 'All agents' },
                                            ...agentCodes.map((code) => ({ value: code, label: code })),
                                        ]}
                                    />
                                </FilterField>
                                <FilterField width={150}>
                                    <Input
                                        type="month"
                                        value={filters.month ?? ''}
                                        onChange={(e) => apply({ month: e.target.value })}
                                    />
                                </FilterField>
                            </FilterStrip>
                        }
                    />
                </TableWithPanel>
            </PageStack>
        </AppShell>
    );
}
