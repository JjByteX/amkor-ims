import { router, useForm, usePage } from '@inertiajs/react';
;
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions, FormCancelButton, FormEditButton, FormSubmitButton } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function BillsEdit({ bill, billTypes, paymentModes }) {
    const { flash } = usePage().props;

    const form = useForm({
        bill_type:       bill.bill_type       ?? '',
        name:            bill.name            ?? '',
        account_no:      bill.account_no      ?? '',
        provider:        bill.provider        ?? '',
        amount:          bill.amount          ?? '',
        due_date:        bill.due_date        ?? '',
        mode_of_payment: bill.mode_of_payment ?? '',
        remarks:         bill.remarks         ?? '',
    });

    const billTypeOptions = Object.entries(billTypes).map(([value, label]) => ({ value, label }));
    const paymentModeOptions = [
        { value: '', label: 'Select payment mode' },
        ...Object.entries(paymentModes).map(([value, label]) => ({ value, label })),
    ];

    function submit(e) {
        e.preventDefault();
        form.patch(route('bills.update', bill.id));
    }

    return (
        <AppShell>
            <form
                onSubmit={submit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout>
                    <PageHeader
                        breadcrumb={[{ label: 'Bills', href: route('bills.index') }]}
                        title="Edit Bill"
                        subtitle={bill.name}
                        actions={
                            <>
                                <FormCancelButton onClick={() => router.visit(route('bills.index'))} />
                                <FormEditButton loading={form.processing} />
                            </>
                        }
                    />

                    <FormCard title="Bill Details">
                        <Select label="Bill Type" required options={billTypeOptions} value={form.data.bill_type} onChange={(e) => form.setData('bill_type', e.target.value)} error={form.errors.bill_type} />
                        <Input label="Bill Name" required placeholder="e.g. Globe Postpaid – Main Office" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} />
                        <FormRow>
                            <Input label="Account Number" placeholder="Optional" value={form.data.account_no} onChange={(e) => form.setData('account_no', e.target.value)} error={form.errors.account_no} />
                            <Input label="Provider" placeholder="e.g. Globe, MERALCO" value={form.data.provider} onChange={(e) => form.setData('provider', e.target.value)} error={form.errors.provider} />
                        </FormRow>
                        <FormRow>
                            <Input label="Amount (PHP)" required type="number" min="0" step="0.01" value={form.data.amount} onChange={(e) => form.setData('amount', e.target.value)} error={form.errors.amount} />
                            <Input label="Due Date" required type="date" value={form.data.due_date} onChange={(e) => form.setData('due_date', e.target.value)} error={form.errors.due_date} />
                        </FormRow>
                        <Select label="Mode of Payment" options={paymentModeOptions} value={form.data.mode_of_payment} onChange={(e) => form.setData('mode_of_payment', e.target.value)} error={form.errors.mode_of_payment} />
                        <Textarea label="Remarks" value={form.data.remarks} onChange={(e) => form.setData('remarks', e.target.value)} error={form.errors.remarks} rows={3} />
                    </FormCard>

                    <FormActions>
                        <FormCancelButton onClick={() => router.visit(route('bills.index'))} />
                        <FormEditButton loading={form.processing} />
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
