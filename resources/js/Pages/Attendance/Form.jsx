import { useForm, router } from '@inertiajs/react';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

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

                    {/* Card 1 — Record Details + Override */}
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
                            label="Employee *"
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
                                label="Work Date *"
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
                            label="Status *"
                            options={Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }))}
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            error={errors.status}
                        />
                        {requiresLeaveType && (
                            <Select
                                label="Leave Type *"
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
                            label="Override Reason *"
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

                    {/* Card 2 — Time In / Time Out */}
                    <FormCard title="Time In / Time Out">
                        <div className="font-body" style={{
                            fontSize: 'var(--font-size-small)',
                            color: 'var(--color-text-muted)',
                            marginBottom: 'var(--space-1)',
                        }}>
                            Standard hours: <strong>8:00 AM – 5:00 PM</strong>.
                            Minutes late and undertime are computed automatically when saved.
                        </div>
                        <Input
                            label="Time In"
                            type="time"
                            value={data.time_in}
                            onChange={(e) => setData('time_in', e.target.value)}
                            error={errors.time_in}
                        />
                        <Input
                            label="Time Out"
                            type="time"
                            value={data.time_out}
                            onChange={(e) => setData('time_out', e.target.value)}
                            error={errors.time_out}
                        />
                    </FormCard>

                    <FormActions>
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
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
