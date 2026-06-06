import { useEffect } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import Card from '../../Components/UI/Card';

export default function CreditCardCreate({ cards }) {
    const { flash } = usePage().props;

    const form = useForm({
        credit_card_id : '',
        amount         : '',
        due_date       : '',
        statement_date : '',
        remarks        : '',
    });

    const cardOptions = [
        { value: '', label: 'Select card...' },
        ...cards.map(c => ({
            value: String(c.id),
            label: `${c.card_name}${c.bank_name ? ` – ${c.bank_name}` : ''}${c.last_four ? ` (••${c.last_four})` : ''}`,
        })),
    ];

    // Auto-fill due_date from selected card's due_day
    const selectedCard = cards.find(c => String(c.id) === String(form.data.credit_card_id));
    useEffect(() => {
        if (selectedCard?.due_day && !form.data.due_date) {
            const today = new Date();
            const dueDay = selectedCard.due_day;
            const candidate = new Date(today.getFullYear(), today.getMonth(), dueDay);
            if (candidate < today) {
                candidate.setMonth(candidate.getMonth() + 1);
            }
            form.setData('due_date', candidate.toISOString().split('T')[0]);
        }
    }, [form.data.credit_card_id]);

    function submit(e) {
        e.preventDefault();
        form.post(route('credit-cards.store'));
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

                <Button variant="ghost" icon={ArrowLeft} onClick={() => router.visit(route('credit-cards.index'))}>
                    Back to Payments
                </Button>

                <PageHeader title="Record Credit Card Payment" />

                <Card>
                    <form onSubmit={submit} className="flex flex-col" style={{ gap: 'var(--space-3)' }}>

                        <Select
                            label="Credit Card"
                            options={cardOptions}
                            value={form.data.credit_card_id}
                            onChange={(e) => form.setData('credit_card_id', e.target.value)}
                            error={form.errors.credit_card_id}
                        />

                        {selectedCard && (
                            <div className="font-body text-[var(--color-text)]" style={{
                                padding      : 'var(--space-2)',
                                background   : 'var(--color-bg)',
                                borderRadius : 'var(--radius-md)',
                                fontSize     : 'var(--font-size-small)',
                                opacity      : 0.8,
                            }}>
                                {selectedCard.bank_name && <span>Bank: {selectedCard.bank_name} &nbsp;·&nbsp; </span>}
                                {selectedCard.statement_cut_off && <span>Statement cut-off: Day {selectedCard.statement_cut_off} &nbsp;·&nbsp; </span>}
                                {selectedCard.due_day && <span>Payment due: Day {selectedCard.due_day}</span>}
                            </div>
                        )}

                        <Input
                            label="Amount (PHP)"
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            value={form.data.amount}
                            onChange={(e) => form.setData('amount', e.target.value)}
                            error={form.errors.amount}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                            <Input
                                label="Due Date"
                                type="date"
                                value={form.data.due_date}
                                onChange={(e) => form.setData('due_date', e.target.value)}
                                error={form.errors.due_date}
                            />
                            <Input
                                label="Statement Date"
                                type="date"
                                value={form.data.statement_date}
                                onChange={(e) => form.setData('statement_date', e.target.value)}
                                error={form.errors.statement_date}
                            />
                        </div>

                        <Textarea
                            label="Remarks"
                            value={form.data.remarks}
                            onChange={(e) => form.setData('remarks', e.target.value)}
                            error={form.errors.remarks}
                            rows={3}
                        />

                        <div className="flex justify-end" style={{ gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                            <Button variant="ghost" onClick={() => router.visit(route('credit-cards.index'))} type="button">Cancel</Button>
                            <Button variant="primary" type="submit" loading={form.processing} disabled={form.processing}>
                                Record Payment
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppShell>
    );
}
