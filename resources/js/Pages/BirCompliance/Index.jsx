import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Download, Search, BarChart2 } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import DataTable from '../../Components/Shared/DataTable';
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
                        <tr style={{ background: 'var(--color-bg)' }}>
                            <th style={thStyle}>Month</th>
                            {Object.keys(documentTypes).map((type) => (
                                <th key={type} style={thStyle} colSpan={2}>
                                    {documentTypes[type]}
                                </th>
                            ))}
                        </tr>
                        <tr style={{ background: 'var(--color-bg)' }}>
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
    borderBottom: '2px solid rgba(0,0,0,0.08)',
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
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

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
                                variant="secondary"
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

                {/* Summary strip */}
                {totals && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-2)' }}>
                        {[
                            { label: 'Total Records',    value: totals.total_count,   color: 'var(--color-text)',    isCount: true },
                            { label: 'Gross Amount',     value: totals.total_gross,   color: 'var(--color-text)' },
                            { label: 'VATAble Sales',    value: totals.total_vatable, color: 'var(--color-text)' },
                            { label: 'VAT Amount (12%)', value: totals.total_vat,     color: 'var(--color-warning)' },
                            { label: 'Withholding Tax',  value: totals.total_wht,     color: 'var(--color-warning)' },
                            { label: 'Net Amount Due',   value: totals.total_net,     color: 'var(--color-success)' },
                        ].map((item) => (
                            <Card key={item.label}>
                                <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                    {item.label}
                                </div>
                                <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color: item.color, marginTop: 4 }}>
                                    {item.isCount
                                        ? (item.value ?? 0)
                                        : <CurrencyDisplay amount={item.value ?? 0} currency="PHP" />
                                    }
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Filters — no card, no labels, search first, dropdowns fire immediately */}
                <div className="flex flex-wrap items-center" style={{ gap: 'var(--space-2)' }}>
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder="Client, TIN, document #…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKey}
                            icon={Search}
                        />
                    </div>
                    <div className="min-w-[100px]">
                        <Select
                            options={years.map((y) => ({ value: y, label: y }))}
                            value={filters.year ?? currentYear}
                            onChange={(e) => applyFilter({ year: e.target.value, page: 1 })}
                        />
                    </div>
                    <div className="min-w-[140px]">
                        <Select
                            options={[{ value: '', label: 'All Months' }, ...months.map((m, i) => ({ value: i + 1, label: m }))]}
                            value={filters.month ?? ''}
                            onChange={(e) => applyFilter({ month: e.target.value || undefined, page: 1 })}
                        />
                    </div>
                    <div className="min-w-[160px]">
                        <Select
                            options={[{ value: '', label: 'All Types' }, ...Object.entries(documentTypes).map(([v, l]) => ({ value: v, label: `${v} — ${l}` }))]}
                            value={filters.document_type ?? ''}
                            onChange={(e) => applyFilter({ document_type: e.target.value || undefined, page: 1 })}
                        />
                    </div>
                    {hasActiveFilters && (
                        <Button variant="ghost" onClick={clearFilters}>Clear</Button>
                    )}
                </div>

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
                />
            </div>
        </AppShell>
    );
}
