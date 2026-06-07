import { router } from '@inertiajs/react';
import { Archive, Check, CheckCheck, Trash2 } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Select from '../../Components/UI/Select';

const date = (v) => v ? new Date(v).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-';
const levelVariant = { success: 'success', warning: 'warning', error: 'error', info: 'info' };

export default function NotificationsIndex({ notifications, filters, unreadCount }) {
    function apply(overrides = {}) {
        router.get(route('notifications.index'), { ...filters, ...overrides }, { preserveState: true, preserveScroll: true });
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
            <div className="flex min-h-0 flex-1 flex-col" style={{ gap: 'var(--space-section)' }}>
                <PageHeader
                    title="Notifications"
                    subtitle={`${unreadCount} unread`}
                    actions={
                        <Button icon={CheckCheck} onClick={() => router.post(route('notifications.read-all'), {}, { preserveScroll: true })}>
                            Mark All Read
                        </Button>
                    }
                />

                <Card compact>
                    <div className="max-w-xs">
                        <Select
                            value={filters.status ?? ''}
                            onChange={(e) => apply({ status: e.target.value })}
                            options={[
                                { value: '', label: 'Inbox' },
                                { value: 'unread', label: 'Unread' },
                                { value: 'archived', label: 'Archived' },
                            ]}
                        />
                    </div>
                </Card>

                <DataTable
                    rows={notifications.data ?? []}
                    columns={columns}
                    pagination={notifications}
                    onPageChange={(page) => apply({ page })}
                />
            </div>
        </AppShell>
    );
}
