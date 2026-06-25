import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, ThumbsUp, Send, Bell } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import {
    PanelColumns, PanelCol, PanelColRight,
    PanelSection, PanelField, PanelFieldRow, PanelDivider,
} from '../../Components/Shared/DetailPanel';
import ApprovalStepper from '../../Components/Shared/ApprovalStepper';
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

/**
 * ReloadContent — the inner body of a reload detail view.
 * Exported so it can be embedded in the Index page's DetailPanel
 * without duplicating markup.
 *
 * Uses the shared panel primitives (PanelSection, PanelField, PanelDivider,
 * PanelColumns) so the layout is consistent with every other module's
 * detail panel.
 */
export function ReloadContent({ reload, approvalStatuses, canWrite, canCheck, canApprove }) {
    const [checkModal,   setCheckModal  ] = useState(false);
    const [releaseModal, setReleaseModal ] = useState(false);

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

    const steps = [
        {
            label  : 'Prepared',
            done   : true,
            person : reload.created_by?.name,
            at     : reload.created_at,
        },
        {
            label  : 'Checked',
            done   : !!reload.checked_at,
            person : reload.checker?.name,
            at     : reload.checked_at,
            action : canCheck && !reload.checked_at
                ? <Button variant="primary" size="sm" icon={CheckCircle2} onClick={() => setCheckModal(true)} style={{ width: '100%' }}>Mark as Checked</Button>
                : null,
        },
        {
            label  : 'Approved',
            done   : !!reload.approved_at,
            person : reload.approver?.name,
            at     : reload.approved_at,
            action : canApprove && !reload.approved_at && reload.checked_at
                ? <Button variant="primary" size="sm" icon={ThumbsUp} onClick={submitApprove} style={{ width: '100%' }}>Approve</Button>
                : null,
        },
        {
            label  : 'Released / Deposited',
            done   : !!reload.released_at,
            person : reload.releaser?.name,
            at     : reload.released_at,
            action : canWrite && !reload.released_at && reload.approved_at
                ? <Button variant="primary" size="sm" icon={Send} onClick={() => setReleaseModal(true)} style={{ width: '100%' }}>Mark as Deposited</Button>
                : null,
        },
        {
            label  : 'Supplier Notified',
            done   : !!reload.supplier_notified,
            person : null,
            at     : reload.supplier_notified_at,
            action : canWrite && reload.released_at && !reload.supplier_notified
                ? <Button variant="ghost" size="sm" icon={Bell} onClick={submitNotify} style={{ width: '100%' }}>Record Notification</Button>
                : null,
        },
    ];

    return (
        <>
            <PanelColumns>
                {/* Left column — reload details */}
                <PanelCol>
                    <PanelSection title="Reload Details">
                        <PanelField
                            label="Amount"
                            value={<CurrencyDisplay amount={reload.amount} currency="PHP" />}
                            highlight
                        />
                        <PanelField label="Portal"       value={reload.portal?.name} />
                        <PanelFieldRow>
                            <PanelField label="Request Date" value={fmt(reload.request_date)} />
                            <PanelField label="Deposit Date" value={fmt(reload.deposit_date)} />
                        </PanelFieldRow>
                        <PanelField label="Prepared by" value={reload.created_by?.name} />
                        {reload.remarks && <PanelField label="Remarks" value={reload.remarks} />}
                    </PanelSection>

                    <PanelDivider />

                    <PanelSection title="Status">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <Badge variant={APPROVAL_VARIANT[reload.approval_status] ?? 'neutral'}>
                                {approvalStatuses[reload.approval_status] ?? reload.approval_status}
                            </Badge>
                            {reload.balance_updated   && <Badge variant="success">Balance Updated</Badge>}
                            {reload.supplier_notified && <Badge variant="neutral">Supplier Notified</Badge>}
                        </div>
                    </PanelSection>

                    {reload.audit_remarks && (
                        <>
                            <PanelDivider />
                            <PanelSection title="Audit Remarks">
                                <PanelField value={reload.audit_remarks} />
                            </PanelSection>
                        </>
                    )}

                    <PanelDivider />

                    <PanelSection title="Audit">
                        <PanelField
                            label="Created by"
                            value={reload.created_by ? `${reload.created_by.name} · ${fmtDt(reload.created_at)}` : fmtDt(reload.created_at)}
                        />
                    </PanelSection>
                </PanelCol>

                {/* Right column — approval stepper */}
                <PanelColRight>
                    <PanelSection title="Approval Chain">
                        <ApprovalStepper steps={steps} fmtDt={fmtDt} />
                    </PanelSection>
                </PanelColRight>
            </PanelColumns>

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
        </>
    );
}

/**
 * Full-page view — reached from direct URL or breadcrumb.
 */
export default function CashbondReloadShow({ reload, approvalStatuses, canWrite, canCheck, canApprove }) {
    const { flash } = usePage().props;
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

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

                <PageHeader
                    breadcrumb={[{ label: 'Cashbond Monitoring', href: route('cashbond.index') }]}
                    title={reload.reload_no}
                    subtitle={`${reload.portal?.name ?? ''} · ${fmt(reload.request_date)}`}
                />

                <ReloadContent
                    reload={reload}
                    approvalStatuses={approvalStatuses}
                    canWrite={canWrite}
                    canCheck={canCheck}
                    canApprove={canApprove}
                />
            </div>
        </AppShell>
    );
}
