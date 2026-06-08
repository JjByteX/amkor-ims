import { router, useForm } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function BillsCreate({ billTypes, paymentModes }) {
    const form = useForm({
        bill_type      : '',
        name           : '',
        account_no     : '',
        provider       : '',
        amount         : '',
        due_date       : '',
        mode_of_payment: '',
        remarks        : '',
    });

    const typeOptions = [
        { value: '', label: 'Select type…' },
        ...Object.entries(billTypes).map(([v, l]) => ({ value: v, label: l })),
    ];
    const paymentOptions = [
        { value: '', label: 'Select mode…' },
        ...Object.entries(paymentModes).map(([v, l]) => ({ value: v, label: l })),
    ];

    function handleSubmit(e) {
        e.preventDefault();
        form.post(route('bills.store'));
    }

    return (
        <AppShell>
            <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout columns={2}>
                    <PageHeader
                        breadcrumb={[{ label: 'Bills & On-Ques', href: route('bills.index') }]}
                        title="Add Bill"
                        subtitle="Record a utility, membership, permit, or other recurring bill"
                        actions={
                            <>
                                <Button type="button" variant="ghost" icon={X} onClick={() => router.visit(route('bills.index'))}>Cancel</Button>
                                <Button type="submit" variant="primary" icon={Save} loading={form.processing}>Save Bill</Button>
                            </>
                        }
                    />

                    <FormCard title="Bill Details">
                        <Select label="Bill Type" options={typeOptions} value={form.data.bill_type} onChange={(e) => form.setData('bill_type', e.target.value)} error={form.errors.bill_type} required />
                        <Input label="Bill Name" placeholder="e.g. MERALCO, PLDT, BIR Annual Registration" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} required />
                        <FormRow>
                            <Input label="Provider" placeholder="e.g. Meralco" value={form.data.provider} onChange={(e) => form.setData('provider', e.target.value)} error={form.errors.provider} />
                            <Input label="Account No." value={form.data.account_no} onChange={(e) => form.setData('account_no', e.target.value)} error={form.errors.account_no} />
                        </FormRow>
                        <FormRow>
                            <Input label="Amount (PHP)" type="number" step="0.01" min="0" value={form.data.amount} onChange={(e) => form.setData('amount', e.target.value)} error={form.errors.amount} required />
                            <Input label="Due Date" type="date" value={form.data.due_date} onChange={(e) => form.setData('due_date', e.target.value)} error={form.errors.due_date} required />
                        </FormRow>
                        <Select label="Mode of Payment" options={paymentOptions} value={form.data.mode_of_payment} onChange={(e) => form.setData('mode_of_payment', e.target.value)} error={form.errors.mode_of_payment} />
                        <Textarea label="Remarks" rows={3} value={form.data.remarks} onChange={(e) => form.setData('remarks', e.target.value)} />
                    </FormCard>

                    <FormActions>
                        <Button type="button" variant="ghost" icon={X} onClick={() => router.visit(route('bills.index'))}>Cancel</Button>
                        <Button type="submit" variant="primary" icon={Save} loading={form.processing}>Save Bill</Button>
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}