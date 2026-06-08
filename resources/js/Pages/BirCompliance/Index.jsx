import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Download, Search, BarChart2, Banknote, Files, Receipt, Percent } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import DataTable from '../../Components/Shared/DataTable';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import StatCard from '../../Components/Shared/StatCard';
import StatGrid from '../../Components/Shared/StatGrid';
import Select from '../../Components/UI/Select';
import Input from '../../Components/UI/Input';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const DOC_VARIANT = {
    AR:  'success',
    SI:  'info',
    SOA: 'neutral',
};

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const php = (v) =>
    v != null ? '₱ ' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

function MonthlyCard({ summary, months, documentTypes }) {
    if (!summary || summary.length === 0) return null;

    const grouped = {};
    summary.forEach((row) => {
        const key = row.month;
        if (!grouped[key]) grouped[key] = {};
        grouped[key][row.document_type] = row;
    });

    return (
        <Card>
            <div
                className="font-heading font-semibold text-[var(--color-text)]"
                style={{ fontSize: 'var(--font-size-body)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
            >
                <BarChart2 size={18} style={{ color: 'var(--color-primary)' }} />
                Monthly BIR Summary
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-small)' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-table-header-bg)' }}>
                            <th style={thStyle}>Month</th>
                            {Object.keys(documentTypes).map((type) => (
                                <th key={type} style={thStyle} colSpan={2}>
                                    {documentTypes[type]}
                                </th>
                            ))}
                        </tr>
                        <tr style={{ background: 'var(--color-table-header-bg)' }}>
                            <th style={thStyle}></th>
                            {Object.keys(documentTypes).map((type) => (
                                <>
                                    <th key={`${type}-cnt`} style={thStyle}>Count</th>
                                    <th key={`${type}-amt`} style={thStyle}>Gross</th>
                                </>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(grouped).map(([month, data]) => (
                            <tr key={month} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <td style={tdStyle}>{months[Number(month) - 1]}</td>
                                {Object.keys(documentTypes).map((type) => {
                                    const row = data[type];
                                    return (
                                        <>
                                            <td key={`${type}-cnt`} style={{ ...tdStyle, textAlign: 'center' }}>
                                                {row ? row.count : '—'}
                                            </td>
                                            <td key={`${type}-amt`} style={{ ...tdStyle, textAlign: 'right' }}>
                                                {row ? php(row.total_gross) : '—'}
                                            </td>
                                        </>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

const thStyle = {
    padding     : '8px 12px',
    fontWeight  : 600,
    color       : 'var(--color-text)',
    textAlign   : 'left',
    borderBottom: 'var(--border-table-header)',
    whiteSpace  : 'nowrap',
};

const tdStyle = {
    padding       : '10px 12px',
    color         : 'var(--color-text)',
    verticalAlign : 'middle',
    fontSize      : 'var(--font-size-small)',
};

export default function BirIndex({
    transactions,
    monthlySummary,
    totals,
    filters,
    documentTypes,
    months,
    currentYear,
    years,
    canGenerate,
}) {
    const { flash } = usePage().props;

    const [searchInput, setSearchInput] = useState(filters.search ?? '');

    function applyFilter(overrides = {}) {
        router.get(
            route('bir.index'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true }
        );
    }

    function handleSearchKey(e) { if (e.key === 'Enter') applyFilter(); }

    function clearFilters() {
        setSearchInput('');
        router.get(route('bir.index'), {}, { preserveState: false });
    }

    function handleExport() {
        router.post(route('bir.export-monthly'), { year: filters.year, month: filters.month });
    }

    const hasActiveFilters = filters.search || filters.year || filters.month || filters.document_type;

    const columns = [
        {
            key   : 'transaction_date',
            label : 'Date',
            render: (row) => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {fmt(row.transaction_date)}
                </span>
            ),
        },
        {
            key   : 'document_number',
            label : 'Document #',
            render: (row) => (
                <span className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-primary)' }}>
                    {row.document_number ?? '—'}
                </span>
            ),
        },
        {
            key   : 'document_type',
            label : 'Type',
            render: (row) => (
                <Badge variant={DOC_VARIANT[row.document_type] ?? 'neutral'}>
                    {row.document_type}
                </Badge>
            ),
        },
        {
            key   : 'client_name',
            label : 'Client',
            render: (row) => (
                <div>
                    <div className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                        {row.client_name}
                    </div>
                    {row.tin && (
                        <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                            TIN: {row.tin}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key   : 'gross_amount',
            label : 'Gross Amount',
            render: (row) => (
                <span className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {php(row.gross_amount)}
                </span>
            ),
        },
        {
            key   : 'net_amount_due',
            label : 'Net Due',
            render: (row) => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {php(row.net_amount_due)}
                </span>
            ),
        },
        {
            key   : 'branch',
            label : 'Branch',
            render: (row) => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.branch?.name ?? '—'}
                </span>
            ),
        },
        {
            key   : 'pdf_generated',
            label : 'PDF',
            render: (row) => (
                row.pdf_generated
                    ? <Badge variant="success">Generated</Badge>
                    : <Badge variant="warning">Pending</Badge>
            ),
        },
        {
            key   : 'actions',
            label : '',
            render: (row) => (
                <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.get(route('bir.show', row.id))}
                    >
                        View
                    </Button>
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
                        background  : flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-info)',
                        color       : '#fff',
                        fontSize    : 'var(--font-size-small)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title="BIR / Compliance"
                    subtitle={`${transactions.total ?? 0} transaction${transactions.total !== 1 ? 's' : ''}`}
                    actions={
                        <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
                            <Button
                                variant="primary"
                                icon={Download}
                                onClick={handleExport}
                            >
                                Export Monthly
                            </Button>
                            {canGenerate && (
                                <Button
                                    icon={Plus}
                                    onClick={() => router.get(route('bir.create'))}
                                >
                                    New Transaction
                                </Button>
                            )}
                        </div>
                    }
                />

                {totals && (
                    <StatGrid>
                        <StatCard icon={Files} label="Total Records" value={totals.total_count ?? 0} />
                        <StatCard icon={Banknote} label="Gross Amount" value={<CurrencyDisplay amount={totals.total_gross ?? 0} currency="PHP" />} />
                        <StatCard icon={Receipt} label="VATAble Sales" value={<CurrencyDisplay amount={totals.total_vatable ?? 0} currency="PHP" />} />
                        <StatCard icon={Percent} label="VAT Amount" value={<CurrencyDisplay amount={totals.total_vat ?? 0} currency="PHP" />} tone="warning" />
                        <StatCard icon={Percent} label="Withholding Tax" value={<CurrencyDisplay amount={totals.total_wht ?? 0} currency="PHP" />} tone="warning" />
                        <StatCard icon={Banknote} label="Net Amount Due" value={<CurrencyDisplay amount={totals.total_net ?? 0} currency="PHP" />} tone="success" />
                    </StatGrid>
                )}

                {/* Monthly summary */}
                <MonthlyCard summary={monthlySummary} months={months} documentTypes={documentTypes} />

                {/* Transactions table */}
                <DataTable
                    columns={columns}
                    rows={transactions.data ?? []}
                    pagination={transactions}
                    onPageChange={(page) =>
                        router.get(route('bir.index'), { ...filters, search: searchInput, page }, { preserveState: true })
                    }
                    toolbar={
                        <FilterStrip>
                            <FilterField grow>
                                <Input
                                    placeholder="Client, TIN, document #..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKey}
                                    icon={Search}
                                />
                            </FilterField>
                            <FilterField width={110}>
                                <Select
                                    options={years.map((y) => ({ value: y, label: y }))}
                                    value={filters.year ?? currentYear}
                                    onChange={(e) => applyFilter({ year: e.target.value, page: 1 })}
                                />
                            </FilterField>
                            <FilterField width={150}>
                                <Select
                                    options={[{ value: '', label: 'All Months' }, ...months.map((m, i) => ({ value: i + 1, label: m }))]}
                                    value={filters.month ?? ''}
                                    onChange={(e) => applyFilter({ month: e.target.value || undefined, page: 1 })}
                                />
                            </FilterField>
                            <FilterField width={180}>
                                <Select
                                    options={[{ value: '', label: 'All Types' }, ...Object.entries(documentTypes).map(([v, l]) => ({ value: v, label: `${v} - ${l}` }))]}
                                    value={filters.document_type ?? ''}
                                    onChange={(e) => applyFilter({ document_type: e.target.value || undefined, page: 1 })}
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
