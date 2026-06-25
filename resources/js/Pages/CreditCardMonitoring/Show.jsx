import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { CheckCircle2, ThumbsUp, Send } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, {PanelActions, PanelCol, PanelColRight, PanelColumns, PanelDivider, PanelField, PanelFieldRow, PanelMeta, PanelMetaItem, PanelSection} from '../../Components/Shared/DetailPanel';
import ApprovalStepper from '../../Components/Shared/ApprovalStepper';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';
import Input from '../../Components/UI/Input';
import Textarea from '../../Components/UI/Textarea';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const STATUS_VARIANT   = { pending: 'warning', paid: 'success', overdue: 'error' };
const APPROVAL_VARIANT = { pending: 'warning', checked: 'info', approved: 'success', released: 'neutral' };

export function CreditCardContent({ payment, statuses, approvalStatuses, canWrite, canCheck, canApprove }) {

    const { url } = usePage();
    const isPanel = url?.includes('panel=1');

    const [checkOpen,   setCheckOpen]   = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);
    const [releaseOpen, setReleaseOpen] = useState(false);

    const checkForm   = useForm({ audit_remarks: '' });
    const approveForm = useForm({});
    const releaseForm = useForm({ payment_date: new Date().toISOString().split('T')[0] });

    function doCheck(e)   { e.preventDefault(); checkForm.post(route('credit-cards.check',   payment.id), { onSuccess: () => setCheckOpen(false)   }); }
    function doApprove(e) { e.preventDefault(); approveForm.post(route('credit-cards.approve', payment.id), { onSuccess: () => setApproveOpen(false) }); }
    function doRelease(e) { e.preventDefault(); releaseForm.post(route('credit-cards.release', payment.id), { onSuccess: () => setReleaseOpen(false) }); }

    const fmtDt = (d) => d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    const card = payment.credit_card;

    const steps = [
        {
            label  : 'Prepared',
            done   : true,
            person : payment.created_by?.name,
            at     : payment.created_at,
        },
        {
            label  : 'Checked',
            done   : !!payment.checked_at,
            person : payment.checker?.name,
            at     : payment.checked_at,
            action : canCheck && !payment.checked_at
                ? <Button variant="primary" size="sm" icon={CheckCircle2} onClick={() => setCheckOpen(true)} style={{ width: '100%' }}>Check Payment</Button>
                : null,
        },
        {
            label  : 'Approved',
            done   : !!payment.approved_at,
            person : payment.approver?.name,
            at     : payment.approved_at,
            action : canApprove && payment.checked_at && !payment.approved_at
                ? <Button variant="primary" size="sm" icon={ThumbsUp} onClick={() => setApproveOpen(true)} style={{ width: '100%' }}>Approve Payment</Button>
                : null,
        },
        {
            label  : 'Released',
            done   : !!payment.released_at,
            person : payment.releaser?.name,
            at     : payment.released_at,
            action : canWrite && payment.approved_at && !payment.released_at
                ? <Button variant="primary" size="sm" icon={Send} onClick={() => setReleaseOpen(true)} style={{ width: '100%' }}>Release Payment</Button>
                : null,
        },
    ];

    const content = (
        <>
            <PanelColumns>
                {/* LEFT — payment details */}
                <PanelCol>
                    <PanelSection title="Payment Details">
                        <PanelField label="Card"   value={card?.card_name} highlight />
                        <PanelFieldRow>
                            <PanelField label="Bank"   value={card?.bank_name} />
                            <PanelField label="Last 4" value={card?.last_four ? `•••• ${card.last_four}` : null} mono />
                        </PanelFieldRow>
                        <PanelDivider />
                        <PanelField label="Amount" value={<CurrencyDisplay amount={payment.amount} currency="PHP" />} highlight />
                        <PanelFieldRow>
                            <PanelField label="Due Date"       value={fmtDt(payment.due_date)} />
                            <PanelField label="Statement Date" value={fmtDt(payment.statement_date)} />
                        </PanelFieldRow>
                        <PanelField label="Payment Date" value={fmtDt(payment.payment_date)} />
                        {payment.remarks && <PanelField label="Remarks" value={payment.remarks} />}
                    </PanelSection>

                    {payment.audit_remarks && (
                        <>
                            <PanelDivider />
                            <p className="font-body" style={{ fontSize: 'var(--font-size-small)', margin: 0 }}>
                                {payment.audit_remarks}
                            </p>
                        </>
                    )}

                    <PanelMeta>
                        <PanelMetaItem label="Created by" value={`${payment.created_by?.name ?? '—'} · ${fmtDt(payment.created_at)}`} />
                        <PanelMetaItem label="Updated by" value={`${payment.updated_by?.name ?? '—'} · ${fmtDt(payment.updated_at)}`} />
                    </PanelMeta>
                </PanelCol>

                {/* RIGHT — approval stepper */}
                <PanelColRight>
                    <PanelSection title="Approval Chain">
                        <ApprovalStepper steps={steps} fmtDt={fmtDt} />
                    </PanelSection>
                </PanelColRight>
            </PanelColumns>

            {/* Check Modal */}
            <Modal open={checkOpen} onClose={() => setCheckOpen(false)} title="Check Payment">
                <form onSubmit={doCheck} className="flex flex-col gap-[var(--space-2)]">
                    <Textarea label="Audit Remarks (optional)" rows={3}
                        value={checkForm.data.audit_remarks}
                        onChange={(e) => checkForm.setData('audit_remarks', e.target.value)} />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={() => setCheckOpen(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={checkForm.processing}>Confirm Check</Button>
                    </div>
                </form>
            </Modal>

            {/* Approve Modal */}
            <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Approve Payment">
                <form onSubmit={doApprove} className="flex flex-col gap-[var(--space-2)]">
                    <p className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                        Approve payment of <strong><CurrencyDisplay amount={payment.amount} currency="PHP" /></strong> for {card?.card_name}?
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={() => setApproveOpen(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={approveForm.processing}>Approve</Button>
                    </div>
                </form>
            </Modal>

            {/* Release Modal */}
            <Modal open={releaseOpen} onClose={() => setReleaseOpen(false)} title="Release Payment">
                <form onSubmit={doRelease} className="flex flex-col gap-[var(--space-2)]">
                    <Input label="Payment Date" type="date"
                        value={releaseForm.data.payment_date}
                        onChange={(e) => releaseForm.setData('payment_date', e.target.value)}
                        error={releaseForm.errors.payment_date} />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={() => setReleaseOpen(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={releaseForm.processing}>Confirm Release</Button>
                    </div>
                </form>
            </Modal>
        </>
    );


    return content;
}

export default function CreditCardShow({ payment, statuses, approvalStatuses, canWrite, canCheck, canApprove }) {
    const { url } = usePage();
    const isPanel = url?.includes('panel=1');

    if (isPanel) {
        return (
            <DetailPanel
                open
                onClose={() => router.visit(route('credit-cards.index'), { preserveState: false })}
                title={payment.payment_no}
                subtitle={payment.credit_card?.card_name ?? 'Credit Card Payment'}
                badges={
                <>
                <Badge variant={STATUS_VARIANT[payment.status] ?? 'neutral'}>
                {statuses[payment.status] ?? payment.status}
                </Badge>
                <Badge variant={APPROVAL_VARIANT[payment.approval_status] ?? 'neutral'}>
                {approvalStatuses[payment.approval_status] ?? payment.approval_status}
                </Badge>
                </>
                }
            >
                <CreditCardContent payment={payment} statuses={statuses} approvalStatuses={approvalStatuses} canWrite={canWrite} canCheck={canCheck} canApprove={canApprove} />
            </DetailPanel>
        );
    }

    return <AppShell><CreditCardContent payment={payment} statuses={statuses} approvalStatuses={approvalStatuses} canWrite={canWrite} canCheck={canCheck} canApprove={canApprove} /></AppShell>;
}
