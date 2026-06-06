import { useForm, router } from '@inertiajs/react';
import { ArrowLeft, Save, AlertTriangle, Shield } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

// ── Field helpers ─────────────────────────────────────────────────────────────

function FieldGroup({ label, error, children, required }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="font-body" style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-text)',
                fontWeight: 600,
            }}>
                {label}{required && <span style={{ color: 'var(--color-error)', marginLeft: 2 }}>*</span>}
            </label>
            {children}
            {error && (
                <span className="font-body" style={{ fontSize: 11, color: 'var(--color-error)' }}>
                    {error}
                </span>
            )}
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <div className="font-heading font-semibold" style={{
            fontSize: 'var(--font-size-heading)',
            color: 'var(--color-text)',
            paddingBottom: 'var(--space-1)',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            marginBottom: 'var(--space-2)',
        }}>
            {children}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AttendanceForm({ record, employees, branches, statuses, leaveTypes }) {
    const isEdit = !!record;

    const { data, setData, post, put, processing, errors } = useForm({
        employee_id:     record?.employee_id ?? '',
        user_id:         record?.user_id ?? '',
        work_date:       record?.work_date?.split('T')[0] ?? record?.work_date ?? '',
        time_in:         record?.time_in ? record.time_in.substring(0, 5) : '',
        time_out:        record?.time_out ? record.time_out.substring(0, 5) : '',
        status:          record?.status ?? 'present',
        leave_type:      record?.leave_type ?? '',
        branch_id:       record?.branch_id ?? '',
        override_reason: record?.override_reason ?? '',
        remarks:         record?.remarks ?? '',
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

    return (
        <AppShell>
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

                    <PageHeader
                        title={isEdit ? 'Edit Attendance Record' : 'Add Attendance Record'}
                        subtitle="HR override — all changes are flagged in the audit trail"
                        actions={
                            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    icon={ArrowLeft}
                                    onClick={() => isEdit
                                        ? router.get(route('attendance.show', record.id))
                                        : router.get(route('attendance.index'))
                                    }
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" icon={Save} loading={processing}>
                                    {isEdit ? 'Save Changes' : 'Create Record'}
                                </Button>
                            </div>
                        }
                    />

                    {/* HR override notice */}
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-1)',
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid var(--color-info)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-info)',
                        fontSize: 'var(--font-size-small)',
                    }}>
                        <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span className="font-body">
                            This form is for HR corrections only. All changes are logged as HR overrides in the audit trail.
                            Employee self clock-in/out is done from the main attendance page.
                        </span>
                    </div>

                    <Card>
                        <SectionTitle>Record Details</SectionTitle>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>

                            <FieldGroup label="Employee" required error={errors.employee_id}>
                                <Select
                                    options={[
                                        { value: '', label: 'Select employee…' },
                                        ...employees.map((e) => ({ value: e.id, label: e.name })),
                                    ]}
                                    value={data.employee_id}
                                    onChange={(e) => setData('employee_id', e.target.value)}
                                />
                            </FieldGroup>

                            <FieldGroup label="Work Date" required error={errors.work_date}>
                                <Input
                                    type="date"
                                    value={data.work_date}
                                    onChange={(e) => setData('work_date', e.target.value)}
                                />
                            </FieldGroup>

                            <FieldGroup label="Branch" error={errors.branch_id}>
                                <Select
                                    options={[
                                        { value: '', label: 'Select branch…' },
                                        ...branches.map((b) => ({ value: b.id, label: b.name })),
                                    ]}
                                    value={data.branch_id}
                                    onChange={(e) => setData('branch_id', e.target.value)}
                                />
                            </FieldGroup>

                            <FieldGroup label="Status" required error={errors.status}>
                                <Select
                                    options={Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }))}
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                />
                            </FieldGroup>

                            {requiresLeaveType && (
                                <FieldGroup label="Leave Type" required error={errors.leave_type}>
                                    <Select
                                        options={[
                                            { value: '', label: 'Select type…' },
                                            ...Object.entries(leaveTypes).map(([v, l]) => ({ value: v, label: l })),
                                        ]}
                                        value={data.leave_type}
                                        onChange={(e) => setData('leave_type', e.target.value)}
                                    />
                                </FieldGroup>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <SectionTitle>Time In / Time Out</SectionTitle>

                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6, marginBottom: 'var(--space-2)' }}>
                            Standard hours: <strong>8:00 AM – 5:00 PM</strong>.
                            Minutes late and undertime will be computed automatically when saved.
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>

                            <FieldGroup label="Time In" error={errors.time_in}>
                                <Input
                                    type="time"
                                    value={data.time_in}
                                    onChange={(e) => setData('time_in', e.target.value)}
                                />
                            </FieldGroup>

                            <FieldGroup label="Time Out" error={errors.time_out}>
                                <Input
                                    type="time"
                                    value={data.time_out}
                                    onChange={(e) => setData('time_out', e.target.value)}
                                />
                            </FieldGroup>
                        </div>
                    </Card>

                    <Card>
                        <SectionTitle>Override Details</SectionTitle>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)' }}>
                            <FieldGroup label="Override Reason" required error={errors.override_reason}>
                                <Textarea
                                    placeholder="Explain why this record is being manually entered or corrected…"
                                    value={data.override_reason}
                                    onChange={(e) => setData('override_reason', e.target.value)}
                                    rows={3}
                                />
                            </FieldGroup>

                            <FieldGroup label="Remarks (optional)" error={errors.remarks}>
                                <Textarea
                                    placeholder="Any additional notes…"
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    rows={2}
                                />
                            </FieldGroup>
                        </div>
                    </Card>

                    {/* Submit footer */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)', paddingBottom: 'var(--space-4)' }}>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => isEdit
                                ? router.get(route('attendance.show', record.id))
                                : router.get(route('attendance.index'))
                            }
                        >
                            Cancel
                        </Button>
                        <Button type="submit" icon={Save} loading={processing}>
                            {isEdit ? 'Save Changes' : 'Create Record'}
                        </Button>
                    </div>
                </div>
            </form>
        </AppShell>
    );
}
