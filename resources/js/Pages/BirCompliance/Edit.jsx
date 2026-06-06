import { router, usePage, useForm } from '@inertiajs/react';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import Checkbox from '../../Components/UI/Checkbox';

const php = (v) =>
    v != null ? '₱ ' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

export default function BirEdit({ transaction, documentTypes, sourceTypes, paymentModes, vatRate, whtRate, atpNumber, months }) {
    const { flash } = usePage().props;

    const { data, setData, put, processing, errors } = useForm({
        document_type    : transaction.document_type     ?? 'AR',
        document_number  : transaction.document_number   ?? '',
        source_type      : transaction.source_type       ?? 'manual',
        client_name      : transaction.client_name       ?? '',
        tin              : transaction.tin               ?? '',
        address          : transaction.address           ?? '',
        business_style   : transaction.business_style    ?? '',
        gross_amount     : transaction.gross_amount      ?? '',
        sc_pwd_discount  : transaction.sc_pwd_discount   ?? '',
        withholding_tax  : transaction.withholding_tax   ?? '',
        is_vat_exempt    : Number(transaction.vat_exempt_sales) > 0,
        is_vat_zero_rated: Number(transaction.vat_zero_rated_sales) > 0,
        mode_of_payment  : transaction.mode_of_payment   ?? 'cash',
        check_number     : transaction.check_number      ?? '',
        transaction_date : transaction.transaction_date  ?? '',
        due_date         : transaction.due_date          ?? '',
        particulars      : transaction.particulars       ?? '',
        remarks          : transaction.remarks           ?? '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        put(route('bir.update', transaction.id));
    }

    const isSI  = data.document_type === 'SI';
    const isSOA = data.document_type === 'SOA';

    // Preview
    const gross        = parseFloat(data.gross_amount) || 0;
    const discount     = parseFloat(data.sc_pwd_discount) || 0;
    const wht          = parseFloat(data.withholding_tax) || 0;
    const vatExclusive = data.is_vat_exempt || data.is_vat_zero_rated ? gross : gross / (1 + vatRate / 100);
    const vatAmount    = data.is_vat_exempt || data.is_vat_zero_rated ? 0 : gross - vatExclusive;
    const netDue       = Math.max(0, gross - discount - wht);

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
                    title={`Edit — ${transaction.document_number ?? 'Transaction'}`}
                    subtitle={`${documentTypes[transaction.document_type] ?? transaction.document_type} · ${transaction.client_name}`}
                    actions={
                        <Button
                            variant="ghost"
                            icon={ArrowLeft}
                            onClick={() => router.get(route('bir.show', transaction.id))}
                        >
                            Back
                        </Button>
                    }
                />

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>

                        {/* Left column */}
                        <div className="flex flex-col" style={{ gap: 'var(--space-3)' }}>

                            {/* Document details */}
                            <Card>
                                <div className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)', marginBottom: 'var(--space-2)' }}>
                                    Document Details
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                                    <Select
                                        label="Document Type *"
                                        value={data.document_type}
                                        onChange={(e) => setData('document_type', e.target.value)}
                                        error={errors.document_type}
                                        options={Object.entries(documentTypes).map(([v, l]) => ({ value: v, label: `${v} — ${l}` }))}
                                    />
                                    <Input
                                        label="Document Number"
                                        value={data.document_number}
                                        onChange={(e) => setData('document_number', e.target.value)}
                                        error={errors.document_number}
                                    />
                                    <Select
                                        label="Source"
                                        value={data.source_type}
                                        onChange={(e) => setData('source_type', e.target.value)}
                                        error={errors.source_type}
                                        options={Object.entries(sourceTypes).map(([v, l]) => ({ value: v, label: l }))}
                                    />
                                    <Input
                                        label="Transaction Date *"
                                        type="date"
                                        value={data.transaction_date}
                                        onChange={(e) => setData('transaction_date', e.target.value)}
                                        error={errors.transaction_date}
                                    />
                                    {isSOA && (
                                        <Input
                                            label="Due Date"
                                            type="date"
                                            value={data.due_date}
                                            onChange={(e) => setData('due_date', e.target.value)}
                                            error={errors.due_date}
                                        />
                                    )}
                                </div>

                                {isSI && (
                                    <div className="flex items-center font-body" style={{
                                        marginTop   : 'var(--space-2)',
                                        padding     : '8px 12px',
                                        background  : '#FEF3C7',
                                        border      : '1px solid #F59E0B',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize    : 'var(--font-size-small)',
                                        color       : '#92400E',
                                        gap         : 'var(--space-1)',
                                    }}>
                                        <AlertCircle size={14} />
                                        Service Invoice — BIR ATP No. {atpNumber} will be printed.
                                    </div>
                                )}
                            </Card>

                            {/* Client */}
                            <Card>
                                <div className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)', marginBottom: 'var(--space-2)' }}>
                                    Client Information
                                </div>
                                <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                                    <Input
                                        label="Client Name *"
                                        value={data.client_name}
                                        onChange={(e) => setData('client_name', e.target.value)}
                                        error={errors.client_name}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                                        <Input
                                            label="TIN"
                                            value={data.tin}
                                            onChange={(e) => setData('tin', e.target.value)}
                                            error={errors.tin}
                                            placeholder="000-000-000-00000"
                                        />
                                        <Input
                                            label="Business Style"
                                            value={data.business_style}
                                            onChange={(e) => setData('business_style', e.target.value)}
                                            error={errors.business_style}
                                        />
                                    </div>
                                    <Textarea
                                        label="Address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        error={errors.address}
                                        rows={2}
                                    />
                                </div>
                            </Card>

                            {/* Particulars */}
                            <Card>
                                <div className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)', marginBottom: 'var(--space-2)' }}>
                                    Particulars
                                </div>
                                <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                                    <Textarea
                                        label="Particulars / Description"
                                        value={data.particulars}
                                        onChange={(e) => setData('particulars', e.target.value)}
                                        error={errors.particulars}
                                        rows={3}
                                    />
                                    <Textarea
                                        label="Remarks (internal)"
                                        value={data.remarks}
                                        onChange={(e) => setData('remarks', e.target.value)}
                                        error={errors.remarks}
                                        rows={2}
                                    />
                                </div>
                            </Card>

                            {/* Payment */}
                            <Card>
                                <div className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)', marginBottom: 'var(--space-2)' }}>
                                    Payment Details
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                                    <Select
                                        label="Mode of Payment"
                                        value={data.mode_of_payment}
                                        onChange={(e) => setData('mode_of_payment', e.target.value)}
                                        error={errors.mode_of_payment}
                                        options={Object.entries(paymentModes).map(([v, l]) => ({ value: v, label: l }))}
                                    />
                                    {data.mode_of_payment === 'check' && (
                                        <Input
                                            label="Check Number"
                                            value={data.check_number}
                                            onChange={(e) => setData('check_number', e.target.value)}
                                            error={errors.check_number}
                                        />
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Right column — amounts */}
                        <div className="flex flex-col" style={{ gap: 'var(--space-3)' }}>
                            <Card>
                                <div className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)', marginBottom: 'var(--space-2)' }}>
                                    Amount
                                </div>
                                <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                                    <Input
                                        label="Gross Amount (VAT-inclusive) *"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.gross_amount}
                                        onChange={(e) => setData('gross_amount', e.target.value)}
                                        error={errors.gross_amount}
                                    />

                                    {isSI && (
                                        <>
                                            <Checkbox
                                                label="VAT Exempt"
                                                checked={data.is_vat_exempt}
                                                onChange={(e) => {
                                                    setData('is_vat_exempt', e.target.checked);
                                                    if (e.target.checked) setData('is_vat_zero_rated', false);
                                                }}
                                            />
                                            <Checkbox
                                                label="VAT Zero-Rated"
                                                checked={data.is_vat_zero_rated}
                                                onChange={(e) => {
                                                    setData('is_vat_zero_rated', e.target.checked);
                                                    if (e.target.checked) setData('is_vat_exempt', false);
                                                }}
                                            />
                                        </>
                                    )}

                                    <Input
                                        label="SC/PWD Discount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.sc_pwd_discount}
                                        onChange={(e) => setData('sc_pwd_discount', e.target.value)}
                                        error={errors.sc_pwd_discount}
                                    />
                                    <Input
                                        label={`Withholding Tax${isSI ? ` (${(whtRate * 100).toFixed(0)}%)` : ''}`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.withholding_tax}
                                        onChange={(e) => setData('withholding_tax', e.target.value)}
                                        error={errors.withholding_tax}
                                    />
                                </div>
                            </Card>

                            {/* Live preview */}
                            {gross > 0 && (
                                <Card compact style={{ background: 'var(--color-bg)' }}>
                                    <div className="font-heading font-semibold text-gray-400" style={{ fontSize: 'var(--font-size-small)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--space-1)' }}>
                                        Computed Preview
                                    </div>
                                    <div className="flex flex-col">
                                        {[
                                            { label: 'Gross Amount',           value: php(gross) },
                                            ...(isSI && !data.is_vat_exempt && !data.is_vat_zero_rated
                                                ? [
                                                    { label: `VATAble Sales`,     value: php(vatExclusive) },
                                                    { label: `VAT (${vatRate}%)`, value: php(vatAmount) },
                                                  ]
                                                : []),
                                            ...(discount > 0 ? [{ label: 'SC/PWD Discount', value: `- ${php(discount)}` }] : []),
                                            ...(wht > 0      ? [{ label: 'Withholding Tax',  value: `- ${php(wht)}` }]     : []),
                                        ].map((row) => (
                                            <div key={row.label} className="flex justify-between font-body" style={{ padding: '4px 0', fontSize: 'var(--font-size-small)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                                <span className="text-gray-400">{row.label}</span>
                                                <span className="text-[var(--color-text)]">{row.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between font-heading font-semibold" style={{ padding: '8px 0', fontSize: 'var(--font-size-body)', color: 'var(--color-primary)', borderTop: '2px solid var(--color-primary)', marginTop: 4 }}>
                                        <span>Net Amount Due</span>
                                        <span>{php(netDue)}</span>
                                    </div>
                                </Card>
                            )}

                            <Button
                                type="submit"
                                icon={Save}
                                disabled={processing}
                                loading={processing}
                                style={{ width: '100%' }}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppShell>
    );
}
