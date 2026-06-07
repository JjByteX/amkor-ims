import { useState } from 'react';
import { router } from '@inertiajs/react';
import { CalendarDays, Eye, Plus, Search, TrendingUp, Users } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';

const money = (v) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(v ?? 0));
const date = (v) => v ? new Date(v).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
const badge = { inquiry: 'neutral', quoted: 'info', confirmed: 'success', cancelled: 'error' };

function Stat({ icon: Icon, label, value }) {
    return (
        <Card compact>
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-[var(--color-bg)]" style={{ borderRadius: 'var(--radius-md)' }}>
                    <Icon size={18} className="text-[var(--color-primary)]" />
                </div>
                <div>
                    <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>{label}</div>
                    <div className="font-heading font-semibold text-[var(--color-text)]">{value}</div>
                </div>
            </div>
        </Card>
    );
}

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
            <div className="flex min-h-0 flex-1 flex-col" style={{ gap: 'var(--space-section)' }}>
                <PageHeader
                    title="Reservation & Booking"
                    subtitle={`${bookings.total ?? 0} booking${bookings.total === 1 ? '' : 's'}`}
                    actions={canWrite && <Button icon={Plus} onClick={() => router.get(route('reservation.create'))}>New Booking</Button>}
                />

                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                    <Stat icon={Users} label="Records" value={summary.total} />
                    <Stat icon={CalendarDays} label="Confirmed" value={summary.confirmed} />
                    <Stat icon={TrendingUp} label="Gross Sales" value={money(summary.gross)} />
                    <Stat icon={TrendingUp} label="Income" value={money(summary.income)} />
                </div>

                <Card compact>
                    <div className="grid gap-3" style={{ gridTemplateColumns: 'minmax(220px, 1fr) repeat(3, minmax(140px, 180px)) auto' }}>
                        <Input icon={Search} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder="Booking, client, destination..." />
                        <Select value={filters.status ?? ''} onChange={(e) => apply({ status: e.target.value })} placeholder="All statuses" options={[{ value: '', label: 'All statuses' }, ...Object.entries(statuses).map(([value, label]) => ({ value, label }))]} />
                        <Select value={filters.agent ?? ''} onChange={(e) => apply({ agent: e.target.value })} placeholder="All agents" options={[{ value: '', label: 'All agents' }, ...agentCodes.map((code) => ({ value: code, label: code }))]} />
                        <Input type="month" value={filters.month ?? ''} onChange={(e) => apply({ month: e.target.value })} />
                        <Button variant="secondary" onClick={() => apply()}>Apply</Button>
                    </div>
                </Card>

                <DataTable
                    rows={bookings.data ?? []}
                    columns={columns}
                    pagination={bookings}
                    onPageChange={(page) => apply({ page })}
                />
            </div>
        </AppShell>
    );
}
