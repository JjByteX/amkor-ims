import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Download, Search, BarChart2, Banknote, Files, Receipt, Percent, Eye, FileText } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import DataTable, { tableThStyle, tableTdStyle } from '../../Components/Shared/DataTable';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import StatCard from '../../Components/Shared/StatCard';
import StatGrid from '../../Components/Shared/StatGrid';
import Select from '../../Components/UI/Select';
import Input from '../../Components/UI/Input';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';
import SegmentedControl from '../../Components/UI/SegmentedControl';
import DetailPanel, { TableWithPanel, useDetailPanel, PanelSection, PanelField, PanelFieldRow, PanelDivider, PanelColumns, PanelCol, PanelColRight } from '../../Components/Shared/DetailPanel';

const DOC_VARIANT = {
    AR : 'success',
    SI : 'info',
    SOA: 'neutral',
};

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const php = (v) =>
    v != null ? '₱ ' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';



const VIEW_TABS = [
    { key: 'transactions', label: 'Transactions',        icon: Files     },
    { key: 'monthly',      label: 'Monthly BIR Summary', icon: BarChart2 },
];

// ─── Detail panel content ─────────────────────────────────────────────────────
function BirPanelContent({ data }) {
    const { transaction, documentTypes, sourceTypes, paymentModes, canGenerate, atpNumber } = data;
    const isSI  = transaction.document_type === 'SI';
    const isSOA = transaction.document_type === 'SOA';

    function generatePdf() {
        const routeMap = { AR: 'documents.ar', SI: 'documents.si', SOA: 'documents.soa' };
        const r = routeMap[transaction.document_type];
        if (r) window.open(route(r, transaction.id), '_blank');
    }

    return (
        <PanelColumns>
            <PanelCol>
                <PanelSection title="Document">
                    <PanelField label="Document #"   value={transaction.document_number}                                    highlight />
                    <PanelField label="Type"         value={documentTypes?.[transaction.document_type] ?? transaction.document_type} />
                    <PanelField label="Date"         value={fmt(transaction.transaction_date)} />
                    {isSI && atpNumber && (
                        <PanelField label="BIR ATP No." value={atpNumber} />
                    )}
                    {isSOA && transaction.due_date && (
                        <PanelField label="Due Date" value={fmt(transaction.due_date)} />
                    )}
                    <PanelField label="Source"       value={sourceTypes?.[transaction.source_type] ?? transaction.source_type} />
                    <PanelField label="Branch"       value={transaction.branch?.name} />
                    <PanelField label="Created By"   value={transaction.created_by?.name} />
                </PanelSection>

                <PanelDivider />

                <PanelSection title="Client">
                    <PanelField label="Name"           value={transaction.client_name} />
                    <PanelField label="TIN"            value={transaction.tin} mono />
                    <PanelField label="Business Style" value={transaction.business_style} />
                    <PanelField label="Address"        value={transaction.address} />
                    <PanelField label="Particulars"    value={transaction.particulars} />
                </PanelSection>

                <PanelDivider />

                <PanelSection title="Payment">
                    <PanelField label="Mode"         value={paymentModes?.[transaction.mode_of_payment] ?? transaction.mode_of_payment} />
                    {transaction.check_number && (
                        <PanelField label="Check #"  value={transaction.check_number} mono />
                    )}
                    {transaction.remarks && (
                        <PanelField label="Remarks"  value={transaction.remarks} />
                    )}
                </PanelSection>
            </PanelCol>

            <PanelColRight>
                <PanelSection title="Amount Breakdown">
                    <PanelField label="Gross Amount"          value={php(transaction.gross_amount)} highlight />
                    <PanelField label="Total (VAT Inclusive)" value={php(transaction.total_sales_vat_inclusive)} />

                    {isSI && (
                        <>
                            <PanelDivider />
                            <PanelField label="VATAble Sales"        value={php(transaction.vatable_sales)} />
                            <PanelField label="VAT-Exempt Sales"     value={php(transaction.vat_exempt_sales)} />
                            <PanelField label="VAT Zero-Rated Sales" value={php(transaction.vat_zero_rated_sales)} />
                            <PanelField label="VAT Amount (12%)"     value={php(transaction.vat_amount)} />
                        </>
                    )}

                    {Number(transaction.sc_pwd_discount) > 0 && (
                        <PanelField label="SC/PWD Discount"      value={`- ${php(transaction.sc_pwd_discount)}`} />
                    )}
                    {Number(transaction.withholding_tax) > 0 && (
                        <PanelField label="Withholding Tax (2%)" value={`- ${php(transaction.withholding_tax)}`} />
                    )}

                    <PanelDivider />
                    <PanelField label="Net Amount Due" value={php(transaction.net_amount_due)} highlight />
                </PanelSection>

                <PanelDivider />

                <PanelSection title="PDF">
                    <PanelField
                        label="Status"
                        value={transaction.pdf_generated ? 'Generated' : 'Not yet generated'}
                    />
                    {transaction.pdf_generated_at && (
                        <PanelField label="Last Generated" value={fmt(transaction.pdf_generated_at)} />
                    )}
                </PanelSection>

                <PanelDivider />

                <PanelSection title="Actions">
                    <Button
                        size="sm"
                        icon={FileText}
                        onClick={generatePdf}
                        style={{ width: '100%' }}
                    >
                        Generate PDF
                    </Button>

                </PanelSection>
            </PanelColRight>
        </PanelColumns>
    );
}

