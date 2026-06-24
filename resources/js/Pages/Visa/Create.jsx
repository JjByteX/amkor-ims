import { useForm } from '@inertiajs/react';
;
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions, FormCancelButton, FormEditButton, FormSubmitButton } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import ContactPicker from '../../Components/Shared/ContactPicker';

export default function VisaCreate({ visaTypes, agentCodes, statuses, paymentModes, contactsSearchUrl }) {
    const { data, setData, post, processing, errors } = useForm({
        agent_code      : '',
        date            : new Date().toISOString().slice(0, 10),
        agency          : '',
        embassy_name    : '',
        contact_id      : '',
        customer_name   : '',
        date_of_birth   : '',
        visa_type       : '',
        selling_price   : '',
        net_payable     : '',
        // income is computed server-side from SP - NP, never submitted
        status          : 'pending',
        notes           : '',
        mode_of_payment : '',
        payment_date    : '',

        // Client-side payment — per-bank split (SP)
        payment_cash      : '',
        payment_bdo       : '',
        payment_bpi       : '',
        payment_metrobank : '',
        payment_card      : '',
        payment_check     : '',

        soa_number      : '',
        si_number       : '',
        ar_number       : '',
        payment_due_date: '',

        // Payables side — amount paid to embassy/operator (NP)
        payable_cash         : '',
        payable_cash_usd     : '',
        payable_bank_deposit : '',
        payable_credit_card  : '',

        // OR / disbursement / embassy-filing tracking
        cv_number      : '',
        date_requested : '',
        courier_name   : '',
        date_received  : '',
        date_filed     : '',
    });

    function handleFinancialChange(field, value) {
        setData(field, value);
    }

    // Display-only preview — actual income is computed and saved server-side
    const sellingPrice = parseFloat(data.selling_price) || 0;
    const netPayable   = parseFloat(data.net_payable)   || 0;
    const incomePreview = (sellingPrice && netPayable)
        ? (sellingPrice - netPayable).toFixed(2)
        : '0.00';

    function submit(e) {
        e.preventDefault();
        post(route('visa.store'));
    }

    const agentOptions   = agentCodes.map((c) => ({ value: c, label: c }));
    const visaOptions    = visaTypes.map((t) => ({ value: t, label: t }));
    const statusOptions  = Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }));
    const paymentOptions = Object.entries(paymentModes).map(([v, l]) => ({ value: v, label: l }));

    return (
        <AppShell>
            <form
                onSubmit={submit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout split="1fr 1fr 1fr">
                    <PageHeader
                        breadcrumb={[{ label: 'Visa & Documentation', href: route('visa.index') }]}
                        title="New Application"
                        subtitle="Record a visa or documentation service"
                        actions={
                            <>
                                <FormCancelButton onClick={() => history.back()} />
                                <FormSubmitButton loading={processing} />
                            </>
                        }
                    />

                    {/* Card 1 — Client & Service */}
                    <FormCard title="Client & Service">
                        <FormRow>
                            <Select
                                label="Agent" required
                                options={[{ value: '', label: 'Select agent...' }, ...agentOptions]}
                                value={data.agent_code}
                                onChange={(e) => setData('agent_code', e.target.value)}
                                error={errors.agent_code}
                            />
                            <Input
                                label="Date" required
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                error={errors.date}
                            />
                        </FormRow>
                        <Input
                            label="Customer Name" required
                            placeholder="Full name of applicant"
                            value={data.customer_name}
                            onChange={(e) => setData('customer_name', e.target.value)}
                            error={errors.customer_name}
                        />
                        <Input
                            label="Date of Birth"
                            type="date"
                            value={data.date_of_birth}
                            onChange={(e) => setData('date_of_birth', e.target.value)}
                            error={errors.date_of_birth}
                        />
                        <ContactPicker
                            label="Linked Contact (optional)"
                            value={data.contact_id}
                            contactsSearchUrl={contactsSearchUrl}
                            onChange={(id) => setData('contact_id', id)}
                            error={errors.contact_id}
                        />
                        <FormRow>
                            <Input
                                label="Agency"
                                placeholder="Travel agency (if applicable)"
                                value={data.agency}
                                onChange={(e) => setData('agency', e.target.value)}
                                error={errors.agency}
                            />
                            <Select
                                label="Visa / Service Type" required
                                options={[{ value: '', label: 'Select type...' }, ...visaOptions]}
                                value={data.visa_type}
                                onChange={(e) => setData('visa_type', e.target.value)}
                                error={errors.visa_type}
                            />
                        </FormRow>
                        <Input
                            label="Embassy / Operator Name"
                            placeholder="e.g. China Embassy, Japan Embassy via VFS"
                            value={data.embassy_name}
                            onChange={(e) => setData('embassy_name', e.target.value)}
                            error={errors.embassy_name}
                        />
                    </FormCard>

                    {/* Card 2 — Pricing & Payment Collected (SP) */}
                    <FormCard title="Pricing & Payment Collected (SP)">
                        <FormRow>
                            <Input
                                label="Selling Price (SP)"
                                type="number"
                               
                                value={data.selling_price}
                                onChange={(e) => handleFinancialChange('selling_price', e.target.value)}
                                error={errors.selling_price}
                            />
                            <Input
                                label="Net Payable (NP)"
                                type="number"
                               
                                value={data.net_payable}
                                onChange={(e) => handleFinancialChange('net_payable', e.target.value)}
                                error={errors.net_payable}
                            />
                        </FormRow>
                        <Input
                            label="Income (auto-computed, SP − NP)"
                            type="text"
                            value={incomePreview}
                            disabled
                            readOnly
                        />
                        <FormRow>
                            <Select
                                label="Status"
                                options={statusOptions}
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                error={errors.status}
                            />
                            <Select
                                label="Mode of Payment"
                                options={[{ value: '', label: 'Select mode...' }, ...paymentOptions]}
                                value={data.mode_of_payment}
                                onChange={(e) => setData('mode_of_payment', e.target.value)}
                                error={errors.mode_of_payment}
                            />
                        </FormRow>
                        <FormRow>
                            <Input
                                label="Payment Date"
                                type="date"
                                value={data.payment_date}
                                onChange={(e) => setData('payment_date', e.target.value)}
                                error={errors.payment_date}
                            />
                            <Input
                                label="Payment Due Date (Embassy)"
                                type="date"
                                value={data.payment_due_date}
                                onChange={(e) => setData('payment_due_date', e.target.value)}
                                error={errors.payment_due_date}
                            />
                        </FormRow>

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
                            <Input label="SOA #" placeholder="SOA number" value={data.soa_number} onChange={(e) => setData('soa_number', e.target.value)} error={errors.soa_number} />
                            <Input label="SI #" placeholder="Service Invoice #" value={data.si_number} onChange={(e) => setData('si_number', e.target.value)} error={errors.si_number} />
                        </FormRow>
                        <Input label="AR #" placeholder="Acknowledgement Receipt #" value={data.ar_number} onChange={(e) => setData('ar_number', e.target.value)} error={errors.ar_number} />

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
                            <Input label="CV #" placeholder="Cash voucher number" value={data.cv_number} onChange={(e) => setData('cv_number', e.target.value)} error={errors.cv_number} />
                            <Input label="Date Requested" type="date" value={data.date_requested} onChange={(e) => setData('date_requested', e.target.value)} error={errors.date_requested} />
                        </FormRow>
                        <FormRow>
                            <Input label="Courier" placeholder="Grab, 2GO, etc." value={data.courier_name} onChange={(e) => setData('courier_name', e.target.value)} error={errors.courier_name} />
                            <Input label="Date Received (OR)" type="date" value={data.date_received} onChange={(e) => setData('date_received', e.target.value)} error={errors.date_received} />
                        </FormRow>
                        <Input label="Date Filed (Embassy)" type="date" value={data.date_filed} onChange={(e) => setData('date_filed', e.target.value)} error={errors.date_filed} />

                        <Textarea
                            label="Notes"
                            placeholder="Any follow-ups, flags, or special instructions..."
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            error={errors.notes}
                        />
                    </FormCard>

                    <FormActions>
                        <FormCancelButton onClick={() => history.back()} />
                        <FormSubmitButton loading={processing} />
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
