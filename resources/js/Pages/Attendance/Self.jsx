import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import {
    Clock, CheckCircle, XCircle, MinusCircle, AlertTriangle,
    LogIn, LogOut, ChevronLeft, ChevronRight, Calendar, TrendingUp, Coffee,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import AttendanceCalendar from '../../Components/Shared/AttendanceCalendar';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

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

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AttendanceSelf({
    records,
    stats,
    filters,
    todayRecord,
    statuses,
    leaveTypes,
    currentUser,
    now,
}) {
    const { flash } = usePage().props;
    const { post, processing } = useForm({});
    const [showConfirm, setShowConfirm] = useState(null);

    const month = filters.month;
    const year  = filters.year;

    function goMonth(delta) {
        let m = month + delta;
        let y = year;
        if (m > 12) { m = 1; y++; }
        if (m < 1)  { m = 12; y--; }
        router.get(route('attendance.me'), { month: m, year: y }, { preserveState: false });
    }

    function handleClock(type) {
        setShowConfirm(null);
        post(route(type === 'in' ? 'attendance.clock-in' : 'attendance.clock-out'), {
            preserveScroll: true,
        });
    }

    const nowDate     = new Date(now);
    const timeStr     = nowDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    const dateStr     = nowDate.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const isClockedIn  = todayRecord?.time_in && !todayRecord?.time_out;
    const isClockedOut = todayRecord?.time_in && todayRecord?.time_out;

    // Monthly stat tiles — Excel column order: Present | Absent | OT | Lates | OB | Undertime
    const statTiles = [
        { label: 'Present',       value: stats.total_present,                   color: 'var(--color-success)' },
        { label: 'Absent',        value: stats.total_absent,                    color: 'var(--color-error)' },
        { label: 'Half Day',      value: stats.total_half_day,                  color: 'var(--color-warning)' },
        { label: 'On Leave',      value: stats.total_on_leave,                  color: 'var(--color-info)' },
        { label: 'Overtime',      value: fmtMinutes(stats.minutes_overtime),    color: 'var(--color-success)' },
        { label: 'Late Days',     value: stats.total_late,                      color: 'var(--color-warning)' },
        { label: 'Total Late',    value: fmtMinutes(stats.minutes_late),        color: 'var(--color-warning)' },
        { label: 'Overbreak',     value: fmtMinutes(stats.minutes_overbreak),   color: 'var(--color-error)' },
        { label: 'Undertime',     value: fmtMinutes(stats.minutes_undertime),   color: 'var(--color-warning)' },
    ];

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

                {/* Flash */}
                {flash?.message && (
                    <div className="font-body" style={{
                        padding: 'var(--space-2)',
                        background: flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-info)',
                        color: '#fff',
                        fontSize: 'var(--font-size-small)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title="My Attendance"
                    subtitle={`${currentUser.name} · ${MONTHS[month - 1]} ${year}`}
                />

                {/* Clock card */}
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
                                        {fmtTime(todayRecord.time_in)} → {fmtTime(todayRecord.time_out)}
                                        {' · '}{fmtMinutes(todayRecord.minutes_worked)} worked
                                    </div>
                                    {todayRecord.minutes_overtime > 0 && (
                                        <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}>
                                            +{fmtMinutes(todayRecord.minutes_overtime)} overtime
                                        </span>
                                    )}
                                    {todayRecord.minutes_late > 0 && (
                                        <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-warning)' }}>
                                            {todayRecord.minutes_late}m late today
                                        </span>
                                    )}
                                    {todayRecord.minutes_overbreak > 0 && (
                                        <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-error)' }}>
                                            {fmtMinutes(todayRecord.minutes_overbreak)} overbreak
                                        </span>
                                    )}
                                </>
                            ) : isClockedIn ? (
                                <>
                                    <Badge variant="warning">In progress</Badge>
                                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>
                                        Since {fmtTime(todayRecord.time_in)}
                                        {todayRecord.minutes_late > 0 && (
                                            <span style={{ color: 'var(--color-warning)', marginLeft: 6 }}>
                                                ({todayRecord.minutes_late}m late)
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        variant="danger"
                                        icon={LogOut}
                                        loading={processing}
                                        onClick={() => setShowConfirm('out')}
                                    >
                                        Clock Out
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55 }}>
                                        Not clocked in yet
                                    </div>
                                    <Button
                                        icon={LogIn}
                                        loading={processing}
                                        onClick={() => setShowConfirm('in')}
                                    >
                                        Clock In
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Monthly stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-2)' }}>
                    {statTiles.map(({ label, value, color }) => (
                        <Card key={label}>
                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5 }}>
                                {label}
                            </div>
                            <div className="font-heading font-semibold" style={{ fontSize: 20, color, marginTop: 2 }}>
                                {value ?? 0}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Month nav */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-text)' }}>
                        {MONTHS[month - 1]} {year}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => goMonth(-1)} />
                        <Button variant="ghost" size="sm" icon={ChevronRight} onClick={() => goMonth(1)} />
                    </div>
                </div>

                {/* Calendar */}
                <Card>
                    <AttendanceCalendar
                        records={records}
                        month={month}
                        year={year}
                        statuses={statuses}
                    />
                </Card>

                {/* Records list */}
                <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-text)' }}>
                    Records
                </div>

                {records.length === 0 ? (
                    <Card>
                        <div className="font-body" style={{ textAlign: 'center', color: 'var(--color-text)', opacity: 0.45, padding: 'var(--space-4)' }}>
                            No records for this month yet.
                        </div>
                    </Card>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                        {records.map((row) => (
                            <Card key={row.id}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                    <div>
                                        <div className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                            {new Date(row.work_date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55 }}>
                                            {fmtTime(row.time_in)} → {fmtTime(row.time_out)}
                                            {row.minutes_worked > 0 && (
                                                <span style={{ marginLeft: 8 }}>{fmtMinutes(row.minutes_worked)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        {row.minutes_late > 0 && (
                                            <span style={{ fontSize: 11, color: 'var(--color-warning)' }}>
                                                {row.minutes_late}m late
                                            </span>
                                        )}
                                        {row.minutes_overtime > 0 && (
                                            <span style={{ fontSize: 11, color: 'var(--color-success)' }}>
                                                +{fmtMinutes(row.minutes_overtime)} OT
                                            </span>
                                        )}
                                        {row.minutes_overbreak > 0 && (
                                            <span style={{ fontSize: 11, color: 'var(--color-error)' }}>
                                                {fmtMinutes(row.minutes_overbreak)} OB
                                            </span>
                                        )}
                                        <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>
                                            {statuses[row.status] ?? row.status}
                                        </Badge>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Confirm clock modal */}
                <Modal
                    open={!!showConfirm}
                    onClose={() => setShowConfirm(null)}
                    title={showConfirm === 'in' ? 'Confirm Clock In' : 'Confirm Clock Out'}
                    footer={
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                            <Button variant="ghost" onClick={() => setShowConfirm(null)}>Cancel</Button>
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
                        {showConfirm === 'in'
                            ? `Record your time in now (${timeStr})?`
                            : `Record your time out now (${timeStr})?`}
                    </p>
                </Modal>
            </div>
        </AppShell>
    );
}
