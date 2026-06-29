import { useState, useRef, useCallback } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import {
    Trash2, AlertTriangle, CheckCircle, Send,
    ExternalLink, ArrowUpRight, Lock, Link,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, {
    PanelColumns, PanelCol, PanelColRight,
    PanelSection, PanelField, PanelFieldRow,
    PanelDivider, PanelMeta, PanelMetaItem, PanelActions,
} from '../../Components/Shared/DetailPanel';
import Badge from '../../Components/UI/Badge';
import Button from '../../Components/UI/Button';
import Modal, { ModalCancelButton } from '../../Components/UI/Modal';
import Select from '../../Components/UI/Select';
import Input from '../../Components/UI/Input';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';
import ContactLinkPanel from '../../Components/Shared/ContactLinkPanel';
import RelatedTransactionsPanel from '../../Components/Shared/RelatedTransactionsPanel';
import ApprovalStepper from '../../Components/Shared/ApprovalStepper';

const STATUS_VARIANT = { inquiry: 'neutral', quoted: 'info', confirmed: 'success', cancelled: 'error' };
const money   = (v, cur = 'PHP') => new Intl.NumberFormat('en-PH', { style: 'currency', currency: cur }).format(Number(v ?? 0));
const fmt     = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
const fmtDt   = (d) => d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;

/**
 * BookingContent — unified detail panel body for ALL branches (QC and Ormoc).
 *
 * Ormoc-specific sections (passport warning, escalation, CC surcharge,
 * booking type, hotel/room, date of payment, notes, Mariposa PO) are gated
 * on `isOrmocBranch` so QC users never see them.
 *
 * The `canAcknowledge` prop gates the QC-side escalation acknowledgment action
 * (only sales_ticketing_officer and president see it).
 */
export function BookingContent({
    booking,
    statuses,
    serviceTypes,
    bookingTypes,
    transactionTypes,
    paymentModes,
    canWrite,
    canAcknowledge,
    contactsSearchUrl,
    relatedTransactions,
    isOrmocBranch,
}) {
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleting,     setDeleting    ] = useState(false);
    const [ackModal,     setAckModal    ] = useState(false);

    // ── Inline autosave notes (Ormoc) ─────────────────────────────────────────
    // Uncontrolled textarea with key={booking.id} so it resets from the prop
    // on every mount — avoids fighting Inertia's stale prop cache.
    const [notesSaved, setNotesSaved] = useState(null); // null | 'saving' | 'saved'
    const notesTimer  = useRef(null);

    const saveNotes = useCallback((value) => {
        router.post(route('reservation.update-notes', booking.id), { notes: value }, {
            preserveScroll: true,
            onSuccess: () => setNotesSaved('saved'),
            onError:   () => setNotesSaved(null),
        });
    }, [booking.id]);

    function handleNotesChange(e) {
        const value = e.target.value;
        setNotesSaved('saving');
        clearTimeout(notesTimer.current);
        notesTimer.current = setTimeout(() => saveNotes(value), 600);
    }

    const statusForm = useForm({ status: booking.status });
    const ackForm    = useForm({ linked_resa_booking_id: booking.linked_resa_booking_id ?? '' });

    function changeStatus(e) {
        router.post(route('reservation.status', booking.id), { status: e.target.value }, { preserveScroll: true });
    }

    function handleDelete() {
        setDeleting(true);
        router.delete(route('reservation.destroy', booking.id), { onFinish: () => setDeleting(false) });
    }

    // Ormoc: booking is from the Ormoc branch regardless of who's viewing it
    // (e.g. a QC sales_ticketing_officer viewing an escalated Ormoc booking).
    const bookingIsOrmoc = booking.branch?.code === 'ORMOC';

    return (
        <>
            {/* ── Alerts ────────────────────────────────────────────────── */}
            {booking.forwarded_to_accounting && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-info)', color: '#fff', fontSize: 'var(--font-size-small)', marginBottom: 'var(--space-2)' }}>
                    <Lock size={14} /> Locked — forwarded to Accounting {fmtDt(booking.forwarded_to_accounting_at)}
                </div>
            )}
            {bookingIsOrmoc && booking.passport_expiry_flagged && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-warning)', color: '#fff', fontSize: 'var(--font-size-small)', marginBottom: 'var(--space-2)' }}>
                    <AlertTriangle size={14} /> Passport expires within 6 months of travel — advise client.
                </div>
            )}

            <PanelColumns>
                {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
                <PanelCol>
                    <PanelSection title="Booking Details">
                        <PanelFieldRow>
                            <PanelField label="Date"   value={fmt(booking.date)} />
                            <PanelField label="Branch" value={booking.branch?.name} />
                        </PanelFieldRow>
                        <PanelFieldRow>
                            <PanelField label="Agent Code" value={booking.agent_code} highlight />
                            {/* Ormoc: show booking type; QC: show service type */}
                            {bookingIsOrmoc
                                ? <PanelField label="Booking Type" value={bookingTypes?.[booking.booking_type] ?? booking.booking_type} />
                                : <PanelField label="Service"      value={serviceTypes?.[booking.service_type] ?? booking.service_type} />
                            }
                        </PanelFieldRow>
                        {!bookingIsOrmoc && (
                            <PanelFieldRow>
                                <PanelField label="Transaction Type" value={transactionTypes?.[booking.transaction_type] ?? booking.transaction_type} />
                                <PanelField label="Source"           value={booking.source} />
                            </PanelFieldRow>
                        )}
                        <PanelField label="Destination" value={booking.destination} />
                        <PanelField label="Airline"     value={booking.airline} />
                        {/* Ormoc: hotel + room */}
                        {bookingIsOrmoc && (booking.hotel || booking.room_type) && (
                            <PanelFieldRow>
                                <PanelField label="Hotel"     value={booking.hotel} />
                                <PanelField label="Room Type" value={booking.room_type} />
                            </PanelFieldRow>
                        )}
                        <PanelFieldRow>
                            <PanelField label="Travel Date" value={fmt(booking.travel_date)} />
                            {!bookingIsOrmoc
                                ? <PanelField label="Return Date" value={fmt(booking.return_date)} />
                                : <PanelField label="Pax Count"   value={booking.pax_count} />
                            }
                        </PanelFieldRow>
                        {!bookingIsOrmoc && (
                            <PanelFieldRow>
                                <PanelField label="Pax Count"         value={booking.pax_count} />
                                <PanelField label="Corporate Account" value={booking.corporate_account} />
                            </PanelFieldRow>
                        )}
                    </PanelSection>

                    <PanelDivider />

                    {/* ── Client Info ───────────────────────────────────── */}
                    <PanelSection title="Client Info">
                        <PanelField label="Client Name" value={booking.client_name} />
                        <PanelFieldRow>
                            <PanelField label="Date of Birth"  value={fmt(booking.date_of_birth)} />
                            <PanelField label="Contact Number" value={booking.contact_number} />
                        </PanelFieldRow>
                        <PanelField label="Email" value={booking.email} />
                        {/* Ormoc: passport expiry */}
                        {bookingIsOrmoc && booking.passport_expiry && (
                            <PanelField
                                label="Passport Expiry"
                                value={
                                    <span style={{ color: booking.passport_expiry_flagged ? 'var(--color-warning)' : undefined }}>
                                        {fmt(booking.passport_expiry)}
                                        {booking.passport_expiry_flagged && ' ⚠'}
                                    </span>
                                }
                            />
                        )}
                    </PanelSection>

                    <PanelDivider />

                    {/* ── Document References ───────────────────────────── */}
                    <PanelSection title="Document References">
                        <PanelFieldRow>
                            <PanelField label="SOA #" value={booking.soa_number} mono />
                            <PanelField label="PO #"  value={booking.po_number}  mono />
                        </PanelFieldRow>
                        <PanelFieldRow>
                            <PanelField label="SI #" value={booking.si_number} mono />
                            <PanelField label="AR #" value={booking.ar_number} mono />
                        </PanelFieldRow>
                        <PanelFieldRow>
                            <PanelField label="ACR"  value={booking.acr}       mono />
                            <PanelField label="OR #" value={booking.or_number} mono />
                        </PanelFieldRow>
                    </PanelSection>

                    <PanelMeta>
                        <PanelMetaItem label="Booking #"    value={booking.booking_no} />
                        <PanelMetaItem label="Created by"   value={booking.created_by?.name} />
                        <PanelMetaItem label="Last updated" value={fmtDt(booking.updated_at)} />
                    </PanelMeta>
                </PanelCol>

                {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
                <PanelColRight>
                    {/* ── Financials ────────────────────────────────────── */}
                    <PanelSection title={
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            Financials
                            {booking.currency && booking.currency !== 'PHP' && (
                                <Badge variant="info">{booking.currency}</Badge>
                            )}
                        </span>
                    }>
                        <PanelField label="Selling Price" value={<CurrencyDisplay amount={booking.selling_price ?? 0} currency={booking.currency ?? 'PHP'} />} highlight />
                        <PanelFieldRow>
                            <PanelField label="Net Payable" value={<CurrencyDisplay amount={booking.net_payable ?? 0} currency={booking.currency ?? 'PHP'} />} />
                            <PanelField label="Income"      value={<CurrencyDisplay amount={booking.income      ?? 0} currency={booking.currency ?? 'PHP'} />} />
                        </PanelFieldRow>
                        {!bookingIsOrmoc && (
                            <PanelFieldRow>
                                <PanelField label="Excess"           value={booking.excess        != null ? money(booking.excess,        booking.currency ?? 'PHP') : null} />
                                <PanelField label="Insurance (Nett)" value={booking.insurance_nett != null ? money(booking.insurance_nett, booking.currency ?? 'PHP') : null} />
                            </PanelFieldRow>
                        )}
                        <PanelDivider />
                        <PanelField label="Payment Mode" value={paymentModes?.[booking.mode_of_payment] ?? booking.mode_of_payment} />
                        {/* Ormoc uses date_of_payment; QC uses payment_due_date */}
                        {bookingIsOrmoc
                            ? <>
                                <PanelField label="Date of Payment" value={fmt(booking.date_of_payment)} />
                                {booking.cc_surcharge_applied && (
                                    <PanelField
                                        label="CC Surcharge"
                                        value={<Badge variant="warning">5% surcharge applied</Badge>}
                                    />
                                )}
                              </>
                            : <PanelField label="Payment Due" value={fmt(booking.payment_due_date)} />
                        }
                    </PanelSection>

                    <PanelDivider />

                    {/* ── Booking Lifecycle ────────────────────────────── */}
                    <PanelSection title="Booking Progress">
                        {canWrite && !booking.forwarded_to_accounting && (
                            <div style={{ marginBottom: 'var(--space-2)' }}>
                                <Select
                                    label="Update Status"
                                    value={statusForm.data.status}
                                    onChange={changeStatus}
                                    options={Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }))}
                                />
                            </div>
                        )}
                        <ApprovalStepper fmtDt={fmtDt} steps={[
                            {
                                label : 'Inquiry',
                                done  : true,
                                person: booking.created_by?.name,
                                at    : booking.created_at,
                            },
                            {
                                label : 'Quoted',
                                done  : ['quoted', 'confirmed'].includes(booking.status),
                                person: null,
                                at    : null,
                            },
                            {
                                label : 'Confirmed',
                                done  : booking.status === 'confirmed',
                                person: null,
                                at    : null,
                            },
                            {
                                label : 'Forwarded to Accounting',
                                done  : !!booking.forwarded_to_accounting,
                                person: null,
                                at    : booking.forwarded_to_accounting_at,
                                action: canWrite && booking.status === 'confirmed' && !booking.forwarded_to_accounting
                                    ? <Button
                                        variant="primary"
                                        size="sm"
                                        icon={Send}
                                        onClick={() => router.post(route('reservation.forward-accounting', booking.id), {}, { preserveScroll: true })}
                                      >
                                        Forward to Accounting
                                      </Button>
                                    : null,
                            },
                        ]} />
                    </PanelSection>

                    <PanelDivider />

                    {/* ── Contact Link ──────────────────────────────────── */}
                    <PanelSection title="Contact Link">
                        <ContactLinkPanel
                            contact={booking.contact}
                            contactsSearchUrl={contactsSearchUrl}
                            linkUrl={route('reservation.link-contact', booking.id)}
                            unlinkUrl={route('reservation.unlink-contact', booking.id)}
                            canLink={canWrite}
                        />
                    </PanelSection>

                    <RelatedTransactionsPanel transactions={relatedTransactions} />

                    {/* ── Escalation (Ormoc bookings only) ─────────────── */}
                    {bookingIsOrmoc && booking.escalated_to_head_office && (
                        <>
                            <PanelDivider />
                            <PanelSection title="Escalation">
                                <PanelFieldRow>
                                    <PanelField label="Escalated" value={fmtDt(booking.escalated_at)} />
                                    <PanelField label="By"        value={booking.escalated_by?.name} />
                                </PanelFieldRow>
                                {booking.escalation_acknowledged_at ? (
                                    <>
                                        <PanelFieldRow>
                                            <PanelField label="Acknowledged" value={fmtDt(booking.escalation_acknowledged_at)} />
                                            <PanelField label="By"           value={booking.escalation_acknowledged_by?.name} />
                                        </PanelFieldRow>
                                        {booking.linked_resa_booking && (
                                            <PanelField
                                                label="RESA Booking"
                                                value={
                                                    <a
                                                        href={route('reservation.show', booking.linked_resa_booking.id)}
                                                        style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, fontSize: 'var(--font-size-small)' }}
                                                    >
                                                        {booking.linked_resa_booking.booking_no ?? `#${booking.linked_resa_booking.id}`} ↗
                                                    </a>
                                                }
                                            />
                                        )}
                                        {canAcknowledge && (
                                            <Button variant="ghost" size="sm" icon={Link} onClick={() => setAckModal(true)} style={{ width: '100%', marginTop: 'var(--space-1)' }}>
                                                {booking.linked_resa_booking ? 'Update RESA Link' : 'Link RESA Booking'}
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-warning)', fontWeight: 600 }}>
                                            Awaiting QC acknowledgment
                                        </div>
                                        {canAcknowledge && (
                                            <Button variant="primary" size="sm" icon={CheckCircle} onClick={() => setAckModal(true)} style={{ width: '100%' }}>
                                                Acknowledge Escalation
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </PanelSection>
                        </>
                    )}

                    {/* ── Mariposa PO status (Ormoc bookings only) ─────── */}
                    {bookingIsOrmoc && booking.po_sent_to_mariposa && (
                        <>
                            <PanelDivider />
                            <PanelSection title="Mariposa PO">
                                <PanelField label="PO Sent" value={fmtDt(booking.po_sent_to_mariposa_at)} />
                            </PanelSection>
                        </>
                    )}

                    {/* ── Notes & Coverage ──────────────────────────────── */}
                    {(booking.particulars || booking.remarks || booking.inclusions || booking.exclusions || booking.audit_remarks || booking.notes || canWrite) && (
                        <>
                            <PanelDivider />
                            <PanelSection title="Notes & Coverage">
                                {booking.particulars   && <PanelField label="Particulars"   value={booking.particulars} />}
                                {booking.inclusions    && <PanelField label="Inclusions"    value={booking.inclusions} />}
                                {booking.exclusions    && <PanelField label="Exclusions"    value={booking.exclusions} />}
                                {booking.remarks       && <PanelField label="Remarks"       value={booking.remarks} />}
                                {booking.audit_remarks && <PanelField label="Audit Remarks" value={booking.audit_remarks} />}
                                {/* Ormoc notes — inline autosave */}
                                {bookingIsOrmoc && canWrite && (
                                    <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span className="font-body font-semibold" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)' }}>Notes</span>
                                            {notesSaved === 'saving' && <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', opacity: 0.6 }}>Saving…</span>}
                                            {notesSaved === 'saved'  && <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}>Saved ✓</span>}
                                        </div>
                                        <textarea
                                            key={booking.id}
                                            defaultValue={booking.notes ?? ''}
                                            onChange={handleNotesChange}
                                            placeholder="Add a note…"
                                            rows={4}
                                            style={{
                                                width       : '100%',
                                                resize      : 'vertical',
                                                background  : 'var(--color-surface-raised)',
                                                border      : '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-md)',
                                                padding     : 'var(--space-2)',
                                                fontSize    : 'var(--font-size-small)',
                                                color       : 'var(--color-text)',
                                                fontFamily  : 'inherit',
                                                lineHeight  : 1.6,
                                                outline     : 'none',
                                                boxSizing   : 'border-box',
                                            }}
                                        />
                                    </div>
                                )}
                                {bookingIsOrmoc && !canWrite && booking.notes && (
                                    <PanelField label="Notes" value={<p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 'var(--font-size-small)' }}>{booking.notes}</p>} />
                                )}
                            </PanelSection>
                        </>
                    )}

                    {/* ── Ormoc-only actions ────────────────────────────── */}
                    {canWrite && !booking.forwarded_to_accounting && bookingIsOrmoc && (
                        <>
                            <PanelDivider />
                            <PanelActions>
                                {!booking.escalated_to_head_office && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        icon={ArrowUpRight}
                                        onClick={() => router.post(route('reservation.escalate', booking.id), {}, { preserveScroll: true })}
                                        style={{ width: '100%' }}
                                    >
                                        Escalate to Head Office
                                    </Button>
                                )}
                                {!booking.po_sent_to_mariposa ? (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        icon={ExternalLink}
                                        onClick={() => router.post(route('reservation.mariposa', booking.id), {}, { preserveScroll: true })}
                                        style={{ width: '100%' }}
                                    >
                                        Mark PO Sent to Mariposa
                                    </Button>
                                ) : (
                                    <Badge variant="neutral">PO Sent to Mariposa</Badge>
                                )}
                            </PanelActions>
                        </>
                    )}

                    {/* ── Remove Booking ────────────────────────────────── */}
                    {canWrite && (
                        <>
                            <PanelDivider />
                            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteDialog(true)} style={{ width: '100%' }}>
                                Remove Booking
                            </Button>
                        </>
                    )}
                </PanelColRight>
            </PanelColumns>

            {/* ── Acknowledge escalation modal ─────────────────────────────── */}
            <Modal
                open={ackModal}
                onClose={() => setAckModal(false)}
                title={booking.escalation_acknowledged_at ? 'Update RESA Link' : 'Acknowledge Escalation'}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                        <ModalCancelButton onClick={() => setAckModal(false)} />
                        <Button
                            variant="primary"
                            icon={CheckCircle}
                            loading={ackForm.processing}
                            onClick={() => ackForm.post(route('reservation.escalate-acknowledge', booking.id), { onSuccess: () => setAckModal(false) })}
                        >
                            {booking.escalation_acknowledged_at ? 'Update' : 'Acknowledge'}
                        </Button>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {!booking.escalation_acknowledged_at && (
                        <p className="font-body" style={{ margin: 0, fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                            Confirming that you have received this escalation from Ormoc Branch and will handle the international booking.
                        </p>
                    )}
                    <Input
                        label="RESA Booking ID (optional)"
                        type="number"
                        value={ackForm.data.linked_resa_booking_id}
                        onChange={(e) => ackForm.setData('linked_resa_booking_id', e.target.value)}
                        error={ackForm.errors.linked_resa_booking_id}
                        placeholder="Enter the Reservation booking ID you created"
                    />
                    <p className="font-body" style={{ margin: 0, fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>
                        Leave blank to acknowledge now and link the RESA booking later.
                    </p>
                </div>
            </Modal>

            {/* ── Delete confirm ───────────────────────────────────────────── */}
            <ConfirmDialog
                open={deleteDialog}
                title="Remove Booking"
                message={`Remove "${booking.client_name}"?`}
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog(false)}
            />
        </>
    );
}

export default function ReservationShow({
    booking,
    statuses,
    serviceTypes,
    bookingTypes,
    transactionTypes,
    paymentModes,
    canWrite,
    canAcknowledge,
    contactsSearchUrl,
    relatedTransactions,
}) {
    const { url } = usePage();
    const isPanel = url?.includes('panel=1');

    const isOrmocBranch = booking.branch?.code === 'ORMOC';

    const badges = (
        <>
            <Badge variant={STATUS_VARIANT[booking.status] ?? 'neutral'}>
                {statuses[booking.status] ?? booking.status}
            </Badge>
            {isOrmocBranch && booking.booking_type && (
                <Badge variant="neutral">{bookingTypes?.[booking.booking_type] ?? booking.booking_type}</Badge>
            )}
            {booking.forwarded_to_accounting && (
                <Badge variant="success">Forwarded to Accounting</Badge>
            )}
        </>
    );

    const content = (
        <BookingContent
            booking={booking}
            statuses={statuses}
            serviceTypes={serviceTypes}
            bookingTypes={bookingTypes}
            transactionTypes={transactionTypes}
            paymentModes={paymentModes}
            canWrite={canWrite}
            canAcknowledge={canAcknowledge}
            contactsSearchUrl={contactsSearchUrl}
            relatedTransactions={relatedTransactions}
            isOrmocBranch={isOrmocBranch}
        />
    );

    if (isPanel) {
        return (
            <DetailPanel
                open
                onClose={() => router.visit(route('reservation.index'), { preserveState: false })}
                title={booking.booking_no ?? booking.client_name}
                subtitle={booking.booking_no ? booking.client_name : undefined}
                badges={badges}
            >
                {content}
            </DetailPanel>
        );
    }

    return <AppShell>{content}</AppShell>;
}
