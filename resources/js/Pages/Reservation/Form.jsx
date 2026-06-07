import { router, useForm } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

const today = () => new Date().toISOString().slice(0, 10);

export default function ReservationForm({ booking, statuses, serviceTypes, paymentModes, agentCodes }) {
    const isEdit = Boolean(booking);
    const { data, setData, post, put, processing, errors } = useForm({
        date: booking?.date ?? today(),
        agent_code: booking?.agent_code ?? '',
        client_name: booking?.client_name ?? '',
        contact_number: booking?.contact_number ?? '',
        email: booking?.email ?? '',
        corporate_account: booking?.corporate_account ?? '',
        destination: booking?.destination ?? '',
        travel_date: booking?.travel_date ?? '',
        return_date: booking?.return_date ?? '',
        pax_count: booking?.pax_count ?? 1,
        service_type: booking?.service_type ?? 'package',
        particulars: booking?.particulars ?? '',
        inclusions: booking?.inclusions ?? '',
        exclusions: booking?.exclusions ?? '',
        selling_price: booking?.selling_price ?? 0,
        net_payable: booking?.net_payable ?? 0,
        mode_of_payment: booking?.mode_of_payment ?? '',
        payment_due_date: booking?.payment_due_date ?? '',
        soa_number: booking?.soa_number ?? '',
        po_number: booking?.po_number ?? '',
        si_number: booking?.si_number ?? '',
        ar_number: booking?.ar_number ?? '',
        or_number: booking?.or_number ?? '',
        status: booking?.status ?? 'inquiry',
        remarks: booking?.remarks ?? '',
        audit_remarks: booking?.audit_remarks ?? '',
    });

    const set = (key) => (e) => setData(key, e.target.value);
    const options = (items) => Object.entries(items).map(([value, label]) => ({ value, label }));

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            put(route('reservation.update', booking.id));
        } else {
            post(route('reservation.store'));
        }
    }

    return (
        <AppShell>
            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" style={{ gap: 'var(--space-section)' }}>
                <PageHeader
                    title={isEdit ? `Edit ${booking.booking_no}` : 'New Reservation'}
                    subtitle="Capture inquiry, quotation, and booking details"
                    actions={
                        <>
                            <Button variant="ghost" icon={X} onClick={() => router.get(isEdit ? route('reservation.show', booking.id) : route('reservation.index'))}>Cancel</Button>
                            <Button type="submit" icon={Save} loading={processing}>Save</Button>
                        </>
                    }
                />

                <Card>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Input label="Date" type="date" value={data.date} onChange={set('date')} error={errors.date} required />
                        <Select label="Agent" value={data.agent_code} onChange={set('agent_code')} options={[{ value: '', label: 'Unassigned' }, ...agentCodes.map((code) => ({ value: code, label: code }))]} error={errors.agent_code} />
                        <Select label="Status" value={data.status} onChange={set('status')} options={options(statuses)} error={errors.status} required />
                        <Input label="Client Name" value={data.client_name} onChange={set('client_name')} error={errors.client_name} required />
                        <Input label="Contact Number" value={data.contact_number} onChange={set('contact_number')} error={errors.contact_number} />
                        <Input label="Email" type="email" value={data.email} onChange={set('email')} error={errors.email} />
                        <Input label="Corporate Account" value={data.corporate_account} onChange={set('corporate_account')} error={errors.corporate_account} />
                        <Input label="Destination" value={data.destination} onChange={set('destination')} error={errors.destination} />
                        <Input label="Pax" type="number" min="1" value={data.pax_count} onChange={set('pax_count')} error={errors.pax_count} required />
                        <Input label="Travel Date" type="date" value={data.travel_date} onChange={set('travel_date')} error={errors.travel_date} />
                        <Input label="Return Date" type="date" value={data.return_date} onChange={set('return_date')} error={errors.return_date} />
                        <Select label="Service Type" value={data.service_type} onChange={set('service_type')} options={options(serviceTypes)} error={errors.service_type} required />
                    </div>
                </Card>

                <Card>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Input label="Selling Price" type="number" step="0.01" value={data.selling_price} onChange={set('selling_price')} error={errors.selling_price} />
                        <Input label="Net Payable" type="number" step="0.01" value={data.net_payable} onChange={set('net_payable')} error={errors.net_payable} />
                        <Select label="Payment Mode" value={data.mode_of_payment} onChange={set('mode_of_payment')} options={[{ value: '', label: 'Not set' }, ...options(paymentModes)]} error={errors.mode_of_payment} />
                        <Input label="Payment Due" type="date" value={data.payment_due_date} onChange={set('payment_due_date')} error={errors.payment_due_date} />
                        <Input label="SOA Number" value={data.soa_number} onChange={set('soa_number')} error={errors.soa_number} />
                        <Input label="PO Number" value={data.po_number} onChange={set('po_number')} error={errors.po_number} />
                        <Input label="SI Number" value={data.si_number} onChange={set('si_number')} error={errors.si_number} />
                        <Input label="AR Number" value={data.ar_number} onChange={set('ar_number')} error={errors.ar_number} />
                        <Input label="OR Number" value={data.or_number} onChange={set('or_number')} error={errors.or_number} />
                    </div>
                </Card>

                <Card>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Textarea label="Particulars" value={data.particulars} onChange={set('particulars')} rows={4} error={errors.particulars} />
                        <Textarea label="Remarks" value={data.remarks} onChange={set('remarks')} rows={4} error={errors.remarks} />
                        <Textarea label="Inclusions" value={data.inclusions} onChange={set('inclusions')} rows={4} error={errors.inclusions} />
                        <Textarea label="Exclusions" value={data.exclusions} onChange={set('exclusions')} rows={4} error={errors.exclusions} />
                    </div>
                </Card>
            </form>
        </AppShell>
    );
}
