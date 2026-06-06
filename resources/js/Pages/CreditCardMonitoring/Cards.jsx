import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { Plus, Pencil, CreditCard as CardIcon, ArrowLeft } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Card from '../../Components/UI/Card';
import Modal from '../../Components/UI/Modal';
import Input from '../../Components/UI/Input';
import Textarea from '../../Components/UI/Textarea';

function InfoItem({ label, value }) {
    return (
        <div className="flex flex-col" style={{ gap: 2 }}>
            <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                {label}
            </span>
            <span className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                {value}
            </span>
        </div>
    );
}

function CardForm({ card, onClose }) {
    const form = useForm({
        card_name:         card?.card_name         ?? '',
        bank_name:         card?.bank_name         ?? '',
        last_four:         card?.last_four         ?? '',
        statement_cut_off: card?.statement_cut_off ?? '',
        due_day:           card?.due_day           ?? '',
        is_active:         card?.is_active         ?? true,
        notes:             card?.notes             ?? '',
    });

    function submit(e) {
        e.preventDefault();
        if (card) {
            form.patch(route('credit-cards.cards.update', card.id), { onSuccess: onClose });
        } else {
            form.post(route('credit-cards.cards.store'), { onSuccess: onClose });
        }
    }

    return (
        <form onSubmit={submit} className="flex flex-col" style={{ gap: 'var(--space-3)' }}>
            <Input
                label="Card Name"
                placeholder="e.g. BDO Corporate Visa"
                value={form.data.card_name}
                onChange={(e) => form.setData('card_name', e.target.value)}
                error={form.errors.card_name}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <Input
                    label="Bank"
                    placeholder="e.g. BDO, BPI"
                    value={form.data.bank_name}
                    onChange={(e) => form.setData('bank_name', e.target.value)}
                    error={form.errors.bank_name}
                />
                <Input
                    label="Last 4 Digits"
                    placeholder="e.g. 4321"
                    maxLength={4}
                    value={form.data.last_four}
                    onChange={(e) => form.setData('last_four', e.target.value)}
                    error={form.errors.last_four}
                />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <Input
                    label="Statement Cut-off Day"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="e.g. 25"
                    value={form.data.statement_cut_off}
                    onChange={(e) => form.setData('statement_cut_off', e.target.value)}
                    error={form.errors.statement_cut_off}
                />
                <Input
                    label="Payment Due Day"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="e.g. 15"
                    value={form.data.due_day}
                    onChange={(e) => form.setData('due_day', e.target.value)}
                    error={form.errors.due_day}
                />
            </div>
            {card && (
                <label className="flex items-center font-body text-[var(--color-text)]" style={{ gap: 'var(--space-1)', fontSize: 'var(--font-size-body)' }}>
                    <input
                        type="checkbox"
                        checked={form.data.is_active}
                        onChange={(e) => form.setData('is_active', e.target.checked)}
                        style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
                    />
                    Active
                </label>
            )}
            <Textarea
                label="Notes"
                value={form.data.notes}
                onChange={(e) => form.setData('notes', e.target.value)}
                rows={2}
            />
            <div className="flex justify-end" style={{ gap: 'var(--space-2)' }}>
                <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                <Button variant="primary" type="submit" loading={form.processing} disabled={form.processing}>
                    {card ? 'Save Changes' : 'Add Card'}
                </Button>
            </div>
        </form>
    );
}

export default function CreditCardCards({ cards, canWrite }) {
    const { flash } = usePage().props;
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState(null);

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

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
                    title="Credit Cards"
                    subtitle={`${cards.length} card${cards.length !== 1 ? 's' : ''} registered`}
                    actions={
                        <div className="flex" style={{ gap: 'var(--space-2)' }}>
                            <Button
                                variant="ghost"
                                icon={ArrowLeft}
                                onClick={() => router.visit(route('credit-cards.index'))}
                            >
                                Payments
                            </Button>
                            {canWrite && (
                                <Button
                                    variant="primary"
                                    icon={Plus}
                                    onClick={() => setShowAdd(true)}
                                >
                                    Add Card
                                </Button>
                            )}
                        </div>
                    }
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-3)' }}>
                    {cards.length === 0 && (
                        <p className="font-body text-[var(--color-text)]" style={{
                            fontSize  : 'var(--font-size-body)',
                            opacity   : 0.5,
                            gridColumn: '1/-1',
                            textAlign : 'center',
                            padding   : 'var(--space-6)',
                        }}>
                            No credit cards registered yet.
                        </p>
                    )}

                    {cards.map(card => (
                        <Card key={card.id}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
                                    <CardIcon size={20} style={{ color: 'var(--color-primary)' }} />
                                    <span className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)' }}>
                                        {card.card_name}
                                    </span>
                                </div>
                                <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
                                    <Badge variant={card.is_active ? 'success' : 'neutral'}>
                                        {card.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    {canWrite && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={Pencil}
                                            onClick={() => setEditing(card)}
                                        />
                                    )}
                                </div>
                            </div>

                            <div style={{ marginTop: 'var(--space-2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-1)' }}>
                                <InfoItem label="Bank"       value={card.bank_name ?? '—'} />
                                <InfoItem label="Last 4"     value={card.last_four ? `•••• ${card.last_four}` : '—'} />
                                <InfoItem label="Cut-off Day" value={card.statement_cut_off ? `Day ${card.statement_cut_off}` : '—'} />
                                <InfoItem label="Due Day"    value={card.due_day ? `Day ${card.due_day}` : '—'} />
                                <InfoItem label="Payments"   value={card.payments_count ?? 0} />
                            </div>

                            {card.notes && (
                                <p className="font-body text-[var(--color-text)]" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-small)', opacity: 0.65 }}>
                                    {card.notes}
                                </p>
                            )}
                        </Card>
                    ))}
                </div>

                {/* Add Card Modal */}
                <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Credit Card">
                    <CardForm onClose={() => setShowAdd(false)} />
                </Modal>

                {/* Edit Card Modal */}
                <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit — ${editing?.card_name ?? ''}`}>
                    {editing && <CardForm card={editing} onClose={() => setEditing(null)} />}
                </Modal>
            </div>
        </AppShell>
    );
}
