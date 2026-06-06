import { usePage } from '@inertiajs/react';
import AppShell from '../Components/Layout/AppShell';
import Card from '../Components/UI/Card';
import Badge from '../Components/UI/Badge';
import PageHeader from '../Components/Shared/PageHeader';

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

    return (
        <div className="flex flex-col" style={{ gap: 'var(--space-section)' }}>
            <PageHeader
                title="Dashboard"
                subtitle="Welcome to the Amkor Travel & Tours Internal Management System."
            />

            <Card className="max-w-lg">
                <div className="flex flex-col" style={{ gap: 'var(--space-3)' }}>
                    {/* Greeting */}
                    <div>
                        <p
                            className="font-heading font-semibold text-[var(--color-text)]"
                            style={{ fontSize: 'var(--font-size-heading)' }}
                        >
                            Hello, {user?.name ?? 'there'} 👋
                        </p>
                        <p className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)', marginTop: 4 }}>
                            You are signed in to the Amkor IMS.
                        </p>
                    </div>

                    {/* Role & branch info */}
                    <div
                        className="flex flex-wrap border-t border-gray-100 dark:border-gray-700"
                        style={{ gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}
                    >
                        <div>
                            <p className="font-body font-semibold text-gray-400 uppercase tracking-wide"
                                style={{ fontSize: 11, marginBottom: 4 }}>
                                Role
                            </p>
                            <Badge variant="info">{roleLabel}</Badge>
                        </div>
                        {user?.branch_name && (
                            <div>
                                <p className="font-body font-semibold text-gray-400 uppercase tracking-wide"
                                    style={{ fontSize: 11, marginBottom: 4 }}>
                                    Branch
                                </p>
                                <Badge variant="neutral">{user.branch_name}</Badge>
                            </div>
                        )}
                    </div>

                    {/* Phase placeholder note */}
                    <p
                        className="font-body text-gray-400 border-t border-gray-100 dark:border-gray-700"
                        style={{ fontSize: 'var(--font-size-small)', paddingTop: 'var(--space-2)' }}
                    >
                        Module dashboards will be available as each phase is completed.
                        Use the sidebar to navigate to available modules.
                    </p>
                </div>
            </Card>
        </div>
    );
}

Dashboard.layout = (page) => <AppShell>{page}</AppShell>;

export default Dashboard;