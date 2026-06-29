import { Link, usePage } from '@inertiajs/react';
import {
    BanknoteArrowDown, BanknoteArrowUp, BellDot, CalendarCheck2, CalendarClock,
    ChartSpline, CircleCheckBig, ClipboardCheck, ClipboardList, CreditCard,
    FileCheck2, FileClock, FileWarning, Files, Gauge, Landmark, MapPinned,
    Megaphone, PlaneTakeoff, ReceiptText, Send, Target, UserRoundCheck,
    UsersRound, WalletCards,
} from 'lucide-react';
import AppShell from '../Components/Layout/AppShell';
import Card from '../Components/UI/Card';
import PageStack from '../Components/Shared/PageStack';
import ProfileTimePanel from '../Components/Dashboard/ProfileTimePanel';
import DashboardCharts from '../Components/Dashboard/DashboardCharts';
import { getRoleConfig } from '../Components/Dashboard/dashboardConfig';

/* ── Icon registry ───────────────────────────────────────────────────────── */
const ICONS = {
    BanknoteArrowDown, BanknoteArrowUp, BellDot, CalendarCheck2, CalendarClock,
    ChartSpline, CircleCheckBig, ClipboardCheck, ClipboardList, CreditCard,
    FileCheck2, FileClock, FileWarning, Files, Gauge, Landmark, MapPinned,
    Megaphone, PlaneTakeoff, ReceiptText, Send, Target, UserRoundCheck,
    UsersRound, WalletCards,
};

