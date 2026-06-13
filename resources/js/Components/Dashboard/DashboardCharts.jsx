/**
 * DashboardCharts.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Chart components for the Dashboard. Uses Recharts (already in package.json).
 *
 * Renders chart panels below the KPI grid, driven entirely by dashboardConfig.js.
 * No hardcoded data — all values come from dashboardSections passed by the backend.
 *
 * Supported chart types:
 *   bar    — stacked or grouped bar (e.g. monthly sales by department)
 *   line   — multi-series line (e.g. target vs achieved progress curve)
 *   area   — area variant of line
 *   donut  — donut/pie (e.g. visa status breakdown)
 *
 * Chart data shape expected from backend (in section.chartData[dataKey]):
 *   bar/line/area → { labels: string[], series: { name: string, data: number[] }[] }
 *   donut         → { slices: { name: string, value: number }[] }
 *
 * Gracefully renders an empty state when data is absent.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
    ResponsiveContainer,
    BarChart, Bar,
    LineChart, Line,
    AreaChart, Area,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import Card from '../UI/Card';

/* ── Brand palette — matches app.css tokens as hex so Recharts can use them ── */
const PALETTE = [
    '#3F9800', // primary green
    '#38BDF8', // accent blue
    '#F59E0B', // warning amber
    '#3B82F6', // info blue
    '#EF4444', // error red
    '#22C55E', // success green
    '#8B5CF6', // purple
    '#EC4899', // pink
];

const GRID_COLOR   = 'rgba(102,112,133,0.12)';
const AXIS_COLOR   = '#667085';
const AXIS_FONT    = 12;

/* ── Custom tooltip ────────────────────────────────────────────────────────── */
function AmkorTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background   : 'var(--color-card)',
            border       : 'var(--border-container)',
            borderRadius : 'var(--radius-md)',
            padding      : '10px 14px',
            boxShadow    : 'var(--shadow-card)',
            fontSize     : 12,
            fontFamily   : 'var(--font-body)',
        }}>
            {label && (
                <p style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>{label}</p>
            )}
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{p.name}:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {typeof p.value === 'number'
                            ? p.value >= 1000
                                ? new Intl.NumberFormat('en-PH', { notation: 'compact', maximumFractionDigits: 1 }).format(p.value)
                                : p.value.toLocaleString('en-PH')
                            : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

/* ── Legend renderer ───────────────────────────────────────────────────────── */
function AmkorLegend({ payload }) {
    if (!payload?.length) return null;
    return (
        <div style={{
            display   : 'flex',
            flexWrap  : 'wrap',
            gap       : '8px 16px',
            fontSize  : 11,
            fontFamily: 'var(--font-body)',
            color     : 'var(--color-text-muted)',
            marginTop : 8,
        }}>
            {payload.map((p, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                    {p.value}
                </span>
            ))}
        </div>
    );
}

/* ── Empty state ───────────────────────────────────────────────────────────── */
function ChartEmpty({ title }) {
    return (
        <Card style={{ padding: 'var(--dash-card-pad, 20px)' }}>
            <p style={{
                fontFamily   : 'var(--font-heading)',
                fontWeight   : 700,
                fontSize     : 13,
                color        : 'var(--color-text)',
                marginBottom : 12,
            }}>{title}</p>
            <div style={{
                height        : 160,
                display       : 'flex',
                alignItems    : 'center',
                justifyContent: 'center',
                background    : 'var(--color-bg)',
                borderRadius  : 'var(--radius-md)',
                color         : 'var(--color-text-muted)',
                fontSize      : 13,
                fontFamily    : 'var(--font-body)',
            }}>
                No data yet — records will appear here once available.
            </div>
        </Card>
    );
}

/* ── normalise ─────────────────────────────────────────────────────────────── */
/* Converts backend shape → Recharts-friendly array of { label, ...series }  */
function normalise(raw) {
    if (!raw) return null;

    /* bar/line/area: { labels, series } */
    if (raw.labels && raw.series) {
        return raw.labels.map((label, li) => {
            const row = { label };
            raw.series.forEach(s => { row[s.name] = s.data[li] ?? 0; });
            return row;
        });
    }

    /* donut: { slices } */
    if (raw.slices) return raw.slices;

    /* Already an array (fallback) */
    if (Array.isArray(raw)) return raw;

    return null;
}

/* ── Bar chart ─────────────────────────────────────────────────────────────── */
function DashBarChart({ data, seriesNames = [], title, height = 220, stacked = false }) {
    return (
        <div>
            <p style={{
                fontFamily  : 'var(--font-heading)',
                fontWeight  : 700,
                fontSize    : 13,
                color       : 'var(--color-text)',
                marginBottom: 14,
            }}>{title}</p>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }} barSize={stacked ? 18 : 12}>
                    <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: AXIS_FONT, fill: AXIS_COLOR, fontFamily: 'var(--font-body)' }}
                        axisLine={false} tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: AXIS_FONT, fill: AXIS_COLOR, fontFamily: 'var(--font-body)' }}
                        axisLine={false} tickLine={false}
                        tickFormatter={v => v >= 1000 ? new Intl.NumberFormat('en-PH', { notation: 'compact', maximumFractionDigits: 1 }).format(v) : v}
                        width={48}
                    />
                    <Tooltip content={<AmkorTooltip />} cursor={{ fill: 'rgba(102,112,133,0.06)' }} />
                    <Legend content={<AmkorLegend />} />
                    {seriesNames.map((name, i) => (
                        <Bar
                            key={name}
                            dataKey={name}
                            fill={PALETTE[i % PALETTE.length]}
                            stackId={stacked ? 'stack' : undefined}
                            radius={stacked ? [0, 0, 0, 0] : [3, 3, 0, 0]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ── Line / Area chart ─────────────────────────────────────────────────────── */
function DashLineChart({ data, seriesNames = [], title, height = 220, isArea = false }) {
    const ChartComp = isArea ? AreaChart : LineChart;
    const SeriesComp = isArea ? Area : Line;
    return (
        <div>
            <p style={{
                fontFamily  : 'var(--font-heading)',
                fontWeight  : 700,
                fontSize    : 13,
                color       : 'var(--color-text)',
                marginBottom: 14,
            }}>{title}</p>
            <ResponsiveContainer width="100%" height={height}>
                <ChartComp data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: AXIS_FONT, fill: AXIS_COLOR, fontFamily: 'var(--font-body)' }}
                        axisLine={false} tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: AXIS_FONT, fill: AXIS_COLOR, fontFamily: 'var(--font-body)' }}
                        axisLine={false} tickLine={false}
                        tickFormatter={v => v >= 1000 ? new Intl.NumberFormat('en-PH', { notation: 'compact', maximumFractionDigits: 1 }).format(v) : v}
                        width={48}
                    />
                    <Tooltip content={<AmkorTooltip />} />
                    <Legend content={<AmkorLegend />} />
                    {seriesNames.map((name, i) => (
                        <SeriesComp
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={PALETTE[i % PALETTE.length]}
                            fill={isArea ? PALETTE[i % PALETTE.length] : undefined}
                            fillOpacity={isArea ? 0.12 : undefined}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    ))}
                </ChartComp>
            </ResponsiveContainer>
        </div>
    );
}

