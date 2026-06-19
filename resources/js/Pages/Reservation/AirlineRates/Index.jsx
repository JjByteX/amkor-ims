import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import AppShell from '../../../Components/Layout/AppShell';
import PageStack from '../../../Components/Shared/PageStack';
import PageHeader from '../../../Components/Shared/PageHeader';
import DataTable from '../../../Components/Shared/DataTable';
import FilterStrip, { FilterField } from '../../../Components/Shared/FilterStrip';
import PeriodFilter from '../../../Components/Shared/PeriodFilter';
import ConfirmDialog from '../../../Components/Shared/ConfirmDialog';
import Button from '../../../Components/UI/Button';
import Input from '../../../Components/UI/Input';
import Select from '../../../Components/UI/Select';
import Modal from '../../../Components/UI/Modal';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const EMPTY_FORM = {
    airline:        '',
    origin:         '',
    destination:    '',
    fare_class:     '',
    rate:           '',
    currency:       'PHP',
    effective_date: new Date().toISOString().slice(0, 10),
    remarks:        '',
};

export default function AirlineRatesIndex({ rates, filters, currencies, canWrite }) {
    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [formOpen, setFormOpen]       = useState(false);
    const [editing, setEditing]         = useState(null); // null = create, object = edit
    const [form, setForm]               = useState(EMPTY_FORM);
    const [saving, setSaving]           = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]         = useState(false);

    const period = {
        period: filters.period ?? 'day',
        anchor: filters.anchor,
    };

    function applyFilters(next = {}) {
        router.get(route('airline-rates.index'), {
            search: searchInput,
            ...period,
            ...filters,
            ...next,
        }, { preserveScroll: true, preserveState: true });
    }

    function handlePeriodChange(next) {
        applyFilters({
            period:    next.period,
            anchor:    next.anchor,
            date_from: next.date_from,
            date_to:   next.date_to,
        });
    }

    function applySearch() {
        applyFilters({ search: searchInput });
    }

    function openCreate() {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
    }

    function openEdit(row) {
        setEditing(row);
        setForm({
            airline:        row.airline,
            origin:         row.origin,
            destination:    row.destination,
            fare_class:     row.fare_class ?? '',
            rate:           row.rate,
            currency:       row.currency,
            effective_date: row.effective_date,
            remarks:        row.remarks ?? '',
        });
        setFormOpen(true);
    }

    function submitForm() {
        setSaving(true);
        const payload = { ...form };

        if (editing) {
            router.put(route('airline-rates.update', editing.id), payload, {
                preserveScroll: true,
                onFinish: () => { setSaving(false); setFormOpen(false); },
            });
        } else {
            router.post(route('airline-rates.store'), payload, {
                preserveScroll: true,
                onFinish: () => { setSaving(false); setFormOpen(false); },
            });
        }
    }

    function confirmDelete(row) {
        setDeleteTarget(row);
    }

    function handleDelete() {
        setDeleting(true);
        router.delete(route('airline-rates.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => { setDeleting(false); setDeleteTarget(null); },
        });
    }

    const currencyOptions = Object.entries(currencies).map(([value, label]) => ({ value, label }));

    const columns = [
        {
            key: 'effective_date',
            label: 'Effective Date',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)' }}>
                    {fmt(row.effective_date)}
                </span>
            ),
        },
        {
            key: 'airline',
            label: 'Airline',
            render: (row) => (
                <span className="font-semibold font-body" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.airline}
                </span>
            ),
        },
        {
            key: 'route',
            label: 'Route',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.origin} → {row.destination}
                </span>
            ),
        },
        {
            key: 'fare_class',
            label: 'Fare Class',
            render: (row) => (
                <span className="font-body text-gray-500" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.fare_class || '—'}
                </span>
            ),
        },
        {
            key: 'rate',
            label: 'Rate',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.currency} {Number(row.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            key: 'remarks',
            label: 'Remarks',
            render: (row) => (
                <span className="font-body text-gray-500" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.remarks || '—'}
                </span>
            ),
        },
        ...(canWrite ? [{
            key: 'actions',
            label: '',
            render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(row)} />
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => confirmDelete(row)} />
                </div>
            ),
        }] : []),
    ];

    return (
        <AppShell>
            <PageStack>
                <PageHeader
                    title="Airline Rates"
                    actions={canWrite ? (
                        <Button variant="primary" icon={Plus} onClick={openCreate}>
                            Add Rate
                        </Button>
                    ) : null}
                />

                <DataTable
                    columns={columns}
                    rows={rates.data}
                    pagination={rates}
                    onPageChange={(page) => applyFilters({ page })}
                    keyField="id"
                    empty="No airline rates recorded for this period."
                    toolbar={
                        <FilterStrip>
                            <FilterField grow>
                                <Input
                                    icon={Search}
                                    placeholder="Search airline, route, or fare class..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                                />
                            </FilterField>
                            <FilterField width={420}>
                                <PeriodFilter value={period} onChange={handlePeriodChange} />
                            </FilterField>
                            <Button variant="secondary" onClick={applySearch}>Search</Button>
                        </FilterStrip>
                    }
                />
            </PageStack>

            <Modal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                title={editing ? 'Edit Airline Rate' : 'Add Airline Rate'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Input
                            label="Airline"
                            value={form.airline}
                            onChange={(e) => setForm({ ...form, airline: e.target.value })}
                            required
                        />
                        <Input
                            label="Fare Class"
                            value={form.fare_class}
                            onChange={(e) => setForm({ ...form, fare_class: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Input
                            label="Origin"
                            value={form.origin}
                            onChange={(e) => setForm({ ...form, origin: e.target.value.toUpperCase() })}
                            placeholder="MNL"
                            required
                        />
                        <Input
                            label="Destination"
                            value={form.destination}
                            onChange={(e) => setForm({ ...form, destination: e.target.value.toUpperCase() })}
                            placeholder="NRT"
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Input
                            label="Rate"
                            type="number"
                            value={form.rate}
                            onChange={(e) => setForm({ ...form, rate: e.target.value })}
                            required
                        />
                        <Select
                            label="Currency"
                            options={currencyOptions}
                            value={form.currency}
                            onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Effective Date"
                        type="date"
                        value={form.effective_date}
                        onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
                        required
                    />
                    <Input
                        label="Remarks"
                        value={form.remarks}
                        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                        <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
                        <Button variant="primary" loading={saving} onClick={submitForm}>
                            {editing ? 'Save Changes' : 'Add Rate'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Airline Rate"
                message={deleteTarget
                    ? `Delete the ${deleteTarget.airline} ${deleteTarget.origin} → ${deleteTarget.destination} rate dated ${deleteTarget.effective_date}?`
                    : ''}
                confirmLabel="Delete"
                loading={deleting}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </AppShell>
    );
}
