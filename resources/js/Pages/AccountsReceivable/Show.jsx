import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2, CheckCircle2, DollarSign, FileText, RotateCcw, Send } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';
import Input from '../../Components/UI/Input';
import Textarea from '../../Components/UI/Textarea';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const STATUS_VARIANT    = { current: 'info', overdue: 'error', paid: 'success' };
const APPROVAL_VARIANT  = { pending: 'warning', coo_approved: 'info', gsm_approved: 'info', approved: 'success', rejected: 'error' };

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

export default function ARShow({ collectible, departments, statuses, approvalStatuses, canWrite, canApprove, canAudit }) {
    const { flash } = usePage().props;

    const [deleteDialog,  setDeleteDialog ] = useState(false);
    const [deleting,      setDeleting     ] = useState(false);
    const [paymentModal,  setPaymentModal ] = useState(false);
    const [refundModal,   setRefundModal  ] = useState(false);

    // Payment form
    const payment = useForm({
        payment_received_php: collectible.payment_received_php ?? '',
        payment_received_usd: collectible.payment_received_usd ?? '',
        or_number:            collectible.or_number ?? '',
        ar_number:            collectible.ar_number ?? '',
    });

    // Refund form
    const refund = useForm({ audit_remarks: collectible.audit_remarks ?? '' });

    function handleDelete() {
        setDeleting(true);
        router.delete(route('ar.destroy', collectible.id), {
            onFinish: () => setDeleting(false),
        });
    }

    function submitPayment(e) {
        e.preventDefault();
        payment.post(route('ar.record-payment', collectible.id), {
            onSuccess: () => setPaymentModal(false),
        });
    }

    function submitRefund(e) {
        e.preventDefault();
        refund.post(route('ar.process-refund', collectible.id), {
            onSuccess: () => setRefundModal(false),
        });
    }

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const fmtDt = (d) => d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    const isApproved = collectible.approval_status === 'approved';

    return (
        <AppShell>
            <div className="flex flex-col gap-[var(--space-3)]" style={{ padding: 'var(--space-4)', maxWidth: 900, margin: '0 auto' }}>

                {flash?.message && (
                    <div className="rounded font-body" style={{
                        padding: 'var(--space-2)', color: '#fff', fontSize: 'var(--font-size-small)', borderRadius: 'var(--radius-md)',
                        background: flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                    }}>
                        {flash.message}
                    </div>
                )}

                {/* Nav */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <Button variant="ghost" icon={ArrowLeft} onClick={() => router.visit(route('ar.index'))}>Back</Button>
                    <div className="flex gap-2 flex-wrap">
                        {canWrite && !isApproved && (
                            <Button variant="secondary" icon={Pencil} onClick={() => router.visit(route('ar.edit', collectible.id))}>
                                Edit
                            </Button>
                        )}
                        {(canWrite || canAudit) && (
                            <Button variant="danger" icon={Trash2} onClick={() => setDeleteDialog(true)}>Remove</Button>
                        )}
                    </div>
                </div>

                <PageHeader
                    title={collectible.customer_name}
                    subtitle={`${departments[collectible.department] ?? collectible.department} · ${fmt(collectible.date)}`}
                />

                {/* Status row */}
                <div className="flex gap-2 flex-wrap">
                    <Badge variant={STATUS_VARIANT[collectible.status] ?? 'neutral'}>
                        {statuses[collectible.status] ?? collectible.status}
                    </Badge>
                    <Badge variant={APPROVAL_VARIANT[collectible.approval_status] ?? 'neutral'}>
                        {approvalStatuses[collectible.approval_status] ?? collectible.approval_status}
                    </Badge>
                    {collectible.days_outstanding > 0 && (
                        <Badge variant="error">{collectible.days_outstanding} days overdue</Badge>
                    )}
                </div>

                {/* Financial summary */}
                <div className="grid gap-[var(--space-2)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                    {[
                        { label: 'Collectible (PHP)', value: collectible.collectible_amount_php, currency: 'PHP' },
                        { label: 'Received (PHP)',    value: collectible.payment_received_php,   currency: 'PHP' },
                        { label: 'Balance (PHP)',     value: collectible.balance_php,            currency: 'PHP', highlight: true },
                        { label: 'Collectible (USD)', value: collectible.collectible_amount_usd, currency: 'USD' },
                        { label: 'Received (USD)',    value: collectible.payment_received_usd,   currency: 'USD' },
                        { label: 'Balance (USD)',     value: collectible.balance_usd,            currency: 'USD', highlight: true },
                    ].map((s) => (
                        <div key={s.label} style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2) var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                            <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>{s.label}</div>
                            <div className="font-heading font-semibold" style={{
                                fontSize: 18, marginTop: 2,
                                color: s.highlight && parseFloat(s.value) > 0 ? 'var(--color-error)' : 'var(--color-text)',
                            }}>
                                <CurrencyDisplay amount={s.value ?? 0} currency={s.currency} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detail sections */}
                <div className="grid gap-[var(--space-3)]" style={{ gridTemplateColumns: '1fr 1fr' }}>

                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold mb-[var(--space-2)] text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>Transaction</div>
                        <div className="flex flex-col gap-[var(--space-2)]">
                            <InfoRow label="Department"         value={departments[collectible.department]} />
                            <InfoRow label="Agent Code"         value={collectible.agent_code} />
                            <InfoRow label="Date"               value={fmt(collectible.date)} />
                            <InfoRow label="Corporate Account"  value={collectible.corporate_account} />
                            <InfoRow label="Travel Date"        value={fmt(collectible.travel_date)} />
                            <InfoRow label="Terms"              value={collectible.terms} />
                            <InfoRow label="Due Date"           value={fmt(collectible.due_date)} />
                        </div>
                    </div>

                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold mb-[var(--space-2)] text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>References</div>
                        <div className="flex flex-col gap-[var(--space-2)]">
                            <InfoRow label="OR Number" value={collectible.or_number} />
                            <InfoRow label="AR Number" value={collectible.ar_number} />
                            <InfoRow label="SI Number" value={collectible.si_number} />
                            <InfoRow label="Remarks"   value={collectible.remarks} />
                        </div>
                    </div>
                </div>

                {collectible.particulars && (
                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold mb-1 text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>Particulars</div>
                        <p className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)', whiteSpace: 'pre-wrap' }}>{collectible.particulars}</p>
                    </div>
                )}

                {/* Approval panel */}
                <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="font-heading font-semibold mb-[var(--space-2)] text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                        Approval — COO and GSM (both required)
                    </div>
                    <div className="grid gap-[var(--space-2)]" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Badge variant={collectible.approved_by_coo_at ? 'success' : 'warning'}>
                                    COO {collectible.approved_by_coo_at ? 'Approved' : 'Pending'}
                                </Badge>
                            </div>
                            {collectible.approved_by_coo_at && (
                                <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                    {collectible.coo_approver?.name ?? 'COO'} · {fmtDt(collectible.approved_by_coo_at)}
                                </span>
                            )}
                            {canApprove && !collectible.approved_by_coo_at && (
                                <Button variant="secondary" size="sm" icon={CheckCircle2}
                                    onClick={() => router.post(route('ar.approve-coo', collectible.id))}>
                                    Approve as COO
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Badge variant={collectible.approved_by_gsm_at ? 'success' : 'warning'}>
                                    GSM {collectible.approved_by_gsm_at ? 'Approved' : 'Pending'}
                                </Badge>
                            </div>
                            {collectible.approved_by_gsm_at && (
                                <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                    {collectible.gsm_approver?.name ?? 'GSM'} · {fmtDt(collectible.approved_by_gsm_at)}
                                </span>
                            )}
                            {canApprove && !collectible.approved_by_gsm_at && (
                                <Button variant="secondary" size="sm" icon={CheckCircle2}
                                    onClick={() => router.post(route('ar.approve-gsm', collectible.id))}>
                                    Approve as GSM
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Post-approval actions */}
                {isApproved && (
                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold mb-[var(--space-2)] text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                            Post-Approval Actions
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" size="sm" icon={DollarSign} onClick={() => setPaymentModal(true)}>
                                Record Payment
                            </Button>
                            {!collectible.endorsed_to_disbursement && (
                                <Button variant="secondary" size="sm" icon={Send}
                                    onClick={() => router.post(route('ar.endorse-disbursement', collectible.id))}>
                                    Endorse to Disbursement
                                </Button>
                            )}
                            {collectible.endorsed_to_disbursement && (
                                <Badge variant="success">Endorsed to Disbursement · {fmtDt(collectible.endorsed_to_disbursement_at)}</Badge>
                            )}
                            {!collectible.refund_processed && (
                                <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setRefundModal(true)}>
                                    Process Refund
                                </Button>
                            )}
                            {collectible.refund_processed && (
                                <Badge variant="neutral">Refund Processed · {fmtDt(collectible.refund_processed_at)}</Badge>
                            )}
                            {!collectible.documents_endorsed && (
                                <Button variant="ghost" size="sm" icon={FileText}
                                    onClick={() => router.post(route('ar.endorse-documents', collectible.id))}>
                                    Endorse Documents
                                </Button>
                            )}
                            {collectible.documents_endorsed && (
                                <Badge variant="neutral">Documents Endorsed · {fmtDt(collectible.documents_endorsed_at)}</Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Audit trail */}
                <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="font-heading font-semibold mb-[var(--space-2)] text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>Audit</div>
                    <div className="flex flex-col gap-1">
                        <InfoRow label="Created by" value={`${collectible.created_by?.name ?? '—'} · ${fmtDt(collectible.created_at)}`} />
                        <InfoRow label="Updated by" value={`${collectible.updated_by?.name ?? '—'} · ${fmtDt(collectible.updated_at)}`} />
                        {collectible.audit_remarks && <InfoRow label="Audit Remarks" value={collectible.audit_remarks} />}
                    </div>
                </div>
            </div>

            {/* Payment modal */}
            <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment">
                <form onSubmit={submitPayment} className="flex flex-col gap-[var(--space-2)]">
                    <Input label="Payment Received (PHP)" type="number" step="0.01"
                        value={payment.data.payment_received_php}
                        onChange={(e) => payment.setData('payment_received_php', e.target.value)}
                        error={payment.errors.payment_received_php} />
                    <Input label="Payment Received (USD)" type="number" step="0.01"
                        value={payment.data.payment_received_usd}
                        onChange={(e) => payment.setData('payment_received_usd', e.target.value)}
                        error={payment.errors.payment_received_usd} />
                    <Input label="OR Number" value={payment.data.or_number}
                        onChange={(e) => payment.setData('or_number', e.target.value)}
                        error={payment.errors.or_number} />
                    <Input label="AR Number" value={payment.data.ar_number}
                        onChange={(e) => payment.setData('ar_number', e.target.value)}
                        error={payment.errors.ar_number} />
                    <div className="flex justify-end gap-2 mt-2">
                        <Button variant="ghost" type="button" onClick={() => setPaymentModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={payment.processing}>Save Payment</Button>
                    </div>
                </form>
            </Modal>

            {/* Refund modal */}
            <Modal open={refundModal} onClose={() => setRefundModal(false)} title="Process Refund">
                <form onSubmit={submitRefund} className="flex flex-col gap-[var(--space-2)]">
                    <Textarea label="Audit Remarks" rows={3} value={refund.data.audit_remarks}
                        onChange={(e) => refund.setData('audit_remarks', e.target.value)}
                        error={refund.errors.audit_remarks} />
                    <div className="flex justify-end gap-2 mt-2">
                        <Button variant="ghost" type="button" onClick={() => setRefundModal(false)}>Cancel</Button>
                        <Button variant="danger" type="submit" loading={refund.processing}>Confirm Refund</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={deleteDialog}
                title="Remove Collectible"
                message={`Remove this collectible for ${collectible.customer_name}? This can be undone by an admin.`}
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog(false)}
            />
        </AppShell>
    );
}