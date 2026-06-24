import { useEffect } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions, FormCancelButton, FormEditButton, FormSubmitButton } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import Checkbox from '../../Components/UI/Checkbox';

export default function BirCreate({ documentTypes, sourceTypes, paymentModes, vatRate, whtRate, atpNumber, months }) {
    const { data, setData, post, processing, errors } = useForm({
        document_type    : 'AR',
        document_number  : '',
        source_type      : 'manual',
        client_name      : '',
        tin              : '',
        address          : '',
        business_style   : '',
        gross_amount     : '',
        sc_pwd_discount  : '',
        withholding_tax  : '',
        is_vat_exempt    : false,
        is_vat_zero_rated: false,
        mode_of_payment  : 'cash',
        check_number     : '',
        transaction_date : '',
        due_date         : '',
        particulars      : '',
        remarks          : '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('bir.store'));
    }

    const isSI  = data.document_type === 'SI';
    const isAR  = data.document_type === 'AR';
    const isSOA = data.document_type === 'SOA';

    // Auto-fill WHT for SI
    useEffect(() => {
        if (isSI && data.gross_amount && !data.withholding_tax) {
            const gross = parseFloat(data.gross_amount) || 0;
            const vatExclusive = gross / (1 + vatRate / 100);
            const wht = parseFloat((vatExclusive * whtRate).toFixed(2));
            setData('withholding_tax', wht);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.document_type, data.gross_amount]);

    // Preview computed amounts
    const gross        = parseFloat(data.gross_amount) || 0;
    const discount     = parseFloat(data.sc_pwd_discount) || 0;
    const wht          = parseFloat(data.withholding_tax) || 0;
    const vatExclusive = data.is_vat_exempt || data.is_vat_zero_rated ? gross : gross / (1 + vatRate / 100);
    const vatAmount    = data.is_vat_exempt || data.is_vat_zero_rated ? 0 : gross - vatExclusive;
    const netDue       = Math.max(0, gross - discount - wht);
    const php = (v) => v != null ? '₱ ' + v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

    return (
        <AppShell>
            <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout split="5fr 7fr 5fr">
                    <PageHeader
                        breadcrumb={[{ label: 'BIR Compliance', href: route('bir.index') }]}
                        title="New BIR Transaction"
                        subtitle="Record an Acknowledgement Receipt, Service Invoice, or Statement of Account"
                        actions={
                            <>
                                <FormCancelButton onClick={() => router.get(route('bir.index'))} />
                                <FormSubmitButton loading={processing} />
                            </>
                        }
                    />

                    {/* Card 1 — Document & Client */}
                    <FormCard title="Document & Client">
                        <FormRow>
                            <Select
                                label="Document Type" required
                                value={data.document_type}
                                onChange={(e) => setData('document_type', e.target.value)}
                                error={errors.document_type}
                                options={Object.entries(documentTypes).map(([v, l]) => ({ value: v, label: `${v} — ${l}` }))}
                            />
                            <Input
                                label="Document Number (auto if blank)"
                                value={data.document_number}
                                onChange={(e) => setData('document_number', e.target.value)}
                                error={errors.document_number}
                                placeholder="Auto-generated"
                            />
                        </FormRow>
                        <FormRow>
                            <Select
                                label="Source"
                                value={data.source_type}
                                onChange={(e) => setData('source_type', e.target.value)}
                                error={errors.source_type}
                                options={Object.entries(sourceTypes).map(([v, l]) => ({ value: v, label: l }))}
                            />
                            <Input
                                label="Transaction Date" required
                                type="date"
                                value={data.transaction_date}
                                onChange={(e) => setData('transaction_date', e.target.value)}
                                error={errors.transaction_date}
                            />
                        </FormRow>
                        {isSOA && (
                            <Input label="Due Date" type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} error={errors.due_date} />
                        )}
                        {isSI && (
                            <div className="flex items-center font-body" style={{ padding: '8px 12px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-small)', color: '#92400E', gap: 'var(--space-1)' }}>
                                <AlertCircle size={14} />
                                Service Invoice — BIR ATP No. {atpNumber} will be printed. TIN is required.
                            </div>
                        )}
                        <Input label="Client Name" required value={data.client_name} onChange={(e) => setData('client_name', e.target.value)} error={errors.client_name} placeholder="Full name or company" />
                        <FormRow>
                            <Input label={`TIN${isAR || isSI ? ' (required for BIR)' : ''}`} value={data.tin} onChange={(e) => setData('tin', e.target.value)} error={errors.tin} />
                            <Input label="Business Style" value={data.business_style} onChange={(e) => setData('business_style', e.target.value)} error={errors.business_style} placeholder="Trade name (if any)" />
                        </FormRow>
                        <Textarea label="Address" value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} placeholder="Full address" rows={2} />
                    </FormCard>

                    {/* Card 2 — Amounts & Notes */}
                    <FormCard title="Amounts & Notes">
                        <Input label="Gross Amount (VAT-inclusive)" required type="number" step="0.01" min="0" value={data.gross_amount} onChange={(e) => setData('gross_amount', e.target.value)} error={errors.gross_amount} />
                        {isSI && (
                            <FormRow>
                                <Checkbox label="VAT Exempt" checked={data.is_vat_exempt} onChange={(e) => { setData('is_vat_exempt', e.target.checked); if (e.target.checked) setData('is_vat_zero_rated', false); }} />
                                <Checkbox label="VAT Zero-Rated" checked={data.is_vat_zero_rated} onChange={(e) => { setData('is_vat_zero_rated', e.target.checked); if (e.target.checked) setData('is_vat_exempt', false); }} />
                            </FormRow>
                        )}
                        <FormRow>
                            <Input label="SC/PWD Discount" type="number" step="0.01" min="0" value={data.sc_pwd_discount} onChange={(e) => setData('sc_pwd_discount', e.target.value)} error={errors.sc_pwd_discount} />
                            <Input label={`Withholding Tax${isSI ? ` (${(whtRate * 100).toFixed(0)}%)` : ''}`} type="number" step="0.01" min="0" value={data.withholding_tax} onChange={(e) => setData('withholding_tax', e.target.value)} error={errors.withholding_tax} />
                        </FormRow>
                        {/* Live preview */}
                        {gross > 0 && (
                            <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)' }}>
                                <div className="font-heading font-semibold text-gray-400" style={{ fontSize: 'var(--font-size-small)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--space-1)' }}>
                                    Computed Preview
                                </div>
                                <div className="flex flex-col">
                                    {[
                                        { label: 'Gross Amount', value: php(gross) },
                                        ...(isSI && !data.is_vat_exempt && !data.is_vat_zero_rated
                                            ? [{ label: 'VATAble Sales', value: php(vatExclusive) }, { label: `VAT (${vatRate}%)`, value: php(vatAmount) }]
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
                            </div>
                        )}
                        <Textarea label="Particulars / Description" value={data.particulars} onChange={(e) => setData('particulars', e.target.value)} error={errors.particulars} placeholder="e.g. Japan tour package, 2 pax, Jan 15–22, 2026" rows={3} />
                        <Textarea label="Remarks (internal)" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} error={errors.remarks} placeholder="Internal notes (not printed)" rows={2} />
                    </FormCard>

                    {/* Card 3 — Payment Details */}
                    <FormCard title="Payment Details">
                        <Select
                            label="Mode of Payment"
                            value={data.mode_of_payment}
                            onChange={(e) => setData('mode_of_payment', e.target.value)}
                            error={errors.mode_of_payment}
                            options={Object.entries(paymentModes).map(([v, l]) => ({ value: v, label: l }))}
                        />
                        {data.mode_of_payment === 'check' && (
                            <Input label="Check Number" value={data.check_number} onChange={(e) => setData('check_number', e.target.value)} error={errors.check_number} placeholder="Check #" />
                        )}
                    </FormCard>

                    <FormActions>
                        <FormCancelButton onClick={() => router.get(route('bir.index'))} />
                        <FormSubmitButton loading={processing} />
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
