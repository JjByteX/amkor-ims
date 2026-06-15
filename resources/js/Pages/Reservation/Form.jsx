import { router, useForm } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

const today = () => new Date().toISOString().slice(0, 10);

export default function ReservationForm({ booking, statuses, serviceTypes, transactionTypes, paymentModes, agentCodes }) {
    const isEdit = Boolean(booking);

    const { data, setData, post, put, processing, errors } = useForm({
        date              : booking?.date               ?? today(),
        agent_code        : booking?.agent_code         ?? '',
        status            : booking?.status             ?? 'inquiry',
        service_type      : booking?.service_type       ?? 'package',
        transaction_type  : booking?.transaction_type   ?? '',
        client_name       : booking?.client_name        ?? '',
        date_of_birth     : booking?.date_of_birth      ?? '',
        contact_number    : booking?.contact_number     ?? '',
        email             : booking?.email              ?? '',
        corporate_account : booking?.corporate_account  ?? '',
        destination       : booking?.destination        ?? '',
        airline           : booking?.airline            ?? '',
        travel_date       : booking?.travel_date        ?? '',
        return_date       : booking?.return_date        ?? '',
        pax_count         : booking?.pax_count          ?? 1,
        particulars       : booking?.particulars        ?? '',
        inclusions        : booking?.inclusions         ?? '',
        exclusions        : booking?.exclusions         ?? '',
        source            : booking?.source             ?? '',
        selling_price     : booking?.selling_price      ?? '',
        net_payable       : booking?.net_payable        ?? '',
        income            : booking?.income             ?? '',
        excess            : booking?.excess             ?? '',
        insurance_nett    : booking?.insurance_nett     ?? '',
        acr               : booking?.acr                ?? '',
        mode_of_payment   : booking?.mode_of_payment    ?? '',
        payment_due_date  : booking?.payment_due_date   ?? '',
        soa_number        : booking?.soa_number         ?? '',
        po_number         : booking?.po_number          ?? '',
        si_number         : booking?.si_number          ?? '',
        ar_number         : booking?.ar_number          ?? '',
        or_number         : booking?.or_number          ?? '',
        remarks           : booking?.remarks            ?? '',
        audit_remarks     : booking?.audit_remarks      ?? '',
    });

    const set = (key) => (e) => setData(key, e.target.value);
    const options = (items) => Object.entries(items).map(([value, label]) => ({ value, label }));

    // Auto-compute income when SP or NP changes
    function handleFinancialChange(field, value) {
        const next = { ...data, [field]: value };
        const sp   = parseFloat(next.selling_price) || 0;
        const np   = parseFloat(next.net_payable)   || 0;
        setData({ ...next, income: sp && np ? (sp - np).toFixed(2) : next.income });
    }

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
            <form
                onSubmit={submit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout columns={2}>
                    <PageHeader
                        breadcrumb={[{ label: 'Reservation & Booking', href: route('reservation.index') }]}
                        title={isEdit ? `Edit ${booking.booking_no}` : 'New Booking'}
                        subtitle="Capture inquiry, quotation, and booking details"
                        actions={
                            <>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    icon={X}
                                    onClick={() => router.get(
                                        isEdit
                                            ? route('reservation.show', booking.id)
                                            : route('reservation.index')
                                    )}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" icon={Save} loading={processing}>
                                    Save
                                </Button>
                            </>
                        }
                    />

                    {/* ── Card 1 — Client & Trip ─────────────────────────────── */}
                    <FormCard title="Client & Trip">
                        <FormRow>
                            <Input
                                label="Date"
                                type="date"
                                value={data.date}
                                onChange={set('date')}
                                error={errors.date}
                                required
                            />
                            <Select
                                label="Agent"
                                value={data.agent_code}
                                onChange={set('agent_code')}
                                options={[{ value: '', label: 'Unassigned' }, ...agentCodes.map((c) => ({ value: c, label: c }))]}
                                error={errors.agent_code}
                            />
                        </FormRow>

                        <FormRow>
                            <Select
                                label="Status"
                                value={data.status}
                                onChange={set('status')}
                                options={options(statuses)}
                                error={errors.status}
                                required
                            />
                            <Select
                                label="Service Type"
                                value={data.service_type}
                                onChange={set('service_type')}
                                options={options(serviceTypes)}
                                error={errors.service_type}
                                required
                            />
                        </FormRow>

                        <FormRow>
                            <Select
                                label="Transaction Type"
                                value={data.transaction_type}
                                onChange={set('transaction_type')}
                                options={[{ value: '', label: 'Not set' }, ...options(transactionTypes)]}
                                error={errors.transaction_type}
                            />
                            <Input
                                label="Source"
                                value={data.source}
                                onChange={set('source')}
                                error={errors.source}
                                placeholder="Walk-in, Referral, Online"
                            />
                        </FormRow>

                        <Input
                            label="Client Name"
                            value={data.client_name}
                            onChange={set('client_name')}
                            error={errors.client_name}
                            required
                        />

                        <FormRow>
                            <Input
                                label="Date of Birth"
                                type="date"
                                value={data.date_of_birth}
                                onChange={set('date_of_birth')}
                                error={errors.date_of_birth}
                            />
                            <Input
                                label="Contact Number"
                                value={data.contact_number}
                                onChange={set('contact_number')}
                                error={errors.contact_number}
                            />
                        </FormRow>

                        <FormRow>
                            <Input
                                label="Email"
                                type="email"
                                value={data.email}
                                onChange={set('email')}
                                error={errors.email}
                            />
                            <Input
                                label="Corporate Account"
                                value={data.corporate_account}
                                onChange={set('corporate_account')}
                                error={errors.corporate_account}
                            />
                        </FormRow>

                        <FormRow>
                            <Input
                                label="Destination"
                                value={data.destination}
                                onChange={set('destination')}
                                error={errors.destination}
                            />
                            <Input
                                label="Airline"
                                value={data.airline}
                                onChange={set('airline')}
                                error={errors.airline}
                                placeholder="e.g. Cebu Pacific, PAL"
                            />
                        </FormRow>

                        <FormRow>
                            <Input
                                label="Travel Date"
                                type="date"
                                value={data.travel_date}
                                onChange={set('travel_date')}
                                error={errors.travel_date}
                            />
                            <Input
                                label="Return Date"
                                type="date"
                                value={data.return_date}
                                onChange={set('return_date')}
                                error={errors.return_date}
                            />
                        </FormRow>

                        <Input
                            label="Pax Count"
                            type="number"
                            min="1"
                            value={data.pax_count}
                            onChange={set('pax_count')}
                            error={errors.pax_count}
                            required
                        />

                        <Textarea
                            label="Particulars"
                            value={data.particulars}
                            onChange={set('particulars')}
                            rows={2}
                            error={errors.particulars}
                        />
                        <Textarea
                            label="Inclusions"
                            value={data.inclusions}
                            onChange={set('inclusions')}
                            rows={2}
                            error={errors.inclusions}
                        />
                        <Textarea
                            label="Exclusions"
                            value={data.exclusions}
                            onChange={set('exclusions')}
                            rows={2}
                            error={errors.exclusions}
                        />
                    </FormCard>

                    {/* ── Card 2 — Financials, Payment & References ──────────── */}
                    <FormCard title="Financials, Payment & References">
                        <FormRow>
                            <Input
                                label="Selling Price"
                                type="number"
                                step="0.01"
                                value={data.selling_price}
                                onChange={(e) => handleFinancialChange('selling_price', e.target.value)}
                                error={errors.selling_price}
                            />
                            <Input
                                label="Net Payable"
                                type="number"
                                step="0.01"
                                value={data.net_payable}
                                onChange={(e) => handleFinancialChange('net_payable', e.target.value)}
                                error={errors.net_payable}
                            />
                        </FormRow>

                        <FormRow>
                            <Input
                                label="Income (auto-computed)"
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
                        </FormRow>

                        <FormRow>
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
                                value={data.acr}
                                onChange={set('acr')}
                                error={errors.acr}
                                placeholder="ACR reference"
                            />
                        </FormRow>

                        <FormRow>
                            <Select
                                label="Payment Mode"
                                value={data.mode_of_payment}
                                onChange={set('mode_of_payment')}
                                options={[{ value: '', label: 'Not set' }, ...options(paymentModes)]}
                                error={errors.mode_of_payment}
                            />
                            <Input
                                label="Payment Due"
                                type="date"
                                value={data.payment_due_date}
                                onChange={set('payment_due_date')}
                                error={errors.payment_due_date}
                            />
                        </FormRow>

                        <FormRow>
                            <Input
                                label="SOA Number"
                                value={data.soa_number}
                                onChange={set('soa_number')}
                                error={errors.soa_number}
                            />
                            <Input
                                label="PO Number"
                                value={data.po_number}
                                onChange={set('po_number')}
                                error={errors.po_number}
                            />
                        </FormRow>

                        <FormRow>
                            <Input
                                label="SI Number"
                                value={data.si_number}
                                onChange={set('si_number')}
                                error={errors.si_number}
                            />
                            <Input
                                label="AR Number"
                                value={data.ar_number}
                                onChange={set('ar_number')}
                                error={errors.ar_number}
                            />
                        </FormRow>

                        <Input
                            label="OR Number"
                            value={data.or_number}
                            onChange={set('or_number')}
                            error={errors.or_number}
                        />

                        <Textarea
                            label="Remarks"
                            value={data.remarks}
                            onChange={set('remarks')}
                            rows={2}
                            error={errors.remarks}
                        />

                        <Textarea
                            label="Audit Remarks"
                            value={data.audit_remarks}
                            onChange={set('audit_remarks')}
                            rows={2}
                            error={errors.audit_remarks}
                        />
                    </FormCard>

                    <FormActions>
                        <Button
                            type="button"
                            variant="ghost"
                            icon={X}
                            onClick={() => router.get(
                                isEdit
                                    ? route('reservation.show', booking.id)
                                    : route('reservation.index')
                            )}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" icon={Save} loading={processing}>
                            Save
                        </Button>
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
