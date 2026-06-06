import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import Checkbox from '../../Components/UI/Checkbox';

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }) {
    return (
        <Card>
            <div className="font-heading font-semibold text-[var(--color-text)]" style={{
                fontSize: 'var(--font-size-body)',
                marginBottom: 'var(--space-3)',
                paddingBottom: 'var(--space-2)',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}>
                {title}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-2)' }}>
                {children}
            </div>
        </Card>
    );
}

// ── Full-width row within a Section ──────────────────────────────────────────

function FullRow({ children }) {
    return <div style={{ gridColumn: '1 / -1' }}>{children}</div>;
}

// ── Uniform issuance entry editor ─────────────────────────────────────────────

function UniformEditor({ records, onChange }) {
    function addRow() {
        onChange([...records, { date: '', item: '', size: '', qty: 1, notes: '' }]);
    }

    function removeRow(i) {
        onChange(records.filter((_, idx) => idx !== i));
    }

    function updateRow(i, field, value) {
        const updated = records.map((r, idx) => idx === i ? { ...r, [field]: value } : r);
        onChange(updated);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {records.map((r, i) => (
                <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 1fr 80px 70px 1fr auto',
                    gap: 'var(--space-1)',
                    alignItems: 'end',
                }}>
                    <Input
                        label={i === 0 ? 'Date' : ''}
                        type="date"
                        value={r.date ?? ''}
                        onChange={(e) => updateRow(i, 'date', e.target.value)}
                    />
                    <Input
                        label={i === 0 ? 'Item' : ''}
                        placeholder="Polo, Slacks…"
                        value={r.item ?? ''}
                        onChange={(e) => updateRow(i, 'item', e.target.value)}
                    />
                    <Input
                        label={i === 0 ? 'Size' : ''}
                        placeholder="M, L…"
                        value={r.size ?? ''}
                        onChange={(e) => updateRow(i, 'size', e.target.value)}
                    />
                    <Input
                        label={i === 0 ? 'Qty' : ''}
                        type="number"
                        min={1}
                        value={r.qty ?? 1}
                        onChange={(e) => updateRow(i, 'qty', e.target.value)}
                    />
                    <Input
                        label={i === 0 ? 'Notes' : ''}
                        placeholder="Optional"
                        value={r.notes ?? ''}
                        onChange={(e) => updateRow(i, 'notes', e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => removeRow(i)}
                        style={{
                            height: 40,
                            width: 40,
                            border: 'none',
                            background: 'rgba(239,68,68,0.08)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-error)',
                            alignSelf: 'flex-end',
                        }}
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            ))}
            <div>
                <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addRow}>
                    Add Item
                </Button>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function EmployeeForm({ employee, statuses, departments, genders, civilStatuses, branches }) {
    const { errors } = usePage().props;
    const isEdit = !!employee;

    const [form, setForm] = useState({
        // Personal
        first_name:    employee?.first_name ?? '',
        last_name:     employee?.last_name ?? '',
        middle_name:   employee?.middle_name ?? '',
        suffix:        employee?.suffix ?? '',
        date_of_birth: employee?.date_of_birth ? employee.date_of_birth.substring(0, 10) : '',
        gender:        employee?.gender ?? '',
        civil_status:  employee?.civil_status ?? '',

        // Employment
        employee_code:       employee?.employee_code ?? '',
        position:            employee?.position ?? '',
        department:          employee?.department ?? '',
        branch_id:           employee?.branch_id ?? '',
        employment_status:   employee?.employment_status ?? 'probationary',
        date_hired:          employee?.date_hired ? employee.date_hired.substring(0, 10) : '',
        regularization_date: employee?.regularization_date ? employee.regularization_date.substring(0, 10) : '',

        // Gov IDs
        sss_number:        employee?.sss_number ?? '',
        philhealth_number: employee?.philhealth_number ?? '',
        pagibig_number:    employee?.pagibig_number ?? '',
        tin_number:        employee?.tin_number ?? '',

        // Contact
        personal_email: employee?.personal_email ?? '',
        work_email:     employee?.work_email ?? '',
        mobile_number:  employee?.mobile_number ?? '',
        home_address:   employee?.home_address ?? '',

        // Emergency
        emergency_contact_name:         employee?.emergency_contact_name ?? '',
        emergency_contact_relationship: employee?.emergency_contact_relationship ?? '',
        emergency_contact_number:       employee?.emergency_contact_number ?? '',

        // SIL
        sil_total: employee?.sil_total ?? 5,
        sil_used:  employee?.sil_used ?? 0,

        // Uniform
        uniform_records: employee?.uniform_records ?? [],

        // Compliance
        data_privacy_consent:      employee?.data_privacy_consent ?? false,
        data_privacy_consent_date: employee?.data_privacy_consent_date ? employee.data_privacy_consent_date.substring(0, 10) : '',

        // Other
        remarks: employee?.remarks ?? '',
    });

    const [submitting, setSubmitting] = useState(false);

    function set(field) {
        return (e) => setForm((prev) => ({ ...prev, [field]: e.target?.type === 'checkbox' ? e.target.checked : e.target.value }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);

        const payload = { ...form };

        if (isEdit) {
            router.put(route('employees.update', employee.id), payload, {
                onFinish: () => setSubmitting(false),
            });
        } else {
            router.post(route('employees.store'), payload, {
                onFinish: () => setSubmitting(false),
            });
        }
    }

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={ArrowLeft}
                        onClick={() => isEdit ? router.get(route('employees.show', employee.id)) : router.get(route('employees.index'))}
                    >
                        Back
                    </Button>
                    <h1 className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-heading)', margin: 0 }}>
                        {isEdit ? `Edit — ${employee.display_name ?? employee.first_name}` : 'Add Employee'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

                    {/* Personal Info */}
                    <Section title="Personal Information">
                        <Input label="First Name *" value={form.first_name} onChange={set('first_name')} error={errors?.first_name} />
                        <Input label="Last Name *"  value={form.last_name}  onChange={set('last_name')}  error={errors?.last_name} />
                        <Input label="Middle Name"  value={form.middle_name} onChange={set('middle_name')} />
                        <Input label="Suffix"       value={form.suffix}      onChange={set('suffix')} placeholder="Jr., Sr., III…" />
                        <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
                        <Select
                            label="Gender"
                            value={form.gender}
                            onChange={set('gender')}
                            options={[{ value: '', label: 'Select…' }, ...genders.map((g) => ({ value: g, label: g }))]}
                        />
                        <Select
                            label="Civil Status"
                            value={form.civil_status}
                            onChange={set('civil_status')}
                            options={[{ value: '', label: 'Select…' }, ...civilStatuses.map((c) => ({ value: c, label: c }))]}
                        />
                        <FullRow>
                            <Textarea label="Home Address" value={form.home_address} onChange={set('home_address')} rows={2} />
                        </FullRow>
                    </Section>

                    {/* Employment */}
                    <Section title="Employment Details">
                        <Input label="Employee Code" value={form.employee_code} onChange={set('employee_code')} placeholder="Auto-generated if blank" error={errors?.employee_code} />
                        <Input label="Position *"    value={form.position}      onChange={set('position')}      error={errors?.position} />
                        <Select
                            label="Department"
                            value={form.department}
                            onChange={set('department')}
                            options={[{ value: '', label: 'Select…' }, ...Object.entries(departments).map(([v, l]) => ({ value: v, label: l }))]}
                        />
                        <Select
                            label="Branch"
                            value={form.branch_id}
                            onChange={set('branch_id')}
                            options={[{ value: '', label: 'Select…' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
                        />
                        <Select
                            label="Employment Status *"
                            value={form.employment_status}
                            onChange={set('employment_status')}
                            options={Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }))}
                        />
                        <Input label="Date Hired *"         type="date" value={form.date_hired}          onChange={set('date_hired')}          error={errors?.date_hired} />
                        <Input label="Regularization Date"  type="date" value={form.regularization_date} onChange={set('regularization_date')} />
                    </Section>

                    {/* Government IDs */}
                    <Section title="Government IDs">
                        <Input label="SSS Number"      value={form.sss_number}        onChange={set('sss_number')} />
                        <Input label="PhilHealth No."  value={form.philhealth_number} onChange={set('philhealth_number')} />
                        <Input label="Pag-IBIG No."    value={form.pagibig_number}    onChange={set('pagibig_number')} />
                        <Input label="TIN"             value={form.tin_number}        onChange={set('tin_number')} />
                    </Section>

                    {/* Contact */}
                    <Section title="Contact Information">
                        <Input label="Work Email"     type="email" value={form.work_email}     onChange={set('work_email')}     error={errors?.work_email} />
                        <Input label="Personal Email" type="email" value={form.personal_email} onChange={set('personal_email')} />
                        <Input label="Mobile Number"  value={form.mobile_number} onChange={set('mobile_number')} />
                    </Section>

                    {/* Emergency Contact */}
                    <Section title="Emergency Contact">
                        <Input label="Name"         value={form.emergency_contact_name}         onChange={set('emergency_contact_name')} />
                        <Input label="Relationship" value={form.emergency_contact_relationship} onChange={set('emergency_contact_relationship')} placeholder="Spouse, Parent…" />
                        <Input label="Phone Number" value={form.emergency_contact_number}       onChange={set('emergency_contact_number')} />
                    </Section>

                    {/* SIL */}
                    <Section title="Service Incentive Leave (SIL)">
                        <Input label="SIL Total (days)" type="number" min={0} value={form.sil_total} onChange={set('sil_total')} />
                        <Input label="SIL Used (days)"  type="number" min={0} value={form.sil_used}  onChange={set('sil_used')} />
                    </Section>

                    {/* Uniform */}
                    <Card>
                        <div className="font-heading font-semibold text-[var(--color-text)]" style={{
                            fontSize: 'var(--font-size-body)',
                            marginBottom: 'var(--space-3)',
                            paddingBottom: 'var(--space-2)',
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                        }}>
                            Uniform Issuance Records
                        </div>
                        <UniformEditor
                            records={form.uniform_records}
                            onChange={(val) => setForm((prev) => ({ ...prev, uniform_records: val }))}
                        />
                    </Card>

                    {/* Compliance */}
                    <Card>
                        <div className="font-heading font-semibold text-[var(--color-text)]" style={{
                            fontSize: 'var(--font-size-body)',
                            marginBottom: 'var(--space-3)',
                            paddingBottom: 'var(--space-2)',
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                        }}>
                            Compliance
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <Checkbox
                                label="Data Privacy Act Consent obtained"
                                checked={form.data_privacy_consent}
                                onChange={set('data_privacy_consent')}
                            />
                            {form.data_privacy_consent && (
                                <div style={{ maxWidth: 240 }}>
                                    <Input
                                        label="Consent Date"
                                        type="date"
                                        value={form.data_privacy_consent_date}
                                        onChange={set('data_privacy_consent_date')}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Remarks */}
                    <Card>
                        <Textarea label="Remarks / Notes" value={form.remarks} onChange={set('remarks')} rows={3} />
                    </Card>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)', paddingBottom: 'var(--space-4)' }}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => isEdit ? router.get(route('employees.show', employee.id)) : router.get(route('employees.index'))}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={submitting}>
                            {isEdit ? 'Save Changes' : 'Create Employee'}
                        </Button>
                    </div>

                </form>
            </div>
        </AppShell>
    );
}
