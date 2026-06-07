import { usePage } from '@inertiajs/react';
import { Bell, Building2, LayoutDashboard, ShieldCheck, UserRound } from 'lucide-react';
import AppShell from '../Components/Layout/AppShell';
import Card from '../Components/UI/Card';
import Badge from '../Components/UI/Badge';
import PageHeader from '../Components/Shared/PageHeader';
import PageStack from '../Components/Shared/PageStack';
import StatGrid from '../Components/Shared/StatGrid';
import StatCard from '../Components/Shared/StatCard';

const ROLE_LABELS = {
    general_manager            : 'General Manager',
    chief_operations_officer   : 'Chief Operations Officer',
    general_sales_manager      : 'General Sales Manager',
    accounting_officer         : 'Accounting Officer',
    disbursement_officer       : 'Disbursement Officer',
    admin_auditor              : 'Admin Auditor',
    hr_admin_officer           : 'HR & Admin Officer',
    liaison_officer            : 'Liaison Officer',
    resa_officer               : 'RESA Officer',
    ormoc_branch_officer       : 'Ormoc Branch Officer',
    visa_documentation_officer : 'Visa & Documentation Officer',
    marketing_officer          : 'Marketing Officer',
};

function Dashboard() {
    const { auth } = usePage().props;
    const user      = auth?.user;
    const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? '';
    const unreadNotifications = auth?.unread_notifications ?? 0;

    return (
        <PageStack>
            <PageHeader
                title="Dashboard"
                subtitle="Welcome to the Amkor Travel & Tours Internal Management System."
            />

            <StatGrid>
                <StatCard icon={UserRound} label="Signed in as" value={user?.name ?? 'User'} sub={roleLabel} tone="primary" />
                <StatCard icon={Building2} label="Branch" value={user?.branch_name ?? 'Unassigned'} />
                <StatCard icon={ShieldCheck} label="Access role" value={roleLabel || 'Account'} />
                <StatCard icon={Bell} label="Unread notices" value={unreadNotifications} tone={unreadNotifications > 0 ? 'warning' : 'success'} />
            </StatGrid>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                <Card>
                    <div className="flex flex-col" style={{ gap: 'var(--space-3)' }}>
                        <div className="flex items-start gap-3">
                            <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--color-primary)]"
                                style={{
                                    borderRadius: 'var(--radius-md)',
                                    background: 'color-mix(in srgb, var(--color-primary) 10%, var(--color-card))',
                                    border: '1px solid color-mix(in srgb, var(--color-primary) 16%, var(--color-border))',
                                }}
                            >
                                <LayoutDashboard size={20} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-heading font-bold text-[var(--color-text)]" style={{ fontSize: 20 }}>
                                    Hello, {user?.name ?? 'there'}
                                </h2>
                                <p className="font-body text-[var(--color-text-muted)]" style={{ fontSize: 'var(--font-size-small)', marginTop: 4 }}>
                                    Your workspace is ready. Use the sidebar to move between modules and operational tools.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoTile label="Role" value={<Badge variant="info">{roleLabel}</Badge>} />
                            <InfoTile label="Branch" value={<Badge variant="neutral">{user?.branch_name ?? 'Unassigned'}</Badge>} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                        <h2 className="font-heading font-bold text-[var(--color-text)]" style={{ fontSize: 18 }}>
                            Workspace Notes
                        </h2>
                        <p className="font-body text-[var(--color-text-muted)]" style={{ fontSize: 'var(--font-size-small)' }}>
                            Module dashboards will become richer as each phase gets operational metrics. Current module pages already include table summaries, filters, and workflow actions.
                        </p>
                        <div style={{ height: 1, background: 'var(--color-border-soft)' }} />
                        <p className="font-body text-[var(--color-text-muted)]" style={{ fontSize: 'var(--font-size-small)' }}>
                            For best local viewing, keep the Laravel server, Vite, and Reverb terminals running together.
                        </p>
                    </div>
                </Card>
            </div>
        </PageStack>
    );
}

function InfoTile({ label, value }) {
    return (
        <div
            style={{
                padding: 'var(--space-2)',
                border: 'var(--border-container)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg)',
            }}
        >
            <div
                className="font-body font-semibold uppercase"
                style={{
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.2,
                    letterSpacing: 0,
                    marginBottom: 8,
                }}
            >
                {label}
            </div>
            {value}
        </div>
    );
}

Dashboard.layout = (page) => <AppShell>{page}</AppShell>;

export default Dashboard;
