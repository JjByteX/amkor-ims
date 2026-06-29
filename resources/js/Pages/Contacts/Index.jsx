import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Search, Building2, Users, Truck, Landmark, Pencil, Trash2, Eye } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, { TableWithPanel, useDetailPanel } from '../../Components/Shared/DetailPanel';
import { ContactContent } from './Show';

import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Badge from '../../Components/UI/Badge';
import SegmentedControl from '../../Components/UI/SegmentedControl';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';

const STATUS_MAP = {
    true  : { variant: 'success', label: 'Active'   },
    false : { variant: 'neutral', label: 'Inactive' },
};

const CURRENCY_VARIANT = { PHP: 'info', USD: 'success', JPY: 'warning' };
const CCY_VARIANT      = { PHP: 'info', USD: 'success', JPY: 'warning' };
const TYPE_LABELS      = { corporate: 'Corporate Account', sub_agent: 'Sub-Agent', supplier: 'Supplier', bank: 'Bank' };

function ContactsIndex({ contacts, filters, canWrite, typeCounts }) {
    const [deleteTarget, setDeleteTarget] = useState(null);

    // ─── Detail panel ─────────────────────────────────────────────────────────
    const panel = useDetailPanel((id) => route('contacts.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;
    function openPanel(row) { setShowPanel(true); panel.open(row); }

    const [deleting,     setDeleting    ] = useState(false);
    const [searchInput,  setSearchInput ] = useState(filters.search ?? '');

    const activeTab = filters.type ?? 'corporate';
    const isBankTab = activeTab === 'bank';

    const TABS = [
        { key: 'corporate', label: 'Corporate Accounts', icon: Building2, count: typeCounts?.corporate ?? 0 },
        { key: 'sub_agent', label: 'Sub-Agents',         icon: Users,     count: typeCounts?.sub_agent ?? 0 },
        { key: 'supplier',  label: 'Suppliers',          icon: Truck,     count: typeCounts?.supplier  ?? 0 },
        { key: 'bank',      label: 'Banks',              icon: Landmark,  count: typeCounts?.bank      ?? 0 },
    ];

    const tabsForControl = TABS.map((t) => ({
        ...t,
        count: t.count > 0 ? t.count : undefined,
    }));

    function switchTab(type) {
        router.get(route('contacts.index'), { type, search: '', active: 'all' }, { preserveState: true, preserveScroll: false });
    }

    function applySearch() {
        router.get(
            route('contacts.index'),
            { type: activeTab, search: searchInput, active: filters.active },
            { preserveScroll: true, preserveState: true },
        );
    }

    function confirmDelete(row) { setDeleteTarget(row); }

    function handleDelete() {
        setDeleting(true);
        router.delete(route('contacts.destroy', deleteTarget.id), {
            onFinish: () => { setDeleting(false); setDeleteTarget(null); },
        });
    }

    const columns = [
        {
            key   : 'name',
            label : 'Name',
            render: (row) => (
                <span className="font-semibold text-[var(--color-text)] font-body" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.name}
                </span>
            ),
        },
        {
            key   : 'contact_person',
            label : 'Contact Person',
            render: (row) => (
                <span className="font-body text-gray-500" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.contact_person ?? (isBankTab ? 'N/A' : '—')}
                </span>
            ),
        },
        {
            key   : 'contact_number',
            label : 'Number',
            render: (row) => (
                <span className="font-body text-gray-500" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.contact_number ?? (isBankTab ? 'N/A' : '—')}
                </span>
            ),
        },
        {
            key   : 'email',
            label : 'Email',
            render: (row) => (
                <span className="font-body text-gray-500" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.email ?? (isBankTab ? 'N/A' : '—')}
                </span>
            ),
        },
        {
            key   : 'currency',
            label : 'Currency',
            width : '90px',
            render: (row) => (
                <Badge variant={CURRENCY_VARIANT[row.currency] ?? 'neutral'}>
                    {row.currency}
                </Badge>
            ),
        },
        {
            key   : 'is_active',
            label : 'Status',
            width : '100px',
            render: (row) => {
                const s = STATUS_MAP[row.is_active];
                return <Badge variant={s.variant}>{s.label}</Badge>;
            },
        },
        {
            key   : '_actions',
            label : '',
            width : '120px',
            render: (row) => (
                <div className="flex items-center justify-end" style={{ gap: 'var(--space-1)' }}>
                    <Button variant="ghost" size="sm" icon={Eye}
                        onClick={(e) => { e.stopPropagation(); openPanel(row); }} title="View" />
                    {canWrite && (
                        <>
                            <Button variant="ghost" size="sm" icon={Pencil}
                                onClick={(e) => { e.stopPropagation(); router.get(route('contacts.edit', row.id)); }} title="Edit" />
                            <Button variant="ghost" size="sm" icon={Trash2}
                                onClick={(e) => { e.stopPropagation(); confirmDelete(row); }} title="Delete"
                                className="hover:text-[var(--color-error)]" />
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <PageStack>
            <PageHeader
                title="Contacts & Directory"
                actions={
                    canWrite && (
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => router.get(route('contacts.create', { type: activeTab }))}
                        >
                            Add Contact
                        </Button>
                    )
                }
            />

            <TableWithPanel
                panelOpen={showPanel}
                panel={
                    <DetailPanel
                        open={showPanel}
                        onClose={() => { setShowPanel(false); panel.close(); }}
                        loading={panel.loading}
                        error={panel.error}
                        title={d?.contact?.name ?? ''}
                        subtitle={TYPE_LABELS[d?.contact?.type] ?? d?.contact?.type ?? ''}
                        editHref={d?.canWrite && d?.contact ? route('contacts.edit', d.contact.id) : null}
                        badges={d?.contact && <>
                            <Badge variant={d.contact.is_active ? 'success' : 'neutral'}>{d.contact.is_active ? 'Active' : 'Inactive'}</Badge>
                            <Badge variant={CCY_VARIANT[d.contact.currency] ?? 'neutral'}>{d.contact.currency}</Badge>
                        </>}
                    >
                        {d?.contact && <ContactContent contact={d.contact} />}
                    </DetailPanel>
                }
            >
                <DataTable
                    columns={columns}
                    rows={contacts.data}
                    keyField="id"
                    onRowClick={(row) => openPanel(row)}
                    empty={`No ${TABS.find(t => t.key === activeTab)?.label ?? 'contacts'} found.`}
                    pagination={contacts}
                    onPageChange={(page) => router.get(route('contacts.index'), { type: activeTab, search: searchInput, active: filters.active, page }, { preserveScroll: true, preserveState: true })}
                    autoPageSize
                    onPageSizeChange={(n) => router.get(route('contacts.index'), { type: activeTab, search: searchInput, active: filters.active, per_page: n, page: 1 }, { preserveScroll: true, preserveState: true })}
                    panelOpen={showPanel}
                    selectedKey={panel.id}
                    toolbar={
                        <FilterStrip>
                            <SegmentedControl
                                tabs={tabsForControl}
                                activeKey={activeTab}
                                onChange={switchTab}
                            />
                            <FilterField grow>
                                <Input
                                    placeholder="Search by name, email, or TIN..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                                    icon={Search}
                                />
                            </FilterField>
                            {filters.search && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchInput('');
                                        router.get(route('contacts.index'), { type: activeTab, search: '', active: 'all' });
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </FilterStrip>
                    }
                />
            </TableWithPanel>

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Remove Contact"
                description={`Remove "${deleteTarget?.name}"? This can be restored by an administrator if needed.`}
                confirmLabel="Remove"
            />
        </PageStack>
    );
}

ContactsIndex.layout = (page) => <AppShell>{page}</AppShell>;
export default ContactsIndex;
