import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Plus, Search, Eye, Megaphone,
    FileImage, MapPin, Mail, Send, Star, Archive,
    CheckCircle, Clock, AlertCircle, Download,
    ChevronLeft, ChevronRight, DollarSign, XCircle,
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
import DetailPanel, { TableWithPanel, useDetailPanel, PanelSection, PanelField, PanelFieldRow, PanelDivider, PanelColumns, PanelCol, PanelColRight } from '../../Components/Shared/DetailPanel';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fmtDt = (d) =>
    d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const PHP = (n) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n ?? 0);

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

// ── Marketing panel content ───────────────────────────────────────────────────

function MarketingPanelContent({ data }) {
    const { material, totalSpend, materialTypes, statuses, platforms } = data;

    const statusOrder = ['draft', 'submitted', 'approved', 'published', 'archived'];
    const currentIdx  = statusOrder.indexOf(material.status);

    const workflowSteps = [
        { key: 'draft',     label: 'Created',   by: material.created_by_user?.name,   at: material.created_at },
        { key: 'submitted', label: 'Submitted', by: material.submitted_by_user?.name, at: null },
        { key: 'approved',  label: 'Approved',  by: material.approved_by_user?.name,  at: material.approved_at },
        { key: 'published', label: 'Published', by: material.published_by_user?.name, at: material.published_at },
    ];

    return (
        <PanelColumns>
            <PanelCol>
                <PanelSection title="Details">
                    <PanelFieldRow>
                        <PanelField label="Material Type" value={materialTypes?.[material.material_type] ?? material.material_type} />
                        <PanelField label="Platform"      value={platforms?.[material.platform] ?? material.platform} />
                    </PanelFieldRow>
                    <PanelFieldRow>
                        <PanelField label="Target Publish" value={fmt(material.publish_date)} />
                        <PanelField label="Published At"   value={fmtDt(material.published_at)} />
                    </PanelFieldRow>
                    <PanelFieldRow>
                        <PanelField label="Created By" value={material.created_by_user?.name} />
                        <PanelField label="Created"    value={fmt(material.created_at)} />
                    </PanelFieldRow>
                    {material.description && (
                        <PanelField label="Description" value={material.description} />
                    )}
                    {material.caption && (
                        <PanelField label="Caption / Post Copy" value={material.caption} />
                    )}
                </PanelSection>

                {material.expenses?.length > 0 && (
                    <>
                        <PanelDivider />
                        <PanelSection title="Expenses">
                            <PanelField label="Total Spend" value={PHP(totalSpend)} highlight />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                                {material.expenses.map((exp) => (
                                    <div key={exp.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                        padding: '6px 0',
                                        borderBottom: 'var(--border-container)',
                                    }}>
                                        <div>
                                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', fontWeight: 600 }}>
                                                {exp.campaign_name}
                                            </div>
                                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                                                {exp.category} · {fmt(exp.expense_date)}
                                            </div>
                                        </div>
                                        <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', fontWeight: 600 }}>
                                            {PHP(exp.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </PanelSection>
                    </>
                )}
            </PanelCol>

            <PanelColRight>
                <PanelSection title="Workflow">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {workflowSteps.map((step, i) => {
                            const reached = statusOrder.indexOf(step.key) <= currentIdx || (material.status === 'archived' && i < 2);
                            return (
                                <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                        background: reached ? 'var(--color-primary)' : 'var(--color-bg)',
                                        border: reached ? 'none' : '1.5px solid var(--color-border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: reached ? 1 : 0.4,
                                        marginTop: 2,
                                    }}>
                                        <CheckCircle size={12} color={reached ? '#fff' : 'var(--color-text-muted)'} />
                                    </div>
                                    <div>
                                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)', opacity: reached ? 1 : 0.4 }}>
                                            {step.label}
                                        </div>
                                        {reached && step.by && (
                                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                                                {step.by}{step.at ? ` · ${fmtDt(step.at)}` : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </PanelSection>

                {material.revision_notes && (
                    <>
                        <PanelDivider />
                        <PanelSection title="Revision Notes">
                            <PanelField value={material.revision_notes} />
                        </PanelSection>
                    </>
                )}

            </PanelColRight>
        </PanelColumns>
    );
}

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

    // ─── Detail panel ──────────────────────────────────────────────────────────
    const panel = useDetailPanel((id) => route('marketing.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;

    function openPanel(row) { setShowPanel(true); panel.open(row); }

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
                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
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
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
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
                        onClick={(e) => { e.stopPropagation(); openPanel(row); }}
                    />
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
                                variant="primary"
                                icon={Download}
                                onClick={() => router.get(route('marketing.expenses'))}
                            >
                                Expenses
                            </Button>
                            <Button
                                variant="primary"
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
                    <SharedStatCard icon={Megaphone}   label="Total"     value={total} />
                    <SharedStatCard icon={Clock}       label="Draft"     value={summary.draft ?? 0} />
                    <SharedStatCard icon={AlertCircle} label="Pending"   value={summary.submitted ?? 0} tone="warning" />
                    <SharedStatCard icon={CheckCircle} label="Approved"  value={summary.approved ?? 0} tone="info" />
                    <SharedStatCard icon={Send}        label="Published" value={summary.published ?? 0} tone="success" />
                    <SharedStatCard icon={Archive}     label="Archived"  value={summary.archived ?? 0} />
                </StatGrid>

                                <TableWithPanel
                    panelOpen={showPanel}
                    panel={
                        <DetailPanel
                open={showPanel}
                onClose={() => { setShowPanel(false); panel.close(); }}
                loading={panel.loading}
                error={panel.error}
                title={d?.material?.title ?? ''}
                subtitle={d?.material ? `${d.materialTypes?.[d.material.material_type] ?? d.material.material_type}${d.material.platform ? ` · ${d.platforms?.[d.material.platform] ?? d.material.platform}` : ''}` : ''}
                badges={d?.material && (
                    <Badge variant={STATUS_VARIANT[d.material.status] ?? 'neutral'}>
                        {d.statuses?.[d.material.status] ?? d.material.status}
                    </Badge>
                )}
            >
                {d?.material && <MarketingPanelContent data={d} />}
            </DetailPanel>
                    }
                >
                    <DataTable
                        panelOpen={showPanel}
                        selectedKey={panel.id}
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
                                <Button variant="ghost" onClick={clearFilters} style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-container)', color: 'var(--color-text)' }}>Clear</Button>
                            )}
                        </FilterStrip>
                    }
                />
                </TableWithPanel>
            </PageStack>
        </AppShell>
    );
}
