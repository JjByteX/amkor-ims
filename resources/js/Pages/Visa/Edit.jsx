import { useForm, router } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import ContactPicker from '../../Components/Shared/ContactPicker';

export default function VisaEdit({ application, visaTypes, agentCodes, statuses, paymentModes, contactsSearchUrl }) {

    const { data, setData, put, processing, errors } = useForm({
        agent_code       : application.agent_code       ?? '',
        date             : application.date             ?? '',
        agency           : application.agency           ?? '',
        embassy_name     : application.embassy_name     ?? '',
        contact_id       : application.contact_id       ?? '',
        customer_name    : application.customer_name    ?? '',
        date_of_birth    : application.date_of_birth    ?? '',
        visa_type        : application.visa_type        ?? '',
        selling_price    : application.selling_price    ?? '',
        net_payable      : application.net_payable      ?? '',
        // income is computed server-side from SP - NP, never submitted
        status           : application.status           ?? 'pending',
        notes            : application.notes            ?? '',
        mode_of_payment  : application.mode_of_payment  ?? '',
        payment_date     : application.payment_date     ?? '',

        // Client-side payment — per-bank split (SP)
        payment_cash      : application.payment_cash      ?? '',
        payment_bdo       : application.payment_bdo       ?? '',
        payment_bpi       : application.payment_bpi       ?? '',
        payment_metrobank : application.payment_metrobank ?? '',
        payment_card      : application.payment_card      ?? '',
        payment_check     : application.payment_check     ?? '',

        soa_number       : application.soa_number       ?? '',
        si_number        : application.si_number        ?? '',
        ar_number        : application.ar_number        ?? '',
        payment_due_date : application.payment_due_date ?? '',

        // Payables side — amount paid to embassy/operator (NP)
        payable_cash         : application.payable_cash         ?? '',
        payable_cash_usd     : application.payable_cash_usd     ?? '',
        payable_bank_deposit : application.payable_bank_deposit ?? '',
        payable_credit_card  : application.payable_credit_card  ?? '',

        // OR / disbursement / embassy-filing tracking
        cv_number      : application.cv_number      ?? '',
        date_requested : application.date_requested ?? '',
        courier_name   : application.courier_name   ?? '',
        date_received  : application.date_received  ?? '',
        date_filed     : application.date_filed     ?? '',
    });

    function handleFinancialChange(field, value) {
        setData(field, value);
    }

    // Display-only preview — actual income is recomputed and saved server-side
    const sellingPrice = parseFloat(data.selling_price) || 0;
    const netPayable   = parseFloat(data.net_payable)   || 0;
    const incomePreview = (sellingPrice && netPayable)
        ? (sellingPrice - netPayable).toFixed(2)
        : (application.income ?? '0.00');

    function submit(e) {
        e.preventDefault();
        put(route('visa.update', application.id));
    }

    const agentOptions    = agentCodes.map((c) => ({ value: c, label: c }));
    const visaTypeOptions = visaTypes.map((t) => ({ value: t, label: t }));
    const statusOptions   = Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }));
    const paymentOptions  = Object.entries(paymentModes).map(([v, l]) => ({ value: v, label: l }));

    return (
        <AppShell>
            <form
                onSubmit={submit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout split="1fr 1fr 1fr">
                    <PageHeader
                        breadcrumb={[{ label: 'Visa', href: route('visa.index') }]}
                        title={`Edit — ${application.customer_name}`}
                        subtitle={application.visa_type}
                        actions={
                            <>
                                <Button type="button" variant="ghost" icon={X} onClick={() => history.back()}>Cancel</Button>
                                <Button type="submit" variant="primary" icon={Save} loading={processing}>Save Changes</Button>
                            </>
                        }
                    />

                    {/* Card 1 — Client & Service */}
                    <FormCard title="Client & Service">
                        <FormRow>
                            <Select label="Agent *" options={agentOptions} value={data.agent_code} onChange={(e) => setData('agent_code', e.target.value)} error={errors.agent_code} />
                            <Input label="Date *" type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} error={errors.date} />
                        </FormRow>
                        <Input label="Customer Name *" value={data.customer_name} onChange={(e) => setData('customer_name', e.target.value)} error={errors.customer_name} />
                        <Input label="Date of Birth" type="date" value={data.date_of_birth} onChange={(e) => setData('date_of_birth', e.target.value)} error={errors.date_of_birth} />
                        <ContactPicker
                            label="Linked Contact (optional)"
                            value={data.contact_id}
                            initialContact={application.contact}
                            contactsSearchUrl={contactsSearchUrl}
                            onChange={(id) => setData('contact_id', id)}
                            error={errors.contact_id}
                        />
                        <Input label="Agency" value={data.agency} onChange={(e) => setData('agency', e.target.value)} error={errors.agency} />
                        <Select label="Visa / Service Type *" options={visaTypeOptions} value={data.visa_type} onChange={(e) => setData('visa_type', e.target.value)} error={errors.visa_type} />
                        <Input label="Embassy / Operator Name" placeholder="e.g. China Embassy, Japan Embassy via VFS" value={data.embassy_name} onChange={(e) => setData('embassy_name', e.target.value)} error={errors.embassy_name} />
                    </FormCard>

                    {/* Card 2 — Pricing & Payment Collected (SP) */}
                    <FormCard title="Pricing & Payment Collected (SP)">
                        <FormRow>
                            <Input label="Selling Price (SP)" type="number" value={data.selling_price} onChange={(e) => handleFinancialChange('selling_price', e.target.value)} error={errors.selling_price} />
                            <Input label="Net Payable (NP)" type="number" value={data.net_payable} onChange={(e) => handleFinancialChange('net_payable', e.target.value)} error={errors.net_payable} />
                        </FormRow>
                        <Input label="Income (auto-computed, SP − NP)" type="text" value={incomePreview} disabled readOnly />
                        <Select label="Status" options={statusOptions} value={data.status} onChange={(e) => setData('status', e.target.value)} error={errors.status} />
                        <FormRow>
                            <Select label="Mode of Payment" options={[{ value: '', label: 'Select mode...' }, ...paymentOptions]} value={data.mode_of_payment} onChange={(e) => setData('mode_of_payment', e.target.value)} error={errors.mode_of_payment} />
                            <Input label="Payment Date" type="date" value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} error={errors.payment_date} />
                        </FormRow>
                        <Input label="Payment Due Date (Embassy)" type="date" value={data.payment_due_date} onChange={(e) => setData('payment_due_date', e.target.value)} error={errors.payment_due_date} />

                        <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-small)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                            Payment Breakdown (per bank)
                        </div>
                        <FormRow>
                            <Input label="Cash" type="number" value={data.payment_cash} onChange={(e) => setData('payment_cash', e.target.value)} error={errors.payment_cash} />
                            <Input label="BDO" type="number" value={data.payment_bdo} onChange={(e) => setData('payment_bdo', e.target.value)} error={errors.payment_bdo} />
                        </FormRow>
                        <FormRow>
                            <Input label="BPI" type="number" value={data.payment_bpi} onChange={(e) => setData('payment_bpi', e.target.value)} error={errors.payment_bpi} />
                            <Input label="Metrobank" type="number" value={data.payment_metrobank} onChange={(e) => setData('payment_metrobank', e.target.value)} error={errors.payment_metrobank} />
                        </FormRow>
                        <FormRow>
                            <Input label="Card" type="number" value={data.payment_card} onChange={(e) => setData('payment_card', e.target.value)} error={errors.payment_card} />
                            <Input label="Check" type="number" value={data.payment_check} onChange={(e) => setData('payment_check', e.target.value)} error={errors.payment_check} />
                        </FormRow>
                    </FormCard>

                    {/* Card 3 — References, Payables & Tracking */}
                    <FormCard title="References, Payables & Tracking">
                        <FormRow>
                            <Input label="SOA #" value={data.soa_number} onChange={(e) => setData('soa_number', e.target.value)} error={errors.soa_number} />
                            <Input label="SI #"  value={data.si_number}  onChange={(e) => setData('si_number',  e.target.value)} error={errors.si_number}  />
                        </FormRow>
                        <Input label="AR #" value={data.ar_number} onChange={(e) => setData('ar_number', e.target.value)} error={errors.ar_number} />

                        <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-small)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                            Payable to Embassy / Operator (NP)
                        </div>
                        <FormRow>
                            <Input label="Cash (PHP)" type="number" value={data.payable_cash} onChange={(e) => setData('payable_cash', e.target.value)} error={errors.payable_cash} />
                            <Input label="Cash (USD)" type="number" value={data.payable_cash_usd} onChange={(e) => setData('payable_cash_usd', e.target.value)} error={errors.payable_cash_usd} />
                        </FormRow>
                        <FormRow>
                            <Input label="Bank Deposit" type="number" value={data.payable_bank_deposit} onChange={(e) => setData('payable_bank_deposit', e.target.value)} error={errors.payable_bank_deposit} />
                            <Input label="Credit Card" type="number" value={data.payable_credit_card} onChange={(e) => setData('payable_credit_card', e.target.value)} error={errors.payable_credit_card} />
                        </FormRow>

                        <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-small)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                            Disbursement &amp; OR Tracking
                        </div>
                        <FormRow>
                            <Input label="CV #" value={data.cv_number} onChange={(e) => setData('cv_number', e.target.value)} error={errors.cv_number} />
                            <Input label="Date Requested" type="date" value={data.date_requested} onChange={(e) => setData('date_requested', e.target.value)} error={errors.date_requested} />
                        </FormRow>
                        <FormRow>
                            <Input label="Courier" placeholder="Grab, 2GO, etc." value={data.courier_name} onChange={(e) => setData('courier_name', e.target.value)} error={errors.courier_name} />
                            <Input label="Date Received (OR)" type="date" value={data.date_received} onChange={(e) => setData('date_received', e.target.value)} error={errors.date_received} />
                        </FormRow>
                        <Input label="Date Filed (Embassy)" type="date" value={data.date_filed} onChange={(e) => setData('date_filed', e.target.value)} error={errors.date_filed} />

                        <Textarea label="Notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={4} error={errors.notes} />
                    </FormCard>

                    <FormActions>
                        <Button type="button" variant="ghost" icon={X} onClick={() => history.back()}>Cancel</Button>
                        <Button type="submit" variant="primary" icon={Save} loading={processing}>Save Changes</Button>
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
