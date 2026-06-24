import { useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
;
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions, FormCancelButton, FormEditButton, FormSubmitButton } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function CreditCardCreate({ cards }) {
    const form = useForm({
        credit_card_id: '',
        amount        : '',
        due_date      : '',
        statement_date: '',
        remarks       : '',
    });

    const cardOptions = [
        { value: '', label: 'Select card...' },
        ...cards.map((c) => ({
            value: String(c.id),
            label: `${c.card_name}${c.bank_name ? ` – ${c.bank_name}` : ''}${c.last_four ? ` (••${c.last_four})` : ''}`,
        })),
    ];

    const selectedCard = cards.find((c) => String(c.id) === String(form.data.credit_card_id));

    useEffect(() => {
        if (selectedCard?.due_day && !form.data.due_date) {
            const today     = new Date();
            const dueDay    = selectedCard.due_day;
            const candidate = new Date(today.getFullYear(), today.getMonth(), dueDay);
            if (candidate < today) candidate.setMonth(candidate.getMonth() + 1);
            form.setData('due_date', candidate.toISOString().split('T')[0]);
        }
    }, [form.data.credit_card_id]);

    function submit(e) {
        e.preventDefault();
        form.post(route('credit-cards.store'));
    }

    return (
        <AppShell>
            <form
                onSubmit={submit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout columns={2}>
                    <PageHeader
                        breadcrumb={[{ label: 'Credit Cards', href: route('credit-cards.index') }]}
                        title="Record Payment"
                        subtitle="Log a credit card payment"
                        actions={
                            <>
                                <FormCancelButton onClick={() => router.visit(route('credit-cards.index'))} />
                                <FormSubmitButton loading={form.processing} />
                            </>
                        }
                    />

                    <FormCard title="Payment Details">
                        <Select
                            label="Credit Card"
                            required
                            options={cardOptions}
                            value={form.data.credit_card_id}
                            onChange={(e) => form.setData('credit_card_id', e.target.value)}
                            error={form.errors.credit_card_id}
                        />

                        {selectedCard && (
                            <div
                                className="font-body text-[var(--color-text-muted)]"
                                style={{
                                    padding     : 'var(--space-2)',
                                    background  : 'var(--color-bg)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize    : 'var(--font-size-small)',
                                    border      : 'var(--border-container)',
                                }}
                            >
                                {selectedCard.bank_name && <span>Bank: <strong>{selectedCard.bank_name}</strong> &nbsp;·&nbsp; </span>}
                                {selectedCard.statement_cut_off && <span>Cut-off: Day {selectedCard.statement_cut_off} &nbsp;·&nbsp; </span>}
                                {selectedCard.due_day && <span>Due: Day {selectedCard.due_day}</span>}
                            </div>
                        )}

                        <Input
                            label="Amount (PHP)"
                            required
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            value={form.data.amount}
                            onChange={(e) => form.setData('amount', e.target.value)}
                            error={form.errors.amount}
                        />
                        <FormRow>
                            <Input label="Due Date" required type="date" value={form.data.due_date} onChange={(e) => form.setData('due_date', e.target.value)} error={form.errors.due_date} />
                            <Input label="Statement Date" type="date" value={form.data.statement_date} onChange={(e) => form.setData('statement_date', e.target.value)} error={form.errors.statement_date} />
                        </FormRow>
                        <Textarea label="Remarks" value={form.data.remarks} onChange={(e) => form.setData('remarks', e.target.value)} error={form.errors.remarks} rows={3} />
                    </FormCard>

                    <FormActions>
                        <FormCancelButton onClick={() => router.visit(route('credit-cards.index'))} />
                        <FormSubmitButton loading={form.processing} />
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}