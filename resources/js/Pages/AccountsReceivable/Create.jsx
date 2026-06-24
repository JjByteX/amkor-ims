import { useForm } from '@inertiajs/react';
import { router } from '@inertiajs/react';
;
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions, FormCancelButton, FormEditButton, FormSubmitButton } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function ARCreate({ departments, statuses, defaultDept }) {
    const { data, setData, post, processing, errors } = useForm({
        department            : defaultDept ?? '',
        agent_code            : '',
        date                  : new Date().toISOString().slice(0, 10),
        customer_name         : '',
        corporate_account     : '',
        particulars           : '',
        travel_date           : '',
        terms                 : '',
        collectible_amount_php: '',
        collectible_amount_usd: '',
        payment_received_php  : '',
        payment_received_usd  : '',
        due_date              : '',
        or_number             : '',
        ar_number             : '',
        si_number             : '',
        remarks               : '',
    });

    const deptOptions = [
        { value: '', label: 'Select department...' },
        ...Object.entries(departments).map(([v, l]) => ({ value: v, label: l })),
    ];

    function handleSubmit(e) {
        e.preventDefault();
        post(route('ar.store'));
    }

    return (
        <AppShell>
            <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout split="2fr 3fr">
                    <PageHeader
                        breadcrumb={[{ label: 'Accounts Receivable', href: route('ar.index') }]}
                        title="New Collectible"
                        subtitle="Record an accounts receivable / collectible transaction"
                        actions={
                            <>
                                <FormCancelButton onClick={() => router.visit(route('ar.index'))} />
                                <FormSubmitButton loading={processing} />
                            </>
                        }
                    />

                    {/* Card 1 — Client & Transaction */}
                    <FormCard title="Client & Transaction">
                        <FormRow>
                            <Select label="Department" options={deptOptions} value={data.department} onChange={(e) => setData('department', e.target.value)} error={errors.department} required />
                            <Input label="Date" type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} error={errors.date} required />
                        </FormRow>
                        <Input label="Agent Code" placeholder="e.g. RT" value={data.agent_code} onChange={(e) => setData('agent_code', e.target.value)} error={errors.agent_code} />
                        <Input label="Customer Name" placeholder="Passenger / client name" value={data.customer_name} onChange={(e) => setData('customer_name', e.target.value)} error={errors.customer_name} required />
                        <Input label="Corporate Account / Travel Agency" placeholder="Optional" value={data.corporate_account} onChange={(e) => setData('corporate_account', e.target.value)} error={errors.corporate_account} />
                        <FormRow>
                            <Input label="Travel Date" type="date" value={data.travel_date} onChange={(e) => setData('travel_date', e.target.value)} error={errors.travel_date} />
                            <Input label="Terms" placeholder="e.g. Net 30" value={data.terms} onChange={(e) => setData('terms', e.target.value)} error={errors.terms} />
                        </FormRow>
                        <Textarea label="Particulars" placeholder="Trip details, destinations, services..." rows={3} value={data.particulars} onChange={(e) => setData('particulars', e.target.value)} error={errors.particulars} />
                    </FormCard>

                    {/* Card 2 — Financials & References */}
                    <FormCard title="Financials & References">
                        <FormRow>
                            <Input label="Collectible Amount (PHP)" type="number" step="0.01" placeholder="0.00" value={data.collectible_amount_php} onChange={(e) => setData('collectible_amount_php', e.target.value)} error={errors.collectible_amount_php} />
                            <Input label="Collectible Amount (USD)" type="number" step="0.01" placeholder="0.00" value={data.collectible_amount_usd} onChange={(e) => setData('collectible_amount_usd', e.target.value)} error={errors.collectible_amount_usd} />
                        </FormRow>
                        <FormRow>
                            <Input label="Payment Received (PHP)" type="number" step="0.01" placeholder="0.00" value={data.payment_received_php} onChange={(e) => setData('payment_received_php', e.target.value)} error={errors.payment_received_php} />
                            <Input label="Payment Received (USD)" type="number" step="0.01" placeholder="0.00" value={data.payment_received_usd} onChange={(e) => setData('payment_received_usd', e.target.value)} error={errors.payment_received_usd} />
                        </FormRow>
                        <Input label="Due Date" type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} error={errors.due_date} />
                        <FormRow>
                            <Input label="OR Number" placeholder="Official Receipt #" value={data.or_number} onChange={(e) => setData('or_number', e.target.value)} error={errors.or_number} />
                            <Input label="AR Number" placeholder="Acknowledgement Receipt #" value={data.ar_number} onChange={(e) => setData('ar_number', e.target.value)} error={errors.ar_number} />
                        </FormRow>
                        <Input label="SI Number" placeholder="Service Invoice #" value={data.si_number} onChange={(e) => setData('si_number', e.target.value)} error={errors.si_number} />
                        <Textarea label="Remarks" rows={2} value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} error={errors.remarks} />
                    </FormCard>

                    <FormActions>
                        <FormCancelButton onClick={() => router.visit(route('ar.index'))} />
                        <FormSubmitButton loading={processing} />
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}