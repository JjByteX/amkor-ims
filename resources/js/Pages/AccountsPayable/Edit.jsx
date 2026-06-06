import { router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
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

    return (
        <AppShell>
            <PageHeader
                title={`Edit Payable — ${payable.supplier_name}`}
                subtitle="Update payable details"
                action={
                    <Button
                        variant="ghost"
                        icon={<ArrowLeft size={16} />}
                        onClick={() => router.get(route('ap.show', payable.id))}
                    >
                        Cancel
                    </Button>
                }
            />

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

                    {/* Left column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        <Card padding="p-6">
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>
                                Supplier &amp; Invoice
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <Input
                                        label="Supplier Name *"
                                        value={data.supplier_name}
                                        onChange={(e) => setData('supplier_name', e.target.value)}
                                        error={errors.supplier_name}
                                        placeholder="Operator / supplier name"
                                    />
                                </div>
                                <Input
                                    label="Invoice #"
                                    value={data.invoice_no}
                                    onChange={(e) => setData('invoice_no', e.target.value)}
                                    error={errors.invoice_no}
                                    placeholder="Invoice number"
                                />
                                <Input
                                    label="Requisition #"
                                    value={data.requisition_no}
                                    onChange={(e) => setData('requisition_no', e.target.value)}
                                    error={errors.requisition_no}
                                    placeholder="Req. number"
                                />
                                <Input
                                    label="Invoice Date"
                                    type="date"
                                    value={data.invoice_date}
                                    onChange={(e) => setData('invoice_date', e.target.value)}
                                    error={errors.invoice_date}
                                />
                                <Input
                                    label="Due Date"
                                    type="date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                    error={errors.due_date}
                                />
                                <Input
                                    label="ACR"
                                    value={data.acr}
                                    onChange={(e) => setData('acr', e.target.value)}
                                    error={errors.acr}
                                    placeholder="ACR reference"
                                />
                            </div>
                        </Card>

                        <Card padding="p-6">
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 8 }}>
                                Invoice Amount
                            </h2>
                            <div style={{ marginBottom: 12 }}>
                                <Select
                                    label="Primary Currency *"
                                    value={data.currency}
                                    onChange={(e) => setData('currency', e.target.value)}
                                    error={errors.currency}
                                    options={Object.entries(currencies).map(([v, l]) => ({ value: v, label: l }))}
                                />
                            </div>
                            {isCash && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
                                    <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                                    <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-warning)' }}>
                                        USD invoices are always settled in cash (not check).
                                    </p>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <Input
                                    label="PHP Amount"
                                    type="number"
                                    step="0.01"
                                    value={data.invoice_amount_php}
                                    onChange={(e) => setData('invoice_amount_php', e.target.value)}
                                    error={errors.invoice_amount_php}
                                    placeholder="0.00"
                                    disabled={data.currency !== 'PHP'}
                                />
                                <Input
                                    label="USD Amount"
                                    type="number"
                                    step="0.01"
                                    value={data.invoice_amount_usd}
                                    onChange={(e) => setData('invoice_amount_usd', e.target.value)}
                                    error={errors.invoice_amount_usd}
                                    placeholder="0.00"
                                    disabled={data.currency !== 'USD'}
                                />
                                <Input
                                    label="JPY Amount"
                                    type="number"
                                    step="0.01"
                                    value={data.invoice_amount_jpy}
                                    onChange={(e) => setData('invoice_amount_jpy', e.target.value)}
                                    error={errors.invoice_amount_jpy}
                                    placeholder="0"
                                    disabled={data.currency !== 'JPY'}
                                />
                            </div>
                        </Card>

                        <Card padding="p-6">
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>
                                Payment Received
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <Input
                                    label="Payment PHP"
                                    type="number"
                                    step="0.01"
                                    value={data.payment_php}
                                    onChange={(e) => setData('payment_php', e.target.value)}
                                    error={errors.payment_php}
                                    placeholder="0.00"
                                />
                                <Input
                                    label="Payment USD"
                                    type="number"
                                    step="0.01"
                                    value={data.payment_usd}
                                    onChange={(e) => setData('payment_usd', e.target.value)}
                                    error={errors.payment_usd}
                                    placeholder="0.00"
                                />
                                <Input
                                    label="Payment JPY"
                                    type="number"
                                    step="0.01"
                                    value={data.payment_jpy}
                                    onChange={(e) => setData('payment_jpy', e.target.value)}
                                    error={errors.payment_jpy}
                                    placeholder="0"
                                />
                                <Input
                                    label="Payment Date"
                                    type="date"
                                    value={data.payment_date}
                                    onChange={(e) => setData('payment_date', e.target.value)}
                                    error={errors.payment_date}
                                />
                            </div>
                        </Card>

                        <Card padding="p-6">
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>
                                Payment Method
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <Select
                                    label="Mode of Payment"
                                    value={isCash ? 'cash' : data.mode_of_payment}
                                    onChange={(e) => setData('mode_of_payment', e.target.value)}
                                    error={errors.mode_of_payment}
                                    disabled={isCash}
                                    options={[
                                        { value: '', label: 'Select...' },
                                        ...Object.entries(paymentModes).map(([v, l]) => ({ value: v, label: l })),
                                    ]}
                                />
                                <Input
                                    label="Account #"
                                    value={data.account_no}
                                    onChange={(e) => setData('account_no', e.target.value)}
                                    error={errors.account_no}
                                    placeholder="Bank account number"
                                />
                                {(data.mode_of_payment === 'check' && !isCash) && (
                                    <Input
                                        label="Check #"
                                        value={data.check_no}
                                        onChange={(e) => setData('check_no', e.target.value)}
                                        error={errors.check_no}
                                        placeholder="Check number"
                                    />
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Card padding="p-6">
                            <Textarea
                                label="Remarks"
                                value={data.remarks}
                                onChange={(e) => setData('remarks', e.target.value)}
                                error={errors.remarks}
                                rows={4}
                                placeholder="Additional notes..."
                            />
                        </Card>

                        <Button
                            type="submit"
                            variant="primary"
                            loading={processing}
                            icon={<Save size={16} />}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </form>
        </AppShell>
    );
}
