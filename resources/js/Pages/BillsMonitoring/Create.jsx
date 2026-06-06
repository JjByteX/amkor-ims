import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import Card from '../../Components/UI/Card';

export default function BillsCreate({ billTypes, paymentModes }) {
    const { flash } = usePage().props;

    const form = useForm({
        bill_type:       '',
        name:            '',
        account_no:      '',
        provider:        '',
        amount:          '',
        due_date:        '',
        mode_of_payment: '',
        remarks:         '',
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
            <div className="flex flex-col gap-[var(--space-3)]" style={{ maxWidth: 600, margin: '0 auto' }}>

                {flash?.message && (
                    <div className="rounded font-body" style={{
                        padding     : 'var(--space-2)',
                        background  : flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                        color       : '#fff',
                        fontSize    : 'var(--font-size-small)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <Button variant="ghost" icon={ArrowLeft} onClick={() => router.visit(route('bills.index'))}>
                    Back to Bills
                </Button>

                <PageHeader title="Add Bill" subtitle="Record a utility, membership, permit, or other recurring bill" />

                <Card>
                    <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                        <Select
                            label="Bill Type"
                            options={typeOptions}
                            value={form.data.bill_type}
                            onChange={(e) => form.setData('bill_type', e.target.value)}
                            error={form.errors.bill_type}
                            required
                        />

                        <Input
                            label="Bill Name"
                            placeholder="e.g. MERALCO, PLDT, BIR Annual Registration"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            error={form.errors.name}
                            required
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                            <Input
                                label="Provider"
                                placeholder="e.g. Meralco"
                                value={form.data.provider}
                                onChange={(e) => form.setData('provider', e.target.value)}
                                error={form.errors.provider}
                            />
                            <Input
                                label="Account No."
                                value={form.data.account_no}
                                onChange={(e) => form.setData('account_no', e.target.value)}
                                error={form.errors.account_no}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                            <Input
                                label="Amount (PHP)"
                                type="number" step="0.01" min="0"
                                value={form.data.amount}
                                onChange={(e) => form.setData('amount', e.target.value)}
                                error={form.errors.amount}
                                required
                            />
                            <Input
                                label="Due Date"
                                type="date"
                                value={form.data.due_date}
                                onChange={(e) => form.setData('due_date', e.target.value)}
                                error={form.errors.due_date}
                                required
                            />
                        </div>

                        <Select
                            label="Mode of Payment"
                            options={paymentOptions}
                            value={form.data.mode_of_payment}
                            onChange={(e) => form.setData('mode_of_payment', e.target.value)}
                            error={form.errors.mode_of_payment}
                        />

                        <Textarea
                            label="Remarks"
                            rows={3}
                            value={form.data.remarks}
                            onChange={(e) => form.setData('remarks', e.target.value)}
                        />

                        <div className="flex justify-end" style={{ gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                            <Button variant="ghost" type="button" onClick={() => router.visit(route('bills.index'))}>Cancel</Button>
                            <Button variant="primary" type="submit" loading={form.processing}>Save Bill</Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppShell>
    );
}
