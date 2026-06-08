import { useForm } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function VisaCreate({ visaTypes, agentCodes, statuses, paymentModes }) {
    const { data, setData, post, processing, errors } = useForm({
        agent_code      : '',
        date            : new Date().toISOString().slice(0, 10),
        agency          : '',
        customer_name   : '',
        visa_type       : '',
        selling_price   : '',
        net_payable     : '',
        income          : '',
        status          : 'pending',
        notes           : '',
        mode_of_payment : '',
        payment_date    : '',
        soa_number      : '',
        si_number       : '',
        ar_number       : '',
        payment_due_date: '',
    });

    function handleFinancialChange(field, value) {
        const next = { ...data, [field]: value };
        const sp   = parseFloat(next.selling_price) || 0;
        const np   = parseFloat(next.net_payable)   || 0;
        setData({ ...next, income: sp && np ? (sp - np).toFixed(2) : next.income });
    }

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
                <FormLayout split="2fr 3fr">
                    <PageHeader
                        breadcrumb={[{ label: 'Visa & Documentation', href: route('visa.index') }]}
                        title="New Application"
                        subtitle="Record a visa or documentation service"
                        actions={
                            <>
                                <Button type="button" variant="ghost" icon={X} onClick={() => history.back()}>Cancel</Button>
                                <Button type="submit" icon={Save} loading={processing}>Save Application</Button>
                            </>
                        }
                    />

                    {/* Card 1 — Client & Service */}
                    <FormCard title="Client & Service">
                        <FormRow>
                            <Select
                                label="Agent *"
                                options={[{ value: '', label: 'Select agent...' }, ...agentOptions]}
                                value={data.agent_code}
                                onChange={(e) => setData('agent_code', e.target.value)}
                                error={errors.agent_code}
                            />
                            <Input
                                label="Date *"
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                error={errors.date}
                            />
                        </FormRow>
                        <Input
                            label="Customer Name *"
                            placeholder="Full name of applicant"
                            value={data.customer_name}
                            onChange={(e) => setData('customer_name', e.target.value)}
                            error={errors.customer_name}
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
                                label="Visa / Service Type *"
                                options={[{ value: '', label: 'Select type...' }, ...visaOptions]}
                                value={data.visa_type}
                                onChange={(e) => setData('visa_type', e.target.value)}
                                error={errors.visa_type}
                            />
                        </FormRow>
                    </FormCard>

                    {/* Card 2 — Pricing, Payment & References */}
                    <FormCard title="Pricing, Payment & References">
                        <FormRow>
                            <Input
                                label="Selling Price (SP)"
                                type="number"
                                placeholder="0.00"
                                value={data.selling_price}
                                onChange={(e) => handleFinancialChange('selling_price', e.target.value)}
                                error={errors.selling_price}
                            />
                            <Input
                                label="Net Payable (NP)"
                                type="number"
                                placeholder="0.00"
                                value={data.net_payable}
                                onChange={(e) => handleFinancialChange('net_payable', e.target.value)}
                                error={errors.net_payable}
                            />
                        </FormRow>
                        <Input
                            label="Income (auto-computed)"
                            type="number"
                            placeholder="SP − NP"
                            value={data.income}
                            onChange={(e) => setData('income', e.target.value)}
                            error={errors.income}
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
                        <FormRow>
                            <Input label="SOA #" placeholder="SOA number" value={data.soa_number} onChange={(e) => setData('soa_number', e.target.value)} error={errors.soa_number} />
                            <Input label="SI #" placeholder="Service Invoice #" value={data.si_number} onChange={(e) => setData('si_number', e.target.value)} error={errors.si_number} />
                        </FormRow>
                        <Input label="AR #" placeholder="Acknowledgement Receipt #" value={data.ar_number} onChange={(e) => setData('ar_number', e.target.value)} error={errors.ar_number} />
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
                        <Button type="button" variant="ghost" icon={X} onClick={() => history.back()}>Cancel</Button>
                        <Button type="submit" icon={Save} loading={processing}>Save Application</Button>
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}