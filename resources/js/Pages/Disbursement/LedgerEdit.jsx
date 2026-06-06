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

export default function LedgerEdit({ entry, categories, fundTypes, currencies }) {
    const { data, setData, put, processing, errors } = useForm({
        date:                entry.date                ?? '',
        category:            entry.category            ?? 'cash',
        reference_no:        entry.reference_no        ?? '',
        payee:               entry.payee               ?? '',
        description:         entry.description         ?? '',
        account_code:        entry.account_code        ?? '',
        currency:            entry.currency            ?? 'PHP',
        amount:              entry.amount              ?? '',
        fund_type:           entry.fund_type           ?? 'cash_on_hand',
        remarks:             entry.remarks             ?? '',
        access_file_period:  entry.access_file_period  ?? '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        put(route('disbursement.ledger.update', entry.id));
    }

    return (
        <AppShell>
            <PageHeader
                title="Edit Ledger Entry"
                subtitle={`Entry #${entry.id} — ${entry.payee ?? entry.description ?? ''}`}
                action={
                    <Button
                        variant="ghost"
                        icon={<ArrowLeft size={16} />}
                        onClick={() => router.get(route('disbursement.ledger.index'))}
                    >
                        Cancel
                    </Button>
                }
            />

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Card padding="p-6">
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>
                                Entry Details
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <Input
                                    label="Date *"
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    error={errors.date}
                                />
                                <Select
                                    label="Category *"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    error={errors.category}
                                    options={Object.entries(categories).map(([v, l]) => ({ value: v, label: l }))}
                                />
                                <Input
                                    label="Reference #"
                                    value={data.reference_no}
                                    onChange={(e) => setData('reference_no', e.target.value)}
                                    error={errors.reference_no}
                                    placeholder="Voucher # or reference"
                                />
                                <Input
                                    label="Account Code"
                                    value={data.account_code}
                                    onChange={(e) => setData('account_code', e.target.value)}
                                    error={errors.account_code}
                                    placeholder="Account code"
                                />
                                <Input
                                    label="Payee"
                                    value={data.payee}
                                    onChange={(e) => setData('payee', e.target.value)}
                                    error={errors.payee}
                                    placeholder="Payee name"
                                />
                                <Input
                                    label="Access File Period"
                                    type="date"
                                    value={data.access_file_period}
                                    onChange={(e) => setData('access_file_period', e.target.value)}
                                    error={errors.access_file_period}
                                />
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <Textarea
                                        label="Description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        error={errors.description}
                                        rows={3}
                                        placeholder="What is this disbursement for?"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card padding="p-6">
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>
                                Amount &amp; Fund
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
                                    label="Amount *"
                                    type="number"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    error={errors.amount}
                                    placeholder="0.00"
                                />
                                <Select
                                    label="Fund Type *"
                                    value={data.fund_type}
                                    onChange={(e) => setData('fund_type', e.target.value)}
                                    error={errors.fund_type}
                                    options={Object.entries(fundTypes).map(([v, l]) => ({ value: v, label: l }))}
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
                            Save Changes
                        </Button>
                    </div>
                </div>
            </form>
        </AppShell>
    );
}
