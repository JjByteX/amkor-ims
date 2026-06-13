import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Save, X, Plus, Trash2, UserCheck, Lock } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import Checkbox from '../../Components/UI/Checkbox';
import Toggle from '../../Components/UI/Toggle';

// ── Uniform issuance editor ───────────────────────────────────────────────────

function UniformEditor({ records, onChange }) {
    function addRow() {
        onChange([...records, { date: '', item: '', size: '', qty: 1, notes: '' }]);
    }
    function removeRow(i) {
        onChange(records.filter((_, idx) => idx !== i));
    }
    function updateRow(i, field, value) {
        onChange(records.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {records.map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 70px 60px auto', gap: 'var(--space-1)', alignItems: 'end' }}>
                    <Input label={i === 0 ? 'Date' : ''} type="date" value={r.date ?? ''} onChange={(e) => updateRow(i, 'date', e.target.value)} />
                    <Input label={i === 0 ? 'Item' : ''} placeholder="Polo, Slacks…" value={r.item ?? ''} onChange={(e) => updateRow(i, 'item', e.target.value)} />
                    <Input label={i === 0 ? 'Size' : ''} placeholder="M, L…" value={r.size ?? ''} onChange={(e) => updateRow(i, 'size', e.target.value)} />
                    <Input label={i === 0 ? 'Qty' : ''} type="number" min={1} value={r.qty ?? 1} onChange={(e) => updateRow(i, 'qty', e.target.value)} />
                    <button
                        type="button"
                        onClick={() => removeRow(i)}
                        style={{
                            height: 40, width: 40, border: 'none',
                            background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-error)', alignSelf: 'flex-end',
                        }}
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            ))}
            <div>
                <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addRow}>Add Item</Button>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

// Roles that default to is_agent = true
const AGENT_DEFAULT_ROLES = ['resa_officer', 'ormoc_branch_officer', 'visa_documentation_officer'];

