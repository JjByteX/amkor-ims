import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    ArrowLeft, Pencil, Trash2, User, Briefcase, Phone, Shield,
    Calendar, AlertTriangle, CheckCircle, Clock, FileText, Package,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

const STATUS_VARIANT = {
    probationary: 'warning',
    regular:      'success',
    resigned:     'neutral',
    terminated:   'error',
};

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }) {
    return (
        <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <Icon size={16} style={{ color: 'var(--color-primary)' }} />
                <span className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)' }}>
                    {title}
                </span>
            </div>
            {children}
        </Card>
    );
}

// ── Field row ─────────────────────────────────────────────────────────────────

function Field({ label, value, highlight }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 'var(--space-2)' }}>
            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5 }}>
                {label}
            </span>
            <span className="font-body" style={{
                fontSize: 'var(--font-size-small)',
                color: highlight ? 'var(--color-primary)' : 'var(--color-text)',
                fontWeight: highlight ? 600 : 400,
            }}>
                {value || '—'}
            </span>
        </div>
    );
}

// ── Grid wrapper for 2-column field layout ────────────────────────────────────

function FieldGrid({ children }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0 var(--space-4)' }}>
            {children}
        </div>
    );
}

// ── SIL update mini-form ──────────────────────────────────────────────────────

function SilForm({ employee, onClose }) {
    const [total, setTotal] = useState(employee.sil_total ?? 5);
    const [used, setUsed] = useState(employee.sil_used ?? 0);
    const [submitting, setSubmitting] = useState(false);

    function handleSubmit() {
        setSubmitting(true);
        router.patch(route('employees.sil', employee.id), { sil_total: total, sil_used: used }, {
            onFinish: () => { setSubmitting(false); onClose(); },
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <div>
                    <label className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.7, display: 'block', marginBottom: 4 }}>
                        SIL Total (days)
                    </label>
                    <input
                        type="number"
                        min={0}
                        max={365}
                        value={total}
                        onChange={(e) => setTotal(Number(e.target.value))}
                        style={{
                            width: '100%', height: 40,
                            padding: '0 var(--space-2)',
                            border: '1px solid rgba(0,0,0,0.15)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-body)',
                            fontFamily: 'var(--font-body)',
                            color: 'var(--color-text)',
                            background: 'var(--color-card)',
                            outline: 'none',
                        }}
                    />
                </div>
                <div>
                    <label className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.7, display: 'block', marginBottom: 4 }}>
                        SIL Used (days)
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={used}
                        onChange={(e) => setUsed(Number(e.target.value))}
                        style={{
                            width: '100%', height: 40,
                            padding: '0 var(--space-2)',
                            border: '1px solid rgba(0,0,0,0.15)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-body)',
                            fontFamily: 'var(--font-body)',
                            color: 'var(--color-text)',
                            background: 'var(--color-card)',
                            outline: 'none',
                        }}
                    />
                </div>
            </div>
            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>
                Remaining: <strong>{Math.max(0, total - used)} day{Math.max(0, total - used) !== 1 ? 's' : ''}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} loading={submitting}>Save SIL</Button>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function EmployeeShow({ employee, statuses, departments, canManage }) {
    const { flash } = usePage().props;
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [silOpen, setSilOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    function handleDelete() {
        setDeleting(true);
        router.delete(route('employees.destroy', employee.id), {
            onFinish: () => setDeleting(false),
        });
    }

    const uniformRecords = employee.uniform_records ?? [];

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

                {/* Flash */}
                {flash?.message && (
                    <div className="font-body" style={{
                        padding: 'var(--space-2)',
                        background: flash.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                        color: '#fff',
                        fontSize: 'var(--font-size-small)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => router.get(route('employees.index'))}>
                            Back
                        </Button>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                                <h1 className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-heading)', margin: 0 }}>
                                    {employee.display_name}
                                </h1>
                                <Badge variant={STATUS_VARIANT[employee.employment_status] ?? 'neutral'}>
                                    {statuses[employee.employment_status] ?? employee.employment_status}
                                </Badge>
                                {employee.regularization_due && (
                                    <Badge variant="warning">Reg. Due</Badge>
                                )}
                            </div>
                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5, marginTop: 2 }}>
                                {employee.employee_code ?? 'No code'} · {employee.position} · Tenure: {employee.tenure}
                            </div>
                        </div>
                    </div>
                    {canManage && (
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => router.get(route('employees.edit', employee.id))}>
                                Edit
                            </Button>
                            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteOpen(true)}>
                                Remove
                            </Button>
                        </div>
                    )}
                </div>

                {/* Content grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-3)' }}>

                    {/* Personal Info */}
                    <Section icon={User} title="Personal Information">
                        <FieldGrid>
                            <Field label="Full Name"     value={employee.full_name} highlight />
                            <Field label="Date of Birth" value={fmt(employee.date_of_birth)} />
                            <Field label="Gender"        value={employee.gender} />
                            <Field label="Civil Status"  value={employee.civil_status} />
                            <Field label="Home Address"  value={employee.home_address} />
                        </FieldGrid>
                    </Section>

                    {/* Employment */}
                    <Section icon={Briefcase} title="Employment Details">
                        <FieldGrid>
                            <Field label="Employee Code"       value={employee.employee_code} highlight />
                            <Field label="Position"            value={employee.position} />
                            <Field label="Department"          value={departments[employee.department] ?? employee.department} />
                            <Field label="Branch"              value={employee.branch?.name} />
                            <Field label="Date Hired"          value={fmt(employee.date_hired)} />
                            <Field label="Regularization Date" value={fmt(employee.regularization_date)} />
                            <Field label="Tenure"              value={employee.tenure} />
                        </FieldGrid>
                    </Section>

                    {/* Contact */}
                    <Section icon={Phone} title="Contact Information">
                        <FieldGrid>
                            <Field label="Work Email"      value={employee.work_email} />
                            <Field label="Personal Email"  value={employee.personal_email} />
                            <Field label="Mobile"          value={employee.mobile_number} />
                        </FieldGrid>
                        <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <div className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)', marginBottom: 'var(--space-1)' }}>
                                Emergency Contact
                            </div>
                            <FieldGrid>
                                <Field label="Name"         value={employee.emergency_contact_name} />
                                <Field label="Relationship" value={employee.emergency_contact_relationship} />
                                <Field label="Number"       value={employee.emergency_contact_number} />
                            </FieldGrid>
                        </div>
                    </Section>

                    {/* Government IDs */}
                    <Section icon={Shield} title="Government IDs">
                        <FieldGrid>
                            <Field label="SSS Number"       value={employee.sss_number} />
                            <Field label="PhilHealth"       value={employee.philhealth_number} />
                            <Field label="Pag-IBIG"         value={employee.pagibig_number} />
                            <Field label="TIN"              value={employee.tin_number} />
                        </FieldGrid>
                    </Section>

                    {/* SIL */}
                    <Section icon={Calendar} title="Service Incentive Leave (SIL)">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                            {/* Progress ring-like display */}
                            {[
                                { label: 'Total', value: employee.sil_total ?? 5, color: 'var(--color-info)' },
                                { label: 'Used',  value: employee.sil_used ?? 0,  color: 'var(--color-warning)' },
                                { label: 'Left',  value: employee.sil_remaining ?? 5, color: 'var(--color-success)' },
                            ].map((item) => (
                                <div key={item.label} style={{ textAlign: 'center' }}>
                                    <div className="font-heading font-semibold" style={{ fontSize: 24, color: item.color }}>
                                        {item.value}
                                    </div>
                                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5 }}>
                                        {item.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {canManage && (
                            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setSilOpen(true)}>
                                Update SIL
                            </Button>
                        )}
                    </Section>

                    {/* Compliance */}
                    <Section icon={CheckCircle} title="Compliance">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
                            {employee.data_privacy_consent
                                ? <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                                : <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                            }
                            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                Data Privacy Consent {employee.data_privacy_consent ? 'signed' : 'NOT yet obtained'}
                            </span>
                        </div>
                        {employee.data_privacy_consent_date && (
                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5 }}>
                                Signed on {fmt(employee.data_privacy_consent_date)}
                            </div>
                        )}
                    </Section>
                </div>

                {/* Uniform Issuance */}
                <Section icon={Package} title={`Uniform Issuance Records (${uniformRecords.length})`}>
                    {uniformRecords.length === 0 ? (
                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.45, textAlign: 'center', padding: 'var(--space-3) 0' }}>
                            No uniform issuance records yet.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-small)' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg)' }}>
                                        {['Date', 'Item', 'Size', 'Qty', 'Notes'].map((h) => (
                                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text)', borderBottom: 'var(--border-table-header)', background: 'var(--color-table-header-bg)' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {uniformRecords.map((r, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>{fmt(r.date)}</td>
                                            <td style={{ padding: '10px 12px', color: 'var(--color-text)', fontWeight: 600 }}>{r.item ?? '—'}</td>
                                            <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>{r.size ?? '—'}</td>
                                            <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>{r.qty ?? '—'}</td>
                                            <td style={{ padding: '10px 12px', color: 'var(--color-text)', opacity: 0.6 }}>{r.notes ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Section>

                {/* Remarks */}
                {employee.remarks && (
                    <Section icon={FileText} title="Remarks">
                        <p className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)', whiteSpace: 'pre-wrap', margin: 0 }}>
                            {employee.remarks}
                        </p>
                    </Section>
                )}

            </div>

            {/* SIL update modal */}
            <Modal open={silOpen} onClose={() => setSilOpen(false)} title="Update SIL Records" size="default">
                <SilForm employee={employee} onClose={() => setSilOpen(false)} />
            </Modal>

            {/* Delete confirm modal */}
            <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Remove Employee Record">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <p className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)', margin: 0 }}>
                        This will soft-delete <strong>{employee.display_name}</strong>'s record. The record will no longer appear in the active list but data is preserved.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                        <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                        <Button variant="danger" loading={deleting} onClick={handleDelete}>
                            Confirm Remove
                        </Button>
                    </div>
                </div>
            </Modal>
        </AppShell>
    );
}
