import { useState, useRef, useCallback } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    Send, FileCheck,
    Hash, Trash2,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, {PanelActions, PanelCol, PanelColRight, PanelColumns, PanelDivider, PanelField, PanelFieldRow, PanelFullRow, PanelMeta, PanelMetaItem, PanelSection} from '../../Components/Shared/DetailPanel';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Modal, { ModalCancelButton } from '../../Components/UI/Modal';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';
import ContactLinkPanel from '../../Components/Shared/ContactLinkPanel';
import RelatedTransactionsPanel from '../../Components/Shared/RelatedTransactionsPanel';
import ApprovalStepper from '../../Components/Shared/ApprovalStepper';

const STATUS_VARIANT = {
    pending   : 'warning',
    on_process: 'info',
    completed : 'success',
    approved  : 'success',
    denied    : 'error',
    forfeited : 'error',
    refunded  : 'neutral',
};


export function VisaContent({ application, statuses, paymentModes, canWrite, canEndorse, contactsSearchUrl, relatedTransactions }) {

    const { url } = usePage();
    const isPanel = url?.includes('panel=1');

    const [orModal,      setOrModal     ] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleting,     setDeleting    ] = useState(false);

    // ── Inline autosave notes ──────────────────────────────────────────────────
    // We use a ref for the draft value instead of useState so we never fight
    // Inertia's prop staleness. The textarea gets a key so it hard-resets on
    // every mount (panel open), reading the current prop value fresh each time.
    const [notesSaved,  setNotesSaved ] = useState(null); // null | 'saving' | 'saved'
    const notesTimer  = useRef(null);
    const notesDraft  = useRef(application.notes ?? '');  // tracks current textarea value

    const saveNotes = useCallback((value) => {
        router.post(route('visa.update-notes', application.id), { notes: value }, {
            preserveScroll: true,
            onSuccess: () => setNotesSaved('saved'),
            onError:   () => setNotesSaved(null),
        });
    }, [application.id]);

    function handleNotesChange(e) {
        const value = e.target.value;
        notesDraft.current = value;
        setNotesSaved('saving');
        clearTimeout(notesTimer.current);
        notesTimer.current = setTimeout(() => saveNotes(value), 600);
    }

    const statusForm = useForm({ status: application.status });
    function changeStatus(e) {
        statusForm.setData('status', e.target.value);
        router.post(route('visa.update-status', application.id), { status: e.target.value }, { preserveScroll: true });
    }

    const orForm = useForm({ or_number: '' });
    function submitOr(e) {
        e.preventDefault();
        orForm.post(route('visa.record-or', application.id), { onSuccess: () => setOrModal(false) });
    }

    const [sendingRequest, setSendingRequest] = useState(false);
    function sendPaymentRequest() {
        setSendingRequest(true);
        router.post(route('visa.payment-request', application.id), {}, { onFinish: () => setSendingRequest(false) });
    }

    const [endorsing, setEndorsing] = useState(false);
    function endorseOr() {
        setEndorsing(true);
        router.post(route('visa.endorse-or', application.id), {}, { onFinish: () => setEndorsing(false) });
    }

    function handleDelete() {
        setDeleting(true);
        router.delete(route('visa.destroy', application.id), { onFinish: () => setDeleting(false) });
    }

    const fmtDate    = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : null;
    const statusOptions = Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }));

    const content = (
        <>
            <PanelColumns>
                {/* LEFT — application info, financials, references */}
                <PanelCol>
                    <PanelSection title="Application Info">
                        <PanelFieldRow>
                            <PanelField label="Date"       value={fmtDate(application.date)} />
                            <PanelField label="Agent Code" value={application.agent_code} highlight />
                        </PanelFieldRow>
                        <PanelFieldRow>
                            <PanelField label="Agency"              value={application.agency} />
                            <PanelField label="Visa / Service Type" value={application.visa_type} />
                        </PanelFieldRow>
                        <PanelFieldRow>
                            <PanelField label="Date of Birth"          value={fmtDate(application.date_of_birth)} />
                            <PanelField label="Embassy / Operator"     value={application.embassy_name} />
                        </PanelFieldRow>
                    </PanelSection>

                    <PanelDivider />

                    <PanelSection>
                        <PanelFieldRow>
                            <PanelField label="Selling Price" value={<CurrencyDisplay amount={application.selling_price} currency="PHP" />} />
                            <PanelField label="Net Payable"   value={<CurrencyDisplay amount={application.net_payable}   currency="PHP" />} />
                        </PanelFieldRow>
                        <PanelField label="Income" value={<CurrencyDisplay amount={application.income} currency="PHP" />} highlight />
                    </PanelSection>

                    <PanelDivider />

                    <PanelSection>
                        <PanelField label="Mode of Payment" value={paymentModes[application.mode_of_payment]} />
                        <PanelField label="Payment Date"    value={fmtDate(application.payment_date)} />
                        <PanelDivider />
                        <PanelFieldRow>
                            <PanelField label="SOA #" value={application.soa_number} mono />
                            <PanelField label="SI #"  value={application.si_number}  mono />
                        </PanelFieldRow>
                        <PanelField label="AR #" value={application.ar_number} mono />
                    </PanelSection>

                    <PanelDivider />

                    <PanelSection title="Contact Link">
                        <ContactLinkPanel
                            contact={application.contact}
                            contactsSearchUrl={contactsSearchUrl}
                            linkUrl={route('visa.link-contact', application.id)}
                            unlinkUrl={route('visa.unlink-contact', application.id)}
                            canLink={canWrite}
                        />
                    </PanelSection>
                    <RelatedTransactionsPanel transactions={relatedTransactions} />

                    <PanelMeta>
                        <PanelMetaItem label="Created by" value={application.created_by?.name} />
                    </PanelMeta>
                </PanelCol>

                {/* RIGHT — embassy tracking + workflow */}
                <PanelColRight>
                    <PanelSection title="Embassy Payment Tracking">
                        <PanelField
                            label="Payment Due Date (Embassy)"
                            value={application.payment_due_date
                                ? <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>{fmtDate(application.payment_due_date)}</span>
                                : null}
                        />
                        <PanelField
                            label="Payment Request"
                            value={application.payment_request_sent
                                ? <span style={{ color: 'var(--color-success)' }}>Sent {fmtDate(application.payment_request_sent_at)}</span>
                                : 'Not sent'}
                        />
                        <PanelField label="OR Number"   value={application.or_number} mono />
                        <PanelField label="OR Received" value={fmtDate(application.or_received_at)} />
                        <PanelField
                            label="OR Endorsed"
                            value={application.or_endorsed_at
                                ? <span style={{ color: 'var(--color-success)' }}>
                                    {fmtDate(application.or_endorsed_at)}
                                    {application.or_endorsed_by?.name ? ` by ${application.or_endorsed_by.name}` : ''}
                                  </span>
                                : 'Not yet endorsed'}
                        />
                    </PanelSection>

                    {/* ── Update Status ────────────────────────────────── */}
                    {canWrite && (
                        <>
                            <PanelDivider />
                            <PanelActions>
                                <Select
                                    label="Update Status"
                                    value={statusForm.data.status}
                                    onChange={changeStatus}
                                    options={statusOptions}
                                />
                            </PanelActions>
                        </>
                    )}

                    {/* ── Notes (inline autosave) ──────────────────────── */}
                    {canWrite && (
                        <>
                            <PanelDivider />
                            <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span className="font-body font-semibold" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)' }}>
                                        Notes
                                    </span>
                                    {notesSaved === 'saving' && <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', opacity: 0.6 }}>Saving…</span>}
                                    {notesSaved === 'saved'  && <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}>Saved ✓</span>}
                                </div>
                                <textarea
                                    key={application.id}
                                    defaultValue={application.notes ?? ''}
                                    onChange={handleNotesChange}
                                    placeholder="Add a note…"
                                    rows={4}
                                    style={{
                                        width        : '100%',
                                        resize       : 'vertical',
                                        background   : 'var(--color-surface-raised)',
                                        border       : '1px solid var(--color-border)',
                                        borderRadius : 'var(--radius-md)',
                                        padding      : 'var(--space-2)',
                                        fontSize     : 'var(--font-size-small)',
                                        color        : 'var(--color-text)',
                                        fontFamily   : 'inherit',
                                        lineHeight   : 1.6,
                                        outline      : 'none',
                                        boxSizing    : 'border-box',
                                    }}
                                />
                            </div>
                        </>
                    )}
                    {!canWrite && application.notes && (
                        <>
                            <PanelDivider />
                            <div
                                className="font-body"
                                style={{
                                    background  : 'rgba(245,158,11,0.08)',
                                    borderRadius: 'var(--radius-md)',
                                    padding     : 'var(--space-2)',
                                    fontSize    : 'var(--font-size-small)',
                                    color       : 'var(--color-text)',
                                    borderLeft  : '3px solid var(--color-warning)',
                                    whiteSpace  : 'pre-wrap',
                                }}
                            >
                                {application.notes}
                            </div>
                        </>
                    )}

                    <PanelDivider />
                    <PanelSection title="Workflow">
                        <ApprovalStepper fmtDt={fmtDate} steps={[
                            {
                                label : 'Payment Request Sent',
                                done  : !!application.payment_request_sent,
                                person: null,
                                at    : application.payment_request_sent_at,
                                action: canWrite && !application.payment_request_sent && application.payment_due_date
                                    ? <Button variant="primary" size="sm" icon={Send} loading={sendingRequest} onClick={sendPaymentRequest}>Send Payment Request</Button>
                                    : null,
                            },
                            {
                                label : 'OR Received',
                                done  : !!application.or_number,
                                person: null,
                                at    : application.or_received_at,
                                action: canWrite && application.payment_request_sent && !application.or_number
                                    ? <Button variant="primary" size="sm" icon={Hash} onClick={() => setOrModal(true)}>Record OR Number</Button>
                                    : null,
                            },
                            {
                                label : 'OR Endorsed',
                                done  : !!application.or_endorsed_at,
                                person: application.or_endorsed_by?.name,
                                at    : application.or_endorsed_at,
                                action: canEndorse && application.or_number && !application.or_endorsed_at
                                    ? <Button variant="primary" size="sm" icon={FileCheck} loading={endorsing} onClick={endorseOr}>Endorse OR to Disbursement</Button>
                                    : null,
                            },
                        ]} />
                    </PanelSection>
                </PanelColRight>
            </PanelColumns>

            {/* Payment Breakdown — collected from client (SP), per bank */}
            <PanelFullRow title="Payment Breakdown (Collected from Client)">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                    <PanelField label="Cash"      value={<CurrencyDisplay amount={application.payment_cash}      currency="PHP" />} />
                    <PanelField label="BDO"       value={<CurrencyDisplay amount={application.payment_bdo}       currency="PHP" />} />
                    <PanelField label="BPI"       value={<CurrencyDisplay amount={application.payment_bpi}       currency="PHP" />} />
                    <PanelField label="Metrobank" value={<CurrencyDisplay amount={application.payment_metrobank} currency="PHP" />} />
                    <PanelField label="Card"      value={<CurrencyDisplay amount={application.payment_card}      currency="PHP" />} />
                    <PanelField label="Check"     value={<CurrencyDisplay amount={application.payment_check}     currency="PHP" />} />
                </div>
                <div style={{ marginTop: 'var(--space-1)' }}>
                    <PanelField
                        label="Total Collected"
                        highlight
                        value={<CurrencyDisplay
                            amount={
                                (parseFloat(application.payment_cash) || 0)
                                + (parseFloat(application.payment_bdo) || 0)
                                + (parseFloat(application.payment_bpi) || 0)
                                + (parseFloat(application.payment_metrobank) || 0)
                                + (parseFloat(application.payment_card) || 0)
                                + (parseFloat(application.payment_check) || 0)
                            }
                            currency="PHP"
                        />}
                    />
                </div>
            </PanelFullRow>

            {/* Payable Breakdown — paid out to embassy/operator (NP) */}
            <PanelFullRow title="Payable to Embassy / Operator (NP)">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                    <PanelField label="Cash (PHP)"   value={<CurrencyDisplay amount={application.payable_cash}         currency="PHP" />} />
                    <PanelField label="Cash (USD)"   value={<CurrencyDisplay amount={application.payable_cash_usd}     currency="USD" />} />
                    <PanelField label="Bank Deposit" value={<CurrencyDisplay amount={application.payable_bank_deposit} currency="PHP" />} />
                    <PanelField label="Credit Card"  value={<CurrencyDisplay amount={application.payable_credit_card}  currency="PHP" />} />
                </div>
            </PanelFullRow>

            {/* Disbursement & OR logistics tracking */}
            <PanelFullRow title="Disbursement & OR Tracking">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                    <PanelField label="CV #"               value={application.cv_number} mono />
                    <PanelField label="Date Requested"     value={fmtDate(application.date_requested)} />
                    <PanelField label="Courier"            value={application.courier_name} />
                    <PanelField label="Date Received (OR)" value={fmtDate(application.date_received)} />
                    <PanelField label="Date Filed (Embassy)" value={fmtDate(application.date_filed)} />
                </div>
            </PanelFullRow>

            {/* Modals */}

            <Modal open={orModal} onClose={() => setOrModal(false)} title="Record OR Number">
                <form onSubmit={submitOr} className="flex flex-col gap-[var(--space-2)]">
                    <Input label="Official Receipt Number" required placeholder="Enter OR number from embassy"
                        value={orForm.data.or_number}
                        onChange={(e) => orForm.setData('or_number', e.target.value)}
                        error={orForm.errors.or_number}
                    />
                    <div className="flex justify-end gap-2">
                        <ModalCancelButton type="button" onClick={() => setOrModal(false)} />
                        <Button variant="primary" type="submit" loading={orForm.processing}>Record OR</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={deleteDialog}
                title="Remove Application"
                message={`Remove the application for ${application.customer_name}? This can be undone by an admin.`}
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog(false)}
            />
        </>
    );


    return content;
}

export default function VisaShow({ application, statuses, paymentModes, canWrite, canEndorse, contactsSearchUrl, relatedTransactions }) {
    const { url } = usePage();
    const isPanel = url?.includes('panel=1');

    if (isPanel) {
        return (
            <DetailPanel
                open
                onClose={() => router.visit(route('visa.index'), { preserveState: false })}
                title={application.customer_name}
                subtitle={application.visa_type}
                badges={
                <Badge variant={STATUS_VARIANT[application.status] ?? 'neutral'}>
                {statuses[application.status] ?? application.status}
                </Badge>
                }
            >
                <VisaContent application={application} statuses={statuses} paymentModes={paymentModes} canWrite={canWrite} canEndorse={canEndorse} contactsSearchUrl={contactsSearchUrl} relatedTransactions={relatedTransactions} />
            </DetailPanel>
        );
    }

    return <AppShell><VisaContent application={application} statuses={statuses} paymentModes={paymentModes} canWrite={canWrite} canEndorse={canEndorse} contactsSearchUrl={contactsSearchUrl} relatedTransactions={relatedTransactions} /></AppShell>;
}
