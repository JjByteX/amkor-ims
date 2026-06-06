import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Search, Filter, Eye, Pencil, Trash2 } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Badge from '../../Components/UI/Badge';
import Card from '../../Components/UI/Card';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const STATUS_VARIANT = {
    pending    : 'warning',
    on_process : 'info',
    completed  : 'success',
    approved   : 'success',
    denied     : 'error',
    forfeited  : 'error',
    refunded   : 'neutral',
};

export default function VisaIndex({ applications, filters, statuses, agentCodes, canWrite }) {
    const { flash } = usePage().props;

    const [searchInput,  setSearchInput ] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting    ] = useState(false);

    function applyFilter(overrides = {}) {
        router.get(
            route('visa.index'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true },
        );
    }

    function handleSearchKey(e) { if (e.key === 'Enter') applyFilter(); }

    function clearFilters() {
        setSearchInput('');
        router.get(route('visa.index'), {}, { preserveState: false });
    }

    function handleDelete() {
        setDeleting(true);
        router.delete(route('visa.destroy', deleteTarget.id), {
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
                        padding      : '2px 8px',
                    }}
                >
                    {row.agent_code}
                </span>
            ),
        },
        {
            key   : 'customer_name',
            label : 'Customer',
            render: (row) => (
                <div>
                    <div className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                        {row.customer_name}
                    </div>
                    {row.agency && (
                        <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                            {row.agency}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key   : 'visa_type',
            label : 'Type',
            render: (row) => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.visa_type}
                </span>
            ),
        },
        {
            key   : 'selling_price',
            label : 'SP',
            render: (row) => <CurrencyDisplay amount={row.selling_price} currency="PHP" />,
        },
        {
            key   : 'income',
            label : 'Income',
            render: (row) => <CurrencyDisplay amount={row.income} currency="PHP" />,
        },
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
            key   : 'flags',
            label : 'Flags',
            render: (row) => (
                <div className="flex flex-wrap" style={{ gap: 4 }}>
                    {row.notes && (
                        <Badge variant="warning" title="Has notes">Note</Badge>
                    )}
                    {row.payment_request_sent && !row.or_number && (
                        <Badge variant="info" title="Payment request sent — OR pending">OR Pending</Badge>
                    )}
                    {row.or_number && !row.or_endorsed_at && (
                        <Badge variant="success" title="OR received — not yet endorsed">OR Rcvd</Badge>
                    )}
                    {row.or_endorsed_at && (
                        <Badge variant="neutral" title="OR endorsed to Disbursement">Endorsed</Badge>
                    )}
                </div>
            ),
        },
        {
            key   : 'actions',
            label : '',
            render: (row) => (
                <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                    <Button variant="ghost" size="sm" icon={Eye}
                        onClick={() => router.visit(route('visa.show', row.id))} title="View" />
                    {canWrite && (
                        <>
                            <Button variant="ghost" size="sm" icon={Pencil}
                                onClick={() => router.visit(route('visa.edit', row.id))} title="Edit" />
                            <Button variant="ghost" size="sm" icon={Trash2}
                                onClick={() => setDeleteTarget(row)} title="Remove" />
                        </>
                    )}
                </div>
            ),
        },
    ];

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        ...Object.entries(statuses).map(([v, l]) => ({ value: v, label: l })),
    ];

    const agentOptions = [
        { value: '', label: 'All Agents' },
        ...agentCodes.map((c) => ({ value: c, label: c })),
    ];

    const hasActiveFilters = filters.search || filters.agent || filters.status;

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: "var(--space-section)" }}>

                {flash?.message && (
                    <div
                        className="rounded font-body"
                        style={{
                            padding     : 'var(--space-2)',
                            background  : flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                            color       : '#fff',
                            fontSize    : 'var(--font-size-small)',
                            borderRadius: 'var(--radius-md)',
                        }}
                    >
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title="Visa & Documentation"
                    subtitle={`${applications.total} application${applications.total !== 1 ? 's' : ''}`}
                    actions={canWrite && (
                        <Button variant="primary" icon={Plus} onClick={() => router.visit(route('visa.create'))}>
                            New Application
                        </Button>
                    )}
                />

                {/* Filters */}
                <div className="flex flex-wrap items-center" style={{ gap: 'var(--space-2)' }}>
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder="Customer, agency, visa type, reference..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKey}
                            icon={Search}
                        />
                    </div>
                    <div className="min-w-[160px]">
                        <Select
                            options={agentOptions}
                            value={filters.agent ?? ''}
                            onChange={(e) => applyFilter({ agent: e.target.value, page: 1 })}
                        />
                    </div>
                    <div className="min-w-[160px]">
                        <Select
                            options={statusOptions}
                            value={filters.status ?? ''}
                            onChange={(e) => applyFilter({ status: e.target.value, page: 1 })}
                        />
                    </div>
                    {hasActiveFilters && (
                        <Button variant="ghost" onClick={clearFilters}>Clear</Button>
                    )}
                </div>

                {/* Table */}
                <DataTable
                    columns={columns}
                    rows={applications.data}
                    pagination={applications}
                    onPageChange={(page) => applyFilter({ page })}
                />

            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Remove Application"
                message={`Remove application for ${deleteTarget?.customer_name}? This can be undone by an admin.`}
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppShell>
    );
}