// ─── Monthly summary table ────────────────────────────────────────────────────
function MonthlySummaryBody({ summary, months, documentTypes }) {
    if (!summary || summary.length === 0) {
        return (
            <div
                className="font-body text-[var(--color-text-muted)]"
                style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--font-size-small)' }}
            >
                No monthly summary data for the selected year.
            </div>
        );
    }

    const grouped = {};
    summary.forEach((row) => {
        if (!grouped[row.month]) grouped[row.month] = {};
        grouped[row.month][row.document_type] = row;
    });

    return (
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
            <table className="w-full border-collapse" style={{ flexShrink: 0 }}>
                <thead className="sticky top-0 z-10">
                    <tr>
                        <th style={tableThStyle}>Month</th>
                        {Object.keys(documentTypes).map((type) => (
                            <th key={type} style={{ ...tableThStyle, textAlign: 'center' }} colSpan={2}>
                                {documentTypes[type]}
                            </th>
                        ))}
                    </tr>
                    <tr>
                        <th style={tableThStyle} />
                        {Object.keys(documentTypes).map((type) => (
                            <>
                                <th key={`${type}-cnt`} style={{ ...tableThStyle, textAlign: 'center' }}>Count</th>
                                <th key={`${type}-amt`} style={{ ...tableThStyle, textAlign: 'right' }}>Gross</th>
                            </>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(grouped).map(([month, data]) => (
                        <tr key={month} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                            <td style={tableTdStyle}>{months[Number(month) - 1]}</td>
                            {Object.keys(documentTypes).map((type) => {
                                const row = data[type];
                                return (
                                    <>
                                        <td key={`${type}-cnt`} style={{ ...tableTdStyle, textAlign: 'center' }}>
                                            {row ? row.count : '—'}
                                        </td>
                                        <td key={`${type}-amt`} style={{ ...tableTdStyle, textAlign: 'right' }}>
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
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
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

    const [activeView,  setActiveView ] = useState('transactions');
    const [searchInput, setSearchInput] = useState(filters.search ?? '');

    // ─── Detail panel ─────────────────────────────────────────────────────────
    const panel = useDetailPanel((id) => route('bir.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;

    function openPanel(row) { setShowPanel(true); panel.open(row); }

    // ─── Filters ──────────────────────────────────────────────────────────────
    function applyFilter(overrides = {}) {
        router.get(
            route('bir.index'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true },
        );
    }

    function handleSearchKey(e) { if (e.key === 'Enter') applyFilter(); }

    function clearFilters() {
        setSearchInput('');
        router.get(route('bir.index'), {}, { preserveState: false });
    }

    function handleExport() {
        const params = new URLSearchParams();
        if (filters.year)  params.set('year',  filters.year);
        if (filters.month) params.set('month', filters.month);
        window.location.href = route('bir.export-monthly') + (params.toString() ? '?' + params.toString() : '');
    }

    const hasActiveFilters = filters.search || filters.year || filters.month || filters.document_type;

    // ─── Columns ──────────────────────────────────────────────────────────────
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
                        icon={Eye}
                        onClick={(e) => { e.stopPropagation(); openPanel(row); }}
                        title="View"
                    />
                </div>
            ),
        },
    ];

    // ─── Shared toolbar ───────────────────────────────────────────────────────
    const toolbar = (
        <FilterStrip>
            <SegmentedControl
                tabs={VIEW_TABS}
                activeKey={activeView}
                onChange={setActiveView}
            />

            {/* Year always visible — relevant on both tabs */}
            <FilterField width={110}>
                <Select
                    options={years.map((y) => ({ value: y, label: y }))}
                    value={filters.year ?? currentYear}
                    onChange={(e) => applyFilter({ year: e.target.value, page: 1 })}
                />
            </FilterField>

            {/* Transactions-only filters */}
            {activeView === 'transactions' && (
                <>
                    <FilterField grow>
                        <Input
                            placeholder="Client, TIN, document #..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKey}
                            icon={Search}
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
                </>
            )}
        </FilterStrip>
    );

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
                            <Button variant="primary" icon={Download} onClick={handleExport}>
                                Export Monthly
                            </Button>
                            {canGenerate && (
                                <Button icon={Plus} onClick={() => router.get(route('bir.create'))}>
                                    New Transaction
                                </Button>
                            )}
                        </div>
                    }
                />

                {totals && (
                    <StatGrid>
                        <StatCard icon={Files}    label="Total Records"   value={totals.total_count ?? 0} />
                        <StatCard icon={Banknote} label="Gross Amount"    value={<CurrencyDisplay amount={totals.total_gross   ?? 0} currency="PHP" />} />
                        <StatCard icon={Receipt}  label="VATAble Sales"   value={<CurrencyDisplay amount={totals.total_vatable ?? 0} currency="PHP" />} />
                        <StatCard icon={Percent}  label="VAT Amount"      value={<CurrencyDisplay amount={totals.total_vat     ?? 0} currency="PHP" />} tone="warning" />
                        <StatCard icon={Percent}  label="Withholding Tax" value={<CurrencyDisplay amount={totals.total_wht     ?? 0} currency="PHP" />} tone="warning" />
                        <StatCard icon={Banknote} label="Net Amount Due"  value={<CurrencyDisplay amount={totals.total_net     ?? 0} currency="PHP" />} tone="success" />
                    </StatGrid>
                )}

                {/* ── Single card — tab switches between Transactions and Monthly BIR Summary ── */}
                {activeView === 'transactions' ? (
                    <TableWithPanel
                        panelOpen={showPanel}
                        panel={
                            <DetailPanel
                                open={showPanel}
                                onClose={() => { setShowPanel(false); panel.close(); }}
                                loading={panel.loading}
                                error={panel.error}
                                title={d?.transaction?.document_number ?? d?.document_number ?? ''}
                                subtitle={d?.transaction
                                    ? `${documentTypes[d.transaction.document_type] ?? d.transaction.document_type} · ${d.transaction.client_name}`
                                    : (d?.client_name ?? '')}
                                badges={d?.transaction
                                    ? <Badge variant={DOC_VARIANT[d.transaction.document_type] ?? 'neutral'}>{d.transaction.document_type}</Badge>
                                    : (d?.document_type ? <Badge variant={DOC_VARIANT[d.document_type] ?? 'neutral'}>{d.document_type}</Badge> : null)}
                                editHref={d?.transaction && d?.canGenerate ? route('bir.edit', d.transaction.id) : null}
                            >
                                {d?.transaction && <BirPanelContent data={d} />}
                            </DetailPanel>
                        }
                    >
                        <DataTable
                            panelOpen={showPanel}
                            selectedKey={panel.id}
                            columns={columns}
                            rows={transactions.data ?? []}
                            pagination={transactions}
                            onPageChange={(page) =>
                                router.get(route('bir.index'), { ...filters, search: searchInput, page }, { preserveState: true })
                            }
                            toolbar={toolbar}
                        />
                    </TableWithPanel>
                ) : (
                    /* Monthly summary — same card shell as DataTable, stretches to fill viewport */
                    <div
                        className="flex flex-col flex-1 min-h-0 w-full overflow-hidden bg-[var(--color-card)]"
                        style={{
                            borderRadius: 'var(--radius-md)',
                            border      : 'var(--border-container)',
                            boxShadow   : 'var(--shadow-card)',
                        }}
                    >
                        <div
                            className="shrink-0"
                            style={{
                                padding     : 'var(--space-2)',
                                borderBottom: 'var(--border-container)',
                                background  : 'var(--color-card)',
                            }}
                        >
                            {toolbar}
                        </div>
                        <MonthlySummaryBody
                            summary={monthlySummary}
                            months={months}
                            documentTypes={documentTypes}
                        />
                    </div>
                )}

            </PageStack>
        </AppShell>
    );
}
