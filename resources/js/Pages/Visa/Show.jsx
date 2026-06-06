import { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft, Pencil, Trash2, Send, FileCheck, ClipboardCheck,
    AlertCircle, CheckCircle2, Clock, Hash,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Input from '../../Components/UI/Input';
import Textarea from '../../Components/UI/Textarea';
import Select from '../../Components/UI/Select';
import Modal from '../../Components/UI/Modal';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';
import ConfirmDialog from '../../Components/Shared/ConfirmDialog';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_VARIANT = {
    pending    : 'warning',
    on_process : 'info',
    completed  : 'success',
    approved   : 'success',
    denied     : 'error',
    forfeited  : 'error',
    refunded   : 'neutral',
};

// ─── Small detail row ─────────────────────────────────────────────────────────

function DetailRow({ label, children, highlight }) {
    return (
        <div
            className="flex justify-between items-start py-2 font-body"
            style={{
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                background: highlight ? 'rgba(63,152,0,0.06)' : 'transparent',
                padding: '10px 0',
            }}
        >
            <span style={{ fontSize: 'var(--font-size-small)', color: '#64748B', minWidth: '40%' }}>
                {label}
            </span>
            <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', textAlign: 'right', fontWeight: 600 }}>
                {children ?? '—'}
            </span>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VisaShow({ application, statuses, paymentModes, canWrite, canEndorse }) {
    const { flash } = usePage().props;

    // Modal state
    const [statusModal,  setStatusModal ] = useState(false);
    const [notesModal,   setNotesModal  ] = useState(false);
    const [orModal,      setOrModal     ] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleting,     setDeleting    ] = useState(false);

    // Status form
    const statusForm = useForm({ status: application.status });
    function submitStatus(e) {
        e.preventDefault();
        statusForm.post(route('visa.update-status', application.id), {
            onSuccess: () => setStatusModal(false),
        });
    }

    // Notes form
    const notesForm = useForm({ notes: application.notes ?? '' });
    function submitNotes(e) {
        e.preventDefault();
        notesForm.post(route('visa.update-notes', application.id), {
            onSuccess: () => setNotesModal(false),
        });
    }

    // OR form
    const orForm = useForm({ or_number: '' });
    function submitOr(e) {
        e.preventDefault();
        orForm.post(route('visa.record-or', application.id), {
            onSuccess: () => setOrModal(false),
        });
    }

    // Payment request
    const [sendingRequest, setSendingRequest] = useState(false);
    function sendPaymentRequest() {
        setSendingRequest(true);
        router.post(
            route('visa.payment-request', application.id),
            {},
            { onFinish: () => setSendingRequest(false) },
        );
    }

    // Endorse OR
    const [endorsing, setEndorsing] = useState(false);
    function endorseOr() {
        setEndorsing(true);
        router.post(
            route('visa.endorse-or', application.id),
            {},
            { onFinish: () => setEndorsing(false) },
        );
    }

    // Delete
    function handleDelete() {
        setDeleting(true);
        router.delete(route('visa.destroy', application.id), {
            onFinish: () => setDeleting(false),
        });
    }

    // Helpers
    function fmtDate(d) {
        if (!d) return null;
        return new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    const statusOptions = Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }));

    return (
        <AppShell>
            <div className="flex flex-col gap-[var(--space-3)]" style={{ padding: 'var(--space-4)' }}>

                {/* Flash */}
                {flash?.message && (
                    <div
                        className="font-body"
                        style={{
                            padding: 'var(--space-2)',
                            background: flash.type === 'success' ? 'var(--color-success)' : flash.type === 'warning' ? 'var(--color-warning)' : 'var(--color-error)',
                            color: '#fff',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-small)',
                        }}
                    >
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title={application.customer_name}
                    subtitle={application.visa_type}
                    actions={
                        <div className="flex gap-2">
                            <Button variant="ghost" icon={ArrowLeft} onClick={() => router.visit(route('visa.index'))}>
                                Back
                            </Button>
                            {canWrite && (
                                <>
                                    <Button variant="secondary" icon={Pencil} onClick={() => router.visit(route('visa.edit', application.id))}>
                                        Edit
                                    </Button>
                                    <Button variant="danger" icon={Trash2} onClick={() => setDeleteDialog(true)}>
                                        Remove
                                    </Button>
                                </>
                            )}
                        </div>
                    }
                />

                <div className="grid grid-cols-1 gap-[var(--space-3)] lg:grid-cols-3">

                    {/* ── Left column: details ─────────────────────────────── */}
                    <div className="lg:col-span-2 flex flex-col gap-[var(--space-3)]">

                        {/* Application Info */}
                        <Card>
                            <div className="flex justify-between items-center mb-[var(--space-2)]">
                                <span className="font-heading text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-heading)' }}>
                                    Application Info
                                </span>
                                <Badge variant={STATUS_VARIANT[application.status] ?? 'neutral'}>
                                    {statuses[application.status] ?? application.status}
                                </Badge>
                            </div>

                            <DetailRow label="Date">{fmtDate(application.date)}</DetailRow>
                            <DetailRow label="Agent">{application.agent_code}</DetailRow>
                            <DetailRow label="Agency">{application.agency}</DetailRow>
                            <DetailRow label="Visa / Service Type">{application.visa_type}</DetailRow>
                            <DetailRow label="Created By">{application.created_by?.name}</DetailRow>
                        </Card>

                        {/* Financials */}
                        <Card>
                            <div className="font-heading text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-heading)' }}>
                                Financials
                            </div>
                            <DetailRow label="Selling Price (SP)" highlight>
                                <CurrencyDisplay amount={application.selling_price} currency="PHP" />
                            </DetailRow>
                            <DetailRow label="Net Payable (NP)">
                                <CurrencyDisplay amount={application.net_payable} currency="PHP" />
                            </DetailRow>
                            <DetailRow label="Income" highlight>
                                <CurrencyDisplay amount={application.income} currency="PHP" />
                            </DetailRow>
                        </Card>

                        {/* Payment Details */}
                        <Card>
                            <div className="font-heading text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-heading)' }}>
                                Payment Details
                            </div>
                            <DetailRow label="Mode of Payment">{paymentModes[application.mode_of_payment]}</DetailRow>
                            <DetailRow label="Payment Date">{fmtDate(application.payment_date)}</DetailRow>
                            <DetailRow label="SOA #">{application.soa_number}</DetailRow>
                            <DetailRow label="SI #">{application.si_number}</DetailRow>
                            <DetailRow label="AR #">{application.ar_number}</DetailRow>
                        </Card>

                        {/* Embassy Payment Tracking */}
                        <Card>
                            <div className="font-heading text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-heading)' }}>
                                Embassy Payment Tracking
                            </div>
                            <DetailRow label="Payment Due Date (Embassy)">
                                {application.payment_due_date
                                    ? <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>{fmtDate(application.payment_due_date)}</span>
                                    : null}
                            </DetailRow>
                            <DetailRow label="Payment Request Sent">
                                {application.payment_request_sent
                                    ? <span style={{ color: 'var(--color-success)' }}>✓ Sent {fmtDate(application.payment_request_sent_at)}</span>
                                    : 'Not sent'}
                            </DetailRow>
                            <DetailRow label="OR Number">{application.or_number}</DetailRow>
                            <DetailRow label="OR Received At">{application.or_received_at ? fmtDate(application.or_received_at) : null}</DetailRow>
                            <DetailRow label="OR Endorsed At">
                                {application.or_endorsed_at
                                    ? <span style={{ color: 'var(--color-success)' }}>✓ {fmtDate(application.or_endorsed_at)} by {application.or_endorsed_by?.name}</span>
                                    : 'Not yet endorsed'}
                            </DetailRow>
                        </Card>

                        {/* Notes */}
                        {(application.notes || canWrite) && (
                            <Card>
                                <div className="flex justify-between items-center mb-[var(--space-2)]">
                                    <span className="font-heading text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-heading)' }}>
                                        Notes
                                    </span>
                                    {canWrite && (
                                        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setNotesModal(true)}>
                                            {application.notes ? 'Edit' : 'Add Note'}
                                        </Button>
                                    )}
                                </div>
                                {application.notes
                                    ? (
                                        <div
                                            className="font-body"
                                            style={{
                                                background: 'rgba(245,158,11,0.08)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: 'var(--space-2)',
                                                fontSize: 'var(--font-size-small)',
                                                color: 'var(--color-text)',
                                                borderLeft: '3px solid var(--color-warning)',
                                                whiteSpace: 'pre-wrap',
                                            }}
                                        >
                                            {application.notes}
                                        </div>
                                    )
                                    : (
                                        <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: '#94A3B8' }}>
                                            No notes.
                                        </span>
                                    )}
                            </Card>
                        )}
                    </div>

                    {/* ── Right column: actions ────────────────────────────── */}
                    <div className="flex flex-col gap-[var(--space-3)]">

                        {/* Workflow Actions */}
                        {canWrite && (
                            <Card>
                                <div className="font-heading text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-heading)' }}>
                                    Workflow Actions
                                </div>
                                <div className="flex flex-col gap-[var(--space-2)]">

                                    {/* Update status */}
                                    <Button
                                        variant="secondary"
                                        icon={ClipboardCheck}
                                        onClick={() => setStatusModal(true)}
                                    >
                                        Update Status
                                    </Button>

                                    {/* Add/edit note */}
                                    <Button
                                        variant="secondary"
                                        icon={AlertCircle}
                                        onClick={() => setNotesModal(true)}
                                    >
                                        {application.notes ? 'Edit Note' : 'Add Note'}
                                    </Button>

                                    {/* Send payment request */}
                                    {!application.payment_request_sent && application.payment_due_date && (
                                        <Button
                                            variant="primary"
                                            icon={Send}
                                            loading={sendingRequest}
                                            onClick={sendPaymentRequest}
                                        >
                                            Send Payment Request
                                        </Button>
                                    )}

                                    {application.payment_request_sent && !application.payment_request_sent && (
                                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: '#94A3B8' }}>
                                            Payment request already sent.
                                        </div>
                                    )}

                                    {/* Record OR */}
                                    {application.payment_request_sent && !application.or_number && (
                                        <Button
                                            variant="secondary"
                                            icon={Hash}
                                            onClick={() => setOrModal(true)}
                                        >
                                            Record OR Number
                                        </Button>
                                    )}

                                    {/* Endorse OR */}
                                    {canEndorse && (
                                        <Button
                                            variant="primary"
                                            icon={FileCheck}
                                            loading={endorsing}
                                            onClick={endorseOr}
                                        >
                                            Endorse OR to Disbursement
                                        </Button>
                                    )}

                                </div>

                                {/* Status summary */}
                                <div className="mt-[var(--space-3)] flex flex-col gap-1">
                                    <StatusStep done={application.payment_request_sent} label="Payment request sent" />
                                    <StatusStep done={!!application.or_number}          label="OR received" />
                                    <StatusStep done={!!application.or_endorsed_at}     label="OR endorsed to Disbursement" />
                                </div>
                            </Card>
                        )}

                        {/* Quick summary */}
                        <Card>
                            <div className="font-heading text-[var(--color-text)] mb-[var(--space-2)]" style={{ fontSize: 'var(--font-size-heading)' }}>
                                Summary
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between font-body" style={{ fontSize: 'var(--font-size-small)' }}>
                                    <span style={{ color: '#64748B' }}>Agent</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{application.agent_code}</span>
                                </div>
                                <div className="flex justify-between font-body" style={{ fontSize: 'var(--font-size-small)' }}>
                                    <span style={{ color: '#64748B' }}>Income</span>
                                    <CurrencyDisplay amount={application.income} currency="PHP" />
                                </div>
                                <div className="flex justify-between font-body" style={{ fontSize: 'var(--font-size-small)' }}>
                                    <span style={{ color: '#64748B' }}>Status</span>
                                    <Badge variant={STATUS_VARIANT[application.status] ?? 'neutral'}>
                                        {statuses[application.status]}
                                    </Badge>
                                </div>
                            </div>
                        </Card>

                    </div>
                </div>
            </div>

            {/* ── Status Modal ──────────────────────────────────────────────── */}
            <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Status" size="default">
                <form onSubmit={submitStatus} className="flex flex-col gap-[var(--space-3)]">
                    <Select
                        label="New Status"
                        options={statusOptions}
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

            {/* ── Notes Modal ────────────────────────────────────────────────── */}
            <Modal open={notesModal} onClose={() => setNotesModal(false)} title="Notes" size="default">
                <form onSubmit={submitNotes} className="flex flex-col gap-[var(--space-3)]">
                    <Textarea
                        label="Notes"
                        placeholder="Any follow-ups, flags, or special instructions..."
                        value={notesForm.data.notes}
                        onChange={(e) => notesForm.setData('notes', e.target.value)}
                        rows={5}
                        error={notesForm.errors.notes}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={() => setNotesModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={notesForm.processing}>Save Notes</Button>
                    </div>
                </form>
            </Modal>

            {/* ── OR Modal ──────────────────────────────────────────────────── */}
            <Modal open={orModal} onClose={() => setOrModal(false)} title="Record OR Number" size="default">
                <form onSubmit={submitOr} className="flex flex-col gap-[var(--space-3)]">
                    <Input
                        label="Official Receipt Number *"
                        placeholder="Enter OR number from embassy"
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

            {/* ── Delete Dialog ─────────────────────────────────────────────── */}
            <ConfirmDialog
                open={deleteDialog}
                title="Remove Application"
                message={`Remove the application for ${application.customer_name}? This can be undone by an admin.`}
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog(false)}
            />
        </AppShell>
    );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StatusStep({ done, label }) {
    return (
        <div className="flex items-center gap-2 font-body" style={{ fontSize: 'var(--font-size-small)' }}>
            {done
                ? <CheckCircle2 size={16} color="var(--color-success)" />
                : <Clock size={16} color="#CBD5E1" />}
            <span style={{ color: done ? 'var(--color-success)' : '#94A3B8' }}>{label}</span>
        </div>
    );
}
