import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Search, Edit2, Banknote, Files, Download } from 'lucide-react';
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
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const CATEGORY_VARIANT = {
    cash:          'info',
    check:         'neutral',
    liaison_admin: 'warning',
    liaison_banks: 'warning',
};

const FUND_TYPE_VARIANT = {
    cash_on_hand: 'success',
    cash_on_bank: 'info',
    petty_cash:   'warning',
};

export default function LedgerIndex({
    entries, summary, filters,
    categories, fundTypes, canWrite,
}) {
    const { flash } = usePage().props;
    const [searchInput, setSearchInput] = useState(filters.search ?? '');

    const hasActiveFilters = filters.search || filters.category || filters.month || searchInput;

    function applyFilter(overrides = {}) {
        router.get(
            route('disbursement.ledger.index'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true },
        );
    }

    function handleSearchKey(e) { if (e.key === 'Enter') applyFilter(); }

    function clearFilters() {
        setSearchInput('');
        router.get(route('disbursement.ledger.index'), {}, { preserveState: false });
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
            key: 'category', label: 'Category',
            render: (row) => (
                <Badge variant={CATEGORY_VARIANT[row.category] ?? 'neutral'}>
                    {categories[row.category] ?? row.category}
                </Badge>
            ),
        },
        {
            key: 'payee', label: 'Payee / Description',
            render: (row) => (
                <div>
                    {row.payee && (
                        <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', fontWeight: 600 }}>
                            {row.payee}
                        </p>
                    )}
                    {row.description && (
                        <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>
                            {row.description.length > 60 ? row.description.substring(0, 60) + '…' : row.description}
                        </p>
                    )}
                    {row.reference_no && (
                        <p style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.5 }}>
                            Ref: {row.reference_no}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'fund_type', label: 'Fund',
            render: (row) => (
                <Badge variant={FUND_TYPE_VARIANT[row.fund_type] ?? 'neutral'}>
                    {fundTypes[row.fund_type] ?? row.fund_type}
                </Badge>
            ),
        },
        {
            key: 'amount', label: 'Amount',
            render: (row) => (
                <span className="font-heading" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    <CurrencyDisplay amount={row.amount ?? 0} currency={row.currency ?? 'PHP'} />
                </span>
            ),
        },
        {
            key: 'access_file_period', label: 'Period',
            render: (row) => (
                <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: row.access_file_period ? 1 : 0.4 }}>
                    {row.access_file_period
                        ? new Date(row.access_file_period).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Unassigned'}
                </span>
            ),
        },
        {
            key: 'actions', label: '',
            render: (row) => (
                canWrite && (
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit2 size={16} />}
                        onClick={() => router.get(route('disbursement.ledger.edit', row.id))}
                    />
                )
            ),
        },
    ];

    return (
        <AppShell>
            <PageStack>

                <PageHeader
                    title="Disbursement Ledger"
                    subtitle="Daily cash and check disbursement entries"
                    actions={
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                            {canWrite && (
                                <>
                                    <Button
                                        variant="primary"
                                        icon={<Download size={16} />}
                                        onClick={() => { window.location.href = route('disbursement.access-file-export'); }}
                                    >
                                        Export Access File
                                    </Button>
                                    <Button
                                        variant="primary"
                                        icon={<Plus size={16} />}
                                        onClick={() => router.get(route('disbursement.ledger.create'))}
                                    >
                                        New Entry
                                    </Button>
                                </>
                            )}
                        </div>
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
                        <StatCard icon={Banknote} label="Total Disbursed" value={<CurrencyDisplay amount={summary.total_amount ?? 0} currency="PHP" />} />
                        <StatCard icon={Files} label="Total Entries" value={summary.total_count ?? 0} />
                        <StatCard icon={Download} label="Access File Export" value="Bimonthly" sub="1st–15th and 16th–EOM" />
                    </StatGrid>
                )}

                <DataTable
                    columns={columns}
                    rows={entries.data ?? []}
                    pagination={entries}
                    onPageChange={(page) => applyFilter({ page })}
                    toolbar={
                        <FilterStrip>
                            <FilterField grow>
                                <Input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKey}
                                    icon={Search}
                                    placeholder="Payee, description, reference..."
                                />
                            </FilterField>
                            <FilterField width={190}>
                                <Select
                                    value={filters.category ?? ''}
                                    onChange={(e) => applyFilter({ category: e.target.value || undefined })}
                                    options={[
                                        { value: '', label: 'All Categories' },
                                        ...Object.entries(categories).map(([v, l]) => ({ value: v, label: l })),
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

            </PageStack>
        </AppShell>
    );
}