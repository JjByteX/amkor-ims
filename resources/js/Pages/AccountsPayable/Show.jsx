import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { CheckCircle, ThumbsUp, Package, CreditCard, Inbox } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, {PanelActions, PanelCol, PanelColRight, PanelColumns, PanelDivider, PanelField, PanelFieldRow, PanelSection} from '../../Components/Shared/DetailPanel';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';
import Input from '../../Components/UI/Input';
import Textarea from '../../Components/UI/Textarea';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const STATUS_VARIANT = {
    pending:  'warning',
    overdue:  'error',
    paid:     'success',
    received: 'info',
    filed:    'neutral',
};

const APPROVAL_VARIANT = {
    pending:  'warning',
    checked:  'info',
    approved: 'success',
    released: 'neutral',
};

export function APContent({
    payable, currencies, statuses, approvalStatuses, paymentModes,
    canWrite, canCheck, canApprove,
}) {

    const { url } = usePage();
    const isPanel = url?.includes('panel=1');

    const [paymentModal, setPaymentModal] = useState(false);
    const [releaseModal, setReleaseModal] = useState(false);
    const [checkModal,   setCheckModal  ] = useState(false);
    const [receiveModal, setReceiveModal] = useState(false);
    const [submitting,   setSubmitting  ] = useState(false);

    const paymentForm = useForm({
        payment_php:  payable.payment_php  ?? '',
        payment_usd:  payable.payment_usd  ?? '',
        payment_jpy:  payable.payment_jpy  ?? '',
        payment_date: payable.payment_date ?? '',
        check_no:     payable.check_no     ?? '',
    });

    const checkForm   = useForm({ audit_remarks: payable.audit_remarks ?? '' });
    const releaseForm = useForm({
        payment_date:          payable.payment_date ?? '',
        deposit_slip_attached: payable.deposit_slip_attached ?? false,
    });
    const receiveForm = useForm({
        date_received: payable.date_received ?? '',
    });

    function doApprove() {
        setSubmitting(true);
        router.post(route('ap.approve', payable.id), {}, { onFinish: () => setSubmitting(false) });
    }

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

    const content = (
        <>
            <PanelColumns>
                {/* LEFT — payable details */}
                <PanelCol>
                    <PanelSection title="Payable Details">
                        <PanelField label="Supplier"         value={payable.supplier_name} highlight />
                        <PanelFieldRow>
                            <PanelField label="Invoice #"     value={payable.invoice_no}     mono />
                            <PanelField label="Requisition #" value={payable.requisition_no} mono />
                        </PanelFieldRow>
                        <PanelFieldRow>
                            <PanelField label="Invoice Date"  value={fmt(payable.invoice_date)} />
                            <PanelField label="Due Date"      value={fmt(payable.due_date)} />
                        </PanelFieldRow>
                        <PanelDivider />
                        <PanelField label="Currency"         value={<Badge variant="neutral">{payable.currency}</Badge>} />
                        <PanelField label="ACR"              value={payable.acr} />
                        <PanelFieldRow>
                            <PanelField label="Account #"    value={payable.account_no} mono />
                            <PanelField label="Check #"      value={payable.check_no}   mono />
                        </PanelFieldRow>
                        <PanelField label="Mode of Payment"  value={paymentModes[payable.mode_of_payment] ?? payable.mode_of_payment} />
                        {payable.payment_date && <PanelField label="Payment Date" value={fmt(payable.payment_date)} />}
                        {payable.date_received && <PanelField label="Date Received" value={fmt(payable.date_received)} />}
                        {payable.remarks && <PanelField label="Remarks" value={payable.remarks} />}
                    </PanelSection>

                    <PanelDivider />

                    <PanelSection>
                        {payable.checker  && <PanelField label="Checked by"  value={`${payable.checker.name} — ${fmt(payable.checked_at)}`} />}
                        {payable.approver && <PanelField label="Approved by" value={`${payable.approver.name} — ${fmt(payable.approved_at)}`} />}
                        {payable.releaser && <PanelField label="Released by" value={`${payable.releaser.name} — ${fmt(payable.released_at)}`} />}
                        {!payable.checker && !payable.approver && !payable.releaser && (
                            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                                No approvals recorded yet.
                            </span>
                        )}
                        {payable.audit_remarks && (
                            <>
                                <PanelDivider />
                                <p className="font-body" style={{ fontSize: 'var(--font-size-small)', margin: 0 }}>
                                    {payable.audit_remarks}
                                </p>
                            </>
                        )}
                    </PanelSection>

                    {payable.deposit_slip_attached && (
                        <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}>
                            ✓ Deposit slip attached {fmt(payable.deposit_slip_attached_at)}
                        </span>
                    )}
                </PanelCol>

                {/* RIGHT — amounts + actions */}
                <PanelColRight>
                    <PanelSection title="Amounts">
                        <PanelFieldRow>
                            <PanelField label="Invoice PHP" value={<CurrencyDisplay amount={payable.invoice_amount_php ?? 0} currency="PHP" />} />
                            <PanelField label="Paid PHP"    value={<CurrencyDisplay amount={payable.payment_php ?? 0}        currency="PHP" />} />
                        </PanelFieldRow>
                        <PanelField label="Balance PHP" value={
                            <span style={{ color: parseFloat(payable.balance_php) > 0 ? 'var(--color-error)' : undefined }}>
                                <CurrencyDisplay amount={payable.balance_php ?? 0} currency="PHP" />
                            </span>
                        } />
                        <PanelDivider />
                        <PanelFieldRow>
                            <PanelField label="Invoice USD" value={<CurrencyDisplay amount={payable.invoice_amount_usd ?? 0} currency="USD" />} />
                            <PanelField label="Paid USD"    value={<CurrencyDisplay amount={payable.payment_usd ?? 0}        currency="USD" />} />
                        </PanelFieldRow>
                        <PanelField label="Balance USD" value={<CurrencyDisplay amount={payable.balance_usd ?? 0} currency="USD" />} />
                        <PanelDivider />
                        <PanelFieldRow>
                            <PanelField label="Invoice JPY" value={<CurrencyDisplay amount={payable.invoice_amount_jpy ?? 0} currency="JPY" />} />
                            <PanelField label="Paid JPY"    value={<CurrencyDisplay amount={payable.payment_jpy ?? 0}        currency="JPY" />} />
                        </PanelFieldRow>
                        <PanelField label="Balance JPY" value={<CurrencyDisplay amount={payable.balance_jpy ?? 0} currency="JPY" />} />
                    </PanelSection>

                    <PanelDivider />

                    <PanelActions>
                        {canWrite && !['paid', 'received', 'filed'].includes(payable.status) && (
                            <Button variant="secondary" icon={CreditCard} onClick={() => setPaymentModal(true)} style={{ width: '100%' }}>
                                Record Payment
                            </Button>
                        )}
                        {canCheck && payable.approval_status === 'pending' && (
                            <Button variant="secondary" icon={CheckCircle} onClick={() => setCheckModal(true)} style={{ width: '100%' }}>
                                Mark Checked
                            </Button>
                        )}
                        {canApprove && payable.approval_status === 'checked' && (
                            <Button variant="primary" icon={ThumbsUp} loading={submitting} onClick={doApprove} style={{ width: '100%' }}>
                                Approve (JRT)
                            </Button>
                        )}
                        {canWrite && payable.approval_status === 'approved' && (
                            <Button variant="primary" icon={Package} onClick={() => setReleaseModal(true)} style={{ width: '100%' }}>
                                Release &amp; File
                            </Button>
                        )}
                        {payable.approval_status === 'released' && payable.status !== 'received' && (
                            <>
                                <div style={{ padding: 'var(--space-2)', background: 'color-mix(in srgb, var(--color-success) 10%, var(--color-card))', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}>
                                        Released &amp; Filed ✓
                                    </span>
                                </div>
                                {canWrite && (
                                    <Button variant="secondary" icon={Inbox} onClick={() => setReceiveModal(true)} style={{ width: '100%' }}>
                                        Mark Received
                                    </Button>
                                )}
                            </>
                        )}
                        {payable.status === 'received' && (
                            <div style={{ padding: 'var(--space-2)', background: 'color-mix(in srgb, var(--color-info) 10%, var(--color-card))', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-info)' }}>
                                    Received{payable.date_received ? ` — ${fmt(payable.date_received)}` : ''} ✓
                                </span>
                            </div>
                        )}
                    </PanelActions>
                </PanelColRight>
            </PanelColumns>

            {/* Record Payment Modal */}
            <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setPaymentModal(false)}>Cancel</Button>
                        <Button variant="primary" loading={paymentForm.processing}
                            onClick={() => paymentForm.post(route('ap.record-payment', payable.id), { onSuccess: () => setPaymentModal(false) })}>
                            Save Payment
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-[var(--space-2)]">
                    <Input label="Payment PHP" type="number" step="0.01" placeholder="0.00" value={paymentForm.data.payment_php} onChange={(e) => paymentForm.setData('payment_php', e.target.value)} />
                    <Input label="Payment USD" type="number" step="0.01" placeholder="0.00" value={paymentForm.data.payment_usd} onChange={(e) => paymentForm.setData('payment_usd', e.target.value)} />
                    <Input label="Payment JPY" type="number" step="0.01" placeholder="0"    value={paymentForm.data.payment_jpy} onChange={(e) => paymentForm.setData('payment_jpy', e.target.value)} />
                    <Input label="Payment Date" type="date"                                  value={paymentForm.data.payment_date} onChange={(e) => paymentForm.setData('payment_date', e.target.value)} />
                    <Input label="Check #" placeholder="If paying by check"                  value={paymentForm.data.check_no}    onChange={(e) => paymentForm.setData('check_no', e.target.value)} />
                </div>
            </Modal>

            {/* Check Modal */}
            <Modal open={checkModal} onClose={() => setCheckModal(false)} title="Mark as Checked"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setCheckModal(false)}>Cancel</Button>
                        <Button variant="primary" loading={checkForm.processing}
                            onClick={() => checkForm.post(route('ap.check', payable.id), { onSuccess: () => setCheckModal(false) })}>
                            Confirm Check
                        </Button>
                    </>
                }
            >
                <Textarea label="Audit Remarks (optional)" rows={3}
                    value={checkForm.data.audit_remarks}
                    onChange={(e) => checkForm.setData('audit_remarks', e.target.value)}
                    placeholder="Notes for audit trail..."
                />
            </Modal>

            {/* Release Modal */}
            <Modal open={releaseModal} onClose={() => setReleaseModal(false)} title="Release & File"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setReleaseModal(false)}>Cancel</Button>
                        <Button variant="primary" loading={releaseForm.processing}
                            onClick={() => releaseForm.post(route('ap.release', payable.id), { onSuccess: () => setReleaseModal(false) })}>
                            Release
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-[var(--space-2)]">
                    <Input label="Payment Date" type="date"
                        value={releaseForm.data.payment_date}
                        onChange={(e) => releaseForm.setData('payment_date', e.target.value)}
                    />
                    <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                        <input type="checkbox"
                            checked={releaseForm.data.deposit_slip_attached}
                            onChange={(e) => releaseForm.setData('deposit_slip_attached', e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                        />
                        <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                            Deposit slip attached and filed
                        </span>
                    </label>
                </div>
            </Modal>

            {/* Mark Received Modal */}
            <Modal open={receiveModal} onClose={() => setReceiveModal(false)} title="Mark as Received"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setReceiveModal(false)}>Cancel</Button>
                        <Button variant="primary" loading={receiveForm.processing}
                            onClick={() => receiveForm.post(route('ap.receive', payable.id), { onSuccess: () => setReceiveModal(false) })}>
                            Confirm Received
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-[var(--space-2)]">
                    <p className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', margin: 0 }}>
                        Confirms the operator/embassy has acknowledged receipt of this CV. Used by Visa to update the linked application's "Date Received".
                    </p>
                    <Input label="Date Received" type="date"
                        value={receiveForm.data.date_received}
                        onChange={(e) => receiveForm.setData('date_received', e.target.value)}
                    />
                </div>
            </Modal>
        </>
    );


    return content;
}

