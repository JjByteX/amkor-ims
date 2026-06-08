import { useForm } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function APCreate({ currencies, paymentModes, statuses }) {
    const { data, setData, post, processing, errors } = useForm({
        supplier_name     : '',
        invoice_no        : '',
        requisition_no    : '',
        invoice_date      : '',
        due_date          : '',
        acr               : '',
        currency          : 'PHP',
        invoice_amount_php: '',
        invoice_amount_usd: '',
        invoice_amount_jpy: '',
        payment_php       : '',
        payment_usd       : '',
        payment_jpy       : '',
        payment_date      : '',
        mode_of_payment   : '',
        account_no        : '',
        check_no          : '',
        remarks           : '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('ap.store'));
    }

    const currencyOptions = [
        { value: '', label: 'Select currency...' },
        ...Object.entries(currencies).map(([v, l]) => ({ value: v, label: l })),
    ];
    const paymentOptions = [
        { value: '', label: 'Select mode...' },
        ...Object.entries(paymentModes).map(([v, l]) => ({ value: v, label: l })),
    ];

    return (
        <AppShell>
            <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout split="5fr 7fr 5fr">
                    <PageHeader
                        breadcrumb={[{ label: 'Accounts Payable', href: route('ap.index') }]}
                        title="New Payable"
                        subtitle="Record an operator payable — PHP, USD, or JPY"
                        actions={
                            <>
                                <Button type="button" variant="ghost" icon={X} onClick={() => router.get(route('ap.index'))}>Cancel</Button>
                                <Button type="submit" variant="primary" icon={Save} loading={processing}>Save Payable</Button>
                            </>
                        }
                    />

                    {/* Card 1 — Supplier & Invoice */}
                    <FormCard title="Supplier & Invoice">
                        <Input label="Supplier Name *" value={data.supplier_name} onChange={(e) => setData('supplier_name', e.target.value)} error={errors.supplier_name} required />
                        <FormRow>
                            <Input label="Invoice #" value={data.invoice_no} onChange={(e) => setData('invoice_no', e.target.value)} error={errors.invoice_no} />
                            <Input label="Requisition #" value={data.requisition_no} onChange={(e) => setData('requisition_no', e.target.value)} error={errors.requisition_no} />
                        </FormRow>
                        <FormRow>
                            <Input label="Invoice Date" type="date" value={data.invoice_date} onChange={(e) => setData('invoice_date', e.target.value)} error={errors.invoice_date} />
                            <Input label="Due Date" type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} error={errors.due_date} />
                        </FormRow>
                        <Input label="ACR" value={data.acr} onChange={(e) => setData('acr', e.target.value)} error={errors.acr} placeholder="ACR number" />
                    </FormCard>

                    {/* Card 2 — Amounts */}
                    <FormCard title="Amounts">
                        <Select label="Primary Currency *" options={currencyOptions} value={data.currency} onChange={(e) => setData('currency', e.target.value)} error={errors.currency} />
                        <FormRow>
                            <Input label="PHP Amount" type="number" step="0.01" placeholder="0.00" value={data.invoice_amount_php} onChange={(e) => setData('invoice_amount_php', e.target.value)} error={errors.invoice_amount_php} />
                            <Input label="Payment PHP" type="number" step="0.01" placeholder="0.00" value={data.payment_php} onChange={(e) => setData('payment_php', e.target.value)} error={errors.payment_php} />
                        </FormRow>
                        <FormRow>
                            <Input label="USD Amount" type="number" step="0.01" placeholder="0.00" value={data.invoice_amount_usd} onChange={(e) => setData('invoice_amount_usd', e.target.value)} error={errors.invoice_amount_usd} />
                            <Input label="Payment USD" type="number" step="0.01" placeholder="0.00" value={data.payment_usd} onChange={(e) => setData('payment_usd', e.target.value)} error={errors.payment_usd} />
                        </FormRow>
                        <FormRow>
                            <Input label="JPY Amount" type="number" step="0.01" placeholder="0.00" value={data.invoice_amount_jpy} onChange={(e) => setData('invoice_amount_jpy', e.target.value)} error={errors.invoice_amount_jpy} />
                            <Input label="Payment JPY" type="number" step="0.01" placeholder="0.00" value={data.payment_jpy} onChange={(e) => setData('payment_jpy', e.target.value)} error={errors.payment_jpy} />
                        </FormRow>
                        <Input label="Payment Date" type="date" value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} error={errors.payment_date} />
                    </FormCard>

                    {/* Card 3 — Payment Method & Remarks */}
                    <FormCard title="Payment Method & Remarks">
                        <Select label="Mode of Payment" options={paymentOptions} value={data.mode_of_payment} onChange={(e) => setData('mode_of_payment', e.target.value)} error={errors.mode_of_payment} />
                        <FormRow>
                            <Input label="Account #" value={data.account_no} onChange={(e) => setData('account_no', e.target.value)} error={errors.account_no} />
                            <Input label="Check #" value={data.check_no} onChange={(e) => setData('check_no', e.target.value)} error={errors.check_no} />
                        </FormRow>
                        <Textarea label="Remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} error={errors.remarks} rows={3} />
                    </FormCard>

                    <FormActions>
                        <Button type="button" variant="ghost" icon={X} onClick={() => router.get(route('ap.index'))}>Cancel</Button>
                        <Button type="submit" variant="primary" icon={Save} loading={processing}>Save Payable</Button>
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}