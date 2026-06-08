import { useState } from 'react';
import { router } from '@inertiajs/react';
import { BanknoteArrowDown, BanknoteArrowUp, ChartSpline, ClipboardList, FileText, Search, Users } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import StatCard from '../../Components/Shared/StatCard';
import StatGrid from '../../Components/Shared/StatGrid';
import Badge from '../../Components/UI/Badge';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';

const money = (v) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(v ?? 0));
const date = (v) => v ? new Date(v).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
const badge = { inquiry: 'neutral', quoted: 'info', confirmed: 'success', cancelled: 'error' };

export default function SalesReport({ bookings, summary, filters, statuses, serviceTypes, paymentModes, agentCodes }) {
    const [search, setSearch] = useState(filters.search ?? '');

    function apply(overrides = {}) {
        router.get(route('reservation.sales-report'), { ...filters, search, ...overrides }, { preserveState: true, preserveScroll: true });
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
                    <div className="text-gray-400">{row.corporate_account ?? row.destination ?? '-'}</div>
                </div>
            ),
        },
        { key: 'agent_code', label: 'Agent' },
        {
            key: 'service_type',
            label: 'Type',
            render: (row) => <Badge variant="info">{serviceTypes[row.service_type] ?? row.service_type ?? '-'}</Badge>,
        },
        { key: 'pax_count', label: 'Pax', render: (row) => row.pax_count ?? '-' },
        { key: 'travel_date', label: 'Travel', render: (row) => date(row.travel_date) },
        { key: 'selling_price', label: 'Selling Price', render: (row) => money(row.selling_price) },
        { key: 'net_payable', label: 'Net Payable', render: (row) => money(row.net_payable) },
        { key: 'income', label: 'Income', render: (row) => money(row.income) },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <Badge variant={badge[row.status] ?? 'neutral'}>{statuses[row.status] ?? row.status}</Badge>,
        },
        {
            key: 'mode_of_payment',
            label: 'Payment',
            render: (row) => paymentModes[row.mode_of_payment] ?? row.mode_of_payment ?? '-',
        },
    ];

    return (
        <AppShell>
            <PageStack>
                <PageHeader
                    title="RESA Sales Report"
                    subtitle={`${bookings.total ?? 0} booking${bookings.total === 1 ? '' : 's'} across reservation sales`}
                />

                <StatGrid>
                    <StatCard icon={ClipboardList} label="Records" value={summary.total} />
                    <StatCard icon={Users} label="Pax" value={summary.pax} />
                    <StatCard icon={BanknoteArrowUp} label="Gross Sales" value={money(summary.gross)} />
                    <StatCard icon={BanknoteArrowDown} label="Net Payable" value={money(summary.gross - summary.income)} tone="warning" />
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
                            <FilterField width={150}>
                                <Input type="month" value={filters.month ?? ''} onChange={(e) => apply({ month: e.target.value })} />
                            </FilterField>
                            <FilterField>
                                <Select value={filters.status ?? ''} onChange={(e) => apply({ status: e.target.value })} placeholder="All statuses" options={[{ value: '', label: 'All statuses' }, ...Object.entries(statuses).map(([value, label]) => ({ value, label }))]} />
                            </FilterField>
                            <FilterField>
                                <Select value={filters.agent ?? ''} onChange={(e) => apply({ agent: e.target.value })} placeholder="All agents" options={[{ value: '', label: 'All agents' }, ...agentCodes.map((code) => ({ value: code, label: code }))]} />
                            </FilterField>
                            <FilterField>
                                <Select value={filters.serviceType ?? ''} onChange={(e) => apply({ service_type: e.target.value })} placeholder="All types" options={[{ value: '', label: 'All types' }, ...Object.entries(serviceTypes).map(([value, label]) => ({ value, label }))]} />
                            </FilterField>
                            <Button variant="secondary" onClick={() => apply()}>Apply</Button>
                        </FilterStrip>
                    }
                />
            </PageStack>
        </AppShell>
    );
}