export default function APShow({
    payable, currencies, statuses, approvalStatuses, paymentModes,
    canWrite, canCheck, canApprove,
}) {
    const { url } = usePage();
    const isPanel = url?.includes('panel=1');

    if (isPanel) {
        return (
            <DetailPanel
                open
                onClose={() => router.visit(route('ap.index'), { preserveState: false })}
                title={payable.supplier_name}
                subtitle={`${payable.voucher_no ?? ''}${payable.invoice_no ? ` · Inv# ${payable.invoice_no}` : ''}`}
                badges={
                <>
                <Badge variant={STATUS_VARIANT[payable.status] ?? 'neutral'}>
                {statuses[payable.status] ?? payable.status}
                </Badge>
                <Badge variant={APPROVAL_VARIANT[payable.approval_status] ?? 'neutral'}>
                {approvalStatuses[payable.approval_status] ?? payable.approval_status}
                </Badge>
                {payable.days_outstanding > 0 && (
                <Badge variant="error">{payable.days_outstanding} days overdue</Badge>
                )}
                </>
                }
            >
                <APContent payable={payable} currencies={currencies} statuses={statuses} approvalStatuses={approvalStatuses} paymentModes={paymentModes} canWrite={canWrite} canCheck={canCheck} canApprove={canApprove} />
            </DetailPanel>
        );
    }

    return <AppShell><APContent payable={payable} currencies={currencies} statuses={statuses} approvalStatuses={approvalStatuses} paymentModes={paymentModes} canWrite={canWrite} canCheck={canCheck} canApprove={canApprove} /></AppShell>;
}
