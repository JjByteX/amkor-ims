import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, ThumbsUp, Send, Bell } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';
import Input from '../../Components/UI/Input';
import Textarea from '../../Components/UI/Textarea';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const APPROVAL_VARIANT = {
    pending  : 'warning',
    checked  : 'info',
    approved : 'success',
    released : 'neutral',
};

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

export default function CashbondReloadShow({ reload, approvalStatuses, canWrite, canCheck, canApprove }) {
    const { flash } = usePage().props;

    const [checkModal,   setCheckModal  ] = useState(false);
    const [releaseModal, setReleaseModal] = useState(false);

    const checkForm   = useForm({ audit_remarks: reload.audit_remarks ?? '' });
    const releaseForm = useForm({ deposit_date: new Date().toISOString().split('T')[0] });

    function submitCheck(e) {
        e.preventDefault();
        checkForm.post(route('cashbond.reloads.check', reload.id), { onSuccess: () => setCheckModal(false) });
    }

    function submitApprove() {
        router.post(route('cashbond.reloads.approve', reload.id));
    }

    function submitRelease(e) {
        e.preventDefault();
        releaseForm.post(route('cashbond.reloads.release', reload.id), { onSuccess: () => setReleaseModal(false) });
    }

    function submitNotify() {
        router.post(route('cashbond.reloads.notify', reload.id));
    }

    const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const fmtDt = (d) => d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    const isReleased = reload.approval_status === 'released';

    return (
        <AppShell>
            <div className="flex flex-col" style={{ gap: 'var(--space-3)', maxWidth: 760, margin: '0 auto' }}>

                {flash?.message && (
                    <div className="rounded font-body" style={{
                        padding: 'var(--space-2)', color: '#fff', fontSize: 'var(--font-size-small)', borderRadius: 'var(--radius-md)',
                        background: flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                    <Button variant="ghost" icon={ArrowLeft} onClick={() => router.visit(route('cashbond.reloads.index'))}>
                        All Reloads
                    </Button>
                </div>

                <PageHeader
                    title={reload.reload_no}
                    subtitle={`${reload.portal?.name} · ${fmt(reload.request_date)}`}
                />

                <div className="flex gap-2 flex-wrap">
                    <Badge variant={APPROVAL_VARIANT[reload.approval_status] ?? 'neutral'}>
                        {approvalStatuses[reload.approval_status] ?? reload.approval_status}
                    </Badge>
                    {reload.balance_updated && <Badge variant="success">Balance Updated</Badge>}
                    {reload.supplier_notified && <Badge variant="neutral">Supplier Notified</Badge>}
                </div>

                {/* Core details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-small)' }}>Reload Details</div>
                        <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                            <div>
                                <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>Amount</div>
                                <div className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 20 }}>
                                    <CurrencyDisplay amount={reload.amount} currency="PHP" />
                                </div>
                            </div>
                            <InfoRow label="Portal"        value={reload.portal?.name} />
                            <InfoRow label="Request Date"  value={fmt(reload.request_date)} />
                            <InfoRow label="Deposit Date"  value={fmt(reload.deposit_date)} />
                            <InfoRow label="Prepared by"   value={reload.created_by?.name} />
                            {reload.remarks && <InfoRow label="Remarks" value={reload.remarks} />}
                        </div>
                    </div>

                    {/* Approval chain */}
                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-small)' }}>Approval Chain</div>
                        <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>

                            {/* Checked */}
                            <div className="flex flex-col gap-1">
                                <Badge variant={reload.checked_at ? 'info' : 'warning'}>
                                    {reload.checked_at ? 'Checked' : 'Awaiting Check'}
                                </Badge>
                                {reload.checked_at && (
                                    <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                        {reload.checker?.name ?? '—'} · {fmtDt(reload.checked_at)}
                                    </span>
                                )}
                                {canCheck && !reload.checked_at && (
                                    <Button variant="secondary" size="sm" icon={CheckCircle2} onClick={() => setCheckModal(true)}>
                                        Mark as Checked
                                    </Button>
                                )}
                            </div>

                            {/* Approved */}
                            <div className="flex flex-col gap-1">
                                <Badge variant={reload.approved_at ? 'success' : 'warning'}>
                                    {reload.approved_at ? 'Approved' : 'Awaiting Approval'}
                                </Badge>
                                {reload.approved_at && (
                                    <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                        {reload.approver?.name ?? '—'} · {fmtDt(reload.approved_at)}
                                    </span>
                                )}
                                {canApprove && !reload.approved_at && reload.checked_at && (
                                    <Button variant="primary" size="sm" icon={ThumbsUp} onClick={submitApprove}>
                                        Approve
                                    </Button>
                                )}
                            </div>

                            {/* Released */}
                            <div className="flex flex-col gap-1">
                                <Badge variant={reload.released_at ? 'neutral' : 'warning'}>
                                    {reload.released_at ? 'Released / Deposited' : 'Awaiting Deposit'}
                                </Badge>
                                {reload.released_at && (
                                    <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                        {reload.releaser?.name ?? '—'} · {fmtDt(reload.released_at)}
                                    </span>
                                )}
                                {canWrite && !reload.released_at && reload.approved_at && (
                                    <Button variant="secondary" size="sm" icon={Send} onClick={() => setReleaseModal(true)}>
                                        Mark as Deposited
                                    </Button>
                                )}
                            </div>

                            {/* Notify supplier */}
                            {isReleased && (
                                <div className="flex flex-col gap-1">
                                    <Badge variant={reload.supplier_notified ? 'neutral' : 'warning'}>
                                        {reload.supplier_notified ? 'Supplier Notified' : 'Supplier Not Yet Notified'}
                                    </Badge>
                                    {reload.supplier_notified_at && (
                                        <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                            {fmtDt(reload.supplier_notified_at)}
                                        </span>
                                    )}
                                    {canWrite && !reload.supplier_notified && (
                                        <Button variant="ghost" size="sm" icon={Bell} onClick={submitNotify}>
                                            Record Notification
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Audit remarks */}
                {reload.audit_remarks && (
                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold text-[var(--color-text)] mb-1" style={{ fontSize: 'var(--font-size-small)' }}>Audit Remarks</div>
                        <p className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)', whiteSpace: 'pre-wrap' }}>{reload.audit_remarks}</p>
                    </div>
                )}

                {/* System audit */}
                <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="font-heading font-semibold text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-small)' }}>Audit</div>
                    <div className="flex flex-col gap-1">
                        <InfoRow label="Created by" value={`${reload.created_by?.name ?? '—'} · ${fmtDt(reload.created_at)}`} />
                    </div>
                </div>
            </div>

            {/* Check modal */}
            <Modal open={checkModal} onClose={() => setCheckModal(false)} title="Check Reload Request">
                <form onSubmit={submitCheck} className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                    <Textarea
                        label="Audit Remarks (optional)"
                        rows={3}
                        value={checkForm.data.audit_remarks}
                        onChange={(e) => checkForm.setData('audit_remarks', e.target.value)}
                    />
                    <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                        <Button variant="ghost" type="button" onClick={() => setCheckModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={checkForm.processing} icon={CheckCircle2}>Confirm Check</Button>
                    </div>
                </form>
            </Modal>

            {/* Release modal */}
            <Modal open={releaseModal} onClose={() => setReleaseModal(false)} title="Record Deposit">
                <form onSubmit={submitRelease} className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                    <Input
                        label="Deposit Date"
                        type="date"
                        value={releaseForm.data.deposit_date}
                        onChange={(e) => releaseForm.setData('deposit_date', e.target.value)}
                        error={releaseForm.errors.deposit_date}
                    />
                    <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                        <Button variant="ghost" type="button" onClick={() => setReleaseModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={releaseForm.processing}>Confirm Deposit</Button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
}
