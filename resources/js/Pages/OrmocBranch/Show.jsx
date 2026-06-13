import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { Trash2, AlertTriangle, CheckCircle, Send, ExternalLink, ArrowUpRight, Lock, Pencil } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, {
    PanelColumns, PanelCol, PanelColRight,
    PanelSection, PanelField, PanelFieldRow,
    PanelDivider, PanelMeta, PanelMetaItem, PanelActions,
} from '../../Components/Shared/DetailPanel';
import Badge from '../../Components/UI/Badge';
import Button from '../../Components/UI/Button';
import Modal from '../../Components/UI/Modal';
import Textarea from '../../Components/UI/Textarea';
import Select from '../../Components/UI/Select';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';
import ContactLinkPanel from '../../Components/Shared/ContactLinkPanel';
import RelatedTransactionsPanel from '../../Components/Shared/RelatedTransactionsPanel';

const STATUS_VARIANT = { inquiry: 'info', quoted: 'warning', confirmed: 'success', cancelled: 'error' };
const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : null;
const fmtDt = (d) => d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;

export function OrmocContent({ booking, statuses, bookingTypes, paymentModes, canWrite, contactsSearchUrl, relatedTransactions }) {
    const [notesModal,   setNotesModal  ] = useState(false);
    const [statusModal,  setStatusModal ] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleting,     setDeleting    ] = useState(false);
    const notesForm  = useForm({ notes: booking.notes ?? '' });
    const statusForm = useForm({ status: booking.status });
    const statusOptions = Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }));
    function handleDelete() { setDeleting(true); router.delete(route('ormoc.destroy', booking.id), { onFinish: () => setDeleting(false) }); }
    return (<>
        {booking.forwarded_to_accounting && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-info)', color: '#fff', fontSize: 'var(--font-size-small)', marginBottom: 'var(--space-2)' }}>
                <Lock size={14} /> Locked — forwarded to Accounting {fmtDt(booking.forwarded_to_accounting_at)}
            </div>
        )}
        {booking.passport_expiry_flagged && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-warning)', color: '#fff', fontSize: 'var(--font-size-small)', marginBottom: 'var(--space-2)' }}>
                <AlertTriangle size={14} /> Passport expires within 6 months of travel — advise client.
            </div>
        )}
        <PanelColumns>
            <PanelCol>
                <PanelSection title="Booking Details">
                    <PanelFieldRow>
                        <PanelField label="Date"   value={fmt(booking.date)} />
                        <PanelField label="Agent"  value={booking.agent_code} highlight />
                    </PanelFieldRow>
                    <PanelField label="Destination" value={booking.destination} />
                    <PanelFieldRow>
                        <PanelField label="Travel Date" value={fmt(booking.travel_date)} />
                        <PanelField label="Pax Count"   value={booking.pax_count} />
                    </PanelFieldRow>
                    <PanelFieldRow>
                        <PanelField label="Contact Number" value={booking.contact_number} />
                        <PanelField label="Email"          value={booking.email} />
                    </PanelFieldRow>
                    <PanelFieldRow>
                        <PanelField label="Hotel"     value={booking.hotel} />
                        <PanelField label="Room Type" value={booking.room_type} />
                    </PanelFieldRow>
                    {booking.remarks && <PanelField label="Remarks" value={booking.remarks} />}
                </PanelSection>
                <PanelDivider />
                <PanelSection title="References">
                    <PanelFieldRow>
                        <PanelField label="PO #" value={booking.po_number} mono />
                        <PanelField label="SI #" value={booking.si_number} mono />
                    </PanelFieldRow>
                    <PanelFieldRow>
                        <PanelField label="OR #" value={booking.or_number} mono />
                        <PanelField label="AR #" value={booking.ar_number} mono />
                    </PanelFieldRow>
                    <PanelField label="SOA #" value={booking.soa_number} mono />
                </PanelSection>
                <PanelMeta>
                    <PanelMetaItem label="Created by"   value={booking.created_by?.name} />
                    <PanelMetaItem label="Last updated" value={fmtDt(booking.updated_at)} />
                </PanelMeta>
            </PanelCol>
            <PanelColRight>
                <PanelSection title="Financials">
                    <PanelFieldRow>
                        <PanelField label="Selling Price" value={<CurrencyDisplay amount={booking.selling_price ?? 0} currency="PHP" />} highlight />
                        <PanelField label="Net Payable"   value={<CurrencyDisplay amount={booking.net_payable   ?? 0} currency="PHP" />} />
                    </PanelFieldRow>
                    <PanelField label="Income" value={<CurrencyDisplay amount={booking.income ?? 0} currency="PHP" />} />
                    <PanelField label="Payment Mode"    value={paymentModes[booking.mode_of_payment] ?? booking.mode_of_payment} />
                    <PanelField label="Date of Payment" value={fmt(booking.date_of_payment)} />
                </PanelSection>
                <PanelDivider />
                <PanelSection title="Contact Link">
                    <ContactLinkPanel
                        contact={booking.contact}
                        contactsSearchUrl={contactsSearchUrl}
                        linkUrl={route('ormoc.link-contact', booking.id)}
                        unlinkUrl={route('ormoc.unlink-contact', booking.id)}
                        canLink={canWrite}
                    />
                </PanelSection>
                <RelatedTransactionsPanel transactions={relatedTransactions} />
                {booking.notes && (<>
                    <PanelDivider />
                    <PanelSection title="Notes">
                        <p style={{ fontSize: 'var(--font-size-small)', margin: 0, whiteSpace: 'pre-wrap' }}>{booking.notes}</p>
                    </PanelSection>
                </>)}
                {canWrite && !booking.forwarded_to_accounting && (<>
                    <PanelDivider />
                    <PanelSection title="Actions">
                        <PanelActions>
                            <Button variant="secondary" size="sm" onClick={() => setStatusModal(true)} style={{ width: '100%' }}>Change Status</Button>
                            <Button variant="ghost"     size="sm" onClick={() => setNotesModal(true)}  style={{ width: '100%' }}>{booking.notes ? 'Edit Notes' : 'Add Notes'}</Button>
                            {!booking.escalated_to_head_office
                                ? <Button variant="secondary" size="sm" icon={ArrowUpRight} onClick={() => router.post(route('ormoc.escalate', booking.id))} style={{ width: '100%' }}>Escalate to Head Office</Button>
                                : <Badge variant="success">Escalated {fmtDt(booking.escalated_at)}</Badge>}
                            {!booking.po_sent_to_mariposa
                                ? <Button variant="secondary" size="sm" icon={ExternalLink} onClick={() => router.post(route('ormoc.mariposa', booking.id))} style={{ width: '100%' }}>Mark PO Sent to Mariposa</Button>
                                : <Badge variant="neutral">PO Sent to Mariposa</Badge>}
                            <Button variant="primary" size="sm" icon={Send} onClick={() => router.post(route('ormoc.forward-accounting', booking.id))} style={{ width: '100%' }}>Forward to Accounting</Button>
                            <PanelDivider />
                            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteDialog(true)} style={{ width: '100%' }}>Remove Booking</Button>
                        </PanelActions>
                    </PanelSection>
                </>)}
            </PanelColRight>
        </PanelColumns>
        <Modal open={notesModal} onClose={() => setNotesModal(false)} title="Notes"
            footer={<><Button variant="ghost" onClick={() => setNotesModal(false)}>Cancel</Button><Button variant="primary" loading={notesForm.processing} onClick={() => notesForm.post(route('ormoc.update-notes', booking.id), { onSuccess: () => setNotesModal(false) })}>Save</Button></>}>
            <Textarea label="Notes" rows={5} value={notesForm.data.notes} onChange={(e) => notesForm.setData('notes', e.target.value)} />
        </Modal>
        <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Change Status"
            footer={<><Button variant="ghost" onClick={() => setStatusModal(false)}>Cancel</Button><Button variant="primary" loading={statusForm.processing} onClick={() => statusForm.post(route('ormoc.update-status', booking.id), { onSuccess: () => setStatusModal(false) })}>Update</Button></>}>
            <Select label="Status" options={statusOptions} value={statusForm.data.status} onChange={(e) => statusForm.setData('status', e.target.value)} />
        </Modal>
        <ConfirmDialog open={deleteDialog} title="Remove Booking" message={`Remove "${booking.client_name}"?`} confirmLabel="Remove" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteDialog(false)} />
    </>);
}

export default function OrmocBranchShow({ booking, statuses, bookingTypes, paymentModes, canWrite, contactsSearchUrl, relatedTransactions }) {
    const { url } = usePage();
    const isPanel = url?.includes('panel=1');
    if (isPanel) {
        return (
            <DetailPanel open onClose={() => router.visit(route('ormoc.index'), { preserveState: false })}
                title={booking.client_name}
                badges={<>
                    <Badge variant={STATUS_VARIANT[booking.status] ?? 'neutral'}>{statuses[booking.status] ?? booking.status}</Badge>
                    <Badge variant="neutral">{bookingTypes[booking.booking_type] ?? booking.booking_type}</Badge>
                </>}
            >
                <OrmocContent booking={booking} statuses={statuses} bookingTypes={bookingTypes} paymentModes={paymentModes} canWrite={canWrite} contactsSearchUrl={contactsSearchUrl} relatedTransactions={relatedTransactions} />
            </DetailPanel>
        );
    }
    return <AppShell><OrmocContent booking={booking} statuses={statuses} bookingTypes={bookingTypes} paymentModes={paymentModes} canWrite={canWrite} contactsSearchUrl={contactsSearchUrl} relatedTransactions={relatedTransactions} /></AppShell>;
}
