import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { Trash2, CheckCircle2, DollarSign, FileText, RotateCcw, Send } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, {PanelActions, PanelCol, PanelColRight, PanelColumns, PanelDivider, PanelField, PanelFieldRow, PanelMeta, PanelMetaItem, PanelSection} from '../../Components/Shared/DetailPanel';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal, { ModalCancelButton } from '../../Components/UI/Modal';
import Input from '../../Components/UI/Input';
import Textarea from '../../Components/UI/Textarea';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';
import ApprovalStepper from '../../Components/Shared/ApprovalStepper';

const STATUS_VARIANT    = { current: 'info', overdue: 'error', paid: 'success' };
const APPROVAL_VARIANT  = { pending: 'warning', coo_approved: 'info', gsm_approved: 'info', approved: 'success', rejected: 'error' };

export function ARContent({ collectible, departments, statuses, approvalStatuses, canWrite, canApprove, canApproveCoo, canApproveGsm, canAudit, hydrating = false, onApprove }) {

    const { url } = usePage();

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleting,     setDeleting    ] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [refundModal,  setRefundModal ] = useState(false);

    const payment = useForm({
        payment_received_php: collectible.payment_received_php ?? '',
        payment_received_usd: collectible.payment_received_usd ?? '',
        or_number:            collectible.or_number ?? '',
        ar_number:            collectible.ar_number ?? '',
    });

    const refund = useForm({ audit_remarks: collectible.audit_remarks ?? '' });

    function handleDelete() {
        setDeleting(true);
        router.delete(route('ar.destroy', collectible.id), { onFinish: () => setDeleting(false) });
    }

    function submitPayment(e) {
        e.preventDefault();
        payment.post(route('ar.record-payment', collectible.id), { onSuccess: () => setPaymentModal(false) });
    }

    function submitRefund(e) {
        e.preventDefault();
        refund.post(route('ar.process-refund', collectible.id), { onSuccess: () => setRefundModal(false) });
    }

    const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
    const fmtDt = (d) => d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
    const isApproved     = collectible.approval_status === 'approved';
    const needsApproval  = !isApproved;
    const dueDatePast    = collectible.due_date && new Date(collectible.due_date) < new Date();

    // ── Approval step state helpers ────────────────────────────────────────────
    const cooApproved = !!collectible.approved_by_coo_at;
    const gsmApproved = !!collectible.approved_by_gsm_at;

    const approvalSteps = [
        { label: 'Submitted', done: true, person: collectible.created_by?.name, at: collectible.created_at },
        { label: 'COO Approval', done: cooApproved, person: collectible.coo_approver?.name, at: collectible.approved_by_coo_at,
          action: !hydrating && canApproveCoo && !cooApproved
            ? <Button variant="primary" size="sm" icon={CheckCircle2}
                onClick={() => router.post(route('ar.approve-coo', collectible.id), {}, { onSuccess: () => onApprove?.() })}>
                Approve as COO
              </Button>
            : null },
        { label: 'GSM Approval', done: gsmApproved, person: collectible.gsm_approver?.name, at: collectible.approved_by_gsm_at,
          action: !hydrating && canApproveGsm && cooApproved && !gsmApproved
            ? <Button variant="primary" size="sm" icon={CheckCircle2}
                onClick={() => router.post(route('ar.approve-gsm', collectible.id), {}, { onSuccess: () => onApprove?.() })}>
                Approve as GSM
              </Button>
            : null },
    ];

    const content = (
        <>
            <PanelColumns>
                {/* LEFT — amounts */}
                <PanelCol>
                    <PanelSection title="Amounts">
                        <PanelFieldRow>
                            <PanelField label="Collectible (PHP)" value={<CurrencyDisplay amount={collectible.collectible_amount_php ?? 0} currency="PHP" />} />
                            <PanelField label="Received (PHP)"    value={<CurrencyDisplay amount={collectible.payment_received_php ?? 0} currency="PHP" />} />
                        </PanelFieldRow>
                        <PanelField label="Balance (PHP)" value={
                            <span style={{ color: parseFloat(collectible.balance_php) > 0 ? 'var(--color-error)' : undefined, fontWeight: 600 }}>
                                <CurrencyDisplay amount={collectible.balance_php ?? 0} currency="PHP" />
                            </span>
                        } />
                        <PanelDivider />
                        <PanelFieldRow>
                            <PanelField label="Collectible (USD)" value={<CurrencyDisplay amount={collectible.collectible_amount_usd ?? 0} currency="USD" />} />
                            <PanelField label="Received (USD)"    value={<CurrencyDisplay amount={collectible.payment_received_usd ?? 0} currency="USD" />} />
                        </PanelFieldRow>
                        <PanelField label="Balance (USD)" value={
                            <span style={{ color: parseFloat(collectible.balance_usd) > 0 ? 'var(--color-error)' : undefined }}>
                                <CurrencyDisplay amount={collectible.balance_usd ?? 0} currency="USD" />
                            </span>
                        } />
                    </PanelSection>

                    <PanelMeta>
                        <PanelMetaItem label="Created by" value={`${collectible.created_by?.name ?? '—'} · ${fmtDt(collectible.created_at)}`} />
                    </PanelMeta>
                </PanelCol>

                {/* RIGHT — transaction details */}
                <PanelColRight>
                    <PanelSection title="Transaction">
                        <PanelField label="Agent Code"        value={collectible.agent_code} highlight />
                        <PanelField label="Corporate Account" value={collectible.corporate_account} />
                        <PanelFieldRow>
                            <PanelField label="Travel Date" value={fmt(collectible.travel_date)} />
                            <PanelField label="Due Date" value={
                                <span style={{ color: dueDatePast && !isApproved ? 'var(--color-error)' : undefined }}>
                                    {fmt(collectible.due_date) ?? '—'}
                                </span>
                            } />
                        </PanelFieldRow>
                        <PanelField label="Terms" value={collectible.terms} />
                    </PanelSection>

                    <PanelDivider />

                    <PanelSection>
                        <PanelFieldRow>
                            <PanelField label="SI #" value={collectible.si_number} mono />
                            <PanelField label="OR #" value={collectible.or_number} mono />
                        </PanelFieldRow>
                        <PanelField label="AR #" value={collectible.ar_number} mono />
                        {collectible.particulars && <PanelField label="Particulars" value={collectible.particulars} />}
                        {collectible.remarks     && <PanelField label="Remarks"     value={collectible.remarks} />}
                    </PanelSection>

                    {/* Post-approval actions — only shown once fully approved */}
                    {isApproved && (
                        <>
                            <PanelDivider />
                            <PanelActions>
                                <Button variant="primary" size="sm" icon={DollarSign} onClick={() => setPaymentModal(true)} style={{ width: '100%' }}>
                                    Record Payment
                                </Button>
                                {!collectible.endorsed_to_disbursement && (
                                    <Button variant="primary" size="sm" icon={Send}
                                        onClick={() => router.post(route('ar.endorse-disbursement', collectible.id))}
                                        style={{ width: '100%' }}>
                                        Endorse to Disbursement
                                    </Button>
                                )}
                                {collectible.endorsed_to_disbursement && (
                                    <Badge variant="success">Endorsed to Disbursement · {fmtDt(collectible.endorsed_to_disbursement_at)}</Badge>
                                )}
                                {!collectible.refund_processed && (
                                    <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setRefundModal(true)} style={{ width: '100%' }}>
                                        Process Refund
                                    </Button>
                                )}
                                {collectible.refund_processed && (
                                    <Badge variant="neutral">Refund Processed · {fmtDt(collectible.refund_processed_at)}</Badge>
                                )}
                                {!collectible.documents_endorsed && (
                                    <Button variant="ghost" size="sm" icon={FileText}
                                        onClick={() => router.post(route('ar.endorse-documents', collectible.id))}
                                        style={{ width: '100%' }}>
                                        Endorse Documents
                                    </Button>
                                )}
                                {collectible.documents_endorsed && (
                                    <Badge variant="neutral">Documents Endorsed · {fmtDt(collectible.documents_endorsed_at)}</Badge>
                                )}
                            </PanelActions>
                        </>
                    )}

                    <PanelDivider />
                    <PanelSection title={isApproved ? 'Approval' : 'Approval Required'}>
                        <ApprovalStepper steps={approvalSteps} fmtDt={fmtDt} />
                    </PanelSection>

                    {(canWrite || canAudit) && (
                        <>
                            <PanelDivider />
                            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteDialog(true)} style={{ width: '100%' }}>
                                Delete Collectible
                            </Button>
                        </>
                    )}
                </PanelColRight>
            </PanelColumns>
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
                        <ModalCancelButton type="button" onClick={() => setPaymentModal(false)} />
                        <Button variant="primary" type="submit" loading={payment.processing}>Save Payment</Button>
                    </div>
                </form>
            </Modal>

            {/* Refund modal */}
            <Modal open={refundModal} onClose={() => setRefundModal(false)} title="Process Refund">
                <form onSubmit={submitRefund} className="flex flex-col gap-[var(--space-2)]">
                    <Textarea label="Audit Remarks" rows={3}
                        value={refund.data.audit_remarks}
                        onChange={(e) => refund.setData('audit_remarks', e.target.value)}
                        error={refund.errors.audit_remarks} />
                    <div className="flex justify-end gap-2 mt-2">
                        <ModalCancelButton type="button" onClick={() => setRefundModal(false)} />
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
        </>
    );

    return content;
}

