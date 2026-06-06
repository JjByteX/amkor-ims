import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { ArrowLeft, Pencil, CheckCircle2, ThumbsUp, Send, Bell } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';
import Input from '../../Components/UI/Input';
import Textarea from '../../Components/UI/Textarea';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const STATUS_VARIANT   = { pending: 'warning', paid: 'success', overdue: 'error' };
const APPROVAL_VARIANT = { pending: 'warning', checked: 'info', approved: 'success', released: 'neutral' };

function InfoRow({ label, value }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>{label}</span>
            <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                {value ?? <span className="text-gray-300">—</span>}
            </span>
        </div>
    );
}

export default function IataPaymentsShow({ payment, statuses, approvalStatuses, canWrite, canCheck, canApprove }) {
    const { flash } = usePage().props;

    const [checkOpen,   setCheckOpen]   = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);
    const [releaseOpen, setReleaseOpen] = useState(false);
    const [notifyOpen,  setNotifyOpen]  = useState(false);

    const checkForm   = useForm({ audit_remarks: '' });
    const approveForm = useForm({});
    const releaseForm = useForm({
        payment_date          : new Date().toISOString().split('T')[0],
        deposit_slip_attached : false,
    });
    const notifyForm  = useForm({});

    function doCheck(e) {
        e.preventDefault();
        checkForm.post(route('iata.check', payment.id), { onSuccess: () => setCheckOpen(false) });
    }

    function doApprove(e) {
        e.preventDefault();
        approveForm.post(route('iata.approve', payment.id), { onSuccess: () => setApproveOpen(false) });
    }

    function doRelease(e) {
        e.preventDefault();
        releaseForm.post(route('iata.release', payment.id), { onSuccess: () => setReleaseOpen(false) });
    }

    function doNotify(e) {
        e.preventDefault();
        notifyForm.post(route('iata.notify', payment.id), { onSuccess: () => setNotifyOpen(false) });
    }

    const fmtDt = (d) => d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    return (
        <AppShell>
            <div className="flex flex-col gap-[var(--space-3)]" style={{ maxWidth: 800, margin: '0 auto' }}>

                {flash?.message && (
                    <div className="rounded font-body" style={{
                        padding     : 'var(--space-2)',
                        background  : flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                        color       : '#fff',
                        fontSize    : 'var(--font-size-small)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                    <Button variant="ghost" icon={ArrowLeft} onClick={() => router.visit(route('iata.index'))}>
                        Back to IATA Payments
                    </Button>
                    <div className="flex gap-2 flex-wrap">
                        {canWrite && payment.approval_status === 'pending' && (
                            <Button variant="secondary" icon={Pencil} onClick={() => router.visit(route('iata.edit', payment.id))}>Edit</Button>
                        )}
                        {canCheck && !payment.checked_at && (
                            <Button variant="secondary" icon={CheckCircle2} onClick={() => setCheckOpen(true)}>Check</Button>
                        )}
                        {canApprove && payment.checked_at && !payment.approved_at && (
                            <Button variant="primary" icon={ThumbsUp} onClick={() => setApproveOpen(true)}>Approve</Button>
                        )}
                        {canWrite && payment.approved_at && !payment.released_at && (
                            <Button variant="primary" icon={Send} onClick={() => setReleaseOpen(true)}>Release & File</Button>
                        )}
                        {canWrite && payment.released_at && !payment.operator_notified && (
                            <Button variant="secondary" icon={Bell} onClick={() => setNotifyOpen(true)}>Notify Operator</Button>
                        )}
                    </div>
                </div>

                <PageHeader
                    title={payment.payment_no}
                    subtitle={payment.operator_name}
                />

                <div className="flex gap-2 flex-wrap">
                    <Badge variant={STATUS_VARIANT[payment.status] ?? 'neutral'}>
                        {statuses[payment.status] ?? payment.status}
                    </Badge>
                    <Badge variant={APPROVAL_VARIANT[payment.approval_status] ?? 'neutral'}>
                        {approvalStatuses[payment.approval_status] ?? payment.approval_status}
                    </Badge>
                    {payment.deposit_slip_attached && (
                        <Badge variant="success">Deposit Slip Attached</Badge>
                    )}
                    {payment.operator_notified && (
                        <Badge variant="info">Operator Notified</Badge>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    {/* Payment details */}
                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-small)' }}>Payment Details</div>
                        <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                            <InfoRow label="Operator"          value={payment.operator_name} />
                            <InfoRow label="Billing Reference" value={payment.billing_reference} />
                            <InfoRow label="Billing Date"      value={payment.billing_date} />
                            <InfoRow label="Due Date"          value={payment.due_date} />
                            <InfoRow label="Amount"            value={<CurrencyDisplay amount={payment.amount} currency="PHP" />} />
                            <InfoRow label="Payment Date"      value={payment.payment_date} />
                            <InfoRow label="Branch"            value={payment.branch?.name} />
                            {payment.remarks && <InfoRow label="Remarks" value={payment.remarks} />}
                        </div>
                    </div>

                    {/* Approval chain */}
                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-small)' }}>Approval Chain</div>
                        <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>

                            <div className="flex flex-col gap-1">
                                <Badge variant="info">Prepared</Badge>
                                <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                    {payment.created_by?.name ?? '—'} · {fmtDt(payment.created_at)}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <Badge variant={payment.checked_at ? 'info' : 'warning'}>{payment.checked_at ? 'Checked' : 'Awaiting Check'}</Badge>
                                {payment.checked_at && (
                                    <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                        {payment.checker?.name ?? '—'} · {fmtDt(payment.checked_at)}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Badge variant={payment.approved_at ? 'success' : 'warning'}>{payment.approved_at ? 'Approved' : 'Awaiting Approval'}</Badge>
                                {payment.approved_at && (
                                    <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                        {payment.approver?.name ?? '—'} · {fmtDt(payment.approved_at)}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Badge variant={payment.released_at ? 'neutral' : 'warning'}>{payment.released_at ? 'Released' : 'Awaiting Release'}</Badge>
                                {payment.released_at && (
                                    <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                        {payment.releaser?.name ?? '—'} · {fmtDt(payment.released_at)}
                                    </span>
                                )}
                            </div>
                        </div>
                        {payment.audit_remarks && (
                            <div className="font-body text-[var(--color-text)]" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-small)', opacity: 0.7 }}>
                                <strong>Audit remarks:</strong> {payment.audit_remarks}
                            </div>
                        )}
                    </div>
                </div>

                {/* Audit trail */}
                <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="font-heading font-semibold text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-small)' }}>Audit</div>
                    <div className="flex flex-col gap-1">
                        <InfoRow label="Created by" value={`${payment.created_by?.name ?? '—'} · ${fmtDt(payment.created_at)}`} />
                        <InfoRow label="Updated by" value={`${payment.updated_by?.name ?? '—'} · ${fmtDt(payment.updated_at)}`} />
                    </div>
                </div>
            </div>

            {/* Check Modal */}
            <Modal open={checkOpen} onClose={() => setCheckOpen(false)} title="Check IATA Payment">
                <form onSubmit={doCheck} className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                    <Textarea
                        label="Audit Remarks (optional)"
                        value={checkForm.data.audit_remarks}
                        onChange={(e) => checkForm.setData('audit_remarks', e.target.value)}
                        rows={3}
                    />
                    <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                        <Button variant="ghost" onClick={() => setCheckOpen(false)} type="button">Cancel</Button>
                        <Button variant="primary" type="submit" loading={checkForm.processing}>Confirm Check</Button>
                    </div>
                </form>
            </Modal>

            {/* Approve Modal */}
            <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Approve IATA Payment">
                <form onSubmit={doApprove} className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                    <p className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)' }}>
                        Approve IATA payment of <strong><CurrencyDisplay amount={payment.amount} currency="PHP" /></strong> to <strong>{payment.operator_name}</strong>?
                    </p>
                    <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                        <Button variant="ghost" onClick={() => setApproveOpen(false)} type="button">Cancel</Button>
                        <Button variant="primary" type="submit" loading={approveForm.processing}>Approve</Button>
                    </div>
                </form>
            </Modal>

            {/* Release Modal */}
            <Modal open={releaseOpen} onClose={() => setReleaseOpen(false)} title="Release & File IATA Payment">
                <form onSubmit={doRelease} className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                    <Input
                        label="Payment Date"
                        type="date"
                        value={releaseForm.data.payment_date}
                        onChange={(e) => releaseForm.setData('payment_date', e.target.value)}
                        error={releaseForm.errors.payment_date}
                    />
                    <label className="flex items-center font-body text-[var(--color-text)]" style={{ gap: 'var(--space-1)', fontSize: 'var(--font-size-body)' }}>
                        <input
                            type="checkbox"
                            checked={releaseForm.data.deposit_slip_attached}
                            onChange={(e) => releaseForm.setData('deposit_slip_attached', e.target.checked)}
                            style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
                        />
                        Deposit slip attached
                    </label>
                    <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                        <Button variant="ghost" onClick={() => setReleaseOpen(false)} type="button">Cancel</Button>
                        <Button variant="primary" type="submit" loading={releaseForm.processing}>Release</Button>
                    </div>
                </form>
            </Modal>

            {/* Notify Modal */}
            <Modal open={notifyOpen} onClose={() => setNotifyOpen(false)} title="Notify Operator">
                <form onSubmit={doNotify} className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                    <p className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)' }}>
                        Record that <strong>{payment.operator_name}</strong> has been notified of the payment?
                        Email delivery is wired in Phase 12.
                    </p>
                    <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                        <Button variant="ghost" onClick={() => setNotifyOpen(false)} type="button">Cancel</Button>
                        <Button variant="primary" type="submit" loading={notifyForm.processing}>Confirm</Button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
}
