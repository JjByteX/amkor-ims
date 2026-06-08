import { router, useForm } from '@inertiajs/react';
import { Save, X, AlertTriangle } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function APEdit({ payable, currencies, paymentModes, statuses }) {
    const { data, setData, put, processing, errors } = useForm({
        supplier_name:      payable.supplier_name      ?? '',
        invoice_no:         payable.invoice_no         ?? '',
        requisition_no:     payable.requisition_no     ?? '',
        invoice_date:       payable.invoice_date       ?? '',
        currency:           payable.currency           ?? 'PHP',
        invoice_amount_php: payable.invoice_amount_php ?? '',
        invoice_amount_usd: payable.invoice_amount_usd ?? '',
        invoice_amount_jpy: payable.invoice_amount_jpy ?? '',
        payment_php:        payable.payment_php        ?? '',
        payment_usd:        payable.payment_usd        ?? '',
        payment_jpy:        payable.payment_jpy        ?? '',
        due_date:           payable.due_date           ?? '',
        payment_date:       payable.payment_date       ?? '',
        mode_of_payment:    payable.mode_of_payment    ?? '',
        account_no:         payable.account_no         ?? '',
        acr:                payable.acr                ?? '',
        check_no:           payable.check_no           ?? '',
        remarks:            payable.remarks            ?? '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        put(route('ap.update', payable.id));
    }

    const isCash = data.currency === 'USD';

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
                        title={`Edit Payable — ${payable.supplier_name}`}
                        subtitle="Update payable details"
                        actions={
                            <>
                                <Button type="button" variant="ghost" icon={X} onClick={() => router.get(route('ap.show', payable.id))}>Cancel</Button>
                                <Button type="submit" variant="primary" icon={Save} loading={processing}>Save Changes</Button>
                            </>
                        }
                    />

                    {/* Card 1 — Supplier & Invoice */}
                    <FormCard title="Supplier & Invoice">
                        <Input label="Supplier Name *" value={data.supplier_name} onChange={(e) => setData('supplier_name', e.target.value)} error={errors.supplier_name} placeholder="Operator / supplier name" required />
                        <FormRow>
                            <Input label="Invoice #" value={data.invoice_no} onChange={(e) => setData('invoice_no', e.target.value)} error={errors.invoice_no} placeholder="Invoice number" />
                            <Input label="Requisition #" value={data.requisition_no} onChange={(e) => setData('requisition_no', e.target.value)} error={errors.requisition_no} placeholder="Req. number" />
                        </FormRow>
                        <FormRow>
                            <Input label="Invoice Date" type="date" value={data.invoice_date} onChange={(e) => setData('invoice_date', e.target.value)} error={errors.invoice_date} />
                            <Input label="Due Date" type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} error={errors.due_date} />
                        </FormRow>
                        <Input label="ACR" value={data.acr} onChange={(e) => setData('acr', e.target.value)} error={errors.acr} placeholder="ACR reference" />
                    </FormCard>

                    {/* Card 2 — Amounts */}
                    <FormCard title="Amounts">
                        <Select label="Primary Currency *" options={currencyOptions} value={data.currency} onChange={(e) => setData('currency', e.target.value)} error={errors.currency} />
                        {isCash && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 'var(--radius-md)' }}>
                                <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                                <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-warning)' }}>
                                    USD invoices are always settled in cash (not check).
                                </p>
                            </div>
                        )}
                        <FormRow>
                            <Input label="PHP Amount" type="number" step="0.01" placeholder="0.00" value={data.invoice_amount_php} onChange={(e) => setData('invoice_amount_php', e.target.value)} error={errors.invoice_amount_php} disabled={data.currency !== 'PHP'} />
                            <Input label="Payment PHP" type="number" step="0.01" placeholder="0.00" value={data.payment_php} onChange={(e) => setData('payment_php', e.target.value)} error={errors.payment_php} />
                        </FormRow>
                        <FormRow>
                            <Input label="USD Amount" type="number" step="0.01" placeholder="0.00" value={data.invoice_amount_usd} onChange={(e) => setData('invoice_amount_usd', e.target.value)} error={errors.invoice_amount_usd} disabled={data.currency !== 'USD'} />
                            <Input label="Payment USD" type="number" step="0.01" placeholder="0.00" value={data.payment_usd} onChange={(e) => setData('payment_usd', e.target.value)} error={errors.payment_usd} />
                        </FormRow>
                        <FormRow>
                            <Input label="JPY Amount" type="number" step="0.01" placeholder="0" value={data.invoice_amount_jpy} onChange={(e) => setData('invoice_amount_jpy', e.target.value)} error={errors.invoice_amount_jpy} disabled={data.currency !== 'JPY'} />
                            <Input label="Payment JPY" type="number" step="0.01" placeholder="0" value={data.payment_jpy} onChange={(e) => setData('payment_jpy', e.target.value)} error={errors.payment_jpy} />
                        </FormRow>
                        <Input label="Payment Date" type="date" value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} error={errors.payment_date} />
                    </FormCard>

                    {/* Card 3 — Payment Method & Remarks */}
                    <FormCard title="Payment Method & Remarks">
                        <Select
                            label="Mode of Payment"
                            options={paymentOptions}
                            value={isCash ? 'cash' : data.mode_of_payment}
                            onChange={(e) => setData('mode_of_payment', e.target.value)}
                            error={errors.mode_of_payment}
                            disabled={isCash}
                        />
                        <FormRow>
                            <Input label="Account #" value={data.account_no} onChange={(e) => setData('account_no', e.target.value)} error={errors.account_no} placeholder="Bank account number" />
                            {(data.mode_of_payment === 'check' && !isCash) && (
                                <Input label="Check #" value={data.check_no} onChange={(e) => setData('check_no', e.target.value)} error={errors.check_no} placeholder="Check number" />
                            )}
                        </FormRow>
                        <Textarea label="Remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} error={errors.remarks} rows={3} placeholder="Additional notes..." />
                    </FormCard>

                    <FormActions>
                        <Button type="button" variant="ghost" icon={X} onClick={() => router.get(route('ap.show', payable.id))}>Cancel</Button>
                        <Button type="submit" variant="primary" icon={Save} loading={processing}>Save Changes</Button>
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
