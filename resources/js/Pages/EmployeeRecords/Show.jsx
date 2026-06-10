import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Trash2, AlertTriangle, CheckCircle, Pencil,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, {PanelActions, PanelCol, PanelColRight, PanelColumns, PanelDivider, PanelField, PanelFieldRow, PanelFullRow, PanelMeta, PanelMetaItem, PanelSection} from '../../Components/Shared/DetailPanel';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';

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
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} loading={submitting}>Save SIL</Button>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function EmployeeContent({ employee, statuses, departments, canManage }) {

    const { url } = usePage();
    const isPanel = url?.includes('panel=1');

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [silOpen,    setSilOpen   ] = useState(false);
    const [deleting,   setDeleting  ] = useState(false);

    function handleDelete() {
        setDeleting(true);
        router.delete(route('employees.destroy', employee.id), { onFinish: () => setDeleting(false) });
    }

    const uniformRecords = employee.uniform_records ?? [];

    const content = (
        <>
            <PanelColumns>
                {/* LEFT — personal + contact + government IDs */}
                <PanelCol>
                    <PanelSection title="Personal Information">
                        <PanelField label="Full Name"     value={employee.full_name} highlight />
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
                            <PanelField label="Position"      value={employee.position} />
                        </PanelFieldRow>
                        <PanelFieldRow>
                            <PanelField label="Department" value={departments[employee.department] ?? employee.department} />
                            <PanelField label="Branch"     value={employee.branch?.name} />
                        </PanelFieldRow>
                        <PanelFieldRow>
                            <PanelField label="Date Hired"          value={fmt(employee.date_hired)} />
                            <PanelField label="Regularization Date" value={fmt(employee.regularization_date)} />
                        </PanelFieldRow>
                        <PanelField label="Tenure" value={employee.tenure} />
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
                            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setSilOpen(true)}>
                                Update SIL
                            </Button>
                        )}
                    </PanelSection>

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
                                    variant="secondary"
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

            {/* Uniform Issuance — full width below the columns */}
            {uniformRecords.length > 0 && (
                <PanelFullRow title={`Uniform Issuance Records (${uniformRecords.length})`}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-small)' }}>
                            <thead>
                                <tr>
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
                </PanelFullRow>
            )}

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
                        <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                        <Button variant="danger" loading={deleting} onClick={handleDelete}>Confirm Remove</Button>
                    </div>
                </div>
            </Modal>
        </>
    );


    return content;
}

export default function EmployeeShow({ employee, statuses, departments, canManage }) {
    const { url } = usePage();
    const isPanel = url?.includes('panel=1');

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
                <EmployeeContent employee={employee} statuses={statuses} departments={departments} canManage={canManage} />
            </DetailPanel>
        );
    }

    return <AppShell><EmployeeContent employee={employee} statuses={statuses} departments={departments} canManage={canManage} /></AppShell>;
}
