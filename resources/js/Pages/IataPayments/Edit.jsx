import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import Card from '../../Components/UI/Card';

export default function IataPaymentsEdit({ payment, operators }) {
    const { flash } = usePage().props;

    const form = useForm({
        contact_id        : payment.contact_id        ? String(payment.contact_id) : '',
        operator_name     : payment.operator_name     ?? '',
        billing_reference : payment.billing_reference ?? '',
        billing_date      : payment.billing_date      ?? '',
        due_date          : payment.due_date          ?? '',
        amount            : payment.amount            ?? '',
        remarks           : payment.remarks           ?? '',
    });

    const operatorOptions = [
        { value: '', label: 'Select operator (optional)…' },
        ...operators.map(o => ({ value: String(o.id), label: o.name })),
    ];

    function handleOperatorSelect(e) {
        const v = e.target.value;
        form.setData('contact_id', v);
        if (v) {
            const match = operators.find(o => String(o.id) === v);
            if (match) form.setData('operator_name', match.name);
        }
    }

    function submit(e) {
        e.preventDefault();
        form.patch(route('iata.update', payment.id));
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

                <PageHeader
                    title="Edit IATA Payment"
                    subtitle={payment.payment_no}
                    actions={
                        <Button
                            variant="ghost"
                            icon={ArrowLeft}
                            onClick={() => router.visit(route('iata.show', payment.id))}
                        >
                            Back
                        </Button>
                    }
                />

                <Card>
                    <form onSubmit={submit} className="flex flex-col" style={{ gap: 'var(--space-3)' }}>

                        <Select
                            label="Operator (from Directory)"
                            options={operatorOptions}
                            value={form.data.contact_id}
                            onChange={handleOperatorSelect}
                            error={form.errors.contact_id}
                        />

                        <Input
                            label="Operator Name"
                            placeholder="Name stored on record"
                            value={form.data.operator_name}
                            onChange={(e) => form.setData('operator_name', e.target.value)}
                            error={form.errors.operator_name}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                            <Input
                                label="Billing Reference"
                                placeholder="Confirmation # from operator"
                                value={form.data.billing_reference}
                                onChange={(e) => form.setData('billing_reference', e.target.value)}
                                error={form.errors.billing_reference}
                            />
                            <Input
                                label="Billing Date"
                                type="date"
                                value={form.data.billing_date}
                                onChange={(e) => form.setData('billing_date', e.target.value)}
                                error={form.errors.billing_date}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                            <Input
                                label="Amount (PHP)"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.data.amount}
                                onChange={(e) => form.setData('amount', e.target.value)}
                                error={form.errors.amount}
                            />
                            <Input
                                label="Due Date"
                                type="date"
                                value={form.data.due_date}
                                onChange={(e) => form.setData('due_date', e.target.value)}
                                error={form.errors.due_date}
                            />
                        </div>

                        <Textarea
                            label="Remarks"
                            value={form.data.remarks}
                            onChange={(e) => form.setData('remarks', e.target.value)}
                            error={form.errors.remarks}
                            rows={3}
                        />

                        <div className="flex justify-end" style={{ gap: 'var(--space-2)' }}>
                            <Button variant="ghost" onClick={() => router.visit(route('iata.show', payment.id))} type="button">
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" loading={form.processing} disabled={form.processing}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppShell>
    );
}
