import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2, CheckCircle2, ThumbsUp, Send } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import ApprovalStepper from '../../Components/Shared/ApprovalStepper';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';
import Input from '../../Components/UI/Input';
import Textarea from '../../Components/UI/Textarea';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';
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

export default function BillsShow({ bill, billTypes, statuses, approvalStatuses, paymentModes, canWrite, canCheck, canApprove }) {
    const { flash } = usePage().props;

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleting,     setDeleting    ] = useState(false);
    const [checkModal,   setCheckModal  ] = useState(false);
    const [releaseModal, setReleaseModal] = useState(false);

    const checkForm   = useForm({ audit_remarks: bill.audit_remarks ?? '' });
    const releaseForm = useForm({ payment_date: new Date().toISOString().split('T')[0] });

    function handleDelete() {
        setDeleting(true);
        router.delete(route('bills.destroy', bill.id), { onFinish: () => setDeleting(false) });
    }

    function submitCheck(e) {
        e.preventDefault();
        checkForm.post(route('bills.check', bill.id), { onSuccess: () => setCheckModal(false) });
    }

    function submitApprove() {
        router.post(route('bills.approve', bill.id));
    }

    function submitRelease(e) {
        e.preventDefault();
        releaseForm.post(route('bills.release', bill.id), { onSuccess: () => setReleaseModal(false) });
    }

    const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const fmtDt = (d) => d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    const isApproved = ['approved', 'released'].includes(bill.approval_status);

    const steps = [
        {
            label  : 'Prepared',
            done   : true,
            person : bill.created_by?.name,
            at     : bill.created_at,
        },
        {
            label  : 'Checked',
            done   : !!bill.checked_at,
            person : bill.checker?.name,
            at     : bill.checked_at,
            action : canCheck && !bill.checked_at
                ? <Button variant="secondary" size="sm" icon={CheckCircle2} onClick={() => setCheckModal(true)} style={{ width: '100%' }}>Mark Checked</Button>
                : null,
        },
        {
            label  : 'Approved',
            done   : !!bill.approved_at,
            person : bill.approver?.name,
            at     : bill.approved_at,
            action : canApprove && !bill.approved_at && bill.checked_at
                ? <Button variant="primary" size="sm" icon={ThumbsUp} onClick={submitApprove} style={{ width: '100%' }}>Approve</Button>
                : null,
        },
        {
            label  : 'Paid / Released',
            done   : !!bill.released_at,
            person : bill.releaser?.name,
            at     : bill.released_at,
            action : canWrite && !bill.released_at && bill.approved_at
                ? <Button variant="secondary" size="sm" icon={Send} onClick={() => setReleaseModal(true)} style={{ width: '100%' }}>Mark as Paid</Button>
                : null,
        },
    ];

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
                    <Button variant="ghost" icon={ArrowLeft} onClick={() => router.visit(route('bills.index'))}>
                        Back to Bills
                    </Button>
                    <div className="flex gap-2 flex-wrap">
                        {canWrite && !isApproved && (
                            <Button variant="secondary" icon={Pencil} onClick={() => router.visit(route('bills.edit', bill.id))}>Edit</Button>
                        )}
                        {canWrite && (
                            <Button variant="danger" icon={Trash2} onClick={() => setDeleteDialog(true)}>Remove</Button>
                        )}
                    </div>
                </div>

                <PageHeader
                    title={bill.name}
                    subtitle={`${billTypes[bill.bill_type] ?? bill.bill_type} · Due ${fmt(bill.due_date)}`}
                />

                <div className="flex gap-2 flex-wrap">
                    <Badge variant={STATUS_VARIANT[bill.status] ?? 'neutral'}>{statuses[bill.status] ?? bill.status}</Badge>
                    <Badge variant={APPROVAL_VARIANT[bill.approval_status] ?? 'neutral'}>{approvalStatuses[bill.approval_status] ?? bill.approval_status}</Badge>
                </div>

                {/* Amount highlight */}
                <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>Amount</div>
                    <div className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 24, marginTop: 4 }}>
                        <CurrencyDisplay amount={bill.amount} currency="PHP" />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    {/* Bill details */}
                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-small)' }}>Bill Details</div>
                        <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                            <InfoRow label="Bill Type"       value={billTypes[bill.bill_type] ?? bill.bill_type} />
                            <InfoRow label="Provider"        value={bill.provider} />
                            <InfoRow label="Account No."     value={bill.account_no} />
                            <InfoRow label="Due Date"        value={fmt(bill.due_date)} />
                            <InfoRow label="Payment Date"    value={fmt(bill.payment_date)} />
                            <InfoRow label="Mode of Payment" value={paymentModes[bill.mode_of_payment] ?? bill.mode_of_payment} />
                            {bill.remarks && <InfoRow label="Remarks" value={bill.remarks} />}
                        </div>
                    </div>

                    {/* Approval stepper */}
                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-small)' }}>Approval Chain</div>
                        <ApprovalStepper steps={steps} fmtDt={fmtDt} />
                    </div>
                </div>

                {bill.audit_remarks && (
                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold text-[var(--color-text)] mb-1" style={{ fontSize: 'var(--font-size-small)' }}>Audit Remarks</div>
                        <p className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)', whiteSpace: 'pre-wrap' }}>{bill.audit_remarks}</p>
                    </div>
                )}

                {/* Audit trail */}
                <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="font-heading font-semibold text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-small)' }}>Audit</div>
                    <div className="flex flex-col gap-1">
                        <InfoRow label="Created by" value={`${bill.created_by?.name ?? '—'} · ${fmtDt(bill.created_at)}`} />
                        <InfoRow label="Updated by" value={`${bill.updated_by?.name ?? '—'} · ${fmtDt(bill.updated_at)}`} />
                    </div>
                </div>
            </div>

            {/* Check modal */}
            <Modal open={checkModal} onClose={() => setCheckModal(false)} title="Check Bill">
                <form onSubmit={submitCheck} className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                    <Textarea label="Audit Remarks (optional)" rows={3}
                        value={checkForm.data.audit_remarks}
                        onChange={(e) => checkForm.setData('audit_remarks', e.target.value)} />
                    <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                        <Button variant="ghost" type="button" onClick={() => setCheckModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={checkForm.processing} icon={CheckCircle2}>Confirm</Button>
                    </div>
                </form>
            </Modal>

            {/* Release modal */}
            <Modal open={releaseModal} onClose={() => setReleaseModal(false)} title="Mark Bill as Paid">
                <form onSubmit={submitRelease} className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                    <Input label="Payment Date" type="date"
                        value={releaseForm.data.payment_date}
                        onChange={(e) => releaseForm.setData('payment_date', e.target.value)}
                        error={releaseForm.errors.payment_date} />
                    <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                        <Button variant="ghost" type="button" onClick={() => setReleaseModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={releaseForm.processing}>Confirm Payment</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={deleteDialog}
                title="Remove Bill"
                message={`Remove "${bill.name}"? This can be undone by an admin.`}
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog(false)}
            />
        </AppShell>
    );
}
