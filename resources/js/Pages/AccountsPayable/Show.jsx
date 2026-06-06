import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { Edit2, ArrowLeft, CheckCircle, ThumbsUp, Package, CreditCard, AlertTriangle, FileText } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';
import Input from '../../Components/UI/Input';
import Textarea from '../../Components/UI/Textarea';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const STATUS_VARIANT = {
    pending: 'warning',
    overdue: 'error',
    paid:    'success',
    filed:   'neutral',
};

const APPROVAL_VARIANT = {
    pending:  'warning',
    checked:  'info',
    approved: 'success',
    released: 'neutral',
};

function InfoRow({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>{label}</span>
            <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
        </div>
    );
}

export default function APShow({
    payable, currencies, statuses, approvalStatuses, paymentModes,
    canWrite, canCheck, canApprove,
}) {
    const { flash } = usePage().props;

    const [paymentModal,  setPaymentModal ] = useState(false);
    const [releaseModal,  setReleaseModal ] = useState(false);
    const [checkModal,    setCheckModal   ] = useState(false);
    const [submitting,    setSubmitting   ] = useState(false);

    const paymentForm = useForm({
        payment_php:  payable.payment_php ?? '',
        payment_usd:  payable.payment_usd ?? '',
        payment_jpy:  payable.payment_jpy ?? '',
        payment_date: payable.payment_date ?? '',
        check_no:     payable.check_no ?? '',
    });

    const checkForm = useForm({ audit_remarks: payable.audit_remarks ?? '' });

    const releaseForm = useForm({
        payment_date:          payable.payment_date ?? '',
        deposit_slip_attached: payable.deposit_slip_attached ?? false,
    });

    function doAction(routeName, form = null, onSuccess = null) {
        setSubmitting(true);
        const method = form ? form.post : (url, opts) => router.post(url, {}, opts);
        const target = route(routeName, payable.id);
        if (form) {
            form.post(target, {
                onSuccess: () => { setSubmitting(false); if (onSuccess) onSuccess(); },
                onError: () => setSubmitting(false),
            });
        } else {
            router.post(target, {}, {
                onFinish: () => { setSubmitting(false); if (onSuccess) onSuccess(); },
            });
        }
    }

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    return (
        <AppShell>
            <PageHeader
                title={`Payable — ${payable.supplier_name}`}
                subtitle={`${payable.voucher_no ?? ''} ${payable.invoice_no ? `| Inv# ${payable.invoice_no}` : ''}`}
                action={
                    <div style={{ display: 'flex', gap: 8 }}>
                        {canWrite && payable.approval_status === 'pending' && (
                            <Button
                                variant="secondary"
                                icon={<Edit2 size={16} />}
                                onClick={() => router.get(route('ap.edit', payable.id))}
                            >
                                Edit
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            icon={<ArrowLeft size={16} />}
                            onClick={() => router.get(route('ap.index'))}
                        >
                            Back
                        </Button>
                    </div>
                }
            />

            {flash?.message && (
                <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, background: flash.type === 'error' ? 'var(--color-error)' : flash.type === 'success' ? 'var(--color-success)' : 'var(--color-info)', color: '#fff', fontSize: 'var(--font-size-small)' }}>
                    {flash.message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Payable details */}
                    <Card padding="p-6">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)' }}>Payable Details</h2>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Badge variant={STATUS_VARIANT[payable.status] ?? 'neutral'}>{statuses[payable.status] ?? payable.status}</Badge>
                                <Badge variant={APPROVAL_VARIANT[payable.approval_status] ?? 'neutral'}>{approvalStatuses[payable.approval_status] ?? payable.approval_status}</Badge>
                            </div>
                        </div>
                        <InfoRow label="Supplier" value={payable.supplier_name} />
                        <InfoRow label="Invoice #" value={payable.invoice_no} />
                        <InfoRow label="Requisition #" value={payable.requisition_no} />
                        <InfoRow label="Invoice Date" value={fmt(payable.invoice_date)} />
                        <InfoRow label="Due Date" value={fmt(payable.due_date)} />
                        {payable.days_outstanding > 0 && (
                            <InfoRow label="Days Overdue" value={<span style={{ color: 'var(--color-error)', fontWeight: 600 }}>{payable.days_outstanding} days</span>} />
                        )}
                        <InfoRow label="Currency" value={<Badge variant="neutral">{payable.currency}</Badge>} />
                        <InfoRow label="ACR" value={payable.acr} />
                        <InfoRow label="Account #" value={payable.account_no} />
                        <InfoRow label="Check #" value={payable.check_no} />
                        <InfoRow label="Mode of Payment" value={paymentModes[payable.mode_of_payment] ?? payable.mode_of_payment} />
                        <InfoRow label="Remarks" value={payable.remarks} />
                    </Card>

                    {/* Amounts */}
                    <Card padding="p-6">
                        <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>Amounts</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
                            {[
                                { label: 'Invoice PHP', val: payable.invoice_amount_php, curr: 'PHP' },
                                { label: 'Invoice USD', val: payable.invoice_amount_usd, curr: 'USD' },
                                { label: 'Invoice JPY', val: payable.invoice_amount_jpy, curr: 'JPY' },
                                { label: 'Paid PHP',    val: payable.payment_php, curr: 'PHP' },
                                { label: 'Paid USD',    val: payable.payment_usd, curr: 'USD' },
                                { label: 'Paid JPY',    val: payable.payment_jpy, curr: 'JPY' },
                                { label: 'Balance PHP', val: payable.balance_php, curr: 'PHP', highlight: parseFloat(payable.balance_php) > 0 },
                                { label: 'Balance USD', val: payable.balance_usd, curr: 'USD', highlight: parseFloat(payable.balance_usd) > 0 },
                                { label: 'Balance JPY', val: payable.balance_jpy, curr: 'JPY', highlight: parseFloat(payable.balance_jpy) > 0 },
                            ].map(({ label, val, curr, highlight }) => (
                                <div key={label} style={{ padding: '12px 8px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.02)' }}>
                                    <p style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.5, marginBottom: 4 }}>{label}</p>
                                    <p className="font-heading" style={{ fontSize: 'var(--font-size-small)', color: highlight ? 'var(--color-error)' : 'var(--color-text)' }}>
                                        <CurrencyDisplay amount={val ?? 0} currency={curr} />
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Audit trail */}
                    {(payable.checker || payable.approver || payable.releaser) && (
                        <Card padding="p-6">
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>Approval Trail</h2>
                            {payable.checker && (
                                <InfoRow label="Checked by" value={`${payable.checker.name} — ${fmt(payable.checked_at)}`} />
                            )}
                            {payable.approver && (
                                <InfoRow label="Approved by" value={`${payable.approver.name} — ${fmt(payable.approved_at)}`} />
                            )}
                            {payable.releaser && (
                                <InfoRow label="Released by" value={`${payable.releaser.name} — ${fmt(payable.released_at)}`} />
                            )}
                            {payable.audit_remarks && (
                                <InfoRow label="Audit Remarks" value={payable.audit_remarks} />
                            )}
                        </Card>
                    )}
                </div>

                {/* Right column — actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Card padding="p-4">
                        <p className="font-heading" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', marginBottom: 12 }}>Actions</p>

                        {/* Record payment */}
                        {canWrite && !['paid', 'filed'].includes(payable.status) && (
                            <Button
                                variant="secondary"
                                icon={<CreditCard size={16} />}
                                onClick={() => setPaymentModal(true)}
                                style={{ width: '100%', marginBottom: 8 }}
                            >
                                Record Payment
                            </Button>
                        )}

                        {/* Check */}
                        {canCheck && payable.approval_status === 'pending' && (
                            <Button
                                variant="secondary"
                                icon={<CheckCircle size={16} />}
                                onClick={() => setCheckModal(true)}
                                style={{ width: '100%', marginBottom: 8 }}
                            >
                                Mark Checked
                            </Button>
                        )}

                        {/* Approve */}
                        {canApprove && payable.approval_status === 'checked' && (
                            <Button
                                variant="primary"
                                icon={<ThumbsUp size={16} />}
                                loading={submitting}
                                onClick={() => doAction('ap.approve')}
                                style={{ width: '100%', marginBottom: 8 }}
                            >
                                Approve (JRT)
                            </Button>
                        )}

                        {/* Release */}
                        {canWrite && payable.approval_status === 'approved' && (
                            <Button
                                variant="primary"
                                icon={<Package size={16} />}
                                onClick={() => setReleaseModal(true)}
                                style={{ width: '100%', marginBottom: 8 }}
                            >
                                Release & File
                            </Button>
                        )}

                        {payable.approval_status === 'released' && (
                            <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}>
                                    Released & Filed ✓
                                </p>
                            </div>
                        )}
                    </Card>

                    {payable.deposit_slip_attached && (
                        <Card padding="p-4">
                            <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}>
                                ✓ Deposit slip attached {fmt(payable.deposit_slip_attached_at)}
                            </p>
                        </Card>
                    )}
                </div>
            </div>

            {/* Record Payment Modal */}
            <Modal
                open={paymentModal}
                onClose={() => setPaymentModal(false)}
                title="Record Payment"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setPaymentModal(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            loading={paymentForm.processing}
                            onClick={() => paymentForm.post(route('ap.record-payment', payable.id), {
                                onSuccess: () => setPaymentModal(false),
                            })}
                        >
                            Save Payment
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Input label="Payment PHP" type="number" step="0.01" value={paymentForm.data.payment_php} onChange={(e) => paymentForm.setData('payment_php', e.target.value)} placeholder="0.00" />
                    <Input label="Payment USD" type="number" step="0.01" value={paymentForm.data.payment_usd} onChange={(e) => paymentForm.setData('payment_usd', e.target.value)} placeholder="0.00" />
                    <Input label="Payment JPY" type="number" step="0.01" value={paymentForm.data.payment_jpy} onChange={(e) => paymentForm.setData('payment_jpy', e.target.value)} placeholder="0" />
                    <Input label="Payment Date" type="date" value={paymentForm.data.payment_date} onChange={(e) => paymentForm.setData('payment_date', e.target.value)} />
                    <Input label="Check #" value={paymentForm.data.check_no} onChange={(e) => paymentForm.setData('check_no', e.target.value)} placeholder="If paying by check" />
                </div>
            </Modal>

            {/* Check Modal */}
            <Modal
                open={checkModal}
                onClose={() => setCheckModal(false)}
                title="Mark as Checked"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setCheckModal(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            loading={checkForm.processing}
                            onClick={() => checkForm.post(route('ap.check', payable.id), {
                                onSuccess: () => setCheckModal(false),
                            })}
                        >
                            Confirm Check
                        </Button>
                    </>
                }
            >
                <Textarea
                    label="Audit Remarks (optional)"
                    value={checkForm.data.audit_remarks}
                    onChange={(e) => checkForm.setData('audit_remarks', e.target.value)}
                    rows={3}
                    placeholder="Notes for audit trail..."
                />
            </Modal>

            {/* Release Modal */}
            <Modal
                open={releaseModal}
                onClose={() => setReleaseModal(false)}
                title="Release & File"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setReleaseModal(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            loading={releaseForm.processing}
                            onClick={() => releaseForm.post(route('ap.release', payable.id), {
                                onSuccess: () => setReleaseModal(false),
                            })}
                        >
                            Release
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Input
                        label="Payment Date"
                        type="date"
                        value={releaseForm.data.payment_date}
                        onChange={(e) => releaseForm.setData('payment_date', e.target.value)}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={releaseForm.data.deposit_slip_attached}
                            onChange={(e) => releaseForm.setData('deposit_slip_attached', e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                            Deposit slip attached and filed
                        </span>
                    </label>
                </div>
            </Modal>
        </AppShell>
    );
}