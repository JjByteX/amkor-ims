import { router, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit, Send } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Select from '../../Components/UI/Select';

const money = (v) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(v ?? 0));
const date = (v) => v ? new Date(v).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
const badge = { inquiry: 'neutral', quoted: 'info', confirmed: 'success', cancelled: 'error' };

function Row({ label, value }) {
    return (
        <div>
            <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>{label}</div>
            <div className="font-body font-semibold text-[var(--color-text)]">{value ?? '-'}</div>
        </div>
    );
}

export default function ReservationShow({ booking, statuses, serviceTypes, paymentModes, canWrite }) {
    const statusForm = useForm({ status: booking.status });

    function changeStatus(e) {
        statusForm.setData('status', e.target.value);
        router.post(route('reservation.status', booking.id), { status: e.target.value }, { preserveScroll: true });
    }

    return (
        <AppShell>
            <div className="flex min-h-0 flex-1 flex-col" style={{ gap: 'var(--space-section)' }}>
                <PageHeader
                    title={booking.booking_no}
                    subtitle={booking.client_name}
                    actions={
                        <>
                            <Button variant="ghost" icon={ArrowLeft} onClick={() => router.get(route('reservation.index'))}>Back</Button>
                            {canWrite && <Button variant="secondary" icon={Edit} onClick={() => router.get(route('reservation.edit', booking.id))}>Edit</Button>}
                            {canWrite && !booking.forwarded_to_accounting && booking.status === 'confirmed' && (
                                <Button icon={Send} onClick={() => router.post(route('reservation.forward-accounting', booking.id), {}, { preserveScroll: true })}>Forward</Button>
                            )}
                        </>
                    }
                />

                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <Card>
                        <div className="grid gap-5 md:grid-cols-3">
                            <Row label="Status" value={<Badge variant={badge[booking.status] ?? 'neutral'}>{statuses[booking.status] ?? booking.status}</Badge>} />
                            <Row label="Date" value={date(booking.date)} />
                            <Row label="Branch" value={booking.branch?.name} />
                            <Row label="Agent" value={booking.agent_code} />
                            <Row label="Destination" value={booking.destination} />
                            <Row label="Travel" value={date(booking.travel_date)} />
                            <Row label="Return" value={date(booking.return_date)} />
                            <Row label="Pax" value={booking.pax_count} />
                            <Row label="Service" value={serviceTypes[booking.service_type] ?? booking.service_type} />
                            <Row label="Contact" value={booking.contact_number} />
                            <Row label="Email" value={booking.email} />
                            <Row label="Corporate Account" value={booking.corporate_account} />
                        </div>
                    </Card>

                    <Card>
                        <div className="flex flex-col gap-4">
                            <Row label="Selling Price" value={money(booking.selling_price)} />
                            <Row label="Net Payable" value={money(booking.net_payable)} />
                            <Row label="Income" value={money(booking.income)} />
                            <Row label="Payment Mode" value={paymentModes[booking.mode_of_payment] ?? booking.mode_of_payment} />
                            <Row label="Payment Due" value={date(booking.payment_due_date)} />
                            {canWrite && (
                                <Select label="Update Status" value={statusForm.data.status} onChange={changeStatus} options={Object.entries(statuses).map(([value, label]) => ({ value, label }))} />
                            )}
                        </div>
                    </Card>
                </div>

                <Card>
                    <div className="grid gap-5 md:grid-cols-5">
                        <Row label="SOA" value={booking.soa_number} />
                        <Row label="PO" value={booking.po_number} />
                        <Row label="SI" value={booking.si_number} />
                        <Row label="AR" value={booking.ar_number} />
                        <Row label="OR" value={booking.or_number} />
                    </div>
                </Card>

                <Card>
                    <div className="grid gap-5 md:grid-cols-2">
                        <Row label="Particulars" value={booking.particulars} />
                        <Row label="Remarks" value={booking.remarks} />
                        <Row label="Inclusions" value={booking.inclusions} />
                        <Row label="Exclusions" value={booking.exclusions} />
                    </div>
                </Card>
            </div>
        </AppShell>
    );
}
