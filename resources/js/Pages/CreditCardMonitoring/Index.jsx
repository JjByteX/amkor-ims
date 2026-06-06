import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Search, Eye, CreditCard as CardIcon } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Badge from '../../Components/UI/Badge';
import Card from '../../Components/UI/Card';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

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

export default function CreditCardIndex({ payments, cards, summary, filters, statuses, approvalStatuses, canWrite }) {
    const { flash } = usePage().props;
    const [searchInput, setSearchInput] = useState(filters.search ?? '');

    function applyFilter(overrides = {}) {
        router.get(route('credit-cards.index'), { ...filters, search: searchInput, ...overrides }, { preserveState: true, preserveScroll: true });
    }

    function handleSearchKey(e) { if (e.key === 'Enter') applyFilter(); }

    function clearFilters() {
        setSearchInput('');
        router.get(route('credit-cards.index'), {}, { preserveState: false });
    }

    const hasActiveFilters = filters.search || filters.card_id || filters.status || filters.month;

    const cardOptions = [
        { value: '', label: 'All Cards' },
        ...cards.map(c => ({
            value: String(c.id),
            label: `${c.card_name}${c.last_four ? ` (••${c.last_four})` : ''}`,
        })),
    ];

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        ...Object.entries(statuses).map(([v, l]) => ({ value: v, label: l })),
    ];

    const columns = [
        {
            key: 'payment_no',
            label: 'Ref No.',
            render: row => (
                <span className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-primary)' }}>
                    {row.payment_no}
                </span>
            ),
        },
        {
            key: 'credit_card',
            label: 'Card',
            render: row => (
                <div>
                    <div className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                        {row.credit_card?.card_name ?? '—'}
                    </div>
                    {row.credit_card?.last_four && (
                        <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                            •••• {row.credit_card.last_four}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'Amount',
            render: row => <CurrencyDisplay amount={row.amount} currency="PHP" />,
        },
        {
            key: 'due_date',
            label: 'Due Date',
            render: row => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.due_date}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: row => (
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
            key: 'actions',
            label: '',
            render: row => (
                <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => router.visit(route('credit-cards.show', row.id))}
                        title="View"
                    />
                </div>
            ),
        },
    ];

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

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
                    title="Credit Card Monitoring"
                    subtitle={`${payments.total} payment${payments.total !== 1 ? 's' : ''}`}
                    actions={
                        <div className="flex" style={{ gap: 'var(--space-2)' }}>
                            <Button
                                variant="secondary"
                                icon={CardIcon}
                                onClick={() => router.visit(route('credit-cards.cards.index'))}
                            >
                                Manage Cards
                            </Button>
                            {canWrite && (
                                <Button
                                    variant="primary"
                                    icon={Plus}
                                    onClick={() => router.visit(route('credit-cards.create'))}
                                >
                                    Record Payment
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Summary */}
                {summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-2)' }}>
                        {[
                            { label: 'Total Amount',  value: summary.total_amount,  color: 'var(--color-text)' },
                            { label: 'Total Records', value: summary.total_count,   color: 'var(--color-text)', isCount: true },
                            { label: 'Pending',       value: summary.pending_count, color: 'var(--color-warning)', isCount: true },
                            { label: 'Overdue',       value: summary.overdue_count, color: 'var(--color-error)', isCount: true },
                        ].map((s) => (
                            <Card key={s.label}>
                                <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>{s.label}</div>
                                <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color: s.color, marginTop: 4 }}>
                                    {s.isCount ? (s.value ?? 0) : <CurrencyDisplay amount={s.value ?? 0} currency="PHP" />}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-center" style={{ gap: 'var(--space-2)' }}>
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder="Search payments…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKey}
                            icon={Search}
                        />
                    </div>
                    <div className="min-w-[180px]">
                        <Select
                            options={cardOptions}
                            value={filters.card_id ?? ''}
                            onChange={(e) => applyFilter({ card_id: e.target.value, page: 1 })}
                        />
                    </div>
                    <div className="min-w-[160px]">
                        <Select
                            options={statusOptions}
                            value={filters.status ?? ''}
                            onChange={(e) => applyFilter({ status: e.target.value, page: 1 })}
                        />
                    </div>
                    <div className="min-w-[160px]">
                        <Input
                            type="month"
                            value={filters.month ?? ''}
                            onChange={(e) => applyFilter({ month: e.target.value, page: 1 })}
                        />
                    </div>
                    {hasActiveFilters && (
                        <Button variant="ghost" onClick={clearFilters}>Clear</Button>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    rows={payments.data ?? []}
                    pagination={payments}
                    onPageChange={(page) => applyFilter({ page })}
                />
            </div>
        </AppShell>
    );
}
