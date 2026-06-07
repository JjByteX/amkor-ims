import { useState } from 'react';
import { router } from '@inertiajs/react';
import { BanknoteArrowUp, ChartSpline, CircleCheckBig, ClipboardList, Eye, Plus, Search } from 'lucide-react';
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
const date = (v) => v ? new Date(v).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
const badge = { inquiry: 'neutral', quoted: 'info', confirmed: 'success', cancelled: 'error' };

export default function ReservationIndex({ bookings, summary, filters, statuses, agentCodes, canWrite }) {
    const [search, setSearch] = useState(filters.search ?? '');

    function apply(overrides = {}) {
        router.get(route('reservation.index'), { ...filters, search, ...overrides }, { preserveState: true, preserveScroll: true });
    }

    const columns = [
        {
            key: 'booking',
            label: 'Booking',
            render: (row) => (
                <div>
                    <div className="font-semibold text-[var(--color-text)]">{row.booking_no}</div>
                    <div className="text-gray-400">{date(row.date)}</div>
                </div>
            ),
        },
        {
            key: 'client',
            label: 'Client',
            render: (row) => (
                <div>
                    <div className="font-semibold text-[var(--color-text)]">{row.client_name}</div>
                    <div className="text-gray-400">{row.destination ?? '-'}</div>
                </div>
            ),
        },
        { key: 'agent_code', label: 'Agent' },
        { key: 'travel_date', label: 'Travel', render: (row) => date(row.travel_date) },
        { key: 'selling_price', label: 'Sales', render: (row) => money(row.selling_price) },
        { key: 'income', label: 'Income', render: (row) => money(row.income) },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <Badge variant={badge[row.status] ?? 'neutral'}>{statuses[row.status] ?? row.status}</Badge>,
        },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <Button size="sm" variant="ghost" icon={Eye} onClick={() => router.get(route('reservation.show', row.id))}>
                    View
                </Button>
            ),
        },
    ];

    return (
        <AppShell>
            <PageStack>
                <PageHeader
                    title="Reservation & Booking"
                    subtitle={`${bookings.total ?? 0} booking${bookings.total === 1 ? '' : 's'}`}
                    actions={canWrite && <Button icon={Plus} onClick={() => router.get(route('reservation.create'))}>New Booking</Button>}
                />

                <StatGrid>
                    <StatCard icon={ClipboardList} label="Records" value={summary.total} />
                    <StatCard icon={CircleCheckBig} label="Confirmed" value={summary.confirmed} tone="success" />
                    <StatCard icon={BanknoteArrowUp} label="Gross Sales" value={money(summary.gross)} />
                    <StatCard icon={ChartSpline} label="Income" value={money(summary.income)} tone="primary" />
                </StatGrid>

                <DataTable
                    rows={bookings.data ?? []}
                    columns={columns}
                    pagination={bookings}
                    onPageChange={(page) => apply({ page })}
                    toolbar={
                        <FilterStrip>
                            <FilterField grow>
                                <Input icon={Search} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder="Booking, client, destination..." />
                            </FilterField>
                            <FilterField>
                                <Select value={filters.status ?? ''} onChange={(e) => apply({ status: e.target.value })} placeholder="All statuses" options={[{ value: '', label: 'All statuses' }, ...Object.entries(statuses).map(([value, label]) => ({ value, label }))]} />
                            </FilterField>
                            <FilterField>
                                <Select value={filters.agent ?? ''} onChange={(e) => apply({ agent: e.target.value })} placeholder="All agents" options={[{ value: '', label: 'All agents' }, ...agentCodes.map((code) => ({ value: code, label: code }))]} />
                            </FilterField>
                            <FilterField width={150}>
                                <Input type="month" value={filters.month ?? ''} onChange={(e) => apply({ month: e.target.value })} />
                            </FilterField>
                            <Button variant="secondary" onClick={() => apply()}>Apply</Button>
                        </FilterStrip>
                    }
                />
            </PageStack>
        </AppShell>
    );
}
