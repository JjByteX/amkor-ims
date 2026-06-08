import { useForm, router } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function VisaEdit({ application, visaTypes, agentCodes, statuses, paymentModes }) {

    const { data, setData, put, processing, errors } = useForm({
        agent_code       : application.agent_code       ?? '',
        date             : application.date             ?? '',
        agency           : application.agency           ?? '',
        customer_name    : application.customer_name    ?? '',
        visa_type        : application.visa_type        ?? '',
        selling_price    : application.selling_price    ?? '',
        net_payable      : application.net_payable      ?? '',
        income           : application.income           ?? '',
        status           : application.status           ?? 'pending',
        notes            : application.notes            ?? '',
        mode_of_payment  : application.mode_of_payment  ?? '',
        payment_date     : application.payment_date     ?? '',
        soa_number       : application.soa_number       ?? '',
        si_number        : application.si_number        ?? '',
        ar_number        : application.ar_number        ?? '',
        payment_due_date : application.payment_due_date ?? '',
    });

    function handleFinancialChange(field, value) {
        const next = { ...data, [field]: value };
        const sp   = parseFloat(next.selling_price) || 0;
        const np   = parseFloat(next.net_payable)   || 0;
        setData({ ...next, income: sp && np ? (sp - np).toFixed(2) : next.income });
    }

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
                <FormLayout columns={2}>
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
                        <Input label="Agency" value={data.agency} onChange={(e) => setData('agency', e.target.value)} error={errors.agency} />
                        <Input label="Customer Name *" value={data.customer_name} onChange={(e) => setData('customer_name', e.target.value)} error={errors.customer_name} />
                        <Select label="Visa / Service Type *" options={visaTypeOptions} value={data.visa_type} onChange={(e) => setData('visa_type', e.target.value)} error={errors.visa_type} />
                    </FormCard>

                    {/* Card 2 — Pricing, Payment & References */}
                    <FormCard title="Pricing, Payment & References">
                        <FormRow>
                            <Input label="Selling Price (SP)" type="number" value={data.selling_price} onChange={(e) => handleFinancialChange('selling_price', e.target.value)} error={errors.selling_price} />
                            <Input label="Net Payable (NP)" type="number" value={data.net_payable} onChange={(e) => handleFinancialChange('net_payable', e.target.value)} error={errors.net_payable} />
                        </FormRow>
                        <Input label="Income" type="number" value={data.income} onChange={(e) => setData('income', e.target.value)} error={errors.income} />
                        <Select label="Status" options={statusOptions} value={data.status} onChange={(e) => setData('status', e.target.value)} error={errors.status} />
                        <FormRow>
                            <Select label="Mode of Payment" options={[{ value: '', label: 'Select mode...' }, ...paymentOptions]} value={data.mode_of_payment} onChange={(e) => setData('mode_of_payment', e.target.value)} error={errors.mode_of_payment} />
                            <Input label="Payment Date" type="date" value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} error={errors.payment_date} />
                        </FormRow>
                        <Input label="Payment Due Date (Embassy)" type="date" value={data.payment_due_date} onChange={(e) => setData('payment_due_date', e.target.value)} error={errors.payment_due_date} />
                        <FormRow>
                            <Input label="SOA #" value={data.soa_number} onChange={(e) => setData('soa_number', e.target.value)} error={errors.soa_number} />
                            <Input label="SI #"  value={data.si_number}  onChange={(e) => setData('si_number',  e.target.value)} error={errors.si_number}  />
                        </FormRow>
                        <Input label="AR #" value={data.ar_number} onChange={(e) => setData('ar_number', e.target.value)} error={errors.ar_number} />
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
