// ── AttendanceCalendar ──────────────────────────────────────────────────────
// Extracted from Pages/Attendance/Self.jsx (Phase 3.1) so it can be reused
// on the Employee Profile → Attendance tab (Phase 3.7) without duplicating
// the calendar grid markup/logic.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fmtTime = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12  = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
};

const STATUS_DOT = {
    present:                     'var(--color-success)',
    late:                        'var(--color-warning)',
    undertime:                   'var(--color-warning)',
    half_day:                    'var(--color-warning)',
    absent:                      'var(--color-error)',
    rest_day:                    'var(--color-text)',
    regular_holiday:             'var(--color-text)',
    special_non_working_holiday: 'var(--color-text)',
    present_regular_holiday:     'var(--color-success)',
    present_special_holiday:     'var(--color-success)',
    on_sil:                      'var(--color-info)',
    birthday_leave:              'var(--color-info)',
    on_leave:                    'var(--color-info)',
};

export default function AttendanceCalendar({ records, month, year, statuses }) {
    const recordMap = {};
    records.forEach((r) => {
        const d = r.work_date?.split('T')[0] ?? r.work_date;
        recordMap[d] = r;
    });

    const firstDay    = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const today = new Date();

    return (
        <div>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                {DAYS.map((d) => (
                    <div key={d} className="font-body" style={{
                        textAlign: 'center',
                        fontSize: 'var(--font-size-small)',
                        color: 'var(--color-text)',
                        opacity: 0.45,
                        padding: '4px 0',
                        fontWeight: 600,
                    }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {cells.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} />;

                    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const rec     = recordMap[dateStr];
                    const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
                    const isFuture = new Date(dateStr) > today;

                    return (
                        <div
                            key={day}
                            title={rec ? [
                                statuses[rec.status] ?? rec.status,
                                rec.minutes_overtime  > 0 ? `+${rec.minutes_overtime}m OT`       : null,
                                rec.minutes_overbreak > 0 ? `${rec.minutes_overbreak}m overbreak` : null,
                                rec.minutes_late      > 0 ? `${rec.minutes_late}m late`            : null,
                            ].filter(Boolean).join(' · ') : undefined}
                            style={{
                                minHeight: 52,
                                borderRadius: 'var(--radius-md)',
                                border: isToday ? '2px solid var(--color-primary)' : '1px solid rgba(0,0,0,0.07)',
                                background: 'var(--color-card)',
                                padding: '4px 6px',
                                position: 'relative',
                                opacity: isFuture ? 0.4 : 1,
                            }}
                        >
                            <div className="font-body" style={{
                                fontSize: 11,
                                fontWeight: isToday ? 700 : 400,
                                color: isToday ? 'var(--color-primary)' : 'var(--color-text)',
                            }}>
                                {day}
                            </div>
                            {rec && (
                                <>
                                    {/* Status dot */}
                                    <div style={{
                                        width: 8, height: 8,
                                        borderRadius: '50%',
                                        background: STATUS_DOT[rec.status] ?? 'var(--color-text)',
                                        position: 'absolute',
                                        top: 6, right: 6,
                                    }} />
                                    {/* Time in */}
                                    {rec.time_in && (
                                        <div className="font-body" style={{ fontSize: 10, color: 'var(--color-text)', opacity: 0.55, marginTop: 2 }}>
                                            {fmtTime(rec.time_in)}
                                        </div>
                                    )}
                                    {/* Overtime indicator dot */}
                                    {rec.minutes_overtime > 0 && (
                                        <div style={{
                                            width: 5, height: 5,
                                            borderRadius: '50%',
                                            background: 'var(--color-success)',
                                            position: 'absolute',
                                            bottom: 5, right: 6,
                                        }} />
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                {[
                    { key: 'present',  label: statuses.present  ?? 'Present',  color: 'var(--color-success)' },
                    { key: 'absent',   label: statuses.absent   ?? 'Absent',   color: 'var(--color-error)' },
                    { key: 'half_day', label: statuses.half_day ?? 'Half Day', color: 'var(--color-warning)' },
                    { key: 'on_leave', label: statuses.on_leave ?? 'On Leave', color: 'var(--color-info)' },
                ].map(({ key, label, color }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span className="font-body" style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.6 }}>
                            {label}
                        </span>
                    </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0 }} />
                    <span className="font-body" style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.6 }}>
                        Overtime
                    </span>
                </div>
            </div>
        </div>
    );
}
