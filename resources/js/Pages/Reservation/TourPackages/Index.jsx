import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Search, Pencil, Trash2, PlusCircle, X as XIcon } from 'lucide-react';
import AppShell from '../../../Components/Layout/AppShell';
import PageStack from '../../../Components/Shared/PageStack';
import PageHeader from '../../../Components/Shared/PageHeader';
import DataTable from '../../../Components/Shared/DataTable';
import FilterStrip, { FilterField } from '../../../Components/Shared/FilterStrip';
import ConfirmDialog from '../../../Components/Shared/ConfirmDialog';
import Button from '../../../Components/UI/Button';
import Input from '../../../Components/UI/Input';
import Select from '../../../Components/UI/Select';
import Textarea from '../../../Components/UI/Textarea';
import Toggle from '../../../Components/UI/Toggle';
import Badge from '../../../Components/UI/Badge';
import Modal, { ModalCancelButton } from '../../../Components/UI/Modal';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_COST_ROW   = { min_pax: '', price: '' };
const EMPTY_DATE_ROW   = { date: '', surcharge: '0' };

const EMPTY_FORM = {
    country:         '',
    package_name:    '',
    destinations:    '',
    duration_days:   '',
    duration_nights: '',
    particulars:     '',
    inclusions:      '',
    exclusions:      '',
    airline:         '',
    tour_costs:      [{ ...EMPTY_COST_ROW }],
    departure_dates: [{ ...EMPTY_DATE_ROW }],
    is_active:       true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(price) {
    if (price == null) return '—';
    return `$${Number(price).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

function fmtDate(d) {
    if (!d) return null;
    return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function lowestPrice(tourCosts) {
    if (!tourCosts || tourCosts.length === 0) return null;
    const prices = tourCosts.map(t => Number(t.price)).filter(Boolean);
    if (!prices.length) return null;
    return Math.min(...prices);
}

function packageToForm(pkg) {
    return {
        country:         pkg.country ?? '',
        package_name:    pkg.package_name ?? '',
        destinations:    pkg.destinations ?? '',
        duration_days:   pkg.duration_days ?? '',
        duration_nights: pkg.duration_nights ?? '',
        particulars:     pkg.particulars ?? '',
        inclusions:      pkg.inclusions ?? '',
        exclusions:      pkg.exclusions ?? '',
        airline:         pkg.airline ?? '',
        tour_costs:      pkg.tour_costs?.length
            ? pkg.tour_costs.map(t => ({ min_pax: String(t.min_pax), price: String(t.price) }))
            : [{ ...EMPTY_COST_ROW }],
        departure_dates: pkg.departure_dates?.length
            ? pkg.departure_dates.map(d => ({ date: d.date, surcharge: String(d.surcharge ?? 0) }))
            : [{ ...EMPTY_DATE_ROW }],
        is_active: pkg.is_active ?? true,
    };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * RepeatableRows — generic add/remove row list used for both tour_costs
 * and departure_dates. Keeps the repeatable pattern in one place.
 */
function RepeatableRows({ label, rows, onAdd, onRemove, onChangeRow, addLabel, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span
                className="font-body font-semibold text-[var(--color-text)]"
                style={{ fontSize: 'var(--font-size-small)' }}
            >
                {label}
            </span>
            {rows.map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'flex-end' }}>
                    {children(row, i)}
                    {rows.length > 1 && (
                        <button
                            type="button"
                            onClick={() => onRemove(i)}
                            style={{
                                flexShrink : 0,
                                height     : 'var(--height-btn)',
                                padding    : '0 8px',
                                color      : 'var(--color-error)',
                                background : 'transparent',
                                border     : 'none',
                                cursor     : 'pointer',
                                borderRadius: 'var(--radius-md)',
                            }}
                            aria-label="Remove row"
                        >
                            <XIcon size={15} />
                        </button>
                    )}
                </div>
            ))}
            <button
                type="button"
                onClick={onAdd}
                style={{
                    display    : 'inline-flex',
                    alignItems : 'center',
                    gap        : 4,
                    fontSize   : 'var(--font-size-small)',
                    color      : 'var(--color-primary)',
                    background : 'transparent',
                    border     : 'none',
                    cursor     : 'pointer',
                    padding    : '2px 0',
                    fontFamily : 'var(--font-body)',
                    fontWeight : 600,
                    width      : 'fit-content',
                }}
            >
                <PlusCircle size={14} />
                {addLabel}
            </button>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TourPackagesIndex({ packages, filters, countries, canWrite }) {
    const [searchInput,  setSearchInput]  = useState(filters.search  ?? '');
    const [countryInput, setCountryInput] = useState(filters.country ?? '');

    const [formOpen,  setFormOpen]  = useState(false);
    const [editing,   setEditing]   = useState(null);
    const [form,      setForm]      = useState(EMPTY_FORM);
    const [saving,    setSaving]    = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting]     = useState(false);

    // ── Filters ──────────────────────────────────────────────────────────────

    function applyFilters(next = {}) {
        router.get(route('tour-packages.index'), {
            search:  searchInput,
            country: countryInput,
            ...next,
        }, { preserveScroll: true, preserveState: true });
    }

    function applySearch() {
        applyFilters({ search: searchInput });
    }

    function handleCountryChange(e) {
        const val = e.target.value;
        setCountryInput(val);
        applyFilters({ country: val });
    }

    // ── Form helpers ─────────────────────────────────────────────────────────

    function openCreate() {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
    }

    function openEdit(row) {
        setEditing(row);
        setForm(packageToForm(row));
        setFormOpen(true);
    }

    function setField(key, value) {
        setForm(f => ({ ...f, [key]: value }));
    }

    // tour_costs rows
    function addCostRow() {
        setForm(f => ({ ...f, tour_costs: [...f.tour_costs, { ...EMPTY_COST_ROW }] }));
    }
    function removeCostRow(i) {
        setForm(f => ({ ...f, tour_costs: f.tour_costs.filter((_, idx) => idx !== i) }));
    }
    function updateCostRow(i, key, val) {
        setForm(f => {
            const next = [...f.tour_costs];
            next[i] = { ...next[i], [key]: val };
            return { ...f, tour_costs: next };
        });
    }

    // departure_dates rows
    function addDateRow() {
        setForm(f => ({ ...f, departure_dates: [...f.departure_dates, { ...EMPTY_DATE_ROW }] }));
    }
    function removeDateRow(i) {
        setForm(f => ({ ...f, departure_dates: f.departure_dates.filter((_, idx) => idx !== i) }));
    }
    function updateDateRow(i, key, val) {
        setForm(f => {
            const next = [...f.departure_dates];
            next[i] = { ...next[i], [key]: val };
            return { ...f, departure_dates: next };
        });
    }

    // ── Submit ───────────────────────────────────────────────────────────────

    function submitForm() {
        setSaving(true);

        // Clean up empty rows before sending
        const payload = {
            ...form,
            tour_costs: form.tour_costs
                .filter(r => r.min_pax !== '' || r.price !== '')
                .map(r => ({ min_pax: Number(r.min_pax), price: Number(r.price) })),
            departure_dates: form.departure_dates
                .filter(r => r.date !== '')
                .map(r => ({ date: r.date, surcharge: Number(r.surcharge ?? 0) })),
        };

        if (editing) {
            router.put(route('tour-packages.update', editing.id), payload, {
                preserveScroll: true,
                onFinish: () => { setSaving(false); setFormOpen(false); },
            });
        } else {
            router.post(route('tour-packages.store'), payload, {
                preserveScroll: true,
                onFinish: () => { setSaving(false); setFormOpen(false); },
            });
        }
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    function confirmDelete(row) { setDeleteTarget(row); }

    function handleDelete() {
        setDeleting(true);
        router.delete(route('tour-packages.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => { setDeleting(false); setDeleteTarget(null); },
        });
    }

    // ── Columns ──────────────────────────────────────────────────────────────

    const sm = { fontSize: 'var(--font-size-small)' };

    const columns = [
        {
            key: 'country',
            label: 'Country',
            render: (row) => (
                <span className="font-semibold font-body" style={sm}>{row.country}</span>
            ),
        },
        {
            key: 'package_name',
            label: 'Package',
            render: (row) => (
                <div>
                    <div className="font-semibold font-body" style={sm}>{row.package_name}</div>
                    {row.destinations && (
                        <div className="font-body text-[var(--color-text-muted)]" style={{ fontSize: 'calc(var(--font-size-small) - 1px)', marginTop: 2 }}>
                            {row.destinations}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'duration',
            label: 'Duration',
            render: (row) => (
                <span className="font-body text-[var(--color-text-muted)]" style={sm}>
                    {row.duration_days ? `${row.duration_days}D / ${row.duration_nights}N` : '—'}
                </span>
            ),
        },
        {
            key: 'price_from',
            label: 'From (USD)',
            render: (row) => (
                <span className="font-body font-semibold" style={sm}>
                    {fmtPrice(lowestPrice(row.tour_costs))}
                </span>
            ),
        },
        {
            key: 'departure_dates',
            label: 'Departures',
            render: (row) => {
                const dates = row.departure_dates ?? [];
                if (!dates.length) return <span className="font-body text-[var(--color-text-muted)]" style={sm}>—</span>;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {dates.slice(0, 3).map((d, i) => (
                            <span key={i} className="font-body" style={sm}>
                                {fmtDate(d.date)}
                                {d.surcharge > 0 && (
                                    <span style={{ color: 'var(--color-warning)', marginLeft: 4 }}>
                                        +${d.surcharge}
                                    </span>
                                )}
                            </span>
                        ))}
                        {dates.length > 3 && (
                            <span className="font-body text-[var(--color-text-muted)]" style={{ fontSize: 'calc(var(--font-size-small) - 1px)' }}>
                                +{dates.length - 3} more
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (row) => (
                <Badge variant={row.is_active ? 'success' : 'neutral'}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </Badge>
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

    // ── Country options for filter ────────────────────────────────────────────

    const countryOptions = [
        { value: '', label: 'All Countries' },
        ...countries.map(c => ({ value: c, label: c })),
    ];

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <AppShell>
            <PageStack>
                <PageHeader
                    title="Tour Packages"
                    actions={canWrite ? (
                        <Button variant="primary" icon={Plus} onClick={openCreate}>
                            Add Package
                        </Button>
                    ) : null}
                />

                <DataTable
                    columns={columns}
                    rows={packages.data}
                    pagination={packages}
                    onPageChange={(page) => applyFilters({ page })}
                    autoPageSize
                    onPageSizeChange={(n) => applyFilters({ per_page: n, page: 1 })}
                    keyField="id"
                    empty="No tour packages found. Add one to get started."
                    toolbar={
                        <FilterStrip>
                            <FilterField grow>
                                <Input
                                    icon={Search}
                                    placeholder="Search packages or countries..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                                />
                            </FilterField>
                            <FilterField width={180}>
                                <Select
                                    options={countryOptions}
                                    value={countryInput}
                                    onChange={handleCountryChange}
                                />
                            </FilterField>
                        </FilterStrip>
                    }
                />
            </PageStack>

            {/* ── Create / Edit Modal ──────────────────────────────────────── */}
            <Modal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                title={editing ? 'Edit Tour Package' : 'Add Tour Package'}
                size="wide"
                footer={
                    <>
                        <ModalCancelButton onClick={() => setFormOpen(false)} />
                        <Button variant="primary" loading={saving} onClick={submitForm}>
                            {editing ? 'Save Changes' : 'Add Package'}
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

                    {/* Identity */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Input
                            label="Country"
                            value={form.country}
                            onChange={(e) => setField('country', e.target.value)}
                            placeholder="e.g. Australia"
                            required
                        />
                        <Input
                            label="Package Name"
                            value={form.package_name}
                            onChange={(e) => setField('package_name', e.target.value)}
                            placeholder="e.g. Spectacular Australia"
                            required
                        />
                    </div>

                    <Input
                        label="Destinations"
                        value={form.destinations}
                        onChange={(e) => setField('destinations', e.target.value)}
                        placeholder="e.g. Brisbane - Sydney - Canberra - Melbourne"
                    />

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Input
                            label="Duration (Days)"
                            type="number"
                            value={form.duration_days}
                            onChange={(e) => setField('duration_days', e.target.value)}
                            placeholder="12"
                        />
                        <Input
                            label="Duration (Nights)"
                            type="number"
                            value={form.duration_nights}
                            onChange={(e) => setField('duration_nights', e.target.value)}
                            placeholder="11"
                        />
                    </div>

                    {/* Booking form autofill fields */}
                    <Input
                        label="Particulars"
                        value={form.particulars}
                        onChange={(e) => setField('particulars', e.target.value)}
                        placeholder="e.g. Spectacular Australia 12D/11N"
                    />

                    <Textarea
                        label="Inclusions"
                        value={form.inclusions}
                        onChange={(e) => setField('inclusions', e.target.value)}
                        placeholder="One item per line"
                        rows={4}
                    />

                    <Textarea
                        label="Exclusions"
                        value={form.exclusions}
                        onChange={(e) => setField('exclusions', e.target.value)}
                        placeholder="One item per line"
                        rows={3}
                    />

                    <Input
                        label="Airline"
                        value={form.airline}
                        onChange={(e) => setField('airline', e.target.value)}
                        placeholder="e.g. Philippine Airlines — leave blank if carrier varies"
                    />

                    {/* Tour costs — repeatable pax tier rows */}
                    <RepeatableRows
                        label="Tour Costs (USD)"
                        rows={form.tour_costs}
                        onAdd={addCostRow}
                        onRemove={removeCostRow}
                        onChangeRow={updateCostRow}
                        addLabel="Add tier"
                    >
                        {(row, i) => (
                            <>
                                <Input
                                    label={i === 0 ? 'Min Pax' : undefined}
                                    type="number"
                                    value={row.min_pax}
                                    onChange={(e) => updateCostRow(i, 'min_pax', e.target.value)}
                                    placeholder="20"
                                    style={{ width: 90 }}
                                />
                                <Input
                                    label={i === 0 ? 'Price (USD)' : undefined}
                                    type="number"
                                    value={row.price}
                                    onChange={(e) => updateCostRow(i, 'price', e.target.value)}
                                    placeholder="3880"
                                />
                            </>
                        )}
                    </RepeatableRows>

                    {/* Departure dates — repeatable date + surcharge rows */}
                    <RepeatableRows
                        label="Departure Dates"
                        rows={form.departure_dates}
                        onAdd={addDateRow}
                        onRemove={removeDateRow}
                        onChangeRow={updateDateRow}
                        addLabel="Add date"
                    >
                        {(row, i) => (
                            <>
                                <Input
                                    label={i === 0 ? 'Date' : undefined}
                                    type="date"
                                    value={row.date}
                                    onChange={(e) => updateDateRow(i, 'date', e.target.value)}
                                />
                                <Input
                                    label={i === 0 ? 'Peak Surcharge (USD)' : undefined}
                                    type="number"
                                    value={row.surcharge}
                                    onChange={(e) => updateDateRow(i, 'surcharge', e.target.value)}
                                    placeholder="0"
                                    style={{ width: 140 }}
                                />
                            </>
                        )}
                    </RepeatableRows>

                    {/* Active toggle */}
                    <Toggle
                        label="Active — appears in the booking form package selector"
                        checked={form.is_active}
                        onChange={(e) => setField('is_active', e.target.checked)}
                    />
                </div>
            </Modal>

            {/* ── Delete confirmation ──────────────────────────────────────── */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Tour Package"
                message={deleteTarget
                    ? `Delete "${deleteTarget.package_name}" (${deleteTarget.country})? This will remove it from the directory but will not affect existing bookings.`
                    : ''}
                confirmLabel="Delete"
                loading={deleting}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </AppShell>
    );
}
