import { useState }  from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import {
    ArrowLeft, Pencil, Trash2, AlertTriangle, CreditCard,
    ArrowUpRight, Package, CheckCircle, Clock, Send,
    FileText, Lock, ExternalLink,
} from 'lucide-react';
import AppShell        from '../../Components/Layout/AppShell';
import PageHeader      from '../../Components/Shared/PageHeader';
import Card            from '../../Components/UI/Card';
import Button          from '../../Components/UI/Button';
import Badge           from '../../Components/UI/Badge';
import Modal           from '../../Components/UI/Modal';
import Textarea        from '../../Components/UI/Textarea';
import Select          from '../../Components/UI/Select';
import ConfirmDialog   from '../../Components/Shared/ConfirmDialog';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_VARIANT = {
    inquiry  : 'info',
    quoted   : 'warning',
    confirmed: 'success',
    cancelled: 'error',
};

function fmtDate(val) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(val) {
    if (!val) return '—';
    return new Date(val).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function DetailRow({ label, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="font-body" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.45 }}>
                {label}
            </span>
            <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                {children ?? '—'}
            </span>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrmocBranchShow({ booking, statuses, bookingTypes, paymentModes, canWrite }) {
    const { flash } = usePage().props;

    // Modals
    const [showNotesModal,    setShowNotesModal   ] = useState(false);
    const [showStatusModal,   setShowStatusModal  ] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting,          setDeleting         ] = useState(false);

    // Notes form
    const notesForm = useForm({ notes: booking.notes ?? '' });

    function saveNotes() {
        notesForm.post(route('ormoc.update-notes', booking.id), {
            onSuccess: () => setShowNotesModal(false),
        });
    }

    // Status form
    const statusForm = useForm({ status: booking.status });

    function saveStatus() {
        statusForm.post(route('ormoc.update-status', booking.id), {
            onSuccess: () => setShowStatusModal(false),
        });
    }

    // Workflow actions
    function escalate() {
        router.post(route('ormoc.escalate', booking.id));
    }

    function markPoToMariposa() {
        router.post(route('ormoc.mariposa', booking.id));
    }

    function forwardToAccounting() {
        router.post(route('ormoc.forward-accounting', booking.id));
    }

    function handleDelete() {
        setDeleting(true);
        router.delete(route('ormoc.destroy', booking.id), {
            onSuccess: () => router.get(route('ormoc.index')),
            onFinish : () => setDeleting(false),
        });
    }

    // Computed
    const ccSurcharge = booking.mode_of_payment === 'credit_card';
    const ccAmount    = ccSurcharge && booking.selling_price
        ? (parseFloat(booking.selling_price) * 0.05).toFixed(2)
        : null;

    const statusOptions = Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }));

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AppShell>
            <div className="flex flex-col gap-[var(--space-3)]" style={{ padding: 'var(--space-4)' }}>

                {/* Flash */}
                {flash?.message && (
                    <div
                        className="font-body"
                        style={{
                            padding     : 'var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            background  : flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                            color       : '#fff',
                            fontSize    : 'var(--font-size-small)',
                        }}
                    >
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title={booking.client_name}
                    subtitle={`Booking — ${booking.agent_code}`}
                    actions={
                        <div className="flex items-center gap-[var(--space-1)]">
                            <Button
                                variant="ghost"
                                icon={ArrowLeft}
                                onClick={() => router.get(route('ormoc.index'))}
                            >
                                Back
                            </Button>
                            {canWrite && !booking.forwarded_to_accounting && (
                                <Button
                                    variant="secondary"
                                    icon={Pencil}
                                    onClick={() => router.get(route('ormoc.edit', booking.id))}
                                >
                                    Edit
                                </Button>
                            )}
                            {canWrite && (
                                <Button
                                    variant="danger"
                                    icon={Trash2}
                                    onClick={() => setShowDeleteConfirm(true)}
                                />
                            )}
                        </div>
                    }
                />

                {/* Lock banner */}
                {booking.forwarded_to_accounting && (
                    <div
                        className="flex items-center gap-[var(--space-2)] font-body"
                        style={{
                            padding     : 'var(--space-2) var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            background  : 'var(--color-info)',
                            color       : '#fff',
                            fontSize    : 'var(--font-size-small)',
                        }}
                    >
                        <Lock size={16} />
                        This booking is locked — forwarded to Accounting on {fmtDateTime(booking.forwarded_to_accounting_at)}.
                        Contact Admin Auditor to unlock.
                    </div>
                )}

                {/* Alerts */}
                {booking.passport_expiry_flagged && (
                    <div
                        className="flex items-center gap-[var(--space-2)] font-body"
                        style={{
                            padding     : 'var(--space-2) var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            background  : 'var(--color-warning)',
                            color       : '#fff',
                            fontSize    : 'var(--font-size-small)',
                        }}
                    >
                        <AlertTriangle size={16} />
                        Passport expires within 6 months of travel date — please advise client.
                    </div>
                )}

                {ccSurcharge && (
                    <div
                        className="flex items-center gap-[var(--space-2)] font-body"
                        style={{
                            padding     : 'var(--space-2) var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            background  : 'rgba(var(--color-warning-rgb, 245, 158, 11), 0.12)',
                            border      : '1px solid var(--color-warning)',
                            color       : 'var(--color-warning)',
                            fontSize    : 'var(--font-size-small)',
                        }}
                    >
                        <CreditCard size={16} />
                        Credit card payment — 5% surcharge applied
                        {ccAmount && ` (PHP ${parseFloat(ccAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })})`}
                    </div>
                )}

                <div className="grid gap-[var(--space-3)]" style={{ gridTemplateColumns: '1fr 320px' }}>

                    {/* Left column */}
                    <div className="flex flex-col gap-[var(--space-3)]">

                        {/* Core details */}
                        <Card>
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                                Booking Details
                            </h2>
                            <div className="grid gap-[var(--space-3)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                                <DetailRow label="Date">{fmtDate(booking.date)}</DetailRow>
                                <DetailRow label="Agent">{booking.agent_code}</DetailRow>
                                <DetailRow label="Status">
                                    <Badge variant={STATUS_VARIANT[booking.status] ?? 'neutral'}>
                                        {statuses[booking.status] ?? booking.status}
                                    </Badge>
                                </DetailRow>
                                <DetailRow label="Booking Type">
                                    <Badge variant={booking.booking_type === 'international' ? 'info' : 'neutral'}>
                                        {bookingTypes[booking.booking_type] ?? booking.booking_type}
                                    </Badge>
                                </DetailRow>
                                <DetailRow label="Source">{booking.source}</DetailRow>
                                <DetailRow label="Transaction Type">{booking.transaction_type}</DetailRow>
                            </div>
                        </Card>

                        {/* Client */}
                        <Card>
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                                Client Information
                            </h2>
                            <div className="grid gap-[var(--space-3)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                                <DetailRow label="Name">{booking.client_name}</DetailRow>
                                <DetailRow label="Contact">{booking.contact_number}</DetailRow>
                                <DetailRow label="Email">{booking.email}</DetailRow>
                            </div>
                        </Card>

                        {/* Travel */}
                        <Card>
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                                Travel Details
                            </h2>
                            <div className="grid gap-[var(--space-3)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                                <DetailRow label="Destination">{booking.destination}</DetailRow>
                                <DetailRow label="Travel Date">{fmtDate(booking.travel_date)}</DetailRow>
                                <DetailRow label="Pax Count">{booking.pax_count}</DetailRow>
                                <DetailRow label="Hotel">{booking.hotel}</DetailRow>
                                <DetailRow label="Room Type">{booking.room_type}</DetailRow>
                                <div>
                                    <DetailRow label="Passport Expiry">
                                        {fmtDate(booking.passport_expiry)}
                                        {booking.passport_expiry_flagged && (
                                            <span
                                                className="inline-flex items-center gap-1"
                                                style={{ color: 'var(--color-warning)', fontSize: 11, marginLeft: 6 }}
                                            >
                                                <AlertTriangle size={11} /> Expiry flag
                                            </span>
                                        )}
                                    </DetailRow>
                                </div>
                            </div>

                            {booking.flight_details && (
                                <div style={{ marginTop: 'var(--space-2)' }}>
                                    <DetailRow label="Flight Details">
                                        <pre className="font-body" style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 'var(--font-size-small)' }}>
                                            {booking.flight_details}
                                        </pre>
                                    </DetailRow>
                                </div>
                            )}
                            {(booking.inclusions || booking.exclusions) && (
                                <div className="grid gap-[var(--space-3)] mt-[var(--space-2)]" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    {booking.inclusions && <DetailRow label="Inclusions">{booking.inclusions}</DetailRow>}
                                    {booking.exclusions && <DetailRow label="Exclusions">{booking.exclusions}</DetailRow>}
                                </div>
                            )}
                            {booking.remarks && (
                                <div style={{ marginTop: 'var(--space-2)' }}>
                                    <DetailRow label="Remarks">{booking.remarks}</DetailRow>
                                </div>
                            )}
                        </Card>

                        {/* Financials */}
                        <Card>
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                                Financials
                            </h2>
                            <div className="grid gap-[var(--space-3)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                                <DetailRow label="Selling Price">
                                    {booking.selling_price ? <CurrencyDisplay amount={booking.selling_price} currency="PHP" /> : '—'}
                                </DetailRow>
                                <DetailRow label="Net Payable">
                                    {booking.net_payable ? <CurrencyDisplay amount={booking.net_payable} currency="PHP" /> : '—'}
                                </DetailRow>
                                <DetailRow label="Income">
                                    {booking.income ? <CurrencyDisplay amount={booking.income} currency="PHP" /> : '—'}
                                </DetailRow>
                                <DetailRow label="Excess">
                                    {booking.excess ? <CurrencyDisplay amount={booking.excess} currency="PHP" /> : '—'}
                                </DetailRow>
                                <DetailRow label="Insurance (Nett)">
                                    {booking.insurance_nett ? <CurrencyDisplay amount={booking.insurance_nett} currency="PHP" /> : '—'}
                                </DetailRow>
                                <DetailRow label="ACR">
                                    {booking.acr ? <CurrencyDisplay amount={booking.acr} currency="PHP" /> : '—'}
                                </DetailRow>
                            </div>

                            {ccSurcharge && booking.selling_price && (
                                <div
                                    style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}
                                >
                                    <div className="flex justify-between font-body" style={{ fontSize: 'var(--font-size-small)' }}>
                                        <span style={{ opacity: 0.6 }}>CC Surcharge (5%)</span>
                                        <CurrencyDisplay amount={booking.selling_price * 0.05} currency="PHP" />
                                    </div>
                                    <div className="flex justify-between font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', marginTop: 4 }}>
                                        <span>Total with Surcharge</span>
                                        <CurrencyDisplay amount={booking.selling_price * 1.05} currency="PHP" />
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Payment & References */}
                        <Card>
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                                Payment &amp; Reference Numbers
                            </h2>
                            <div className="grid gap-[var(--space-3)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                                <DetailRow label="Mode of Payment">
                                    {booking.mode_of_payment ? paymentModes[booking.mode_of_payment] ?? booking.mode_of_payment : '—'}
                                </DetailRow>
                                <DetailRow label="Date of Payment">{fmtDate(booking.date_of_payment)}</DetailRow>
                                <DetailRow label="PO Number">{booking.po_number}</DetailRow>
                                <DetailRow label="SI Number">{booking.si_number}</DetailRow>
                                <DetailRow label="OR Number">{booking.or_number}</DetailRow>
                                <DetailRow label="AR Number">{booking.ar_number}</DetailRow>
                                <DetailRow label="SOA Number">{booking.soa_number}</DetailRow>
                            </div>
                        </Card>

                        {/* Notes */}
                        <Card>
                            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                                <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600 }}>
                                    Notes
                                </h2>
                                {canWrite && (
                                    <Button variant="ghost" size="sm" onClick={() => setShowNotesModal(true)}>
                                        {booking.notes ? 'Edit Notes' : 'Add Notes'}
                                    </Button>
                                )}
                            </div>
                            {booking.notes
                                ? <p className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)', whiteSpace: 'pre-wrap', margin: 0 }}>{booking.notes}</p>
                                : <p className="font-body" style={{ fontSize: 'var(--font-size-small)', opacity: 0.4, margin: 0 }}>No notes yet.</p>
                            }
                        </Card>

                        {/* Audit Remarks */}
                        {booking.audit_remarks && (
                            <Card>
                                <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                    Audit Remarks
                                </h2>
                                <p className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)', margin: 0 }}>
                                    {booking.audit_remarks}
                                </p>
                            </Card>
                        )}

                    </div>

                    {/* Right column — actions & status */}
                    <div className="flex flex-col gap-[var(--space-3)]">

                        {/* Status card */}
                        <Card>
                            <h3 className="font-heading" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                Booking Status
                            </h3>
                            <div style={{ marginBottom: 'var(--space-2)' }}>
                                <Badge variant={STATUS_VARIANT[booking.status] ?? 'neutral'}>
                                    {statuses[booking.status] ?? booking.status}
                                </Badge>
                            </div>
                            {canWrite && !booking.forwarded_to_accounting && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowStatusModal(true)}
                                    style={{ width: '100%' }}
                                >
                                    Change Status
                                </Button>
                            )}
                        </Card>

                        {/* Escalation */}
                        <Card>
                            <h3 className="font-heading" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                International Escalation
                            </h3>
                            {booking.escalated_to_head_office ? (
                                <div>
                                    <div
                                        className="flex items-center gap-1 font-body"
                                        style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}
                                    >
                                        <CheckCircle size={14} /> Escalated to QC Head Office
                                    </div>
                                    <p className="font-body" style={{ fontSize: 11, opacity: 0.5, margin: '4px 0 0' }}>
                                        {fmtDateTime(booking.escalated_at)}
                                        {booking.escalated_by_name && ` by ${booking.escalated_by_name}`}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-body" style={{ fontSize: 'var(--font-size-small)', opacity: 0.6, marginBottom: 'var(--space-1)' }}>
                                        Use for bookings Ormoc cannot issue — notifies Ms. Jhona Ramos (RESA QC).
                                    </p>
                                    {canWrite && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            icon={ArrowUpRight}
                                            onClick={escalate}
                                            style={{ width: '100%' }}
                                        >
                                            Escalate to Head Office
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* PO to Mariposa */}
                        <Card>
                            <h3 className="font-heading" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                PO to Mariposa
                            </h3>
                            {booking.po_sent_to_mariposa ? (
                                <div>
                                    <div
                                        className="flex items-center gap-1 font-body"
                                        style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}
                                    >
                                        <CheckCircle size={14} /> PO sent to Mariposa
                                    </div>
                                    <p className="font-body" style={{ fontSize: 11, opacity: 0.5, margin: '4px 0 0' }}>
                                        {fmtDateTime(booking.po_sent_to_mariposa_at)}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-body" style={{ fontSize: 'var(--font-size-small)', opacity: 0.6, marginBottom: 'var(--space-1)' }}>
                                        Mark when P.O. has been sent to Mariposa (external consolidator).
                                    </p>
                                    {canWrite && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            icon={ExternalLink}
                                            onClick={markPoToMariposa}
                                            style={{ width: '100%' }}
                                        >
                                            Mark PO Sent to Mariposa
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Forward to Accounting */}
                        <Card>
                            <h3 className="font-heading" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                Forward to Accounting
                            </h3>
                            {booking.forwarded_to_accounting ? (
                                <div>
                                    <div
                                        className="flex items-center gap-1 font-body"
                                        style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}
                                    >
                                        <Lock size={14} /> Forwarded &amp; Locked
                                    </div>
                                    <p className="font-body" style={{ fontSize: 11, opacity: 0.5, margin: '4px 0 0' }}>
                                        {fmtDateTime(booking.forwarded_to_accounting_at)}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-body" style={{ fontSize: 'var(--font-size-small)', opacity: 0.6, marginBottom: 'var(--space-1)' }}>
                                        Locks this booking and notifies Accounting. Cannot be undone without Admin Auditor.
                                    </p>
                                    {canWrite && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            icon={Send}
                                            onClick={forwardToAccounting}
                                            style={{ width: '100%' }}
                                        >
                                            Forward to Accounting
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Metadata */}
                        <Card>
                            <h3 className="font-heading" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                Record Info
                            </h3>
                            <div className="flex flex-col gap-[var(--space-1)]">
                                <DetailRow label="Created by">{booking.created_by?.name ?? '—'}</DetailRow>
                                <DetailRow label="Created">{fmtDateTime(booking.created_at)}</DetailRow>
                                <DetailRow label="Last updated">{fmtDateTime(booking.updated_at)}</DetailRow>
                            </div>
                        </Card>

                    </div>
                </div>
            </div>

            {/* Notes Modal */}
            <Modal
                open={showNotesModal}
                onClose={() => setShowNotesModal(false)}
                title="Edit Notes"
                footer={
                    <div className="flex justify-end gap-[var(--space-1)]">
                        <Button variant="ghost" onClick={() => setShowNotesModal(false)}>Cancel</Button>
                        <Button variant="primary" loading={notesForm.processing} onClick={saveNotes}>Save Notes</Button>
                    </div>
                }
            >
                <Textarea
                    label="Notes"
                    value={notesForm.data.notes}
                    onChange={(e) => notesForm.setData('notes', e.target.value)}
                    rows={5}
                    error={notesForm.errors.notes}
                />
            </Modal>

            {/* Status Modal */}
            <Modal
                open={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                title="Change Status"
                footer={
                    <div className="flex justify-end gap-[var(--space-1)]">
                        <Button variant="ghost" onClick={() => setShowStatusModal(false)}>Cancel</Button>
                        <Button variant="primary" loading={statusForm.processing} onClick={saveStatus}>Update Status</Button>
                    </div>
                }
            >
                <Select
                    label="Status"
                    options={statusOptions}
                    value={statusForm.data.status}
                    onChange={(e) => statusForm.setData('status', e.target.value)}
                    error={statusForm.errors.status}
                />
            </Modal>

            {/* Delete confirm */}
            <ConfirmDialog
                open={showDeleteConfirm}
                title="Remove Booking"
                message={`Remove booking for "${booking.client_name}"? This is a soft delete — it can be recovered if needed.`}
                confirmLabel="Remove"
                confirmVariant="danger"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </AppShell>
    );
}
