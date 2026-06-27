import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Trash2, AlertTriangle, CheckCircle, Pencil, ArrowLeft, MoreHorizontal,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, {
    PanelActions, PanelCol, PanelColRight, PanelColumns, PanelDivider,
    PanelField, PanelFieldRow, PanelFullRow, PanelMeta, PanelMetaItem,
    PanelSection,
} from '../../Components/Shared/DetailPanel';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';
import ApprovalStepper from '../../Components/Shared/ApprovalStepper';
import ProfileHeader from '../../Components/Shared/ProfileHeader';
import ProfileTabBar, { DEFAULT_TAB, PROFILE_TABS } from '../../Components/Shared/ProfileTabBar';
import CopyField from '../../Components/UI/CopyField';
import LeaveBalanceCard from '../../Components/Shared/LeaveBalanceCard';
import AttendanceCalendar from '../../Components/Shared/AttendanceCalendar';
import MonthPicker from '../../Components/UI/MonthPicker';
import StatGrid from '../../Components/Shared/StatGrid';
import StatCard from '../../Components/Shared/StatCard';

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

const STATUS_VARIANT = {
    probationary: 'warning',
    regular:      'success',
    resigned:     'neutral',
    terminated:   'error',
};

// ── SIL update mini-form ──────────────────────────────────────────────────────

function SilForm({ employee, onClose }) {
    const [total, setTotal] = useState(employee.sil_total ?? 5);
    const [used,  setUsed ] = useState(employee.sil_used  ?? 0);
    const [submitting, setSubmitting] = useState(false);

    function handleSubmit() {
        setSubmitting(true);
        router.patch(route('employees.sil', employee.id), { sil_total: total, sil_used: used }, {
            onFinish: () => { setSubmitting(false); onClose(); },
        });
    }

    const inputStyle = {
        width: '100%', height: 40,
        padding: '0 var(--space-2)',
        border: '1px solid rgba(0,0,0,0.15)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-body)',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text)',
        background: 'var(--color-card)',
        outline: 'none',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <div>
                    <label className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.7, display: 'block', marginBottom: 4 }}>
                        SIL Total (days)
                    </label>
                    <input type="number" min={0} max={365} value={total}
                        onChange={(e) => setTotal(Number(e.target.value))} style={inputStyle} />
                </div>
                <div>
                    <label className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.7, display: 'block', marginBottom: 4 }}>
                        SIL Used (days)
                    </label>
                    <input type="number" min={0} value={used}
                        onChange={(e) => setUsed(Number(e.target.value))} style={inputStyle} />
                </div>
            </div>
            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>
                Remaining: <strong>{Math.max(0, total - used)} day{Math.max(0, total - used) !== 1 ? 's' : ''}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                <Button variant="primary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} loading={submitting}>Save SIL</Button>
            </div>
        </div>
    );
}

// ── Shared content used by both panel and full-page Personal tab ──────────────
// Kept intact so existing data renders correctly. Tabs 3.5–3.11 will replace
// each section with dedicated tab components; this remains the fallback until then.

