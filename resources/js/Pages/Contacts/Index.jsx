import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Search, Building2, Users, Truck, Landmark, Pencil, Trash2, Eye } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
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

function ContactsIndex({ contacts, filters, canWrite, typeCounts }) {
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting    ] = useState(false);
    const [searchInput,  setSearchInput ] = useState(filters.search ?? '');

    const activeTab = filters.type ?? 'corporate';
    const isBankTab = activeTab === 'bank';

    // Build tabs with live counts from typeCounts prop
    const TABS = [
        { key: 'corporate', label: 'Corporate Accounts', icon: Building2, count: typeCounts?.corporate ?? 0 },
        { key: 'sub_agent', label: 'Sub-Agents',         icon: Users,     count: typeCounts?.sub_agent ?? 0 },
        { key: 'supplier',  label: 'Suppliers',          icon: Truck,     count: typeCounts?.supplier  ?? 0 },
        { key: 'bank',      label: 'Banks',              icon: Landmark,  count: typeCounts?.bank      ?? 0 },
    ];

    // Only show count badge when > 0
    const tabsForControl = TABS.map((t) => ({
        ...t,
        count: t.count > 0 ? t.count : undefined,
    }));

    function switchTab(type) {
        router.get(route('contacts.index'), { type, search: '', active: 'all' }, { preserveState: false });
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
                        onClick={() => router.get(route('contacts.show', row.id))} title="View" />
                    {canWrite && (
                        <>
                            <Button variant="ghost" size="sm" icon={Pencil}
                                onClick={() => router.get(route('contacts.edit', row.id))} title="Edit" />
                            <Button variant="ghost" size="sm" icon={Trash2}
                                onClick={() => confirmDelete(row)} title="Delete"
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
                subtitle="Corporate accounts, sub-agents, suppliers, and bank references."
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

            <DataTable
                columns={columns}
                rows={contacts.data}
                keyField="id"
                onRowClick={(row) => router.get(route('contacts.show', row.id))}
                empty={`No ${TABS.find(t => t.key === activeTab)?.label ?? 'contacts'} found.`}
                pagination={contacts}
                onPageChange={(page) => router.get(route('contacts.index'), { type: activeTab, search: searchInput, active: filters.active, page }, { preserveScroll: true, preserveState: true })}
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
