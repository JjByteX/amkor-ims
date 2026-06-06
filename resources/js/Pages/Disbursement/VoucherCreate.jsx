import { router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Save, ArrowLeft } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function VoucherCreate({ types, currencies }) {
    const { data, setData, post, processing, errors } = useForm({
        type:                'cash',
        date:                '',
        payee:               '',
        payee_address:       '',
        check_no:            '',
        bank_name:           '',
        check_date:          '',
        details:             '',
        account_code:        '',
        account_description: '',
        currency:            'PHP',
        amount:              '',
        amount_usd:          '',
        amount_jpy:          '',
        remarks:             '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('disbursement.vouchers.store'));
    }

    const isCheck = data.type === 'check';

    return (
        <AppShell>
            <PageHeader
                title="New Voucher"
                subtitle="Create a cash or check voucher"
                action={
                    <Button
                        variant="ghost"
                        icon={<ArrowLeft size={16} />}
                        onClick={() => router.get(route('disbursement.vouchers.index'))}
                    >
                        Back
                    </Button>
                }
            />

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        <Card padding="p-6">
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>
                                Voucher Details
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <Select
                                    label="Voucher Type *"
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    error={errors.type}
                                    options={Object.entries(types).map(([v, l]) => ({ value: v, label: l }))}
                                />
                                <Input
                                    label="Date *"
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    error={errors.date}
                                />
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <Input
                                        label="Payee *"
                                        value={data.payee}
                                        onChange={(e) => setData('payee', e.target.value)}
                                        error={errors.payee}
                                        placeholder="Payee name"
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <Input
                                        label="Payee Address"
                                        value={data.payee_address}
                                        onChange={(e) => setData('payee_address', e.target.value)}
                                        error={errors.payee_address}
                                        placeholder="Address (optional)"
                                    />
                                </div>
                            </div>
                        </Card>

                        {isCheck && (
                            <Card padding="p-6">
                                <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>
                                    Check Details
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <Input
                                        label="Check #"
                                        value={data.check_no}
                                        onChange={(e) => setData('check_no', e.target.value)}
                                        error={errors.check_no}
                                        placeholder="Check number"
                                    />
                                    <Input
                                        label="Bank Name"
                                        value={data.bank_name}
                                        onChange={(e) => setData('bank_name', e.target.value)}
                                        error={errors.bank_name}
                                        placeholder="BDO, BPI, etc."
                                    />
                                    <Input
                                        label="Check Date"
                                        type="date"
                                        value={data.check_date}
                                        onChange={(e) => setData('check_date', e.target.value)}
                                        error={errors.check_date}
                                    />
                                </div>
                            </Card>
                        )}

                        <Card padding="p-6">
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>
                                Payment Details
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <Textarea
                                        label="Details of Payment"
                                        value={data.details}
                                        onChange={(e) => setData('details', e.target.value)}
                                        error={errors.details}
                                        rows={3}
                                        placeholder="What is this payment for?"
                                    />
                                </div>
                                <Input
                                    label="Account Code"
                                    value={data.account_code}
                                    onChange={(e) => setData('account_code', e.target.value)}
                                    error={errors.account_code}
                                    placeholder="Account code"
                                />
                                <Input
                                    label="Account Description"
                                    value={data.account_description}
                                    onChange={(e) => setData('account_description', e.target.value)}
                                    error={errors.account_description}
                                    placeholder="Account description"
                                />
                            </div>
                        </Card>

                        <Card padding="p-6">
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>
                                Amount
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <Select
                                    label="Currency *"
                                    value={data.currency}
                                    onChange={(e) => setData('currency', e.target.value)}
                                    error={errors.currency}
                                    options={Object.entries(currencies).map(([v, l]) => ({ value: v, label: l }))}
                                />
                                <Input
                                    label="Amount (PHP) *"
                                    type="number"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    error={errors.amount}
                                    placeholder="0.00"
                                />
                                <Input
                                    label="Amount (USD)"
                                    type="number"
                                    step="0.01"
                                    value={data.amount_usd}
                                    onChange={(e) => setData('amount_usd', e.target.value)}
                                    error={errors.amount_usd}
                                    placeholder="0.00"
                                />
                                <Input
                                    label="Amount (JPY)"
                                    type="number"
                                    step="0.01"
                                    value={data.amount_jpy}
                                    onChange={(e) => setData('amount_jpy', e.target.value)}
                                    error={errors.amount_jpy}
                                    placeholder="0"
                                />
                            </div>
                        </Card>
                    </div>

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
                            Create Voucher
                        </Button>
                    </div>
                </div>
            </form>
        </AppShell>
    );
}
