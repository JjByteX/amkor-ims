import { router, useForm } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function VoucherEdit({ voucher, types, currencies }) {
    const { data, setData, put, processing, errors } = useForm({
        type:                voucher.type                ?? 'cash',
        date:                voucher.date                ?? '',
        payee:               voucher.payee               ?? '',
        payee_address:       voucher.payee_address       ?? '',
        check_no:            voucher.check_no            ?? '',
        bank_name:           voucher.bank_name           ?? '',
        check_date:          voucher.check_date          ?? '',
        details:             voucher.details             ?? '',
        account_code:        voucher.account_code        ?? '',
        account_description: voucher.account_description ?? '',
        currency:            voucher.currency            ?? 'PHP',
        amount:              voucher.amount              ?? '',
        amount_usd:          voucher.amount_usd          ?? '',
        amount_jpy:          voucher.amount_jpy          ?? '',
        remarks:             voucher.remarks             ?? '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        put(route('disbursement.vouchers.update', voucher.id));
    }

    const isCheck = data.type === 'check';

    return (
        <AppShell>
            <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout split="5fr 7fr 5fr">
                    <PageHeader
                        breadcrumb={[{ label: 'Disbursement', href: route('disbursement.vouchers.index') }]}
                        title={`Edit Voucher — ${voucher.voucher_no}`}
                        subtitle="Update voucher details"
                        actions={
                            <>
                                <Button type="button" variant="ghost" icon={X} onClick={() => router.get(route('disbursement.vouchers.show', voucher.id))}>Cancel</Button>
                                <Button type="submit" variant="primary" icon={Save} loading={processing}>Save Changes</Button>
                            </>
                        }
                    />

                    {/* Card 1 — Voucher & Payee */}
                    <FormCard title="Voucher & Payee">
                        <FormRow>
                            <Select label="Voucher Type *" value={data.type} onChange={(e) => setData('type', e.target.value)} error={errors.type} options={Object.entries(types).map(([v, l]) => ({ value: v, label: l }))} />
                            <Input label="Date *" type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} error={errors.date} />
                        </FormRow>
                        <Input label="Payee *" value={data.payee} onChange={(e) => setData('payee', e.target.value)} error={errors.payee} placeholder="Payee name" />
                        <Input label="Payee Address" value={data.payee_address} onChange={(e) => setData('payee_address', e.target.value)} error={errors.payee_address} placeholder="Address (optional)" />
                        {isCheck && (
                            <>
                                <FormRow>
                                    <Input label="Check #" value={data.check_no} onChange={(e) => setData('check_no', e.target.value)} error={errors.check_no} placeholder="Check number" />
                                    <Input label="Bank Name" value={data.bank_name} onChange={(e) => setData('bank_name', e.target.value)} error={errors.bank_name} placeholder="BDO, BPI, etc." />
                                </FormRow>
                                <Input label="Check Date" type="date" value={data.check_date} onChange={(e) => setData('check_date', e.target.value)} error={errors.check_date} />
                            </>
                        )}
                    </FormCard>

                    {/* Card 2 — Details & Amount */}
                    <FormCard title="Details & Amount">
                        <Textarea label="Details of Payment" value={data.details} onChange={(e) => setData('details', e.target.value)} error={errors.details} rows={3} placeholder="What is this payment for?" />
                        <FormRow>
                            <Input label="Account Code" value={data.account_code} onChange={(e) => setData('account_code', e.target.value)} error={errors.account_code} placeholder="Account code" />
                            <Input label="Account Description" value={data.account_description} onChange={(e) => setData('account_description', e.target.value)} error={errors.account_description} placeholder="Account description" />
                        </FormRow>
                        <Select label="Currency *" value={data.currency} onChange={(e) => setData('currency', e.target.value)} error={errors.currency} options={Object.entries(currencies).map(([v, l]) => ({ value: v, label: l }))} />
                        <FormRow>
                            <Input label="Amount (PHP) *" type="number" step="0.01" value={data.amount} onChange={(e) => setData('amount', e.target.value)} error={errors.amount} placeholder="0.00" />
                            <Input label="Amount (USD)" type="number" step="0.01" value={data.amount_usd} onChange={(e) => setData('amount_usd', e.target.value)} error={errors.amount_usd} placeholder="0.00" />
                        </FormRow>
                        <Input label="Amount (JPY)" type="number" step="0.01" value={data.amount_jpy} onChange={(e) => setData('amount_jpy', e.target.value)} error={errors.amount_jpy} placeholder="0" />
                    </FormCard>

                    {/* Card 3 — Remarks */}
                    <FormCard title="Remarks">
                        <Textarea label="Remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} error={errors.remarks} rows={4} placeholder="Additional notes..." />
                    </FormCard>

                    <FormActions>
                        <Button type="button" variant="ghost" icon={X} onClick={() => router.get(route('disbursement.vouchers.show', voucher.id))}>Cancel</Button>
                        <Button type="submit" variant="primary" icon={Save} loading={processing}>Save Changes</Button>
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
