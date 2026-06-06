import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Search, Building2, Users, Truck, Landmark, Pencil, Trash2, Eye } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Badge from '../../Components/UI/Badge';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';

const TABS = [
    { key: 'corporate', label: 'Corporate Accounts', icon: Building2 },
    { key: 'sub_agent', label: 'Sub-Agents',         icon: Users     },
    { key: 'supplier',  label: 'Suppliers',          icon: Truck     },
    { key: 'bank',      label: 'Banks',              icon: Landmark  },
];

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
                    {row.contact_person ?? '—'}
                </span>
            ),
        },
        {
            key   : 'contact_number',
            label : 'Number',
            render: (row) => (
                <span className="font-body text-gray-500" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.contact_number ?? '—'}
                </span>
            ),
        },
        {
            key   : 'email',
            label : 'Email',
            render: (row) => (
                <span className="font-body text-gray-500" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.email ?? '—'}
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
        <div className="flex flex-col flex-1 min-h-0" style={{ gap: "var(--space-section)" }}>

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

            {/* Tabs */}
            <div className="flex items-center border-b border-gray-100 dark:border-gray-700" style={{ gap: 'var(--space-1)' }}>
                {TABS.map((tab) => {
                    const Icon     = tab.icon;
                    const isActive = tab.key === activeTab;
                    const count    = typeCounts?.[tab.key] ?? 0;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => switchTab(tab.key)}
                            className={[
                                'flex items-center gap-2 font-semibold font-body',
                                'border-b-2 -mb-px transition-colors duration-150',
                                isActive
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                    : 'border-transparent text-gray-400 hover:text-[var(--color-text)]',
                            ].join(' ')}
                            style={{
                                fontSize     : 'var(--font-size-small)',
                                paddingLeft  : 'var(--space-2)',
                                paddingRight : 'var(--space-2)',
                                paddingTop   : 'var(--space-2)',
                                paddingBottom: 'var(--space-2)',
                            }}
                        >
                            <Icon size={15} />
                            {tab.label}
                            {count > 0 && (
                                <span
                                    className={[
                                        'inline-flex items-center justify-center px-1.5 font-semibold min-w-[18px]',
                                        isActive
                                            ? 'bg-[var(--color-primary)] text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500',
                                    ].join(' ')}
                                    style={{ fontSize: 11, borderRadius: 'var(--radius-md)' }}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Search bar */}
            <div className="flex items-center max-w-sm" style={{ gap: 'var(--space-2)' }}>
                <Input
                    placeholder="Search by name, email, or TIN…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                    icon={Search}
                />
                {filters.search && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearchInput('');
                            router.get(route('contacts.index'), { type: activeTab, search: '', active: 'all' });
                        }}
                    >
                        Clear
                    </Button>
                )}
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                rows={contacts.data}
                keyField="id"
                onRowClick={(row) => router.get(route('contacts.show', row.id))}
                empty={`No ${TABS.find(t => t.key === activeTab)?.label ?? 'contacts'} found.`}
            />

            {/* Pagination */}
            {contacts.last_page > 1 && (
                <div
                    className="flex items-center justify-between font-body text-gray-400"
                    style={{ fontSize: 'var(--font-size-small)' }}
                >
                    <span>
                        Showing {contacts.from}–{contacts.to} of {contacts.total}
                    </span>
                    <div className="flex" style={{ gap: 'var(--space-1)' }}>
                        {contacts.links
                            .filter((l) => l.url)
                            .map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => router.get(link.url)}
                                    className={[
                                        'font-semibold transition-colors',
                                        link.active
                                            ? 'bg-[var(--color-primary)] text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600',
                                    ].join(' ')}
                                    style={{
                                        padding      : '4px 10px',
                                        borderRadius: "var(--radius-md)",
                                        fontSize     : 'var(--font-size-small)',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Remove Contact"
                description={`Remove "${deleteTarget?.name}"? This can be restored by an administrator if needed.`}
                confirmLabel="Remove"
            />
        </div>
    );
}

ContactsIndex.layout = (page) => <AppShell>{page}</AppShell>;
export default ContactsIndex;