import { Link, usePage } from '@inertiajs/react';
import {
    BanknoteArrowDown,
    BanknoteArrowUp,
    BellDot,
    Building2,
    CalendarCheck2,
    ChartSpline,
    CircleCheckBig,
    ClipboardCheck,
    ClipboardList,
    ContactRound,
    CreditCard,
    FileCheck2,
    FileClock,
    FileWarning,
    Gauge,
    Landmark,
    MapPinned,
    Megaphone,
    PlaneTakeoff,
    ReceiptText,
    Send,
    ShieldCheck,
    Target,
    UserRoundCheck,
    UsersRound,
    WalletCards,
    Files,
} from 'lucide-react';
import AppShell from '../Components/Layout/AppShell';
import Badge from '../Components/UI/Badge';
import Card from '../Components/UI/Card';
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

const ICONS = {
    BanknoteArrowDown,
    BanknoteArrowUp,
    BellDot,
    Building2,
    CalendarCheck2,
    ChartSpline,
    CircleCheckBig,
    ClipboardCheck,
    ClipboardList,
    ContactRound,
    CreditCard,
    FileCheck2,
    FileClock,
    FileWarning,
    Files,
    Gauge,
    Landmark,
    MapPinned,
    Megaphone,
    PlaneTakeoff,
    ReceiptText,
    Send,
    ShieldCheck,
    Target,
    UserRoundCheck,
    UsersRound,
    WalletCards,
};

function Dashboard({ dashboardSections = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? 'Account';

    return (
        <PageStack>
            <PageHeader
                title="Dashboard"
                subtitle="Read-only operational overview"
            />

            <div className="grid gap-3 md:grid-cols-3">
                <ContextTile label="Signed in" value={user?.name ?? 'User'} icon={UserRoundCheck} />
                <ContextTile label="Role" value={roleLabel} icon={ShieldCheck} />
                <ContextTile label="Branch" value={user?.branch_name ?? 'Unassigned'} icon={Building2} />
            </div>

            {dashboardSections.length > 0 ? (
                <div className="grid gap-4 xl:grid-cols-2">
                    {dashboardSections.map((section) => (
                        <DashboardSection key={section.key} section={section} />
                    ))}
                </div>
            ) : (
                <Card>
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-10 w-10 items-center justify-center text-[var(--color-primary)]"
                            style={{
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid color-mix(in srgb, var(--color-primary) 14%, var(--color-border))',
                                background: 'color-mix(in srgb, var(--color-primary) 9%, var(--color-card))',
                            }}
                        >
                            <Gauge size={18} />
                        </div>
                        <div>
                            <h2 className="font-heading font-bold text-[var(--color-text)]" style={{ fontSize: 18 }}>
                                No dashboard summaries available
                            </h2>
                            <p className="font-body text-[var(--color-text-muted)]" style={{ fontSize: 'var(--font-size-small)', marginTop: 3 }}>
                                Your accessible modules will appear here once records are available.
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </PageStack>
    );
}

function ContextTile({ label, value, icon: Icon }) {
    return (
        <Card compact>
            <div className="flex items-center gap-3">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--color-primary)]"
                    style={{
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid color-mix(in srgb, var(--color-primary) 14%, var(--color-border))',
                        background: 'color-mix(in srgb, var(--color-primary) 9%, var(--color-card))',
                    }}
                >
                    <Icon size={18} />
                </div>
                <div className="min-w-0">
                    <div className="font-body font-bold uppercase text-[var(--color-text-muted)]" style={{ fontSize: 11 }}>
                        {label}
                    </div>
                    <div className="truncate font-heading font-bold text-[var(--color-text)]" style={{ fontSize: 18, marginTop: 4 }}>
                        {value}
                    </div>
                </div>
            </div>
        </Card>
    );
}

function DashboardSection({ section }) {
    const cards = section.cards ?? [];
    const attention = section.attention ?? [];

    return (
        <section className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
            <div>
                <h2 className="font-heading font-bold text-[var(--color-text)]" style={{ fontSize: 18 }}>
                    {section.label}
                </h2>
            </div>

            {cards.length > 0 && (
                <StatGrid min="160px">
                    {cards.map((card, index) => {
                        const Icon = ICONS[card.icon] ?? ClipboardList;
                        const stat = (
                            <StatCard
                                icon={Icon}
                                label={card.label}
                                value={card.value}
                                sub={card.sub}
                                tone={card.tone}
                            />
                        );

                        return card.href ? (
                            <Link key={`${card.label}-${index}`} href={card.href} className="block no-underline">
                                {stat}
                            </Link>
                        ) : (
                            <div key={`${card.label}-${index}`}>
                                {stat}
                            </div>
                        );
                    })}
                </StatGrid>
            )}

            {attention.length > 0 && (
                <div
                    className="grid gap-2"
                    style={{
                        paddingTop: cards.length > 0 ? 'var(--space-1)' : 0,
                        borderTop: cards.length > 0 ? '1px solid var(--color-border-soft)' : 'none',
                    }}
                >
                    {attention.slice(0, 4).map((item, index) => (
                        <AttentionRow key={`${item.label}-${index}`} item={item} />
                    ))}
                </div>
            )}
        </section>
    );
}

function AttentionRow({ item }) {
    const content = (
        <div className="flex items-center justify-between gap-3">
            <span className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                {item.label}
            </span>
            <Badge variant={item.tone === 'error' ? 'error' : item.tone === 'success' ? 'success' : 'warning'}>
                {item.value}
            </Badge>
        </div>
    );

    if (item.href) {
        return (
            <Link
                href={item.href}
                className="block no-underline"
                style={{
                    padding: '10px 12px',
                    border: '1px solid var(--color-border-soft)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg)',
                }}
            >
                {content}
            </Link>
        );
    }

    return (
        <div
            style={{
                padding: '10px 12px',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg)',
            }}
        >
            {content}
        </div>
    );
}

Dashboard.layout = (page) => <AppShell>{page}</AppShell>;

export default Dashboard;
