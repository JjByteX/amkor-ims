import { useEffect }   from 'react';
import { useForm }     from '@inertiajs/react';
import { ArrowLeft, AlertTriangle, CreditCard } from 'lucide-react';
import AppShell   from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card       from '../../Components/UI/Card';
import Button     from '../../Components/UI/Button';
import Input      from '../../Components/UI/Input';
import Select     from '../../Components/UI/Select';
import Textarea   from '../../Components/UI/Textarea';
import { router } from '@inertiajs/react';

export default function OrmocBranchCreate({ statuses, bookingTypes, agentCodes, paymentModes }) {

    const { data, setData, post, processing, errors } = useForm({
        agent_code       : '',
        date             : new Date().toISOString().slice(0, 10),
        client_name      : '',
        contact_number   : '',
        email            : '',
        booking_type     : 'domestic',
        destination      : '',
        travel_date      : '',
        pax_count        : '',
        hotel            : '',
        room_type        : '',
        flight_details   : '',
        inclusions       : '',
        exclusions       : '',
        remarks          : '',
        selling_price    : '',
        net_payable      : '',
        income           : '',
        excess           : '',
        insurance_nett   : '',
        acr              : '',
        mode_of_payment  : '',
        date_of_payment  : '',
        po_number        : '',
        si_number        : '',
        or_number        : '',
        ar_number        : '',
        soa_number       : '',
        transaction_type : '',
        source           : '',
        audit_remarks    : '',
        status           : 'inquiry',
        passport_expiry  : '',
        notes            : '',
    });

    // Auto-compute income
    function handleFinancialChange(field, value) {
        const next = { ...data, [field]: value };
        const sp   = parseFloat(next.selling_price) || 0;
        const np   = parseFloat(next.net_payable)   || 0;
        setData({ ...next, income: sp && np ? (sp - np).toFixed(2) : next.income });
    }

    // Passport expiry check — compute live flag
    const passportFlagged = (() => {
        if (!data.passport_expiry || !data.travel_date) return false;
        const expiry   = new Date(data.passport_expiry);
        const travel   = new Date(data.travel_date);
        const threshold = new Date(travel);
        threshold.setMonth(threshold.getMonth() + 6);
        return expiry < threshold;
    })();

    // CC surcharge alert
    const ccSurcharge = data.mode_of_payment === 'credit_card';
    const ccAmount    = ccSurcharge && data.selling_price
        ? (parseFloat(data.selling_price) * 0.05).toFixed(2)
        : null;

    function submit(e) {
        e.preventDefault();
        post(route('ormoc.store'));
    }

    // Build options
    const agentOptions   = agentCodes.map((c) => ({ value: c, label: c }));
    const statusOptions  = Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }));
    const typeOptions    = Object.entries(bookingTypes).map(([v, l]) => ({ value: v, label: l }));
    const paymentOptions = [
        { value: '', label: 'Select…' },
        ...Object.entries(paymentModes).map(([v, l]) => ({ value: v, label: l })),
    ];

    return (
        <AppShell>
            <form onSubmit={submit}>
                <div className="flex flex-col gap-[var(--space-3)]" style={{ padding: 'var(--space-4)' }}>

                    <PageHeader
                        title="New Ormoc Booking"
                        actions={
                            <Button
                                variant="ghost"
                                icon={ArrowLeft}
                                onClick={() => router.get(route('ormoc.index'))}
                            >
                                Back
                            </Button>
                        }
                    />

                    {/* Section: Core */}
                    <Card>
                        <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                            Booking Details
                        </h2>
                        <div className="grid gap-[var(--space-2)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            <Select
                                label="Agent Code *"
                                options={[{ value: '', label: 'Select agent…' }, ...agentOptions]}
                                value={data.agent_code}
                                onChange={(e) => setData('agent_code', e.target.value)}
                                error={errors.agent_code}
                            />
                            <Input
                                label="Booking Date *"
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                error={errors.date}
                            />
                            <Select
                                label="Status"
                                options={statusOptions}
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                error={errors.status}
                            />
                            <Select
                                label="Booking Type"
                                options={typeOptions}
                                value={data.booking_type}
                                onChange={(e) => setData('booking_type', e.target.value)}
                                error={errors.booking_type}
                            />
                        </div>
                    </Card>

                    {/* Section: Client Info */}
                    <Card>
                        <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                            Client Information
                        </h2>
                        <div className="grid gap-[var(--space-2)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            <Input
                                label="Client Name *"
                                value={data.client_name}
                                onChange={(e) => setData('client_name', e.target.value)}
                                error={errors.client_name}
                                placeholder="Full name"
                            />
                            <Input
                                label="Contact Number"
                                value={data.contact_number}
                                onChange={(e) => setData('contact_number', e.target.value)}
                                error={errors.contact_number}
                                placeholder="+63 9XX XXX XXXX"
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                                placeholder="client@email.com"
                            />
                        </div>
                    </Card>

                    {/* Section: Travel Details */}
                    <Card>
                        <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                            Travel Details
                        </h2>
                        <div className="grid gap-[var(--space-2)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            <Input
                                label="Destination"
                                value={data.destination}
                                onChange={(e) => setData('destination', e.target.value)}
                                error={errors.destination}
                                placeholder="e.g. Boracay, Japan"
                            />
                            <Input
                                label="Travel Date"
                                type="date"
                                value={data.travel_date}
                                onChange={(e) => setData('travel_date', e.target.value)}
                                error={errors.travel_date}
                            />
                            <Input
                                label="Pax Count"
                                type="number"
                                min={1}
                                value={data.pax_count}
                                onChange={(e) => setData('pax_count', e.target.value)}
                                error={errors.pax_count}
                                placeholder="Number of passengers"
                            />
                            <div>
                                <Input
                                    label="Passport Expiry"
                                    type="date"
                                    value={data.passport_expiry}
                                    onChange={(e) => setData('passport_expiry', e.target.value)}
                                    error={errors.passport_expiry}
                                />
                                {passportFlagged && (
                                    <div
                                        className="flex items-center gap-1 font-body"
                                        style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-warning)', marginTop: 4 }}
                                    >
                                        <AlertTriangle size={13} />
                                        Passport expires within 6 months of travel date
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-[var(--space-2)] mt-[var(--space-2)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            <Input
                                label="Hotel"
                                value={data.hotel}
                                onChange={(e) => setData('hotel', e.target.value)}
                                error={errors.hotel}
                            />
                            <Input
                                label="Room Type"
                                value={data.room_type}
                                onChange={(e) => setData('room_type', e.target.value)}
                                error={errors.room_type}
                            />
                        </div>

                        <div className="grid gap-[var(--space-2)] mt-[var(--space-2)]" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <Textarea
                                label="Flight Details"
                                value={data.flight_details}
                                onChange={(e) => setData('flight_details', e.target.value)}
                                error={errors.flight_details}
                                rows={3}
                            />
                            <Textarea
                                label="Inclusions"
                                value={data.inclusions}
                                onChange={(e) => setData('inclusions', e.target.value)}
                                error={errors.inclusions}
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-[var(--space-2)] mt-[var(--space-2)]" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <Textarea
                                label="Exclusions"
                                value={data.exclusions}
                                onChange={(e) => setData('exclusions', e.target.value)}
                                error={errors.exclusions}
                                rows={3}
                            />
                            <Textarea
                                label="Remarks"
                                value={data.remarks}
                                onChange={(e) => setData('remarks', e.target.value)}
                                error={errors.remarks}
                                rows={3}
                            />
                        </div>
                    </Card>

                    {/* Section: Financials */}
                    <Card>
                        <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                            Financials
                        </h2>
                        <div className="grid gap-[var(--space-2)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                            <Input
                                label="Selling Price (PHP)"
                                type="number"
                                step="0.01"
                                value={data.selling_price}
                                onChange={(e) => handleFinancialChange('selling_price', e.target.value)}
                                error={errors.selling_price}
                            />
                            <Input
                                label="Net Payable (PHP)"
                                type="number"
                                step="0.01"
                                value={data.net_payable}
                                onChange={(e) => handleFinancialChange('net_payable', e.target.value)}
                                error={errors.net_payable}
                            />
                            <Input
                                label="Income (auto)"
                                type="number"
                                step="0.01"
                                value={data.income}
                                onChange={(e) => setData('income', e.target.value)}
                                error={errors.income}
                            />
                            <Input
                                label="Excess"
                                type="number"
                                step="0.01"
                                value={data.excess}
                                onChange={(e) => setData('excess', e.target.value)}
                                error={errors.excess}
                            />
                            <Input
                                label="Insurance (Nett)"
                                type="number"
                                step="0.01"
                                value={data.insurance_nett}
                                onChange={(e) => setData('insurance_nett', e.target.value)}
                                error={errors.insurance_nett}
                            />
                            <Input
                                label="ACR"
                                type="number"
                                step="0.01"
                                value={data.acr}
                                onChange={(e) => setData('acr', e.target.value)}
                                error={errors.acr}
                            />
                        </div>
                    </Card>

                    {/* Section: Payment */}
                    <Card>
                        <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                            Payment
                        </h2>
                        <div className="grid gap-[var(--space-2)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            <div>
                                <Select
                                    label="Mode of Payment"
                                    options={paymentOptions}
                                    value={data.mode_of_payment}
                                    onChange={(e) => setData('mode_of_payment', e.target.value)}
                                    error={errors.mode_of_payment}
                                />
                                {ccSurcharge && (
                                    <div
                                        className="flex items-center gap-1 font-body"
                                        style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-warning)', marginTop: 4 }}
                                    >
                                        <CreditCard size={13} />
                                        Credit card selected — 5% surcharge applies
                                        {ccAmount && ` (PHP ${parseFloat(ccAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })})`}
                                    </div>
                                )}
                            </div>
                            <Input
                                label="Date of Payment"
                                type="date"
                                value={data.date_of_payment}
                                onChange={(e) => setData('date_of_payment', e.target.value)}
                                error={errors.date_of_payment}
                            />
                        </div>
                    </Card>

                    {/* Section: Reference Numbers */}
                    <Card>
                        <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                            Reference Numbers
                        </h2>
                        <div className="grid gap-[var(--space-2)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                            <Input label="PO Number"  value={data.po_number}  onChange={(e) => setData('po_number',  e.target.value)} error={errors.po_number} />
                            <Input label="SI Number"  value={data.si_number}  onChange={(e) => setData('si_number',  e.target.value)} error={errors.si_number} />
                            <Input label="OR Number"  value={data.or_number}  onChange={(e) => setData('or_number',  e.target.value)} error={errors.or_number} />
                            <Input label="AR Number"  value={data.ar_number}  onChange={(e) => setData('ar_number',  e.target.value)} error={errors.ar_number} />
                            <Input label="SOA Number" value={data.soa_number} onChange={(e) => setData('soa_number', e.target.value)} error={errors.soa_number} />
                        </div>
                    </Card>

                    {/* Section: Other */}
                    <Card>
                        <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                            Other Details
                        </h2>
                        <div className="grid gap-[var(--space-2)]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            <Input
                                label="Transaction Type"
                                value={data.transaction_type}
                                onChange={(e) => setData('transaction_type', e.target.value)}
                                error={errors.transaction_type}
                            />
                            <Input
                                label="Source"
                                value={data.source}
                                onChange={(e) => setData('source', e.target.value)}
                                error={errors.source}
                                placeholder="e.g. Walk-in, Referral, Online"
                            />
                        </div>
                        <div className="grid gap-[var(--space-2)] mt-[var(--space-2)]" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <Textarea
                                label="Audit Remarks"
                                value={data.audit_remarks}
                                onChange={(e) => setData('audit_remarks', e.target.value)}
                                error={errors.audit_remarks}
                                rows={2}
                            />
                            <Textarea
                                label="Notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                error={errors.notes}
                                rows={2}
                            />
                        </div>
                    </Card>

                    {/* Submit */}
                    <div className="flex justify-end gap-[var(--space-2)]">
                        <Button
                            variant="ghost"
                            onClick={() => router.get(route('ormoc.index'))}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={processing}
                        >
                            Save Booking
                        </Button>
                    </div>

                </div>
            </form>
        </AppShell>
    );
}
