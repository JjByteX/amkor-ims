import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Plus, Search, Eye, Megaphone,
    FileImage, MapPin, Mail, Send, Star, Archive,
    CheckCircle, Clock, AlertCircle, Download,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import SharedStatCard from '../../Components/Shared/StatCard';
import StatGrid from '../../Components/Shared/StatGrid';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import DataTable from '../../Components/Shared/DataTable';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const STATUS_VARIANT = {
    draft:     'neutral',
    submitted: 'warning',
    approved:  'info',
    published: 'success',
    archived:  'neutral',
};

const TYPE_ICON = {
    poster:           FileImage,
    itinerary:        MapPin,
    social_media:     Megaphone,
    email_blast:      Mail,
    event_collateral: Star,
    office_material:  Star,
    tv_ad:            Send,
    other:            Star,
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MarketingIndex({
    materials,
    summary,
    filters,
    materialTypes,
    statuses,
    canCreate,
    canReview,
    currentYear,
}) {
    const { flash } = usePage().props;
    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const year = filters.year ?? currentYear;

    function applyFilter(overrides = {}) {
        router.get(
            route('marketing.index'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true }
        );
    }

    function handleSearchKey(e) {
        if (e.key === 'Enter') applyFilter();
    }

    function clearFilters() {
        setSearchInput('');
        router.get(route('marketing.index'), { year }, { preserveState: false });
    }

    function goYear(delta) {
        applyFilter({ year: year + delta, page: 1 });
    }

    const hasActiveFilters = filters.search || filters.status || filters.type;

    const total = Object.values(summary).reduce((a, b) => a + b, 0);

    const columns = [
        {
            key: 'material',
            label: 'Material',
            render: (row) => {
                const Icon = TYPE_ICON[row.material_type] ?? Star;
                return (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-1)' }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 'var(--radius-md)',
                            background: 'var(--color-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginTop: 2,
                        }}>
                            <Icon size={14} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <div>
                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)' }}>
                                {row.title}
                            </div>
                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5 }}>
                                {materialTypes[row.material_type] ?? row.material_type}
                                {row.platform ? ` · ${row.platform}` : ''}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>
                    {statuses[row.status] ?? row.status}
                </Badge>
            ),
        },
        {
            key: 'submitted_by',
            label: 'Created By',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {row.created_by_user?.name ?? '—'}
                </span>
            ),
        },
        {
            key: 'approved_by',
            label: 'Approved By',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {row.approved_by_user?.name ?? '—'}
                </span>
            ),
        },
        {
            key: 'publish_date',
            label: 'Publish Date',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {fmt(row.publish_date)}
                </span>
            ),
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>
                    {fmt(row.created_at)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => router.get(route('marketing.show', row.id))}
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

                {/* Flash */}
                {flash?.message && (
                    <div className="font-body" style={{
                        padding: 'var(--space-2)',
                        background: flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : flash.type === 'warning' ? 'var(--color-warning)' : 'var(--color-info)',
                        color: '#fff',
                        fontSize: 'var(--font-size-small)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title="Marketing"
                    subtitle={`${total} material${total !== 1 ? 's' : ''} · ${year}`}
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                            <Button
                                variant="secondary"
                                icon={Download}
                                onClick={() => router.get(route('marketing.expenses'))}
                            >
                                Expenses
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => router.get(route('marketing.analytics'))}
                            >
                                Analytics
                            </Button>
                            {canCreate && (
                                <Button icon={Plus} onClick={() => router.get(route('marketing.create'))}>
                                    New Material
                                </Button>
                            )}
                        </div>
                    }
                />

                <StatGrid min="150px">
                    <SharedStatCard icon={Megaphone} label="Total" value={total} />
                    <SharedStatCard icon={Clock} label="Draft" value={summary.draft ?? 0} />
                    <SharedStatCard icon={AlertCircle} label="Pending" value={summary.submitted ?? 0} tone="warning" />
                    <SharedStatCard icon={CheckCircle} label="Approved" value={summary.approved ?? 0} tone="info" />
                    <SharedStatCard icon={Send} label="Published" value={summary.published ?? 0} tone="success" />
                    <SharedStatCard icon={Archive} label="Archived" value={summary.archived ?? 0} />
                </StatGrid>

                <DataTable
                    columns={columns}
                    rows={materials.data ?? []}
                    pagination={materials}
                    onPageChange={(page) =>
                        router.get(route('marketing.index'), { ...filters, search: searchInput, page }, { preserveState: true })
                    }
                    toolbar={
                        <FilterStrip>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flex: '0 0 auto' }}>
                                <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => goYear(-1)} />
                                <span className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', minWidth: 48, textAlign: 'center', color: 'var(--color-text)' }}>
                                    {year}
                                </span>
                                <Button variant="ghost" size="sm" icon={ChevronRight} onClick={() => goYear(1)} />
                            </div>
                            <FilterField grow>
                                <Input
                                    placeholder="Title, description..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKey}
                                    icon={Search}
                                />
                            </FilterField>
                            <FilterField width={180}>
                                <Select
                                    options={[
                                        { value: '', label: 'All Statuses' },
                                        ...Object.entries(statuses).map(([v, l]) => ({ value: v, label: l })),
                                    ]}
                                    value={filters.status ?? ''}
                                    onChange={(e) => applyFilter({ status: e.target.value || undefined, page: 1 })}
                                />
                            </FilterField>
                            <FilterField width={180}>
                                <Select
                                    options={[
                                        { value: '', label: 'All Types' },
                                        ...Object.entries(materialTypes).map(([v, l]) => ({ value: v, label: l })),
                                    ]}
                                    value={filters.type ?? ''}
                                    onChange={(e) => applyFilter({ type: e.target.value || undefined, page: 1 })}
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