/* ── Donut chart ───────────────────────────────────────────────────────────── */
const RADIAN = Math.PI / 180;
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
            fontSize={11} fontFamily="var(--font-body)" fontWeight={700}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
}

function DashDonutChart({ data, title, height = 220 }) {
    return (
        <div>
            <p style={{
                fontFamily  : 'var(--font-heading)',
                fontWeight  : 700,
                fontSize    : 13,
                color       : 'var(--color-text)',
                marginBottom: 14,
            }}>{title}</p>
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={height * 0.22}
                        outerRadius={height * 0.38}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomLabel}
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<AmkorTooltip />} />
                    <Legend content={<AmkorLegend />} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ── ChartPanel ─────────────────────────────────────────────────────────────
 * Renders a single chart config entry from dashboardConfig.js.
 * Resolves data from dashboardSections then picks the right chart type.
 * ─────────────────────────────────────────────────────────────────────────── */
function ChartPanel({ chartConfig, sectionMap }) {
    const { type, section, dataKey, title } = chartConfig;
    const raw    = sectionMap[section]?.chartData?.[dataKey] ?? null;
    const data   = normalise(raw);

    if (!data || data.length === 0) {
        return <ChartEmpty title={title} />;
    }

    /* Derive series names from data keys (exclude 'label', 'name', 'value') */
    const SKIP = new Set(['label', 'name', 'value']);
    const seriesNames = data.length > 0
        ? Object.keys(data[0]).filter(k => !SKIP.has(k))
        : [];

    return (
        <Card style={{ padding: 'var(--dash-card-pad, 20px)' }}>
            {type === 'bar'  && <DashBarChart  data={data} seriesNames={seriesNames} title={title} stacked={seriesNames.length > 2} />}
            {type === 'line' && <DashLineChart  data={data} seriesNames={seriesNames} title={title} />}
            {type === 'area' && <DashLineChart  data={data} seriesNames={seriesNames} title={title} isArea />}
            {type === 'donut'&& <DashDonutChart data={data} title={title} />}
        </Card>
    );
}

/* ── DashboardCharts ─────────────────────────────────────────────────────────
 * Main export. Renders a responsive grid of chart panels.
 *
 * Props:
 *   charts          array  — chartConfig[] from getRoleConfig(role).charts
 *   dashboardSections array — raw section array from DashboardController
 * ─────────────────────────────────────────────────────────────────────────── */
export default function DashboardCharts({ charts = [], dashboardSections = [] }) {
    if (!charts.length) return null;

    const sectionMap = Object.fromEntries(dashboardSections.map(s => [s.key, s]));

    return (
        <div
            style={{
                display             : 'grid',
                gridTemplateColumns : 'repeat(2, 1fr)',
                gap                 : 'var(--space-2)',
            }}
            className="dash-charts-grid"
        >
            {charts.map((cfg, i) => (
                <div
                    key={i}
                    style={{ gridColumn: cfg.span === 'full' ? '1 / -1' : 'span 1' }}
                >
                    <ChartPanel chartConfig={cfg} sectionMap={sectionMap} />
                </div>
            ))}

            {/* Collapse to 1 column on narrow screens */}
            <style>{`
                @media (max-width: 860px) {
                    .dash-charts-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .dash-charts-grid > div {
                        grid-column: 1 / -1 !important;
                    }
                }
            `}</style>
        </div>
    );
}
