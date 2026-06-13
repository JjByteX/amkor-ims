import { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    Send, FileCheck, ClipboardCheck,
    AlertCircle, CheckCircle2, Clock, Hash, Trash2,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, {PanelActions, PanelCol, PanelColRight, PanelColumns, PanelDivider, PanelField, PanelFieldRow, PanelMeta, PanelMetaItem, PanelSection} from '../../Components/Shared/DetailPanel';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Input from '../../Components/UI/Input';
import Textarea from '../../Components/UI/Textarea';
import Select from '../../Components/UI/Select';
import Modal from '../../Components/UI/Modal';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';
import ContactLinkPanel from '../../Components/Shared/ContactLinkPanel';
import RelatedTransactionsPanel from '../../Components/Shared/RelatedTransactionsPanel';

const STATUS_VARIANT = {
    pending   : 'warning',
    on_process: 'info',
    completed : 'success',
    approved  : 'success',
    denied    : 'error',
    forfeited : 'error',
    refunded  : 'neutral',
};

function StepRow({ done, label }) {
    return (
        <div className="flex items-center gap-2 font-body" style={{ fontSize: 'var(--font-size-small)' }}>
            {done
                ? <CheckCircle2 size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                : <Clock size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
            <span style={{ color: done ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{label}</span>
        </div>
    );
}

export function VisaContent({ application, statuses, paymentModes, canWrite, canEndorse, contactsSearchUrl, relatedTransactions }) {

    const { url } = usePage();
    const isPanel = url?.includes('panel=1');

    const [statusModal,  setStatusModal ] = useState(false);
    const [notesModal,   setNotesModal  ] = useState(false);
    const [orModal,      setOrModal     ] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleting,     setDeleting    ] = useState(false);

    const statusForm = useForm({ status: application.status });
    function submitStatus(e) {
        e.preventDefault();
        statusForm.post(route('visa.update-status', application.id), { onSuccess: () => setStatusModal(false) });
    }

    const notesForm = useForm({ notes: application.notes ?? '' });
    function submitNotes(e) {
        e.preventDefault();
        notesForm.post(route('visa.update-notes', application.id), { onSuccess: () => setNotesModal(false) });
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
                        <PanelField label="Agency"              value={application.agency} />
                        <PanelField label="Visa / Service Type" value={application.visa_type} />
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

                    {application.notes && (
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

                    {canWrite && (
                        <>
                            <PanelDivider />
                            <PanelActions>
                                <Button variant="secondary" icon={ClipboardCheck} onClick={() => setStatusModal(true)} style={{ width: '100%' }}>
                                    Update Status
                                </Button>
                                <Button variant="secondary" icon={AlertCircle} onClick={() => setNotesModal(true)} style={{ width: '100%' }}>
                                    {application.notes ? 'Edit Note' : 'Add Note'}
                                </Button>
                                {!application.payment_request_sent && application.payment_due_date && (
                                    <Button variant="primary" icon={Send} loading={sendingRequest} onClick={sendPaymentRequest} style={{ width: '100%' }}>
                                        Send Payment Request
                                    </Button>
                                )}
                                {application.payment_request_sent && !application.or_number && (
                                    <Button variant="secondary" icon={Hash} onClick={() => setOrModal(true)} style={{ width: '100%' }}>
                                        Record OR Number
                                    </Button>
                                )}
                                {canEndorse && (
                                    <Button variant="primary" icon={FileCheck} loading={endorsing} onClick={endorseOr} style={{ width: '100%' }}>
                                        Endorse OR to Disbursement
                                    </Button>
                                )}
                                <Button variant="danger" icon={Trash2} onClick={() => setDeleteDialog(true)} style={{ width: '100%' }}>
                                    Remove Application
                                </Button>
                            </PanelActions>
                        </>
                    )}

                    <PanelDivider />
                    <PanelSection>
                        <StepRow done={!!application.payment_request_sent} label="Payment request sent" />
                        <StepRow done={!!application.or_number}            label="OR received" />
                        <StepRow done={!!application.or_endorsed_at}       label="OR endorsed to Disbursement" />
                    </PanelSection>
                </PanelColRight>
            </PanelColumns>

            {/* Modals */}
            <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Status">
                <form onSubmit={submitStatus} className="flex flex-col gap-[var(--space-2)]">
                    <Select label="New Status" options={statusOptions}
                        value={statusForm.data.status}
                        onChange={(e) => statusForm.setData('status', e.target.value)}
                        error={statusForm.errors.status}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={() => setStatusModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={statusForm.processing}>Save</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={notesModal} onClose={() => setNotesModal(false)} title="Notes">
                <form onSubmit={submitNotes} className="flex flex-col gap-[var(--space-2)]">
                    <Textarea label="Notes" rows={5}
                        value={notesForm.data.notes}
                        onChange={(e) => notesForm.setData('notes', e.target.value)}
                        error={notesForm.errors.notes}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={() => setNotesModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={notesForm.processing}>Save Notes</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={orModal} onClose={() => setOrModal(false)} title="Record OR Number">
                <form onSubmit={submitOr} className="flex flex-col gap-[var(--space-2)]">
                    <Input label="Official Receipt Number *" placeholder="Enter OR number from embassy"
                        value={orForm.data.or_number}
                        onChange={(e) => orForm.setData('or_number', e.target.value)}
                        error={orForm.errors.or_number}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={() => setOrModal(false)}>Cancel</Button>
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
