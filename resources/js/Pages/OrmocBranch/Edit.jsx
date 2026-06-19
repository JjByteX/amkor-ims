import { useForm, router } from '@inertiajs/react';
import { Save, X, AlertTriangle, CreditCard } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function OrmocBranchEdit({ booking, statuses, bookingTypes, agentCodes, paymentModes }) {

    const { data, setData, put, processing, errors } = useForm({
        agent_code       : booking.agent_code       ?? '',
        date             : booking.date             ?? '',
        client_name      : booking.client_name      ?? '',
        contact_number   : booking.contact_number   ?? '',
        email            : booking.email            ?? '',
        booking_type     : booking.booking_type     ?? 'domestic',
        destination      : booking.destination      ?? '',
        travel_date      : booking.travel_date      ?? '',
        pax_count        : booking.pax_count        ?? '',
        hotel            : booking.hotel            ?? '',
        room_type        : booking.room_type        ?? '',
        flight_details   : booking.flight_details   ?? '',
        inclusions       : booking.inclusions       ?? '',
        exclusions       : booking.exclusions       ?? '',
        remarks          : booking.remarks          ?? '',
        selling_price    : booking.selling_price    ?? '',
        net_payable      : booking.net_payable      ?? '',
        income           : booking.income           ?? '',
        excess           : booking.excess           ?? '',
        insurance_nett   : booking.insurance_nett   ?? '',
        acr              : booking.acr              ?? '',
        mode_of_payment  : booking.mode_of_payment  ?? '',
        date_of_payment  : booking.date_of_payment  ?? '',
        po_number        : booking.po_number        ?? '',
        si_number        : booking.si_number        ?? '',
        or_number        : booking.or_number        ?? '',
        ar_number        : booking.ar_number        ?? '',
        soa_number       : booking.soa_number       ?? '',
        transaction_type : booking.transaction_type ?? '',
        source           : booking.source           ?? '',
        audit_remarks    : booking.audit_remarks    ?? '',
        status           : booking.status           ?? 'inquiry',
        passport_expiry  : booking.passport_expiry  ?? '',
        notes            : booking.notes            ?? '',
    });

    function handleFinancialChange(field, value) {
        const next = { ...data, [field]: value };
        const sp   = parseFloat(next.selling_price) || 0;
        const np   = parseFloat(next.net_payable)   || 0;
        setData({ ...next, income: sp && np ? (sp - np).toFixed(2) : next.income });
    }

    const passportFlagged = (() => {
        if (!data.passport_expiry || !data.travel_date) return false;
        const expiry    = new Date(data.passport_expiry);
        const travel    = new Date(data.travel_date);
        const threshold = new Date(travel);
        threshold.setMonth(threshold.getMonth() + 6);
        return expiry < threshold;
    })();

    const ccSurcharge = data.mode_of_payment === 'credit_card';
    const ccAmount    = ccSurcharge && data.selling_price
        ? (parseFloat(data.selling_price) * 0.05).toFixed(2)
        : null;

    function submit(e) {
        e.preventDefault();
        put(route('ormoc.update', booking.id));
    }

    const agentOptions   = agentCodes.map((c) => ({ value: c, label: c }));
    const statusOptions  = Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }));
    const typeOptions    = Object.entries(bookingTypes).map(([v, l]) => ({ value: v, label: l }));
    const paymentOptions = [
        { value: '', label: 'Select…' },
        ...Object.entries(paymentModes).map(([v, l]) => ({ value: v, label: l })),
    ];

    return (
        <AppShell>
            <form
                onSubmit={submit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout columns={3}>
                    <PageHeader
                        breadcrumb={[{ label: 'Ormoc Branch', href: route('ormoc.index') }]}
                        title={`Edit Booking — ${booking.client_name}`}
                        actions={
                            <>
                                <Button type="button" variant="ghost" icon={X} onClick={() => router.get(route('ormoc.index'))}>Cancel</Button>
                                <Button type="submit" variant="primary" icon={Save} loading={processing}>Save Changes</Button>
                            </>
                        }
                    />

                    {/* Card 1 — Client & Travel */}
                    <FormCard title="Client & Travel">
                        <FormRow>
                            <Select label="Agent Code *" options={[{ value: '', label: 'Select agent…' }, ...agentOptions]} value={data.agent_code} onChange={(e) => setData('agent_code', e.target.value)} error={errors.agent_code} />
                            <Input label="Booking Date *" type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} error={errors.date} />
                        </FormRow>
                        <FormRow>
                            <Select label="Status" options={statusOptions} value={data.status} onChange={(e) => setData('status', e.target.value)} error={errors.status} />
                            <Select label="Booking Type" options={typeOptions} value={data.booking_type} onChange={(e) => setData('booking_type', e.target.value)} error={errors.booking_type} />
                        </FormRow>
                        <Input label="Client Name *" value={data.client_name} onChange={(e) => setData('client_name', e.target.value)} error={errors.client_name} />
                        <FormRow>
                            <Input label="Contact Number" value={data.contact_number} onChange={(e) => setData('contact_number', e.target.value)} error={errors.contact_number} />
                            <Input label="Email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                        </FormRow>
                        <FormRow>
                            <Input label="Destination" value={data.destination} onChange={(e) => setData('destination', e.target.value)} error={errors.destination} />
                            <Input label="Travel Date" type="date" value={data.travel_date} onChange={(e) => setData('travel_date', e.target.value)} error={errors.travel_date} />
                        </FormRow>
                        <FormRow>
                            <Input label="Pax Count" type="number" min={1} value={data.pax_count} onChange={(e) => setData('pax_count', e.target.value)} error={errors.pax_count} />
                            <div>
                                <Input label="Passport Expiry" type="date" value={data.passport_expiry} onChange={(e) => setData('passport_expiry', e.target.value)} error={errors.passport_expiry} />
                                {passportFlagged && (
                                    <div className="flex items-center gap-1 font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-warning)', marginTop: 4 }}>
                                        <AlertTriangle size={13} />
                                        Passport expires within 6 months of travel date
                                    </div>
                                )}
                            </div>
                        </FormRow>
                    </FormCard>

                    {/* Card 2 — Trip Details & Financials */}
                    <FormCard title="Trip Details & Financials">
                        <FormRow>
                            <Input label="Hotel" value={data.hotel} onChange={(e) => setData('hotel', e.target.value)} error={errors.hotel} />
                            <Input label="Room Type" value={data.room_type} onChange={(e) => setData('room_type', e.target.value)} error={errors.room_type} />
                        </FormRow>
                        <Textarea label="Flight Details" value={data.flight_details} onChange={(e) => setData('flight_details', e.target.value)} error={errors.flight_details} rows={2} />
                        <Textarea label="Inclusions" value={data.inclusions} onChange={(e) => setData('inclusions', e.target.value)} error={errors.inclusions} rows={2} />
                        <Textarea label="Exclusions" value={data.exclusions} onChange={(e) => setData('exclusions', e.target.value)} error={errors.exclusions} rows={2} />
                        <Textarea label="Remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} error={errors.remarks} rows={2} />

                        <FormRow>
                            <Input label="Selling Price (PHP)" type="number" step="0.01" value={data.selling_price} onChange={(e) => handleFinancialChange('selling_price', e.target.value)} error={errors.selling_price} />
                            <Input label="Net Payable (PHP)" type="number" step="0.01" value={data.net_payable} onChange={(e) => handleFinancialChange('net_payable', e.target.value)} error={errors.net_payable} />
                        </FormRow>
                        <FormRow>
                            <Input label="Income (auto)" type="number" step="0.01" value={data.income} onChange={(e) => setData('income', e.target.value)} error={errors.income} />
                            <Input label="Excess" type="number" step="0.01" value={data.excess} onChange={(e) => setData('excess', e.target.value)} error={errors.excess} />
                        </FormRow>
                        <FormRow>
                            <Input label="Insurance (Nett)" type="number" step="0.01" value={data.insurance_nett} onChange={(e) => setData('insurance_nett', e.target.value)} error={errors.insurance_nett} />
                            <Input label="ACR" type="number" step="0.01" value={data.acr} onChange={(e) => setData('acr', e.target.value)} error={errors.acr} />
                        </FormRow>
                        <div>
                            <Select label="Mode of Payment" options={paymentOptions} value={data.mode_of_payment} onChange={(e) => setData('mode_of_payment', e.target.value)} error={errors.mode_of_payment} />
                            {ccSurcharge && (
                                <div className="flex items-center gap-1 font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-warning)', marginTop: 4 }}>
                                    <CreditCard size={13} />
                                    Credit card — 5% surcharge applies
                                    {ccAmount && ` (PHP ${parseFloat(ccAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })})`}
                                </div>
                            )}
                        </div>
                        <Input label="Date of Payment" type="date" value={data.date_of_payment} onChange={(e) => setData('date_of_payment', e.target.value)} error={errors.date_of_payment} />
                    </FormCard>

                    {/* Card 3 — References & Audit */}
                    <FormCard title="References & Audit">
                        <FormRow>
                            <Input label="PO Number"  value={data.po_number}  onChange={(e) => setData('po_number',  e.target.value)} error={errors.po_number} />
                            <Input label="SI Number"  value={data.si_number}  onChange={(e) => setData('si_number',  e.target.value)} error={errors.si_number} />
                        </FormRow>
                        <FormRow>
                            <Input label="OR Number"  value={data.or_number}  onChange={(e) => setData('or_number',  e.target.value)} error={errors.or_number} />
                            <Input label="AR Number"  value={data.ar_number}  onChange={(e) => setData('ar_number',  e.target.value)} error={errors.ar_number} />
                        </FormRow>
                        <Input label="SOA Number" value={data.soa_number} onChange={(e) => setData('soa_number', e.target.value)} error={errors.soa_number} />
                        <FormRow>
                            <Input label="Transaction Type" value={data.transaction_type} onChange={(e) => setData('transaction_type', e.target.value)} error={errors.transaction_type} />
                            <Input label="Source" value={data.source} onChange={(e) => setData('source', e.target.value)} error={errors.source} />
                        </FormRow>
                        <Textarea label="Audit Remarks" value={data.audit_remarks} onChange={(e) => setData('audit_remarks', e.target.value)} error={errors.audit_remarks} rows={2} />
                        <Textarea label="Notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} error={errors.notes} rows={2} />
                    </FormCard>

                    <FormActions>
                        <Button type="button" variant="ghost" icon={X} onClick={() => router.get(route('ormoc.index'))}>Cancel</Button>
                        <Button type="submit" variant="primary" icon={Save} loading={processing}>Save Changes</Button>
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
