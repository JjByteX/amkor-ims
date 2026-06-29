import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { LogIn, LogOut } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import PageStack from '../../Components/Shared/PageStack';
import FilterStrip from '../../Components/Shared/FilterStrip';
import DataTable from '../../Components/Shared/DataTable';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import MonthPicker from '../../Components/UI/MonthPicker';
import SegmentedControl from '../../Components/UI/SegmentedControl';
import Modal, { ModalCancelButton } from '../../Components/UI/Modal';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtTime = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12  = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
};

const fmtMinutes = (min) => {
    if (!min) return '—';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

const STATUS_VARIANT = {
    present:                     'success',
    late:                        'warning',
    undertime:                   'warning',
    half_day:                    'warning',
    absent:                      'error',
    rest_day:                    'neutral',
    regular_holiday:             'neutral',
    special_non_working_holiday: 'neutral',
    present_regular_holiday:     'success',
    present_special_holiday:     'success',
    on_sil:                      'info',
    birthday_leave:              'info',
    on_leave:                    'info',
};

const NON_WORKING = new Set([
    'rest_day', 'regular_holiday', 'special_non_working_holiday',
]);

const ATTENDED = new Set([
    'present', 'late', 'undertime',
    'present_regular_holiday', 'present_special_holiday',
    'on_leave', 'on_sil', 'birthday_leave',
]);

// ── Status filter groups ──────────────────────────────────────────────────────

const FILTER_GROUPS = [
    { key: 'all',      label: 'All',      match: () => true },
    { key: 'present',  label: 'Present',  match: r => ['present', 'present_regular_holiday', 'present_special_holiday', 'undertime'].includes(r.status) },
    { key: 'late',     label: 'Late',     match: r => r.status === 'late' },
    { key: 'absent',   label: 'Absent',   match: r => r.status === 'absent' },
    { key: 'half_day', label: 'Half Day', match: r => r.status === 'half_day' },
    { key: 'leave',    label: 'On Leave', match: r => ['on_leave', 'on_sil', 'birthday_leave'].includes(r.status) },
];

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data = [], color, gradientId }) {
    if (!data || data.length < 2) return null;

    const W = 100, H = 50;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const PAD = 3;

    const pts = data.map((v, i) => ({
        x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
        y: PAD + ((max - v) / range) * (H - PAD * 2 - 2),
    }));

    let linePath = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        const cpx = (pts[i - 1].x + pts[i].x) / 2;
        linePath += ` C ${cpx} ${pts[i - 1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }

    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H, display: 'block' }} preserveAspectRatio="none">
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={color} stopOpacity="0.45" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.03" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ title, mainValue, sparkData, color, gradientId }) {
    return (
        <div style={{
            background: 'var(--color-card)', border: 'var(--border-container)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)',
            boxShadow: 'var(--shadow-card)', display: 'flex',
            flexDirection: 'column', gap: 'var(--space-2)', minWidth: 0,
        }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.3 }}>
                {title}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 34, color: 'var(--color-text)', lineHeight: 1, minWidth: 0 }}>
                    {mainValue}
                </div>
                {sparkData && sparkData.length > 1 && (
                    <div style={{ flexShrink: 0, alignSelf: 'flex-end', paddingBottom: 2 }}>
                        <Sparkline data={sparkData} color={color} gradientId={gradientId} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AttendanceSelf({
    records,
    stats,
    filters,
    todayRecord,
    statuses,
    currentUser,
    now,
}) {
    const { flash } = usePage().props;
    const { post, processing } = useForm({});
    const [showConfirm, setShowConfirm]   = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    const month = filters.month;
    const year  = filters.year;

    // MonthPicker works with 'YYYY-MM' strings
    const monthPickerValue = `${year}-${String(month).padStart(2, '0')}`;

    function handleMonthChange(e) {
        const [y, m] = e.target.value.split('-').map(Number);
        setStatusFilter('all');
        router.get(route('attendance.me'), { month: m, year: y }, { preserveState: false });
    }

    // ── Derived data ──────────────────────────────────────────────────────────

    const workingDays   = records.filter(r => !NON_WORKING.has(r.status));
    const attendedCount = records.filter(r => ATTENDED.has(r.status)).length;
    const halfDayCount  = records.filter(r => r.status === 'half_day').length;
    const attended      = attendedCount + halfDayCount * 0.5;

    const attendanceRate = workingDays.length > 0 ? Math.round((attended / workingDays.length) * 100) : 0;
    const lateDays       = stats.total_late ?? 0;
    const onTimeRate     = workingDays.length > 0 ? Math.round(((workingDays.length - lateDays) / workingDays.length) * 100) : 0;
    const absentDays     = stats.total_absent ?? 0;

    const totalWorkMin      = records.reduce((s, r) => s + (r.minutes_worked    ?? 0), 0);
    const totalUndertimeMin = stats.minutes_undertime ?? 0;
    const workH  = Math.floor(totalWorkMin / 60);
    const workM  = totalWorkMin % 60;
    const utH    = Math.floor(totalUndertimeMin / 60);
    const utM    = totalUndertimeMin % 60;
    const workValue      = workH > 0 ? `${workH} Hours`  : `${workM} Min`;
    const undertimeValue = utH  > 0 ? `${utH} Hours`  : `${utM} Min`;

    // ── Sparklines ────────────────────────────────────────────────────────────

    const sorted = [...records]
        .filter(r => !NON_WORKING.has(r.status))
        .sort((a, b) => new Date(a.work_date) - new Date(b.work_date));

    let attendedSoFar = 0;
    const attendanceSparkData = sorted.map((r, i) => {
        if (ATTENDED.has(r.status)) attendedSoFar += r.status === 'half_day' ? 0.5 : 1;
        return Math.round((attendedSoFar / (i + 1)) * 100);
    });

    let onTimeSoFar = 0;
    const onTimeSparkData = sorted.map((r, i) => {
        if ((r.minutes_late ?? 0) === 0 && r.status !== 'absent') onTimeSoFar++;
        return Math.round((onTimeSoFar / (i + 1)) * 100);
    });

    let absentSoFar = 0;
    const absentSparkData    = sorted.map(r => { if (r.status === 'absent') absentSoFar++; return absentSoFar; });
    const workSparkData      = sorted.map(r => r.minutes_worked    ?? 0);
    const undertimeSparkData = sorted.map(r => r.minutes_undertime ?? 0);

    // ── Status filter tabs (only show groups that have records) ───────────────

    const filterTabs = FILTER_GROUPS
        .map(g => ({ key: g.key, label: g.label, count: g.key === 'all' ? records.length : records.filter(g.match).length }))
        .filter(t => t.key === 'all' || t.count > 0);

    const activeGroup     = FILTER_GROUPS.find(g => g.key === statusFilter) ?? FILTER_GROUPS[0];
    const filteredRecords = records.filter(activeGroup.match);

    // ── Clock strings ─────────────────────────────────────────────────────────

    const nowDate      = new Date(now);
    const timeStr      = nowDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    const dateStr      = nowDate.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const isClockedIn  = todayRecord?.time_in && !todayRecord?.time_out;
    const isClockedOut = todayRecord?.time_in &&  todayRecord?.time_out;

    function handleClock(type) {
        setShowConfirm(null);
        post(route(type === 'in' ? 'attendance.clock-in' : 'attendance.clock-out'), { preserveScroll: true });
    }

    // ── Table columns ─────────────────────────────────────────────────────────

    const columns = [
        {
            key: 'work_date',
            label: 'Date',
            render: (row) => {
                const d = row.work_date?.split('T')[0] ?? row.work_date;
                return (
                    <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', fontWeight: 600 }}>
                        {new Date(d + 'T12:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                );
            },
        },
        {
            key: 'time_in',
            label: 'Time In / Out',
            sortable: false,
            render: (row) => (
                <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {fmtTime(row.time_in)}
                    <span style={{ color: 'var(--color-text-muted)', margin: '0 4px' }}>→</span>
                    {fmtTime(row.time_out)}
                    {row.minutes_worked > 0 && (
                        <span style={{ marginLeft: 8, color: 'var(--color-text-muted)', fontSize: 11 }}>
                            {fmtMinutes(row.minutes_worked)}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'adjustments',
            label: 'Notes',
            sortable: false,
            render: (row) => {
                const flags = [];
                if (row.minutes_late      > 0) flags.push({ key: 'late', text: `${row.minutes_late}m late`,                   color: 'var(--color-warning)' });
                if (row.minutes_overtime  > 0) flags.push({ key: 'ot',   text: `+${fmtMinutes(row.minutes_overtime)} OT`,       color: 'var(--color-success)' });
                if (row.minutes_overbreak > 0) flags.push({ key: 'ob',   text: `${fmtMinutes(row.minutes_overbreak)} overbreak`, color: 'var(--color-error)'   });
                if (row.minutes_undertime > 0) flags.push({ key: 'ut',   text: `${fmtMinutes(row.minutes_undertime)} early`,    color: 'var(--color-warning)' });
                if (!flags.length) return <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>—</span>;
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {flags.map(({ key, text, color }) => (
                            <span key={key} style={{ fontSize: 11, fontWeight: 600, color }}>{text}</span>
                        ))}
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>
                    {statuses[row.status] ?? row.status}
                </Badge>
            ),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AppShell>
            <PageStack>

                {flash?.message && (
                    <div className="font-body" style={{
                        padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', color: '#fff',
                        fontSize: 'var(--font-size-small)',
                        background: flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-info)',
                    }}>
                        {flash.message}
                    </div>
                )}

                {/* Title + MonthPicker in header */}
                <PageHeader
                    title="My Attendance"
                    actions={
                        <MonthPicker
                            value={monthPickerValue}
                            onChange={handleMonthChange}
                        />
                    }
                />

                {/* ── Clock card ────────────────────────────────────────────── */}
                <Card>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                        <div>
                            <div className="font-heading font-semibold" style={{ fontSize: 28, color: 'var(--color-text)', lineHeight: 1 }}>
                                {timeStr}
                            </div>
                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55, marginTop: 4 }}>
                                {dateStr}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-1)' }}>
                            {isClockedOut ? (
                                <>
                                    <Badge variant="success">Done for today</Badge>
                                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>
                                        {fmtTime(todayRecord.time_in)} → {fmtTime(todayRecord.time_out)} · {fmtMinutes(todayRecord.minutes_worked)} worked
                                    </div>
                                    {todayRecord.minutes_overtime  > 0 && <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}>+{fmtMinutes(todayRecord.minutes_overtime)} overtime</span>}
                                    {todayRecord.minutes_late      > 0 && <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-warning)' }}>{todayRecord.minutes_late}m late today</span>}
                                    {todayRecord.minutes_overbreak > 0 && <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-error)'   }}>{fmtMinutes(todayRecord.minutes_overbreak)} overbreak</span>}
                                </>
                            ) : isClockedIn ? (
                                <>
                                    <Badge variant="warning">In progress</Badge>
                                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>
                                        Since {fmtTime(todayRecord.time_in)}
                                        {todayRecord.minutes_late > 0 && <span style={{ color: 'var(--color-warning)', marginLeft: 6 }}>({todayRecord.minutes_late}m late)</span>}
                                    </div>
                                    <Button variant="danger" icon={LogOut} loading={processing} onClick={() => setShowConfirm('out')}>Clock Out</Button>
                                </>
                            ) : (
                                <>
                                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55 }}>Not clocked in yet</div>
                                    <Button icon={LogIn} loading={processing} onClick={() => setShowConfirm('in')}>Clock In</Button>
                                </>
                            )}
                        </div>
                    </div>
                </Card>

                {/* ── 5 KPI Cards ───────────────────────────────────────────── */}
                {workingDays.length > 0 && (
                    <>
                        <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-2)' }}>
                            <KpiCard title="Attendance Rate"     mainValue={`${attendanceRate}%`} sparkData={attendanceSparkData} color="#3F9800" gradientId="spark-attendance" />
                            <KpiCard title="On Time Percentage"  mainValue={`${onTimeRate}%`}     sparkData={onTimeSparkData}     color="#38BDF8" gradientId="spark-ontime"     />
                            <KpiCard title="Absent Days"         mainValue={`${String(absentDays).padStart(2, '0')} Days`} sparkData={absentSparkData} color="#EF4444" gradientId="spark-absent" />
                            <KpiCard title="Total Working Hours" mainValue={workValue}            sparkData={workSparkData}       color="#F59E0B" gradientId="spark-work"       />
                            <KpiCard title="Total Undertime"     mainValue={undertimeValue}       sparkData={undertimeSparkData}  color="#A855F7" gradientId="spark-undertime"  />
                        </div>
                        <style>{`
                            @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(3, 1fr) !important; } }
                            @media (max-width: 700px)  { .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
                            @media (max-width: 420px)  { .kpi-grid { grid-template-columns: 1fr !important; } }
                        `}</style>
                    </>
                )}

                {/* ── Records table with SegmentedControl filter in toolbar ─── */}
                <DataTable
                    columns={columns}
                    rows={filteredRecords}
                    pageSize={0}
                    empty={statusFilter === 'all' ? 'No records for this month yet.' : `No ${activeGroup.label.toLowerCase()} records this month.`}
                    toolbar={
                        filterTabs.length > 2 && (
                            <FilterStrip>
                                <SegmentedControl
                                    tabs={filterTabs}
                                    activeKey={statusFilter}
                                    onChange={setStatusFilter}
                                />
                            </FilterStrip>
                        )
                    }
                />

                {/* ── Clock confirm modal ───────────────────────────────────── */}
                <Modal
                    open={!!showConfirm}
                    onClose={() => setShowConfirm(null)}
                    title={showConfirm === 'in' ? 'Confirm Clock In' : 'Confirm Clock Out'}
                    footer={
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                            <ModalCancelButton onClick={() => setShowConfirm(null)} />
                            <Button
                                variant={showConfirm === 'in' ? 'primary' : 'danger'}
                                icon={showConfirm === 'in' ? LogIn : LogOut}
                                loading={processing}
                                onClick={() => handleClock(showConfirm)}
                            >
                                {showConfirm === 'in' ? 'Clock In Now' : 'Clock Out Now'}
                            </Button>
                        </div>
                    }
                >
                    <p className="font-body" style={{ color: 'var(--color-text)' }}>
                        {showConfirm === 'in' ? `Record your time in now (${timeStr})?` : `Record your time out now (${timeStr})?`}
                    </p>
                </Modal>

            </PageStack>
        </AppShell>
    );
}