import { router } from '@inertiajs/react';
import {
    ArrowLeft, ChevronLeft, ChevronRight,
    Eye, TrendingUp, MousePointer, Users, DollarSign,
    Megaphone, CheckCircle, Clock, Send, Archive,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';

// ── Helpers ───────────────────────────────────────────────────────────────────

const PHP = (n) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n ?? 0);

const num = (n) =>
    new Intl.NumberFormat('en-PH').format(n ?? 0);

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = 'var(--color-text)', sub }) {
    return (
        <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{
                    width: 40, height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Icon size={18} style={{ color }} />
                </div>
                <div>
                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55 }}>
                        {label}
                    </div>
                    <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color }}>
                        {value}
                    </div>
                    {sub && (
                        <div className="font-body" style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.45, marginTop: 1 }}>
                            {sub}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

// ── Platform row ──────────────────────────────────────────────────────────────

function PlatformRow({ platform, reach, impressions, engagements, clicks, spend, maxReach }) {
    const pct = maxReach > 0 ? Math.round((reach / maxReach) * 100) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)', textTransform: 'capitalize' }}>
                    {platform}
                </span>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    {[
                        { label: 'Reach',        val: num(reach) },
                        { label: 'Impressions',  val: num(impressions) },
                        { label: 'Engagements',  val: num(engagements) },
                        { label: 'Clicks',       val: num(clicks) },
                        { label: 'Spend',        val: PHP(spend) },
                    ].map(({ label, val }) => (
                        <div key={label} style={{ textAlign: 'right' }}>
                            <div className="font-body" style={{ fontSize: 10, color: 'var(--color-text)', opacity: 0.45 }}>
                                {label}
                            </div>
                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', fontWeight: 600 }}>
                                {val}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ height: 6, background: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: 'var(--color-primary)',
                    borderRadius: 4,
                    opacity: 0.7,
                }} />
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MarketingAnalytics({
    byPlatform,
    materialSummary,
    expenseTotal,
    topCampaigns,
    year,
    currentYear,
    statuses,
}) {
    function goYear(delta) {
        router.get(route('marketing.analytics'), { year: year + delta }, { preserveState: false });
    }

    const totalMaterials = Object.values(materialSummary).reduce((a, b) => a + b, 0);
    const totalReach = byPlatform.reduce((a, p) => a + Number(p.reach ?? 0), 0);
    const totalEngagements = byPlatform.reduce((a, p) => a + Number(p.engagements ?? 0), 0);
    const totalClicks = byPlatform.reduce((a, p) => a + Number(p.clicks ?? 0), 0);
    const maxReach = Math.max(...byPlatform.map((p) => Number(p.reach ?? 0)), 1);

    const SUMMARY_ICONS = {
        draft:     Clock,
        submitted: Clock,
        approved:  CheckCircle,
        published: Send,
        archived:  Archive,
    };

    const SUMMARY_COLORS = {
        draft:     'var(--color-text)',
        submitted: 'var(--color-warning)',
        approved:  'var(--color-info)',
        published: 'var(--color-success)',
        archived:  'var(--color-text)',
    };

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

                <PageHeader
                    title="Marketing Analytics"
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                            <Button variant="ghost" icon={ArrowLeft} onClick={() => router.get(route('marketing.index'))}>
                                Materials
                            </Button>
                            <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => goYear(-1)} />
                            <span className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', minWidth: 48, textAlign: 'center' }}>
                                {year}
                            </span>
                            <Button variant="ghost" size="sm" icon={ChevronRight} onClick={() => goYear(1)} />
                        </div>
                    }
                />

                {/* Top stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)' }}>
                    <StatCard icon={Megaphone}    label="Materials"    value={totalMaterials}   color="var(--color-text)" />
                    <StatCard icon={Users}        label="Total Reach"  value={num(totalReach)}  color="var(--color-primary)" />
                    <StatCard icon={TrendingUp}   label="Engagements"  value={num(totalEngagements)} color="var(--color-info)" />
                    <StatCard icon={MousePointer} label="Clicks"       value={num(totalClicks)} color="var(--color-success)" />
                    <StatCard icon={DollarSign}   label="Total Spend"  value={PHP(expenseTotal)} color="var(--color-warning)" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-3)', alignItems: 'start' }}>

                    {/* Platform breakdown */}
                    <Card>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <span className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                Performance by Platform
                            </span>

                            {byPlatform.length === 0 ? (
                                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.45 }}>
                                    No analytics data recorded for {year}.
                                </span>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                    {byPlatform.map((p) => (
                                        <PlatformRow
                                            key={p.platform}
                                            platform={p.platform}
                                            reach={p.reach}
                                            impressions={p.impressions}
                                            engagements={p.engagements}
                                            clicks={p.clicks}
                                            spend={p.spend}
                                            maxReach={maxReach}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

                        {/* Materials by status */}
                        <Card>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                <span className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                    Materials by Status
                                </span>
                                {Object.entries(materialSummary).map(([status, count]) => {
                                    const Icon = SUMMARY_ICONS[status] ?? Megaphone;
                                    return (
                                        <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Icon size={14} style={{ color: SUMMARY_COLORS[status] }} />
                                                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                                    {statuses[status] ?? status}
                                                </span>
                                            </div>
                                            <span className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Top campaigns by spend */}
                        {topCampaigns.length > 0 && (
                            <Card>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    <span className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                        Top Campaigns by Spend
                                    </span>
                                    {topCampaigns.map((c, i) => (
                                        <div key={c.campaign_name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.4, flexShrink: 0 }}>
                                                    {i + 1}
                                                </span>
                                                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {c.campaign_name}
                                                </span>
                                            </div>
                                            <span className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', flexShrink: 0 }}>
                                                {PHP(c.total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
