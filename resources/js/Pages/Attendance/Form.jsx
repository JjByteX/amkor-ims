import { useForm, router } from '@inertiajs/react';
import { Shield, Coffee, Clock, TrendingUp } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions, FormCancelButton, FormEditButton, FormSubmitButton } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeOvertimeMinutes(timeOut) {
    if (!timeOut) return 0;
    const [h, m] = timeOut.split(':').map(Number);
    const totalMinutes = h * 60 + m;
    const standardEnd  = 17 * 60; // 17:00
    return Math.max(0, totalMinutes - standardEnd);
}

function computeOverbreakMinutes(breakStart, breakEnd) {
    if (!breakStart || !breakEnd) return 0;
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const taken = Math.max(0, toMin(breakEnd) - toMin(breakStart));
    return Math.max(0, taken - 60); // 60-min standard break
}

function fmtMinutes(min) {
    if (!min || min === 0) return null;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

// ── Live counter badge ────────────────────────────────────────────────────────

function MinuteBadge({ minutes, label, color }) {
    if (!minutes) return null;
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            background: `${color}18`,
            color,
            fontSize: 'var(--font-size-small)',
        }}>
            <span className="font-body" style={{ fontWeight: 600 }}>
                {fmtMinutes(minutes)} {label}
            </span>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AttendanceForm({ record, employees, branches, statuses, leaveTypes }) {
    const isEdit = !!record;

    const { data, setData, post, put, processing, errors } = useForm({
        employee_id:      record?.employee_id ?? '',
        user_id:          record?.user_id ?? '',
        work_date:        record?.work_date?.split('T')[0] ?? record?.work_date ?? '',
        time_in:          record?.time_in  ? record.time_in.substring(0, 5)  : '',
        time_out:         record?.time_out ? record.time_out.substring(0, 5) : '',
        break_start:      record?.break_start ? record.break_start.substring(0, 5) : '',
        break_end:        record?.break_end   ? record.break_end.substring(0, 5)   : '',
        status:           record?.status   ?? 'present',
        leave_type:       record?.leave_type ?? '',
        branch_id:        record?.branch_id ?? '',
        override_reason:  record?.override_reason ?? '',
        remarks:          record?.remarks ?? '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        if (isEdit) {
            put(route('attendance.update', record.id));
        } else {
            post(route('attendance.store'));
        }
    }

    const requiresLeaveType = data.status === 'on_leave';

    // Live-computed preview counters (mirrors backend logic)
    const liveOvertime  = data.time_out  ? computeOvertimeMinutes(data.time_out)                      : 0;
    const liveOverbreak = data.break_start && data.break_end
        ? computeOverbreakMinutes(data.break_start, data.break_end)
        : 0;
    const liveLate = (() => {
        if (!data.time_in) return 0;
        const [h, m] = data.time_in.split(':').map(Number);
        const totalMin = h * 60 + m;
        const standard = 8 * 60;
        return Math.max(0, totalMin - standard);
    })();
    const liveUndertime = (() => {
        if (!data.time_out) return 0;
        const [h, m] = data.time_out.split(':').map(Number);
        const totalMin = h * 60 + m;
        const standard = 17 * 60;
        return Math.max(0, standard - totalMin);
    })();

    return (
        <AppShell>
            <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout columns={2}>
                    <PageHeader
                        title={isEdit ? 'Edit Attendance Record' : 'Add Attendance Record'}
                        subtitle="HR override — all changes are flagged in the audit trail"
                        actions={
                            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                                <FormCancelButton onClick={() => router.get(route('attendance.index'))} />
                                <FormSubmitButton loading={processing} />
                            </div>
                        }
                    />

                    {/* ── Card 1: Record Details ─────────────────────────────── */}
                    <FormCard title="Record Details">
                        {/* HR notice */}
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 'var(--space-1)',
                            padding: 'var(--space-2)',
                            background: 'rgba(59,130,246,0.08)',
                            border: '1px solid var(--color-info)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-info)',
                            fontSize: 'var(--font-size-small)',
                            marginBottom: 'var(--space-1)',
                        }}>
                            <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span className="font-body">
                                HR corrections only. All changes are logged as HR overrides in the audit trail.
                            </span>
                        </div>

                        <Select
                            label="Employee"
                            required
                            options={[
                                { value: '', label: 'Select employee…' },
                                ...employees.map((e) => ({ value: e.id, label: e.name })),
                            ]}
                            value={data.employee_id}
                            onChange={(e) => setData('employee_id', e.target.value)}
                            error={errors.employee_id}
                        />
                        <FormRow>
                            <Input
                                label="Work Date"
                                required
                                type="date"
                                value={data.work_date}
                                onChange={(e) => setData('work_date', e.target.value)}
                                error={errors.work_date}
                            />
                            <Select
                                label="Branch"
                                options={[
                                    { value: '', label: 'Select branch…' },
                                    ...branches.map((b) => ({ value: b.id, label: b.name })),
                                ]}
                                value={data.branch_id}
                                onChange={(e) => setData('branch_id', e.target.value)}
                                error={errors.branch_id}
                            />
                        </FormRow>
                        <Select
                            label="Status"
                            required
                            options={Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }))}
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            error={errors.status}
                        />
                        {requiresLeaveType && (
                            <Select
                                label="Leave Type"
                                required
                                options={[
                                    { value: '', label: 'Select type…' },
                                    ...Object.entries(leaveTypes).map(([v, l]) => ({ value: v, label: l })),
                                ]}
                                value={data.leave_type}
                                onChange={(e) => setData('leave_type', e.target.value)}
                                error={errors.leave_type}
                            />
                        )}
                        <Textarea
                            label="Override Reason"
                            required
                            placeholder="Explain why this record is being manually entered or corrected…"
                            value={data.override_reason}
                            onChange={(e) => setData('override_reason', e.target.value)}
                            error={errors.override_reason}
                            rows={3}
                        />
                        <Textarea
                            label="Remarks (optional)"
                            placeholder="Any additional notes…"
                            value={data.remarks}
                            onChange={(e) => setData('remarks', e.target.value)}
                            error={errors.remarks}
                            rows={2}
                        />
                    </FormCard>

                    {/* ── Card 2: Time In / Out ──────────────────────────────── */}
                    <FormCard title="Time In / Time Out">
                        <div className="font-body" style={{
                            fontSize: 'var(--font-size-small)',
                            color: 'var(--color-text-muted)',
                            marginBottom: 'var(--space-2)',
                        }}>
                            Standard hours: <strong>8:00 AM – 5:00 PM</strong>.
                            Late, undertime, and overtime are computed automatically when saved.
                        </div>

                        <FormRow>
                            <div>
                                <Input
                                    label="Time In"
                                    type="time"
                                    value={data.time_in}
                                    onChange={(e) => setData('time_in', e.target.value)}
                                    error={errors.time_in}
                                />
                                {liveLate > 0 && (
                                    <div style={{ marginTop: 4 }}>
                                        <MinuteBadge
                                            minutes={liveLate}
                                            label="late"
                                            color="var(--color-warning)"
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <Input
                                    label="Time Out"
                                    type="time"
                                    value={data.time_out}
                                    onChange={(e) => setData('time_out', e.target.value)}
                                    error={errors.time_out}
                                />
                                {liveUndertime > 0 && (
                                    <div style={{ marginTop: 4 }}>
                                        <MinuteBadge
                                            minutes={liveUndertime}
                                            label="undertime"
                                            color="var(--color-warning)"
                                        />
                                    </div>
                                )}
                                {liveOvertime > 0 && (
                                    <div style={{ marginTop: 4 }}>
                                        <MinuteBadge
                                            minutes={liveOvertime}
                                            label="overtime"
                                            color="var(--color-success)"
                                        />
                                    </div>
                                )}
                            </div>
                        </FormRow>
                    </FormCard>

                    {/* ── Card 3: Break Time ─────────────────────────────────── */}
                    <FormCard
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Coffee size={15} />
                                <span>Break / Lunch</span>
                            </div>
                        }
                    >
                        <div className="font-body" style={{
                            fontSize: 'var(--font-size-small)',
                            color: 'var(--color-text-muted)',
                            marginBottom: 'var(--space-2)',
                        }}>
                            Standard break: <strong>12:00 PM – 1:00 PM (60 min)</strong>.
                            Any excess beyond 60 minutes is counted as overbreak.
                        </div>

                        <FormRow>
                            <div>
                                <Input
                                    label="Break Start"
                                    type="time"
                                    value={data.break_start}
                                    onChange={(e) => setData('break_start', e.target.value)}
                                    error={errors.break_start}
                                />
                            </div>
                            <div>
                                <Input
                                    label="Break End"
                                    type="time"
                                    value={data.break_end}
                                    onChange={(e) => setData('break_end', e.target.value)}
                                    error={errors.break_end}
                                />
                            </div>
                        </FormRow>

                        {liveOverbreak > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <MinuteBadge
                                    minutes={liveOverbreak}
                                    label="overbreak"
                                    color="var(--color-error)"
                                />
                                <span className="font-body" style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.5 }}>
                                    Beyond 60-min standard
                                </span>
                            </div>
                        )}
                        {data.break_start && data.break_end && liveOverbreak === 0 && (
                            <div style={{ marginTop: 4 }}>
                                <span className="font-body" style={{ fontSize: 11, color: 'var(--color-success)' }}>
                                    ✓ Break within limit
                                </span>
                            </div>
                        )}
                    </FormCard>

                    {/* ── Card 4: Live Summary (when both time_in and time_out set) ── */}
                    {data.time_in && data.time_out && (
                        <FormCard title="Computed Counters Preview">
                            <div className="font-body" style={{
                                fontSize: 11,
                                color: 'var(--color-text)',
                                opacity: 0.5,
                                marginBottom: 'var(--space-1)',
                            }}>
                                These will be saved automatically. Verify before submitting.
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {liveLate > 0 && (
                                    <MinuteBadge minutes={liveLate} label="late" color="var(--color-warning)" />
                                )}
                                {liveUndertime > 0 && (
                                    <MinuteBadge minutes={liveUndertime} label="undertime" color="var(--color-warning)" />
                                )}
                                {liveOvertime > 0 && (
                                    <MinuteBadge minutes={liveOvertime} label="overtime" color="var(--color-success)" />
                                )}
                                {liveOverbreak > 0 && (
                                    <MinuteBadge minutes={liveOverbreak} label="overbreak" color="var(--color-error)" />
                                )}
                                {liveLate === 0 && liveUndertime === 0 && liveOvertime === 0 && liveOverbreak === 0 && (
                                    <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}>
                                        ✓ No late, undertime, overtime, or overbreak
                                    </span>
                                )}
                            </div>
                        </FormCard>
                    )}

                    <FormActions>
                        <FormCancelButton onClick={() => router.get(route('attendance.index'))} />
                        <FormSubmitButton loading={processing} />
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