export default function ARShow({ collectible, departments, statuses, approvalStatuses, canWrite, canApprove, canApproveCoo, canApproveGsm, canAudit }) {
    const { url } = usePage();
    const isPanel = url?.includes('panel=1');
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

    if (isPanel) {
        return (
            <DetailPanel
                open
                onClose={() => router.visit(route('ar.index'), { preserveState: false })}
                title={collectible.customer_name}
                subtitle={`${departments[collectible.department] ?? collectible.department} · ${fmt(collectible.date)}`}
                badges={
                <>
                <Badge variant={STATUS_VARIANT[collectible.status] ?? 'neutral'}>
                {statuses[collectible.status] ?? collectible.status}
                </Badge>
                <Badge variant={APPROVAL_VARIANT[collectible.approval_status] ?? 'neutral'}>
                {approvalStatuses[collectible.approval_status] ?? collectible.approval_status}
                </Badge>
                {collectible.days_outstanding > 0 && (
                <Badge variant="error">{collectible.days_outstanding} days overdue</Badge>
                )}
                </>
                }
            >
                <ARContent collectible={collectible} departments={departments} statuses={statuses} approvalStatuses={approvalStatuses} canWrite={canWrite} canApprove={canApprove} canApproveCoo={canApproveCoo} canApproveGsm={canApproveGsm} canAudit={canAudit} />
            </DetailPanel>
        );
    }

    return <AppShell><ARContent collectible={collectible} departments={departments} statuses={statuses} approvalStatuses={approvalStatuses} canWrite={canWrite} canApprove={canApprove} canApproveCoo={canApproveCoo} canApproveGsm={canApproveGsm} canAudit={canAudit} /></AppShell>;
}
