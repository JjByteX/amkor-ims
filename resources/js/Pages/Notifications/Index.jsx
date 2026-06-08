import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Archive, Check, CheckCheck, Search, Trash2 } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Input from '../../Components/UI/Input';
import SegmentedControl from '../../Components/UI/SegmentedControl';

const date = (v) => v ? new Date(v).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-';
const levelVariant = { success: 'success', warning: 'warning', error: 'error', info: 'info' };

const STATUS_TABS = [
    { key: '',         label: 'Inbox'    },
    { key: 'unread',   label: 'Unread'   },
    { key: 'archived', label: 'Archived' },
];

export default function NotificationsIndex({ notifications, filters, unreadCount }) {
    const [searchInput, setSearchInput] = useState(filters.search ?? '');

    const activeStatus = filters.status ?? '';

    function apply(overrides = {}) {
        router.get(route('notifications.index'), { ...filters, ...overrides }, { preserveState: true, preserveScroll: true });
    }

    function applySearch() {
        apply({ search: searchInput, page: 1 });
    }

    function switchStatus(status) {
        setSearchInput('');
        apply({ status, search: '', page: 1 });
    }

    const columns = [
        {
            key: 'message',
            label: 'Notification',
            render: (row) => (
                <button
                    type="button"
                    onClick={() => row.data?.url ? router.visit(row.data.url) : null}
                    className="block text-left"
                >
                    <div className="flex items-center gap-2">
                        {!row.read_at && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
                        <span className="font-semibold text-[var(--color-text)]">{row.data?.title ?? 'Notification'}</span>
                        <Badge variant={levelVariant[row.data?.level] ?? 'neutral'}>{row.data?.level ?? 'info'}</Badge>
                    </div>
                    <div className="mt-1 text-gray-400">{row.data?.message ?? '-'}</div>
                </button>
            ),
        },
        { key: 'created_at', label: 'Received', render: (row) => date(row.created_at) },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <div className="flex justify-end gap-1">
                    {!row.read_at && (
                        <Button size="sm" variant="ghost" icon={Check} onClick={() => router.post(route('notifications.read', row.id), {}, { preserveScroll: true })}>
                            Read
                        </Button>
                    )}
                    {!row.archived_at && (
                        <Button size="sm" variant="ghost" icon={Archive} onClick={() => router.post(route('notifications.archive', row.id), {}, { preserveScroll: true })}>
                            Archive
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" icon={Trash2} onClick={() => router.delete(route('notifications.destroy', row.id), { preserveScroll: true })}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppShell>
            <PageStack>
                <PageHeader
                    title="Notifications"
                    subtitle={`${unreadCount} unread`}
                    actions={
                        <Button icon={CheckCheck} onClick={() => router.post(route('notifications.read-all'), {}, { preserveScroll: true })}>
                            Mark All Read
                        </Button>
                    }
                />

                <DataTable
                    rows={notifications.data ?? []}
                    columns={columns}
                    pagination={notifications}
                    onPageChange={(page) => apply({ page })}
                    toolbar={
                        <FilterStrip>
                            {/* Status segmented control — goes first */}
                            <SegmentedControl
                                tabs={STATUS_TABS}
                                activeKey={activeStatus}
                                onChange={switchStatus}
                            />

                            {/* Search — goes after the segmented control */}
                            <FilterField grow>
                                <Input
                                    placeholder="Search notifications..."
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
                                        apply({ search: '', page: 1 });
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </FilterStrip>
                    }
                />
            </PageStack>
        </AppShell>
    );
}
