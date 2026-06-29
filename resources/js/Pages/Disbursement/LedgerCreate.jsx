import { router, useForm } from '@inertiajs/react';
;
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions, FormCancelButton, FormEditButton, FormSubmitButton } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function LedgerCreate({ categories, fundTypes, currencies }) {
    const { data, setData, post, processing, errors } = useForm({
        date:                '',
        category:            'cash',
        reference_no:        '',
        payee:               '',
        description:         '',
        account_code:        '',
        currency:            'PHP',
        amount:              '',
        fund_type:           'cash_on_hand',
        remarks:             '',
        access_file_period:  '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('disbursement.ledger.store'));
    }

    return (
        <AppShell>
            <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout columns={2}>
                    <PageHeader
                        breadcrumb={[{ label: 'Disbursement', href: route('disbursement.ledger.index') }]}
                        title="New Ledger Entry"
                        actions={
                            <>
                                <FormCancelButton onClick={() => router.get(route('disbursement.ledger.index'))} />
                                <FormSubmitButton loading={processing} />
                            </>
                        }
                    />

                    {/* Card 1 — Entry Details */}
                    <FormCard title="Entry Details">
                        <FormRow>
                            <Input label="Date" required type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} error={errors.date} />
                            <Select label="Category" required value={data.category} onChange={(e) => setData('category', e.target.value)} error={errors.category} options={Object.entries(categories).map(([v, l]) => ({ value: v, label: l }))} />
                        </FormRow>
                        <FormRow>
                            <Input label="Reference #" value={data.reference_no} onChange={(e) => setData('reference_no', e.target.value)} error={errors.reference_no} placeholder="Voucher # or reference" />
                            <Input label="Account Code" value={data.account_code} onChange={(e) => setData('account_code', e.target.value)} error={errors.account_code} placeholder="Account code" />
                        </FormRow>
                        <FormRow>
                            <Input label="Payee" value={data.payee} onChange={(e) => setData('payee', e.target.value)} error={errors.payee} />
                            <Input label="Access File Period" type="date" value={data.access_file_period} onChange={(e) => setData('access_file_period', e.target.value)} error={errors.access_file_period} />
                        </FormRow>
                        <Textarea label="Description" value={data.description} onChange={(e) => setData('description', e.target.value)} error={errors.description} rows={3} placeholder="What is this disbursement for?" />
                        <FormRow>
                            <Select label="Currency" required value={data.currency} onChange={(e) => setData('currency', e.target.value)} error={errors.currency} options={Object.entries(currencies).map(([v, l]) => ({ value: v, label: l }))} />
                            <Input label="Amount" required type="number" step="0.01" value={data.amount} onChange={(e) => setData('amount', e.target.value)} error={errors.amount} />
                        </FormRow>
                        <Select label="Fund Type" required value={data.fund_type} onChange={(e) => setData('fund_type', e.target.value)} error={errors.fund_type} options={Object.entries(fundTypes).map(([v, l]) => ({ value: v, label: l }))} />
                    </FormCard>

                    {/* Card 2 — Remarks */}
                    <FormCard title="Remarks">
                        <Textarea label="Remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} error={errors.remarks} rows={4} placeholder="Additional notes..." />
                    </FormCard>

                    <FormActions>
                        <FormCancelButton onClick={() => router.get(route('disbursement.ledger.index'))} />
                        <FormSubmitButton loading={processing} />
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