export function EmployeeContent({ employee, statuses, departments, canManage, canViewSalary }) {

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [silOpen,    setSilOpen   ] = useState(false);
    const [deleting,   setDeleting  ] = useState(false);

    function handleDelete() {
        setDeleting(true);
        router.delete(route('employees.destroy', employee.id), { onFinish: () => setDeleting(false) });
    }

    const uniformRecords = employee.uniform_records ?? [];

    return (
        <>
            <PanelColumns>
                {/* LEFT — personal + contact + government IDs */}
                <PanelCol>
                    <PanelSection title="Personal Information">
                        <PanelField label="Full Name"     value={employee.full_name} highlight />
                        {employee.nickname && <PanelField label="Nickname" value={employee.nickname} />}
                        <PanelFieldRow>
                            <PanelField label="Date of Birth" value={fmt(employee.date_of_birth)} />
                            <PanelField label="Gender"        value={employee.gender} />
                        </PanelFieldRow>
                        <PanelField label="Civil Status"  value={employee.civil_status} />
                        <PanelField label="Home Address"  value={employee.home_address} />
                    </PanelSection>

                    <PanelDivider />

                    <PanelSection>
                        <PanelFieldRow>
                            <PanelField label="Work Email"     value={employee.work_email} />
                            <PanelField label="Personal Email" value={employee.personal_email} />
                        </PanelFieldRow>
                        {(employee.company_viber_number || employee.company_email_outlook) && (
                            <PanelFieldRow>
                                <PanelField label="Company Viber"   value={employee.company_viber_number} />
                                <PanelField label="Outlook / 365"   value={employee.company_email_outlook} />
                            </PanelFieldRow>
                        )}
                        <PanelField label="Mobile" value={employee.mobile_number} />
                        <PanelDivider />
                        <PanelField label="Name"         value={employee.emergency_contact_name} />
                        <PanelFieldRow>
                            <PanelField label="Relationship" value={employee.emergency_contact_relationship} />
                            <PanelField label="Number"       value={employee.emergency_contact_number} />
                        </PanelFieldRow>
                    </PanelSection>

                    <PanelDivider />

                    <PanelSection>
                        <PanelFieldRow>
                            <PanelField label="SSS Number"  value={employee.sss_number} />
                            <PanelField label="PhilHealth"  value={employee.philhealth_number} />
                        </PanelFieldRow>
                        <PanelFieldRow>
                            <PanelField label="Pag-IBIG"    value={employee.pagibig_number} />
                            <PanelField label="TIN"         value={employee.tin_number} />
                        </PanelFieldRow>
                        {(employee.philcare_number || employee.medicard_number) && (
                            <PanelFieldRow>
                                <PanelField label="PhilCare No." value={employee.philcare_number} />
                                <PanelField label="Medicard No." value={employee.medicard_number} />
                            </PanelFieldRow>
                        )}
                    </PanelSection>

                    <PanelMeta>
                        <PanelMetaItem label="Branch" value={employee.branch?.name} />
                    </PanelMeta>
                </PanelCol>

                {/* RIGHT — employment + SIL + compliance + actions */}
                <PanelColRight>
                    <PanelSection title="Employment Details">
                        <PanelFieldRow>
                            <PanelField label="Employee Code" value={employee.employee_code} highlight />
                            <PanelField label="ID Number"     value={employee.id_number} />
                        </PanelFieldRow>
                        <PanelField label="Position" value={employee.position} />
                        <PanelFieldRow>
                            <PanelField label="Department" value={departments[employee.department] ?? employee.department} />
                            <PanelField label="Branch"     value={employee.branch?.name} />
                        </PanelFieldRow>
                        <PanelFieldRow>
                            <PanelField label="Date Hired"          value={fmt(employee.date_hired)} />
                            <PanelField label="Regularization Date" value={fmt(employee.regularization_date)} />
                        </PanelFieldRow>
                        {(employee.maturity_date || employee.last_evaluation_date) && (
                            <PanelFieldRow>
                                <PanelField label="Maturity Date"   value={fmt(employee.maturity_date)} />
                                <PanelField label="Last Evaluation" value={fmt(employee.last_evaluation_date)} />
                            </PanelFieldRow>
                        )}
                        <PanelField label="Tenure" value={employee.tenure} />
                        {(employee.bank_name || employee.bank_account_number) && (
                            <PanelFieldRow>
                                <PanelField label="Bank"        value={employee.bank_name} />
                                <PanelField label="Account No." value={employee.bank_account_number} />
                            </PanelFieldRow>
                        )}
                        {canViewSalary && (employee.salary_increase_amount || employee.salary_increase_date) && (
                            <PanelFieldRow>
                                <PanelField
                                    label="Salary (after increase)"
                                    value={employee.salary_increase_amount
                                        ? '₱ ' + Number(employee.salary_increase_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                                        : null}
                                />
                                <PanelField
                                    label="Effective Date"
                                    value={fmt(employee.salary_increase_date)}
                                />
                            </PanelFieldRow>
                        )}
                    </PanelSection>

                    <PanelDivider />

                    <PanelSection title="Tenure Progress">
                        <ApprovalStepper fmtDt={fmt} steps={
                            ['terminated', 'resigned'].includes(employee.employment_status)
                                ? [
                                    { label: 'Hired',       done: true, person: null, at: employee.date_hired },
                                    { label: 'Regularized', done: employee.regularization_date != null, person: null, at: employee.regularization_date },
                                    { label: 'Separated',   done: true, person: null, at: employee.separation_date ?? null },
                                  ]
                                : [
                                    { label: 'Hired',       done: true, person: null, at: employee.date_hired },
                                    { label: 'Regularized', done: employee.employment_status === 'regular', person: null, at: employee.regularization_date },
                                    { label: 'Active',      done: employee.employment_status === 'regular', person: null, at: null },
                                  ]
                        } />
                    </PanelSection>

                    <PanelDivider />

                    <PanelSection>
                        <div className="flex items-center gap-6">
                            {[
                                { label: 'Total', value: employee.sil_total ?? 5,     color: 'var(--color-info)'    },
                                { label: 'Used',  value: employee.sil_used  ?? 0,     color: 'var(--color-warning)' },
                                { label: 'Left',  value: employee.sil_remaining ?? 5, color: 'var(--color-success)' },
                            ].map((item) => (
                                <div key={item.label} style={{ textAlign: 'center' }}>
                                    <div className="font-heading font-semibold" style={{ fontSize: 24, color: item.color }}>
                                        {item.value}
                                    </div>
                                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                                        {item.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {canManage && (
                            <Button variant="primary" size="sm" icon={Pencil} onClick={() => setSilOpen(true)}>
                                Update SIL
                            </Button>
                        )}
                    </PanelSection>

                    {(employee.vl_fund != null || employee.vl_fund_date) && (
                        <>
                            <PanelDivider />
                            <PanelSection>
                                <PanelFieldRow>
                                    <PanelField
                                        label="VL Fund"
                                        value={employee.vl_fund != null
                                            ? '₱ ' + Number(employee.vl_fund).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                                            : null}
                                    />
                                    <PanelField label="VL Fund Date" value={fmt(employee.vl_fund_date)} />
                                </PanelFieldRow>
                            </PanelSection>
                        </>
                    )}

                    <PanelDivider />

                    <PanelSection>
                        <div className="flex items-center gap-2">
                            {employee.data_privacy_consent
                                ? <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                                : <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />}
                            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                Data Privacy Consent {employee.data_privacy_consent ? 'signed' : 'NOT yet obtained'}
                            </span>
                        </div>
                        {employee.data_privacy_consent_date && (
                            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                                Signed on {fmt(employee.data_privacy_consent_date)}
                            </span>
                        )}
                    </PanelSection>

                    {employee.remarks && (
                        <>
                            <PanelDivider />
                            <p className="font-body" style={{ fontSize: 'var(--font-size-small)', whiteSpace: 'pre-wrap', margin: 0 }}>
                                {employee.remarks}
                            </p>
                        </>
                    )}

                    {canManage && (
                        <>
                            <PanelDivider />
                            <PanelActions>
                                <Button
                                    variant="primary"
                                    icon={Pencil}
                                    onClick={() => router.get(route('employees.edit', employee.id))}
                                    style={{ width: '100%' }}
                                >
                                    Edit Employee
                                </Button>
                                <Button
                                    variant="danger"
                                    icon={Trash2}
                                    onClick={() => setDeleteOpen(true)}
                                    style={{ width: '100%' }}
                                >
                                    Remove Record
                                </Button>
                            </PanelActions>
                        </>
                    )}
                </PanelColRight>
            </PanelColumns>

            {/* SIL update modal */}
            <Modal open={silOpen} onClose={() => setSilOpen(false)} title="Update SIL Records">
                <SilForm employee={employee} onClose={() => setSilOpen(false)} />
            </Modal>

            {/* Delete confirm modal */}
            <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Remove Employee Record">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <p className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)', margin: 0 }}>
                        This will soft-delete <strong>{employee.display_name}</strong>'s record. The record will no longer appear in the active list but data is preserved.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                        <Button variant="primary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                        <Button variant="danger" loading={deleting} onClick={handleDelete}>Confirm Remove</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

// ── Panel quick-view (isPanel === true) ───────────────────────────────────────

export function PanelQuickView({ employee, statuses, canManage }) {
    const remaining = employee.sil_remaining ?? (employee.sil_total ?? 5) - (employee.sil_used ?? 0);
    const total     = employee.sil_total ?? 5;
    const silPct    = Math.min(100, total > 0 ? Math.round((remaining / total) * 100) : 0);
    const silColor  = remaining === 0 ? 'var(--color-error)'
                    : remaining <= 2  ? 'var(--color-warning)'
                    : 'var(--color-success)';

    const row = (label, value) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', padding: '4px 0' }}>
            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', flexShrink: 0 }}>{label}</span>
            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', textAlign: 'right' }}>{value || '—'}</span>
        </div>
    );

    const sectionLabel = (text) => (
        <div style={{
            fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            padding: '8px 0 4px', borderTop: 'var(--border-container)', marginTop: 4,
        }}>
            {text}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Employment */}
            {sectionLabel('Employment')}
            {row('Employee Code', employee.employee_code)}
            {row('Date Hired', fmt(employee.date_hired))}
            {row('Tenure', employee.tenure)}
            {row('Department', employee.department)}

            {/* Contact */}
            {sectionLabel('Contact')}
            {row('Mobile', employee.mobile_number)}
            {row('Work Email', employee.work_email)}

            {/* Leave Balance */}
            {sectionLabel('Leave Balance')}
            <div style={{ padding: '6px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>SIL</span>
                    <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: silColor, fontWeight: 600 }}>
                        {remaining} / {total} days
                    </span>
                </div>
                <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${silPct}%`, background: silColor, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
            </div>
            {employee.vl_fund != null && row('VL Fund', '₱ ' + Number(employee.vl_fund).toLocaleString('en-PH', { minimumFractionDigits: 2 }))}

            {/* View full profile link */}
            <div style={{ marginTop: 'var(--space-3)' }}>
                <Button
                    variant="primary"
                    style={{ width: '100%' }}
                    onClick={() => router.visit(route('employees.show', employee.id))}
                >
                    View Full Profile →
                </Button>
            </div>
        </div>
    );
}

// ── Personal tab ─────────────────────────────────────────────────────────────

function PersonalTab({ employee }) {
    return (
        <PanelColumns>
            {/* LEFT — personal */}
            <PanelCol>
                <PanelSection title="Personal Information">
                    <PanelField label="Full Name"    value={employee.full_name} highlight />
                    {employee.nickname && <PanelField label="Nickname" value={employee.nickname} />}
                    <PanelFieldRow>
                        <PanelField label="Date of Birth" value={fmt(employee.date_of_birth)} />
                        <PanelField label="Gender"        value={employee.gender} />
                    </PanelFieldRow>
                    <PanelField label="Civil Status" value={employee.civil_status} />
                    <PanelField label="Home Address" value={employee.home_address} />
                </PanelSection>
            </PanelCol>

            {/* RIGHT — contact */}
            <PanelColRight>
                <PanelSection title="Contact Information">
                    <PanelField label="Mobile"         value={employee.mobile_number} />
                    <PanelField label="Personal Email" value={employee.personal_email} />
                    <PanelField label="Work Email"     value={employee.work_email} />
                    {employee.company_viber_number && (
                        <PanelField label="Company Viber" value={employee.company_viber_number} />
                    )}
                    {employee.company_email_outlook && (
                        <PanelField label="Outlook / 365" value={employee.company_email_outlook} />
                    )}
                </PanelSection>

                <PanelDivider />

                <PanelSection title="Emergency Contact">
                    <PanelField label="Name"         value={employee.emergency_contact_name} />
                    <PanelFieldRow>
                        <PanelField label="Relationship" value={employee.emergency_contact_relationship} />
                        <PanelField label="Number"       value={employee.emergency_contact_number} />
                    </PanelFieldRow>
                </PanelSection>
            </PanelColRight>
        </PanelColumns>
    );
}

// ── Employment tab ────────────────────────────────────────────────────────────

function EmploymentTab({ employee, departments, canManage, canViewSalary }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting,   setDeleting  ] = useState(false);

    function handleDelete() {
        setDeleting(true);
        router.delete(route('employees.destroy', employee.id), { onFinish: () => setDeleting(false) });
    }

    const isSeparated = ['terminated', 'resigned'].includes(employee.employment_status);

    return (
        <>
            <PanelColumns>
                {/* LEFT — codes + position */}
                <PanelCol>
                    <PanelSection title="Employment Details">
                        <PanelFieldRow>
                            <PanelField label="Employee Code" value={employee.employee_code} highlight />
                            <PanelField label="ID Number"     value={employee.id_number} />
                        </PanelFieldRow>
                        {employee.is_agent && (
                            <PanelField label="Agent Code" value={employee.agent_code} />
                        )}
                        <PanelField label="Position"   value={employee.position} />
                        <PanelFieldRow>
                            <PanelField label="Department" value={departments[employee.department] ?? employee.department} />
                            <PanelField label="Branch"     value={employee.branch?.name} />
                        </PanelFieldRow>
                    </PanelSection>
                </PanelCol>

                {/* RIGHT — status + dates + tenure stepper */}
                <PanelColRight>
                    <PanelSection title="Status & Timeline">
                        <div style={{ marginBottom: 'var(--space-2)' }}>
                            <Badge variant={STATUS_VARIANT[employee.employment_status] ?? 'neutral'}>
                                {employee.employment_status}
                            </Badge>
                            {employee.regularization_due && (
                                <Badge variant="warning" style={{ marginLeft: 'var(--space-1)' }}>Reg. Due</Badge>
                            )}
                        </div>
                        <PanelFieldRow>
                            <PanelField label="Date Hired"          value={fmt(employee.date_hired)} />
                            <PanelField label="Regularization Date" value={fmt(employee.regularization_date)} />
                        </PanelFieldRow>
                        {(employee.maturity_date || employee.last_evaluation_date) && (
                            <PanelFieldRow>
                                <PanelField label="Maturity Date"   value={fmt(employee.maturity_date)} />
                                <PanelField label="Last Evaluation" value={fmt(employee.last_evaluation_date)} />
                            </PanelFieldRow>
                        )}
                        <PanelField label="Tenure" value={employee.tenure} />
                    </PanelSection>

                    <PanelDivider />

                    <PanelSection title="Tenure Progress">
                        <ApprovalStepper fmtDt={fmt} steps={
                            isSeparated
                                ? [
                                    { label: 'Hired',       done: true, person: null, at: employee.date_hired },
                                    { label: 'Regularized', done: employee.regularization_date != null, person: null, at: employee.regularization_date },
                                    { label: 'Separated',   done: true, person: null, at: employee.separation_date ?? null },
                                  ]
                                : [
                                    { label: 'Hired',       done: true, person: null, at: employee.date_hired },
                                    { label: 'Regularized', done: employee.employment_status === 'regular', person: null, at: employee.regularization_date },
                                    { label: 'Active',      done: employee.employment_status === 'regular', person: null, at: null },
                                  ]
                        } />
                    </PanelSection>
                </PanelColRight>
            </PanelColumns>

            {/* Full-width rows below */}
            <PanelDivider />

            {(employee.bank_name || employee.bank_account_number) && (
                <PanelSection>
                    <PanelFieldRow>
                        <PanelField label="Bank Name"   value={employee.bank_name} />
                        <PanelField label="Account No." value={employee.bank_account_number} />
                    </PanelFieldRow>
                </PanelSection>
            )}

            {canViewSalary && (employee.salary_increase_amount || employee.salary_increase_date) && (
                <>
                    <PanelDivider />
                    <PanelSection title="Salary">
                        <PanelFieldRow>
                            <PanelField
                                label="Current Amount"
                                value={employee.salary_increase_amount
                                    ? '₱ ' + Number(employee.salary_increase_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                                    : null}
                                highlight
                            />
                            <PanelField label="Effective Date" value={fmt(employee.salary_increase_date)} />
                        </PanelFieldRow>
                    </PanelSection>
                </>
            )}

            {employee.remarks && (
                <>
                    <PanelDivider />
                    <PanelSection title="Remarks">
                        <p className="font-body" style={{ fontSize: 'var(--font-size-small)', whiteSpace: 'pre-wrap', margin: 0 }}>
                            {employee.remarks}
                        </p>
                    </PanelSection>
                </>
            )}

            <PanelDivider />

            <PanelSection title="Data Privacy Consent">
                <div className="flex items-center gap-2">
                    {employee.data_privacy_consent
                        ? <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                        : <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />}
                    <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                        Data Privacy Consent {employee.data_privacy_consent ? 'signed' : 'NOT yet obtained'}
                    </span>
                </div>
                {employee.data_privacy_consent_date && (
                    <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                        Signed on {fmt(employee.data_privacy_consent_date)}
                    </span>
                )}
            </PanelSection>

            {canManage && (
                <>
                    <PanelDivider />
                    <PanelActions>
                        <Button
                            variant="danger"
                            icon={Trash2}
                            onClick={() => setDeleteOpen(true)}
                        >
                            Remove Record
                        </Button>
                    </PanelActions>
                    <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Remove Employee Record">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <p className="font-body" style={{ fontSize: 'var(--font-size-body)', margin: 0 }}>
                                This will soft-delete <strong>{employee.display_name}</strong>'s record. The record will no longer appear in the active list but data is preserved.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                                <Button variant="primary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                                <Button variant="danger" loading={deleting} onClick={handleDelete}>Confirm Remove</Button>
                            </div>
                        </div>
                    </Modal>
                </>
            )}
        </>
    );
}

// ── Government IDs tab ────────────────────────────────────────────────────────

function GovIdsTab({ employee }) {
    const ids = [
        { label: 'SSS Number',      value: employee.sss_number        },
        { label: 'PhilHealth',      value: employee.philhealth_number  },
        { label: 'Pag-IBIG',        value: employee.pagibig_number     },
        { label: 'TIN',             value: employee.tin_number         },
        { label: 'PhilCare Number', value: employee.philcare_number    },
        { label: 'Medicard Number', value: employee.medicard_number    },
    ];

    return (
        <PanelSection title="Government IDs">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3) var(--space-4)' }}>
                {ids.map(({ label, value }) => (
                    <CopyField key={label} label={label} value={value} />
                ))}
            </div>
        </PanelSection>
    );
}

// ── Leaves tab ────────────────────────────────────────────────────────────────

const LEAVE_STATUS_VARIANT = {
    draft     : 'neutral',
    pending   : 'warning',
    approved  : 'success',
    rejected  : 'error',
    cancelled : 'neutral',
};

function fmtLeaveDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function LeavesTab({ employee, canManage, leaveRequests }) {
    const [silOpen, setSilOpen] = useState(false);

    const silRemaining = employee.sil_remaining ?? ((employee.sil_total ?? 5) - (employee.sil_used ?? 0));
    const silTotal     = employee.sil_total ?? 5;

    const history = leaveRequests ?? [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Balance cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
                <LeaveBalanceCard
                    label="Service Incentive Leave (SIL)"
                    value={silRemaining}
                    total={silTotal}
                    type="days"
                    note={`${silTotal} days total`}
                />
                <LeaveBalanceCard
                    label="VL Fund"
                    value={employee.vl_fund ?? 0}
                    type="currency"
                    note={employee.vl_fund_date ? `As of ${fmt(employee.vl_fund_date)}` : null}
                />
                <LeaveBalanceCard
                    label="Birthday Leave"
                    value={1}
                    total={1}
                    type="days"
                    note="1 day per year"
                />
            </div>

            {/* Update SIL */}
            {canManage && (
                <div>
                    <Button size="sm" icon={Pencil} onClick={() => setSilOpen(true)}>
                        Update SIL
                    </Button>
                    <Modal open={silOpen} onClose={() => setSilOpen(false)} title="Update SIL Records">
                        <SilForm employee={employee} onClose={() => setSilOpen(false)} />
                    </Modal>
                </div>
            )}

            {/* Leave history */}
            <div
                style={{
                    background: 'var(--color-card)',
                    border: 'var(--border-container)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    <div
                        className="font-body"
                        style={{
                            fontSize: 'var(--font-size-small)',
                            fontWeight: 600,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Leave History
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.visit(`/hr/leave?employee_id=${employee.id}`)}
                    >
                        View All →
                    </Button>
                </div>

                {history.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-4) 0' }}>
                        <p className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', margin: 0 }}>
                            No leave requests on file.
                        </p>
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={() => router.visit(`/hr/leave?employee_id=${employee.id}`)}
                        >
                            File a Leave →
                        </Button>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['Date Range', 'Leave Type', 'Days', 'Status'].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            textAlign: 'left',
                                            fontSize: 11,
                                            fontFamily: 'var(--font-body)',
                                            fontWeight: 700,
                                            color: 'var(--color-text-muted)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                            paddingBottom: 8,
                                            paddingRight: 12,
                                            borderBottom: 'var(--border-container)',
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((req) => (
                                <tr key={req.id} style={{ borderBottom: 'var(--border-container)' }}>
                                    <td style={{ padding: '10px 12px 10px 0', fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}>
                                        {req.date_from === req.date_to
                                            ? fmtLeaveDate(req.date_from)
                                            : `${fmtLeaveDate(req.date_from)} – ${fmtLeaveDate(req.date_to)}`}
                                    </td>
                                    <td style={{ padding: '10px 12px 10px 0', fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}>
                                        {req.leave_type_label ?? req.leave_type}
                                    </td>
                                    <td style={{ padding: '10px 12px 10px 0', fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}>
                                        {Number(req.days_requested) === 0.5 ? '½' : req.days_requested}
                                    </td>
                                    <td style={{ padding: '10px 0' }}>
                                        <Badge variant={LEAVE_STATUS_VARIANT[req.status] ?? 'neutral'}>
                                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// ── Attendance tab ────────────────────────────────────────────────────────────

const fmtTime = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
};

function AttendanceTab({ employee, attendance }) {
    const now   = new Date();
    const month = attendance?.month ?? (now.getMonth() + 1);
    const year  = attendance?.year  ?? now.getFullYear();

    function handleMonthChange(e) {
        const [y, m] = e.target.value.split('-').map(Number);
        router.get(
            route('employees.show', employee.id),
            { tab: 'attendance', month: m, year: y },
            { preserveState: true, replace: true },
        );
    }

    const monthValue = `${year}-${String(month).padStart(2, '0')}`;
    const records    = attendance?.records  ?? [];
    const stats      = attendance?.stats    ?? {};
    const statuses   = attendance?.statuses ?? {};
    const recent     = attendance?.recent   ?? [];

    const statItems = [
        { label: 'Present',   value: stats.present   ?? 0, tone: 'success'  },
        { label: 'Absent',    value: stats.absent    ?? 0, tone: 'error'    },
        { label: 'Late',      value: stats.late      ?? 0, tone: 'warning'  },
        { label: 'OT',        value: stats.ot        ?? 0, tone: 'info'     },
        { label: 'Undertime', value: stats.undertime ?? 0, tone: 'warning'  },
        { label: 'Overbreak', value: stats.overbreak ?? 0, tone: 'default'  },
    ];

    if (!attendance) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)' }}>Loading attendance data…</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Month picker */}
            <div style={{ maxWidth: 220 }}>
                <MonthPicker
                    value={monthValue}
                    onChange={handleMonthChange}
                />
            </div>

            {/* Stat summary */}
            <StatGrid min="130px">
                {statItems.map((s) => (
                    <StatCard key={s.label} label={s.label} value={s.value} tone={s.tone} />
                ))}
            </StatGrid>

            {/* Calendar */}
            <AttendanceCalendar
                records={records}
                month={month}
                year={year}
                statuses={statuses}
            />

            {/* Recent records table */}
            {recent.length > 0 && (
                <div
                    style={{
                        background: 'var(--color-card)',
                        border: 'var(--border-container)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ padding: 'var(--space-3)', borderBottom: 'var(--border-container)' }}>
                        <span
                            className="font-body"
                            style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        >
                            Recent Records
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-small)' }}>
                            <thead>
                                <tr>
                                    {['Date', 'Time In', 'Time Out', 'Hours', 'Status'].map((h) => (
                                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text)', borderBottom: 'var(--border-table-header)', background: 'var(--color-table-header-bg)' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((r, i) => {
                                    const isLate = r.minutes_late > 0;
                                    const statusLabel = statuses[r.status] ?? r.status;
                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>
                                                {r.work_date ? new Date(r.work_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                            </td>
                                            <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>{fmtTime(r.time_in)}</td>
                                            <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>{fmtTime(r.time_out)}</td>
                                            <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>
                                                {r.hours_worked != null ? `${r.hours_worked}h` : '—'}
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                {isLate ? (
                                                    <span style={{ color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        ⚠ Late ({r.minutes_late}m)
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text)' }}>{statusLabel}</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Gear tab (Uniform Issuance) ───────────────────────────────────────────────

const BLANK_ROW = { item: '', size: '', qty: '', date: '', notes: '' };

function GearTab({ employee, canManage }) {
    const records = employee.uniform_records ?? [];
    const [adding,   setAdding  ] = useState(false);
    const [newRow,   setNewRow  ] = useState(BLANK_ROW);
    const [saving,   setSaving  ] = useState(false);

    const inputStyle = {
        width: '100%', height: 32,
        padding: '0 8px',
        border: '1px solid rgba(0,0,0,0.15)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--font-size-small)',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text)',
        background: 'var(--color-card)',
        outline: 'none',
    };

    function handleSave() {
        setSaving(true);
        router.post(
            route('employees.uniform.store', employee.id),
            newRow,
            {
                preserveState: false,
                onFinish: () => { setSaving(false); setAdding(false); setNewRow(BLANK_ROW); },
            },
        );
    }

    return (
        <div
            style={{
                background: 'var(--color-card)',
                border: 'var(--border-container)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-3)', borderBottom: 'var(--border-container)',
                }}
            >
                <span
                    className="font-body"
                    style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                    Uniform Issuance{records.length > 0 ? ` (${records.length})` : ''}
                </span>
                {canManage && !adding && (
                    <Button size="sm" variant="primary" onClick={() => setAdding(true)}>
                        + Add Issuance
                    </Button>
                )}
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-small)' }}>
                    <thead>
                        <tr>
                            {['Item', 'Size', 'Qty', 'Date Issued', 'Notes'].map((h) => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text)', borderBottom: 'var(--border-table-header)', background: 'var(--color-table-header-bg)', whiteSpace: 'nowrap' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.length === 0 && !adding && (
                            <tr>
                                <td colSpan={5} style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    No uniform records on file.
                                </td>
                            </tr>
                        )}
                        {records.map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <td style={{ padding: '10px 12px', color: 'var(--color-text)', fontWeight: 600 }}>{r.item ?? '—'}</td>
                                <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>{r.size ?? '—'}</td>
                                <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>{r.qty ?? '—'}</td>
                                <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>{fmt(r.date)}</td>
                                <td style={{ padding: '10px 12px', color: 'var(--color-text)', opacity: 0.6 }}>{r.notes ?? '—'}</td>
                            </tr>
                        ))}

                        {/* Inline add row */}
                        {adding && (
                            <tr style={{ background: 'color-mix(in srgb, var(--color-primary) 4%, var(--color-card))' }}>
                                <td style={{ padding: '8px 12px' }}>
                                    <input style={inputStyle} placeholder="e.g. Polo Shirt" value={newRow.item}
                                        onChange={(e) => setNewRow((p) => ({ ...p, item: e.target.value }))} />
                                </td>
                                <td style={{ padding: '8px 12px' }}>
                                    <input style={{ ...inputStyle, width: 70 }} placeholder="e.g. M" value={newRow.size}
                                        onChange={(e) => setNewRow((p) => ({ ...p, size: e.target.value }))} />
                                </td>
                                <td style={{ padding: '8px 12px' }}>
                                    <input style={{ ...inputStyle, width: 60 }} type="number" min={1} placeholder="1" value={newRow.qty}
                                        onChange={(e) => setNewRow((p) => ({ ...p, qty: e.target.value }))} />
                                </td>
                                <td style={{ padding: '8px 12px' }}>
                                    <input style={inputStyle} type="date" value={newRow.date}
                                        onChange={(e) => setNewRow((p) => ({ ...p, date: e.target.value }))} />
                                </td>
                                <td style={{ padding: '8px 12px' }}>
                                    <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                                        <input style={inputStyle} placeholder="Optional" value={newRow.notes}
                                            onChange={(e) => setNewRow((p) => ({ ...p, notes: e.target.value }))} />
                                        <Button size="sm" loading={saving} onClick={handleSave}>Save</Button>
                                        <Button size="sm" variant="primary" onClick={() => { setAdding(false); setNewRow(BLANK_ROW); }}>Cancel</Button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Tab content renderer ──────────────────────────────────────────────────────

function TabContent({ tab, employee, statuses, departments, canManage, canViewSalary, attendance, leaveRequests }) {
    switch (tab) {
        case 'personal':
            return <PersonalTab employee={employee} />;

        case 'employment':
            return (
                <EmploymentTab
                    employee={employee}
                    departments={departments}
                    canManage={canManage}
                    canViewSalary={canViewSalary}
                />
            );

        case 'gov_ids':
            return <GovIdsTab employee={employee} />;

        case 'leaves':
            return <LeavesTab employee={employee} canManage={canManage} leaveRequests={leaveRequests} />;

        case 'attendance':
            return <AttendanceTab employee={employee} attendance={attendance} />;

        case 'gear':
            return <GearTab employee={employee} canManage={canManage} />;

        default: {
            const found = PROFILE_TABS.find((t) => t.key === tab);
            return (
                <div
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', padding: 'var(--space-8)',
                        color: 'var(--color-text-muted)', gap: 'var(--space-2)',
                    }}
                >
                    <span className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-body)' }}>
                        {found?.label ?? tab} tab
                    </span>
                    <span className="font-body" style={{ fontSize: 'var(--font-size-small)' }}>
                        Coming in the next phase.
                    </span>
                </div>
            );
        }
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function EmployeeShow({ employee, statuses, departments, canManage, canViewSalary, attendance, leaveRequests }) {
    const { url } = usePage();
    const isPanel = url?.includes('panel=1');

    // Read active tab from URL param; default to 'personal'
    const urlParams = new URLSearchParams(url?.split('?')[1] ?? '');
    const activeTab = urlParams.get('tab') || DEFAULT_TAB;

    // ── Side panel (quick-view) ───────────────────────────────────────────────
    if (isPanel) {
        return (
            <DetailPanel
                open
                onClose={() => router.visit(route('employees.index'), { preserveState: false })}
                title={employee.display_name}
                subtitle={`${employee.employee_code ?? 'No code'} · ${employee.position} · ${employee.tenure}`}
                editHref={canManage ? route('employees.edit', employee.id) : null}
                badges={
                    <>
                        <Badge variant={STATUS_VARIANT[employee.employment_status] ?? 'neutral'}>
                            {statuses[employee.employment_status] ?? employee.employment_status}
                        </Badge>
                        {employee.regularization_due && <Badge variant="warning">Reg. Due</Badge>}
                    </>
                }
            >
                <PanelQuickView employee={employee} statuses={statuses} canManage={canManage} />
            </DetailPanel>
        );
    }

    // ── Full page (tabbed layout) ─────────────────────────────────────────────
    return (
        <AppShell>
            {/* Top bar: Back + actions */}
            <div
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 'var(--space-3)',
                }}
            >
                <button
                    type="button"
                    className="flex items-center gap-1 font-body"
                    style={{
                        background: 'none', border: 'none', padding: '4px 0',
                        cursor: 'pointer', color: 'var(--color-primary)',
                        fontSize: 'var(--font-size-small)', fontWeight: 500,
                    }}
                    onClick={() => router.visit(route('employees.index'), { preserveState: true })}
                >
                    <ArrowLeft size={15} />
                    Employees
                </button>

                {canManage && (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            icon={Pencil}
                            onClick={() => router.get(route('employees.edit', employee.id))}
                        >
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            icon={MoreHorizontal}
                            aria-label="More actions"
                        />
                    </div>
                )}
            </div>

            {/* Profile identity card */}
            <ProfileHeader employee={employee} statuses={statuses} />

            {/* Tab bar */}
            <div style={{ marginTop: 'var(--space-3)' }}>
                <ProfileTabBar activeTab={activeTab} employeeId={employee.id} />
            </div>

            {/* Tab content */}
            <div style={{ marginTop: 'var(--space-3)' }}>
                <TabContent
                    tab={activeTab}
                    employee={employee}
                    statuses={statuses}
                    departments={departments}
                    canManage={canManage}
                    canViewSalary={canViewSalary}
                    attendance={attendance}
                    leaveRequests={leaveRequests}
                />
            </div>
        </AppShell>
    );
}
