/**
 * Visa/SalesReport.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Gap #8 — filterable monthly income view per agent / visa type.
 * Mirrors Reservation/SalesReport structure.
 *
 * Sections:
 *   • Filter strip (year / month / agent)
 *   • Stat cards  (Total Count · Total SP · Total NP · Total Income · Target)
 *   • Agent breakdown table with per-agent collapsible rows by visa type
 *   • Income by visa type (sorted bar-style list)
 *   • 12-month trend chart (Recharts line — income by month)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { router } from '@inertiajs/react';
import { useState } from 'react';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { BarChart2, Target, TrendingUp } from 'lucide-react';

import AppShell    from '../../Components/Layout/AppShell';
import PageStack   from '../../Components/Shared/PageStack';
import PageHeader  from '../../Components/Shared/PageHeader';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import Select      from '../../Components/UI/Select';
import Card        from '../../Components/UI/Card';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const fmt  = (n) => Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct  = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

const MONTHS = [
    { value: '1',  label: 'January'   }, { value: '2',  label: 'February'  },
    { value: '3',  label: 'March'     }, { value: '4',  label: 'April'     },
    { value: '5',  label: 'May'       }, { value: '6',  label: 'June'      },
    { value: '7',  label: 'July'      }, { value: '8',  label: 'August'    },
    { value: '9',  label: 'September' }, { value: '10', label: 'October'   },
    { value: '11', label: 'November'  }, { value: '12', label: 'December'  },
];

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: String(y), label: String(y) };
});

const PALETTE = ['#3F9800', '#38BDF8', '#F59E0B', '#3B82F6', '#EF4444', '#22C55E', '#8B5CF6'];

/* ── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, tone = 'default', icon: Icon }) {
    const toneColor = {
        default : 'var(--color-text)',
        primary : 'var(--color-primary)',
        warning : 'var(--color-warning)',
        success : 'var(--color-success)',
        info    : 'var(--color-info)',
    }[tone] ?? 'var(--color-text)';

    return (
        <Card compact style={{ flex: '1 1 160px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {Icon && (
                    <div style={{
                        width: 40, height: 40, flexShrink: 0,
                        borderRadius: 'var(--radius-md)',
                        background: 'color-mix(in srgb, var(--color-primary) 9%, var(--color-card))',
                        color: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Icon size={18} strokeWidth={1.75} />
                    </div>
                )}
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        color: 'var(--color-text-muted)', lineHeight: 1.2 }}>
                        {label}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 20, fontFamily: 'var(--font-heading)',
                        fontWeight: 800, lineHeight: 1.1, color: toneColor,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {value}
                    </div>
                    {sub && (
                        <div style={{ marginTop: 2, fontSize: 'var(--font-size-small)',
                            fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
                            {sub}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

/* ── Custom tooltip ──────────────────────────────────────────────────────── */
function Tip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--color-card)', border: 'var(--border-container)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px',
            boxShadow: 'var(--shadow-card)', fontSize: 12,
        }}>
            <p style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{label}</p>
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0, marginTop: 3 }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{p.name}:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {typeof p.value === 'number'
                            ? 'PHP ' + fmt(p.value)
                            : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

/* ── Agent breakdown table ───────────────────────────────────────────────── */
function AgentTable({ rows, agentTotals }) {
    const [expanded, setExpanded] = useState({});

    const toggle = (code) => setExpanded(prev => ({ ...prev, [code]: !prev[code] }));

    const th = {
        fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.04em',
        color: 'var(--color-text-muted)', padding: '8px 12px',
        textAlign: 'right', whiteSpace: 'nowrap',
    };
    const tdR = {
        fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)',
        color: 'var(--color-text)', padding: '7px 12px', textAlign: 'right',
        borderTop: 'var(--border-container)',
    };
    const tdL = { ...tdR, textAlign: 'left' };

    if (!agentTotals?.length) {
        return (
            <div style={{ padding: '24px 0', textAlign: 'center',
                color: 'var(--color-text-muted)', fontSize: 'var(--font-size-small)',
                fontFamily: 'var(--font-body)' }}>
                No approved / completed applications this month.
            </div>
        );
    }

    const grouped = rows.reduce((acc, r) => {
        acc[r.agent_code] = acc[r.agent_code] ?? [];
        acc[r.agent_code].push(r);
        return acc;
    }, {});

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: 'var(--border-container)' }}>
                        <th style={{ ...th, textAlign: 'left' }}>Agent / Type</th>
                        <th style={th}>Count</th>
                        <th style={th}>Total SP</th>
                        <th style={th}>Total NP</th>
                        <th style={th}>Income</th>
                    </tr>
                </thead>
                <tbody>
                    {agentTotals.map((at) => (
                        <>
                            {/* Agent summary row */}
                            <tr
                                key={at.agent_code}
                                onClick={() => toggle(at.agent_code)}
                                style={{ cursor: 'pointer',
                                    background: expanded[at.agent_code]
                                        ? 'color-mix(in srgb, var(--color-primary) 5%, var(--color-card))'
                                        : undefined }}
                            >
                                <td style={{ ...tdL, fontWeight: 700, color: 'var(--color-primary)' }}>
                                    <span style={{ marginRight: 6, fontSize: 10 }}>
                                        {expanded[at.agent_code] ? '▼' : '▶'}
                                    </span>
                                    {at.agent_code || '—'}
                                </td>
                                <td style={{ ...tdR, fontWeight: 700 }}>{at.count}</td>
                                <td style={{ ...tdR, fontWeight: 700 }}>₱ {fmt(at.total_sp)}</td>
                                <td style={{ ...tdR, fontWeight: 700 }}>₱ {fmt(at.total_np)}</td>
                                <td style={{ ...tdR, fontWeight: 700, color: 'var(--color-success)' }}>₱ {fmt(at.total_income)}</td>
                            </tr>

                            {/* Drill-down by visa type */}
                            {expanded[at.agent_code] && grouped[at.agent_code]?.map((r, i) => (
                                <tr key={`${at.agent_code}-${i}`}
                                    style={{ background: 'color-mix(in srgb, var(--color-primary) 3%, var(--color-bg))' }}>
                                    <td style={{ ...tdL, paddingLeft: 32, color: 'var(--color-text-muted)' }}>
                                        {r.visa_type || 'Unspecified'}
                                    </td>
                                    <td style={tdR}>{r.count}</td>
                                    <td style={tdR}>₱ {fmt(r.total_sp)}</td>
                                    <td style={tdR}>₱ {fmt(r.total_np)}</td>
                                    <td style={{ ...tdR, color: 'var(--color-success)' }}>₱ {fmt(r.total_income)}</td>
                                </tr>
                            ))}
                        </>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function VisaSalesReport({
    rows, agentTotals, grandTotals, byType, monthlyTrend,
    filters, agentCodes, target,
}) {
    function applyFilter(overrides = {}) {
        router.get(
            route('visa.sales-report'),
            { ...filters, ...overrides },
            { preserveState: true, preserveScroll: true },
        );
    }

    const monthLabel = MONTHS.find(m => m.value === String(filters.month))?.label ?? '';
    const achieved   = grandTotals?.total_income ?? 0;
    const progress   = pct(achieved, target);

    const agentOptions = [
        { value: '', label: 'All Agents' },
        ...(agentCodes ?? []).map(c => ({ value: c, label: c })),
    ];

    const trendData = (monthlyTrend ?? []).map(m => ({ label: m.month, Income: m.income, Count: m.count }));
    const typeData  = (byType ?? []).slice(0, 12).map(t => ({ label: t.visa_type, Income: t.total_income }));

    const AXIS_STYLE = { fontSize: 11, fill: '#667085', fontFamily: 'var(--font-body)' };

    return (
        <AppShell>
            <PageStack>
                <PageHeader
                    title="Visa Sales Report"
                    subtitle={`${monthLabel} ${filters.year}${filters.agent ? ` · ${filters.agent}` : ''}`}
                />

                {/* ── Filters ────────────────────────────────────────────── */}
                <FilterStrip>
                    <FilterField>
                        <Select
                            options={YEAR_OPTIONS}
                            value={String(filters.year)}
                            onChange={e => applyFilter({ year: e.target.value, page: 1 })}
                        />
                    </FilterField>
                    <FilterField>
                        <Select
                            options={MONTHS}
                            value={String(filters.month)}
                            onChange={e => applyFilter({ month: e.target.value, page: 1 })}
                        />
                    </FilterField>
                    <FilterField>
                        <Select
                            options={agentOptions}
                            value={filters.agent ?? ''}
                            onChange={e => applyFilter({ agent: e.target.value, page: 1 })}
                        />
                    </FilterField>
                </FilterStrip>

                {/* ── Stat cards ─────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    <StatCard label="Applications" value={grandTotals?.count ?? 0} tone="primary" icon={BarChart2} />
                    <StatCard label="Total SP"     value={`₱ ${fmt(grandTotals?.total_sp)}`}     tone="info" />
                    <StatCard label="Total NP"     value={`₱ ${fmt(grandTotals?.total_np)}`}     tone="warning" />
                    <StatCard label="Total Income" value={`₱ ${fmt(grandTotals?.total_income)}`} tone="success" icon={TrendingUp} />
                    {target > 0 && (
                        <StatCard
                            label="Target"
                            value={`₱ ${fmt(target)}`}
                            sub={`${progress}% achieved`}
                            tone={progress >= 100 ? 'success' : progress >= 70 ? 'primary' : 'warning'}
                            icon={Target}
                        />
                    )}
                </div>

                {/* ── Target progress bar ────────────────────────────────── */}
                {target > 0 && (
                    <Card>
                        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between',
                            fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)',
                            color: 'var(--color-text-muted)' }}>
                            <span>Progress vs Target</span>
                            <span style={{ fontWeight: 700 }}>{progress}%</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: 'var(--color-bg)' }}>
                            <div style={{
                                height: '100%', borderRadius: 4,
                                width: `${Math.min(progress, 100)}%`,
                                background: progress >= 100 ? 'var(--color-success)' : 'var(--color-primary)',
                                transition: 'width 0.4s ease',
                            }} />
                        </div>
                    </Card>
                )}

                {/* ── Two-column charts ──────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                    {/* Monthly trend */}
                    <Card>
                        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
                            color: 'var(--color-text)', marginBottom: 14 }}>
                            Monthly income trend — {filters.year}
                        </p>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(102,112,133,0.12)" />
                                <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={52}
                                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                                <Tooltip content={<Tip />} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="Income" stroke={PALETTE[0]}
                                    strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Income by visa type */}
                    <Card>
                        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
                            color: 'var(--color-text)', marginBottom: 14 }}>
                            Income by visa type — {monthLabel}
                        </p>
                        {typeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={typeData} layout="vertical"
                                    margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                    <CartesianGrid horizontal={false} stroke="rgba(102,112,133,0.12)" />
                                    <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false}
                                        tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                                    <YAxis type="category" dataKey="label" tick={{ ...AXIS_STYLE, fontSize: 10 }}
                                        axisLine={false} tickLine={false} width={96} />
                                    <Tooltip content={<Tip />} />
                                    <Bar dataKey="Income" fill={PALETTE[1]} radius={[0, 3, 3, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: 200, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: 'var(--color-text-muted)',
                                fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)' }}>
                                No data for this period.
                            </div>
                        )}
                    </Card>
                </div>

                {/* ── Agent breakdown table ──────────────────────────────── */}
                <Card>
                    <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
                        color: 'var(--color-text)', marginBottom: 12 }}>
                        Agent breakdown — click row to expand by visa type
                    </p>
                    <AgentTable rows={rows} agentTotals={agentTotals} />
                </Card>

                {/* Responsive */}
                <style>{`
                    @media (max-width: 760px) {
                        .visa-sr-charts { grid-template-columns: 1fr !important; }
                    }
                `}</style>
            </PageStack>
        </AppShell>
    );
}
