import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import {
    ArrowLeft, Edit2, Trash2, Clock, AlertTriangle,
    User, MapPin, Info, CheckCircle, Shield, TrendingUp, Coffee,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '—';

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

const fmtDateTime = (dt) =>
    dt ? new Date(dt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

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

// ── Detail row ─────────────────────────────────────────────────────────────────

function DetailRow({ label, value, highlight, mono }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <span className="font-body" style={{ minWidth: 180, fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55, flexShrink: 0 }}>
                {label}
            </span>
            <span className={`font-body${mono ? ' font-mono' : ''}`} style={{ fontSize: 'var(--font-size-small)', color: highlight ?? 'var(--color-text)', fontWeight: highlight ? 600 : 400 }}>
                {value ?? '—'}
            </span>
        </div>
    );
}

// ── Counter pill ───────────────────────────────────────────────────────────────

function CounterPill({ minutes, label, color, icon: Icon }) {
    if (!minutes || minutes === 0) return null;
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            background: `${color}12`,
            border: `1px solid ${color}30`,
        }}>
            {Icon && <Icon size={13} color={color} />}
            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color, fontWeight: 600 }}>
                {fmtMinutes(minutes)} {label}
            </span>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AttendanceShow({ record, statuses, leaveTypes, canManage }) {
    const { flash } = usePage().props;
    const [showDelete, setShowDelete] = useState(false);
    const { delete: destroy, processing } = useForm({});

    function handleDelete() {
        destroy(route('attendance.destroy', record.id), {
            onSuccess: () => router.get(route('attendance.index')),
        });
    }

    const workedPct = record.minutes_worked
        ? Math.min(100, Math.round((record.minutes_worked / (8 * 60)) * 100))
        : 0;

    const hasCounters = record.minutes_late > 0 || record.minutes_undertime > 0
        || record.minutes_overtime > 0 || record.minutes_overbreak > 0;

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
                    title="Attendance Record"
                    subtitle={fmt(record.work_date)}
                    actions={
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                            <Button variant="ghost" icon={ArrowLeft} onClick={() => router.get(route('attendance.index'))}>
                                Back
                            </Button>
                            {canManage && (
                                <>
                                    <Button variant="primary" icon={Edit2} onClick={() => router.get(route('attendance.edit', record.id))}>
                                        Edit
                                    </Button>
                                    <Button variant="danger" icon={Trash2} onClick={() => setShowDelete(true)}>
                                        Delete
                                    </Button>
                                </>
                            )}
                        </div>
                    }
                />

                {/* HR override banner */}
                {record.hr_override && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid var(--color-info)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-info)',
                        fontSize: 'var(--font-size-small)',
                    }}>
                        <Shield size={16} />
                        <span className="font-body">
                            <strong>HR Override</strong>
                            {record.override_reason ? ` — ${record.override_reason}` : ''}
                        </span>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>

                    {/* Time summary card */}
                    <Card>
                        <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
                            Time Summary
                        </div>

                        {/* Status badge */}
                        <div style={{ marginBottom: 'var(--space-2)' }}>
                            <Badge variant={STATUS_VARIANT[record.status] ?? 'neutral'}>
                                {statuses[record.status] ?? record.status}
                            </Badge>
                            {record.leave_type && (
                                <span className="font-body" style={{ marginLeft: 8, fontSize: 'var(--font-size-small)', color: 'var(--color-info)' }}>
                                    {leaveTypes[record.leave_type] ?? record.leave_type}
                                </span>
                            )}
                        </div>

                        {/* Time in / out boxes */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <div style={{ padding: 'var(--space-2)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                                <div className="font-body" style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.45, marginBottom: 2 }}>Time In</div>
                                <div className="font-heading font-semibold" style={{ fontSize: 18, color: 'var(--color-text)' }}>
                                    {fmtTime(record.time_in)}
                                </div>
                                {record.minutes_late > 0 && (
                                    <div style={{ fontSize: 11, color: 'var(--color-warning)', marginTop: 2 }}>
                                        {record.minutes_late}m late
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: 'var(--space-2)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                                <div className="font-body" style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.45, marginBottom: 2 }}>Time Out</div>
                                <div className="font-heading font-semibold" style={{ fontSize: 18, color: 'var(--color-text)' }}>
                                    {record.time_out
                                        ? fmtTime(record.time_out)
                                        : (record.is_clocked_in
                                            ? <span style={{ color: 'var(--color-warning)' }}>Active</span>
                                            : '—')}
                                </div>
                                {record.minutes_undertime > 0 && (
                                    <div style={{ fontSize: 11, color: 'var(--color-warning)', marginTop: 2 }}>
                                        {record.minutes_undertime}m early
                                    </div>
                                )}
                                {record.minutes_overtime > 0 && (
                                    <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 2 }}>
                                        +{record.minutes_overtime}m overtime
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Break time (if recorded) */}
                        {(record.break_start || record.break_end) && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                <div style={{ padding: 'var(--space-2)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                                    <div className="font-body" style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.45, marginBottom: 2 }}>Break Start</div>
                                    <div className="font-body font-semibold" style={{ fontSize: 14, color: 'var(--color-text)' }}>
                                        {fmtTime(record.break_start)}
                                    </div>
                                </div>
                                <div style={{ padding: 'var(--space-2)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                                    <div className="font-body" style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.45, marginBottom: 2 }}>Break End</div>
                                    <div className="font-body font-semibold" style={{ fontSize: 14, color: 'var(--color-text)' }}>
                                        {fmtTime(record.break_end)}
                                    </div>
                                    {record.minutes_overbreak > 0 && (
                                        <div style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 2 }}>
                                            {record.minutes_overbreak}m overbreak
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Counter pills: Late | Undertime | Overtime | Overbreak */}
                        {hasCounters && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--space-2)' }}>
                                <CounterPill minutes={record.minutes_late}      label="Late"      color="var(--color-warning)" icon={AlertTriangle} />
                                <CounterPill minutes={record.minutes_undertime} label="Undertime" color="var(--color-warning)" icon={Clock} />
                                <CounterPill minutes={record.minutes_overtime}  label="Overtime"  color="var(--color-success)" icon={TrendingUp} />
                                <CounterPill minutes={record.minutes_overbreak} label="Overbreak" color="var(--color-error)"   icon={Coffee} />
                            </div>
                        )}

                        {/* Hours worked bar */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55 }}>
                                    Hours Worked
                                </span>
                                <span className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                    {fmtMinutes(record.minutes_worked)} / 8h
                                </span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: 'var(--color-bg)', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${workedPct}%`,
                                    borderRadius: 3,
                                    background: workedPct >= 100 ? 'var(--color-success)' : workedPct >= 75 ? 'var(--color-primary)' : 'var(--color-warning)',
                                    transition: 'width 0.3s ease',
                                }} />
                            </div>
                        </div>
                    </Card>

                    {/* Details card */}
                    <Card>
                        <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
                            Details
                        </div>
                        <DetailRow label="Employee"  value={record.user?.name ?? `#${record.employee_id}`} />
                        <DetailRow label="Branch"    value={record.branch?.name ?? '—'} />
                        <DetailRow label="Work Date" value={fmt(record.work_date)} />
                        <DetailRow label="IP Address" value={record.ip_address} mono />
                        <DetailRow label="Device"    value={record.device_info ? record.device_info.substring(0, 60) + '…' : '—'} />
                        {record.remarks && <DetailRow label="Remarks" value={record.remarks} />}
                    </Card>

                    {/* Audit card */}
                    <Card>
                        <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
                            Audit Trail
                        </div>
                        <DetailRow label="Clocked In At"  value={fmtDateTime(record.time_in_at)} />
                        <DetailRow label="Clocked Out At" value={fmtDateTime(record.time_out_at)} />
                        <DetailRow label="Recorded By"    value={record.recorded_by?.name ?? '—'} />
                        <DetailRow label="Created"        value={fmtDateTime(record.created_at)} />
                        <DetailRow label="Last Updated"   value={fmtDateTime(record.updated_at)} />
                    </Card>
                </div>

                {/* Delete modal */}
                <Modal
                    open={showDelete}
                    onClose={() => setShowDelete(false)}
                    title="Delete Attendance Record"
                    footer={
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                            <Button variant="ghost" onClick={() => setShowDelete(false)}>Cancel</Button>
                            <Button variant="danger" icon={Trash2} loading={processing} onClick={handleDelete}>
                                Delete Record
                            </Button>
                        </div>
                    }
                >
                    <p className="font-body" style={{ color: 'var(--color-text)' }}>
                        This will soft-delete the attendance record for{' '}
                        <strong>{record.user?.name}</strong> on <strong>{fmt(record.work_date)}</strong>.
                        The record can be restored by the General Manager.
                    </p>
                </Modal>
            </div>
        </AppShell>
    );
}