export default function EmployeeForm({ employee, statuses, departments, genders, civilStatuses, branches, agentCodeLocked = false, reservedCodes = [] }) {
    const { errors } = usePage().props;
    const isEdit = !!employee;

    const [form, setForm] = useState({
        first_name                    : employee?.first_name ?? '',
        last_name                     : employee?.last_name ?? '',
        middle_name                   : employee?.middle_name ?? '',
        suffix                        : employee?.suffix ?? '',
        date_of_birth                 : employee?.date_of_birth?.substring(0, 10) ?? '',
        gender                        : employee?.gender ?? '',
        civil_status                  : employee?.civil_status ?? '',
        home_address                  : employee?.home_address ?? '',
        employee_code                 : employee?.employee_code ?? '',
        position                      : employee?.position ?? '',
        department                    : employee?.department ?? '',
        branch_id                     : employee?.branch_id ?? '',
        employment_status             : employee?.employment_status ?? 'probationary',
        date_hired                    : employee?.date_hired?.substring(0, 10) ?? '',
        regularization_date           : employee?.regularization_date?.substring(0, 10) ?? '',
        sss_number                    : employee?.sss_number ?? '',
        philhealth_number             : employee?.philhealth_number ?? '',
        pagibig_number                : employee?.pagibig_number ?? '',
        tin_number                    : employee?.tin_number ?? '',
        work_email                    : employee?.work_email ?? '',
        personal_email                : employee?.personal_email ?? '',
        mobile_number                 : employee?.mobile_number ?? '',
        emergency_contact_name        : employee?.emergency_contact_name ?? '',
        emergency_contact_relationship: employee?.emergency_contact_relationship ?? '',
        emergency_contact_number      : employee?.emergency_contact_number ?? '',
        sil_total                     : employee?.sil_total ?? 5,
        sil_used                      : employee?.sil_used ?? 0,
        uniform_records               : employee?.uniform_records ?? [],
        data_privacy_consent          : employee?.data_privacy_consent ?? false,
        data_privacy_consent_date     : employee?.data_privacy_consent_date?.substring(0, 10) ?? '',
        remarks                       : employee?.remarks ?? '',
        is_agent                      : employee?.is_agent ?? false,
        agent_code                    : employee?.agent_code ?? '',
    });

    const [submitting, setSubmitting] = useState(false);

    function set(field) {
        return (e) => setForm((prev) => ({
            ...prev,
            [field]: e.target?.type === 'checkbox' ? e.target.checked : e.target.value,
        }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        const method = isEdit ? router.put : router.post;
        const url    = isEdit ? route('employees.update', employee.id) : route('employees.store');
        method(url, { ...form }, { onFinish: () => setSubmitting(false) });
    }

    const backUrl = isEdit ? route('employees.show', employee.id) : route('employees.index');

    return (
        <AppShell>
            <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout columns={3}>
                    <PageHeader
                        breadcrumb={[{ label: 'HR & Records', href: route('employees.index') }]}
                        title={isEdit ? `Edit — ${employee.display_name ?? employee.first_name}` : 'Add Employee'}
                        actions={
                            <>
                                <Button type="button" variant="ghost" icon={X} onClick={() => router.get(backUrl)}>Cancel</Button>
                                <Button type="submit" icon={Save} loading={submitting}>{isEdit ? 'Save Changes' : 'Create Employee'}</Button>
                            </>
                        }
                    />

                    {/* Card 1 — Personal & Contact */}
                    <FormCard title="Personal & Contact">
                        <FormRow>
                            <Input label="First Name *" value={form.first_name} onChange={set('first_name')} error={errors?.first_name} />
                            <Input label="Last Name *" value={form.last_name} onChange={set('last_name')} error={errors?.last_name} />
                        </FormRow>
                        <FormRow>
                            <Input label="Middle Name" value={form.middle_name} onChange={set('middle_name')} />
                            <Input label="Suffix" value={form.suffix} onChange={set('suffix')} placeholder="Jr., Sr., III…" />
                        </FormRow>
                        <FormRow>
                            <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
                            <Select label="Gender" value={form.gender} onChange={set('gender')} options={[{ value: '', label: 'Select…' }, ...genders.map((g) => ({ value: g, label: g }))]} />
                        </FormRow>
                        <Select label="Civil Status" value={form.civil_status} onChange={set('civil_status')} options={[{ value: '', label: 'Select…' }, ...civilStatuses.map((c) => ({ value: c, label: c }))]} />
                        <Textarea label="Home Address" value={form.home_address} onChange={set('home_address')} rows={2} />
                        <FormRow>
                            <Input label="Work Email" type="email" value={form.work_email} onChange={set('work_email')} error={errors?.work_email} />
                            <Input label="Personal Email" type="email" value={form.personal_email} onChange={set('personal_email')} />
                        </FormRow>
                        <Input label="Mobile Number" value={form.mobile_number} onChange={set('mobile_number')} />
                        <FormRow>
                            <Input label="Emergency Contact Name" value={form.emergency_contact_name} onChange={set('emergency_contact_name')} />
                            <Input label="Relationship" value={form.emergency_contact_relationship} onChange={set('emergency_contact_relationship')} placeholder="Spouse, Parent…" />
                        </FormRow>
                        <Input label="Emergency Phone" value={form.emergency_contact_number} onChange={set('emergency_contact_number')} />
                    </FormCard>

                    {/* Card 2 — Employment & IDs */}
                    <FormCard title="Employment & Government IDs">
                        <FormRow>
                            <Input label="Employee Code" value={form.employee_code} onChange={set('employee_code')} placeholder="Auto-generated if blank" error={errors?.employee_code} />
                            <Input label="Position *" value={form.position} onChange={set('position')} error={errors?.position} />
                        </FormRow>
                        <FormRow>
                            <Select label="Department" value={form.department} onChange={set('department')} options={[{ value: '', label: 'Select…' }, ...Object.entries(departments).map(([v, l]) => ({ value: v, label: l }))]} />
                            <Select label="Branch" value={form.branch_id} onChange={set('branch_id')} options={[{ value: '', label: 'Select…' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]} />
                        </FormRow>
                        <Select label="Employment Status *" value={form.employment_status} onChange={set('employment_status')} options={Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }))} />
                        <FormRow>
                            <Input label="Date Hired *" type="date" value={form.date_hired} onChange={set('date_hired')} error={errors?.date_hired} />
                            <Input label="Regularization Date" type="date" value={form.regularization_date} onChange={set('regularization_date')} />
                        </FormRow>
                        <FormRow>
                            <Input label="SSS Number" value={form.sss_number} onChange={set('sss_number')} />
                            <Input label="PhilHealth No." value={form.philhealth_number} onChange={set('philhealth_number')} />
                        </FormRow>
                        <FormRow>
                            <Input label="Pag-IBIG No." value={form.pagibig_number} onChange={set('pagibig_number')} />
                            <Input label="TIN" value={form.tin_number} onChange={set('tin_number')} />
                        </FormRow>
                        <FormRow>
                            <Input label="SIL Total (days)" type="number" min={0} value={form.sil_total} onChange={set('sil_total')} />
                            <Input label="SIL Used (days)" type="number" min={0} value={form.sil_used} onChange={set('sil_used')} />
                        </FormRow>

                        {/* ── Agent ──────────────────────────────────────── */}
                        <div style={{
                            borderTop    : '1px solid var(--color-border-soft)',
                            paddingTop   : 'var(--space-2)',
                            marginTop    : 'var(--space-1)',
                            display      : 'flex',
                            flexDirection: 'column',
                            gap          : 'var(--space-2)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{
                                        display      : 'flex',
                                        alignItems   : 'center',
                                        gap          : 6,
                                        fontSize     : 'var(--font-size-small)',
                                        fontWeight   : 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                        color        : 'var(--color-text-muted)',
                                    }}>
                                        <UserCheck size={13} strokeWidth={2} />
                                        Sales Agent
                                    </div>
                                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>
                                        Enables agent code — required for booking &amp; visa attribution
                                    </p>
                                </div>
                                <Toggle
                                    checked={form.is_agent}
                                    onChange={(e) => setForm(prev => ({
                                        ...prev,
                                        is_agent  : e.target.checked,
                                        agent_code: e.target.checked ? prev.agent_code : '',
                                    }))}
                                />
                            </div>

                            {form.is_agent && (
                                <div>
                                    <Input
                                        label={
                                            agentCodeLocked
                                                ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    Agent Code
                                                    <span style={{
                                                        display     : 'inline-flex',
                                                        alignItems  : 'center',
                                                        gap         : 3,
                                                        fontSize    : 10,
                                                        fontWeight  : 600,
                                                        color       : 'var(--color-text-muted)',
                                                        background  : 'var(--color-bg)',
                                                        border      : '1px solid var(--color-border)',
                                                        borderRadius: 4,
                                                        padding     : '1px 5px',
                                                    }}>
                                                        <Lock size={9} /> Locked
                                                    </span>
                                                  </span>
                                                : 'Agent Code *'
                                        }
                                        value={form.agent_code}
                                        disabled={agentCodeLocked}
                                        maxLength={5}
                                        placeholder="e.g. JHONA"
                                        error={errors?.agent_code}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                            setForm(prev => ({ ...prev, agent_code: val }));
                                        }}
                                        style={{ fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.08em' }}
                                    />
                                    {!agentCodeLocked && (
                                        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                            Up to 5 uppercase letters/numbers. Cannot be changed once the agent has transactions.
                                            {reservedCodes.length > 0 && (
                                                <> Reserved: <strong>{reservedCodes.join(', ')}</strong></>
                                            )}
                                        </p>
                                    )}
                                    {agentCodeLocked && (
                                        <p style={{ fontSize: 11, color: 'var(--color-warning)', marginTop: 4 }}>
                                            This code is locked because it has existing transactions. Contact an administrator to change it.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </FormCard>

                    {/* Card 3 — Uniform, Compliance & Notes */}
                    <FormCard title="Uniform, Compliance & Notes">
                        <div>
                            <div className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Uniform Issuance
                            </div>
                            <UniformEditor
                                records={form.uniform_records}
                                onChange={(val) => setForm((prev) => ({ ...prev, uniform_records: val }))}
                            />
                        </div>
                        <div style={{ borderTop: 'var(--border-container)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <Checkbox
                                label="Data Privacy Act Consent obtained"
                                checked={form.data_privacy_consent}
                                onChange={set('data_privacy_consent')}
                            />
                            {form.data_privacy_consent && (
                                <Input label="Consent Date" type="date" value={form.data_privacy_consent_date} onChange={set('data_privacy_consent_date')} />
                            )}
                        </div>
                        <Textarea label="Remarks / Notes" value={form.remarks} onChange={set('remarks')} rows={3} />
                    </FormCard>

                    <FormActions>
                        <Button type="button" variant="ghost" icon={X} onClick={() => router.get(backUrl)}>Cancel</Button>
                        <Button type="submit" icon={Save} loading={submitting}>{isEdit ? 'Save Changes' : 'Create Employee'}</Button>
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}