/**
 * Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Layout:
 *   LEFT  col  — profile card (avatar, role, branch) + attendance button
 *                + attention/alert badges + login history
 *   RIGHT area — KPI card grid (auto-fit columns, equal height per role)
 *                + chart panels below the KPI grid
 *
 * The right column fills all available horizontal space. KPI cards are
 * distributed via auto-fill so they stretch evenly with no trailing whitespace.
 * The left column is sticky and scrolls independently on tall pages.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function Dashboard({ dashboardSections = [], loginActivity = [] }) {
    const { auth } = usePage().props;
    const role     = auth?.user?.role ?? '';
    const config   = getRoleConfig(role);

    /* ── Resolve live values ───────────────────────────────────────────────── */
    const sectionMap = Object.fromEntries(dashboardSections.map(s => [s.key, s]));

    const resolvedWidgets = config.widgets.map(widget => {
        const section = sectionMap[widget.section];
        const card    = section?.cards?.find(
            c => c.label?.toLowerCase() === widget.label?.toLowerCase()
        );
        return {
            ...widget,
            value: card?.value ?? '—',
            tone : card?.tone  ?? 'default',
            sub  : card?.sub   ?? null,
            href : card?.href  ?? widget.href ?? null,
            icon : card?.icon  ?? widget.icon,
        };
    });

    /* ── Attention items ───────────────────────────────────────────────────── */
    const attentionItems = dashboardSections
        .filter(s => config.attention?.includes(s.key))
        .flatMap(s => (s.attention ?? []).filter(a => a.value > 0));

    /* ── KPI grid column count — distribute evenly based on widget count ───── */
    const widgetCount = resolvedWidgets.length;
    // For 1-4: fill row; for 5-6: 3 cols; for 7-8: 4 cols; otherwise auto-fill
    const colCount = widgetCount <= 4
        ? widgetCount
        : widgetCount <= 6 ? 3
        : widgetCount <= 8 ? 4
        : 'auto-fill';

    const kpiGridStyle = colCount === 'auto-fill'
        ? {
            display            : 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(var(--dash-card-min, 160px), 1fr))`,
            gap                : 'var(--space-2)',
        }
        : {
            display            : 'grid',
            gridTemplateColumns: `repeat(${colCount}, 1fr)`,
            gap                : 'var(--space-2)',
        };

    return (
        <PageStack gap={0}>
            {/* ── Page heading ──────────────────────────────────────────── */}
            <h1
                className="font-heading font-bold text-[var(--color-text)]"
                style={{
                    fontSize     : 'var(--font-size-heading)',
                    lineHeight   : 'var(--line-height-tight)',
                    margin       : 0,
                    marginBottom : 'var(--space-2)',
                    flexShrink   : 0,
                }}
            >
                Dashboard
            </h1>

            {/* ── Two-column grid — fills all remaining height ──────────── */}
            <div
                className="dashboard-grid"
                style={{
                    display            : 'grid',
                    gridTemplateColumns: 'var(--dash-profile-col, 340px) 1fr',
                    gap                : 'var(--space-2)',
                    alignItems         : 'stretch',
                    flex               : '1 1 0',
                    minHeight          : 0,
                    overflow           : 'hidden',
                }}
            >
                {/* ── LEFT — natural height, scrolls if content overflows ── */}
                <div style={{
                    overflowY    : 'auto',
                    height       : '100%',
                    scrollbarWidth: 'none',
                }}>
                    <ProfileTimePanel
                        attentionItems={attentionItems}
                        loginActivity={loginActivity}
                    />
                </div>

                {/* ── RIGHT — KPI cards + charts, this column scrolls ────── */}
                <div style={{ minWidth: 0, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', scrollbarWidth: 'thin' }}>

                    {/* KPI card grid — fills width, no trailing whitespace */}
                    <div style={{ flexShrink: 0 }}>
                        {resolvedWidgets.length > 0 ? (
                            <div className="dash-kpi-grid" style={kpiGridStyle}>
                                {resolvedWidgets.map((w, i) => {
                                    const Icon = ICONS[w.icon] ?? Gauge;
                                    const card = <DashKpiCard key={i} icon={Icon} widget={w} />;
                                    return w.href
                                        ? <Link key={i} href={w.href} className="block no-underline">{card}</Link>
                                        : <div key={i}>{card}</div>;
                                })}
                            </div>
                        ) : (
                            <Card>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width         : 'var(--dash-card-icon-size, 44px)',
                                        height        : 'var(--dash-card-icon-size, 44px)',
                                        borderRadius  : 'var(--dash-card-icon-br, 10px)',
                                        background    : 'color-mix(in srgb, var(--color-primary) 9%, var(--color-card))',
                                        color         : 'var(--color-primary)',
                                        display       : 'flex',
                                        alignItems    : 'center',
                                        justifyContent: 'center',
                                        flexShrink    : 0,
                                    }}>
                                        <Gauge size={20} />
                                    </div>
                                    <div>
                                        <h2 className="font-heading font-bold text-[var(--color-text)]" style={{ fontSize: 16 }}>
                                            No dashboard data yet
                                        </h2>
                                        <p className="font-body text-[var(--color-text-muted)]" style={{ fontSize: 'var(--font-size-small)', marginTop: 3 }}>
                                            Module summaries appear here once records exist.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* ── Charts — stretches to fill remaining viewport height ── */}
                    <div style={{ flex: '1 1 0', minHeight: 'var(--dash-charts-min-h, 280px)' }}>
                        <DashboardCharts
                            charts={config.charts ?? []}
                            dashboardSections={dashboardSections}
                        />
                    </div>

                </div>
            </div>

            {/* Responsive collapse */}
            <style>{`
                @media (max-width: 860px) {
                    .dashboard-grid { grid-template-columns: 1fr !important; overflow: auto !important; }
                    .dash-kpi-grid  { grid-template-columns: repeat(2, 1fr) !important; }
                }
                .dashboard-grid > div:first-child::-webkit-scrollbar { display: none; }
                .dashboard-grid > div:last-child::-webkit-scrollbar { width: 4px; }
                .dashboard-grid > div:last-child::-webkit-scrollbar-track { background: transparent; }
                .dashboard-grid > div:last-child::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }
            `}</style>
        </PageStack>
    );
}

/* ── DashKpiCard ─────────────────────────────────────────────────────────────
 * Matches the StatCard layout used on every other page:
 *   icon box on the left, label (uppercase small) + big value on the right.
 * height: 100% so every card in a row stretches to the same height naturally.
 * ──────────────────────────────────────────────────────────────────────────── */
const TONE_COLORS = {
    default: 'var(--color-text)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error  : 'var(--color-error)',
    info   : 'var(--color-info)',
    primary: 'var(--color-primary)',
};

function DashKpiCard({ icon: Icon, widget }) {
    const toneColor = TONE_COLORS[widget.tone] ?? TONE_COLORS.default;
    const iconColor = toneColor === 'var(--color-text)' ? 'var(--color-primary)' : toneColor;

    return (
        <Card
            compact
            style={{ height: '100%' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                {/* Icon box */}
                <div style={{
                    width         : 40,
                    height        : 40,
                    flexShrink    : 0,
                    borderRadius  : 'var(--radius-md)',
                    background    : 'color-mix(in srgb, var(--color-primary) 9%, var(--color-card))',
                    color         : iconColor,
                    display       : 'flex',
                    alignItems    : 'center',
                    justifyContent: 'center',
                }}>
                    <Icon size={18} strokeWidth={1.75} />
                </div>

                {/* Label + value */}
                <div style={{ minWidth: 0 }}>
                    <div style={{
                        fontSize     : 11,
                        fontFamily   : 'var(--font-body)',
                        fontWeight   : 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color        : 'var(--color-text-muted)',
                        lineHeight   : 1.2,
                    }}>
                        {widget.label}
                    </div>
                    <div style={{
                        marginTop   : 5,
                        fontSize    : 21,
                        fontFamily  : 'var(--font-heading)',
                        fontWeight  : 800,
                        lineHeight  : 1.1,
                        color       : toneColor,
                        overflow    : 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace  : 'nowrap',
                    }}>
                        {widget.value}
                    </div>
                    {widget.sub && (
                        <div style={{
                            marginTop   : 3,
                            fontSize    : 'var(--font-size-small)',
                            fontFamily  : 'var(--font-body)',
                            color       : 'var(--color-text-muted)',
                            overflow    : 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace  : 'nowrap',
                        }}>
                            {widget.sub}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

Dashboard.layout = (page) => <AppShell>{page}</AppShell>;
export default Dashboard;
