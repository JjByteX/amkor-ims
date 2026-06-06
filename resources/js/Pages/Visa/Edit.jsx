import { useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

export default function VisaEdit({ application, visaTypes, agentCodes, statuses, paymentModes }) {

    const { data, setData, put, processing, errors } = useForm({
        agent_code       : application.agent_code       ?? '',
        date             : application.date             ?? '',
        agency           : application.agency           ?? '',
        customer_name    : application.customer_name    ?? '',
        visa_type        : application.visa_type        ?? '',
        selling_price    : application.selling_price    ?? '',
        net_payable      : application.net_payable      ?? '',
        income           : application.income           ?? '',
        status           : application.status           ?? 'pending',
        notes            : application.notes            ?? '',
        mode_of_payment  : application.mode_of_payment  ?? '',
        payment_date     : application.payment_date     ?? '',
        soa_number       : application.soa_number       ?? '',
        si_number        : application.si_number        ?? '',
        ar_number        : application.ar_number        ?? '',
        payment_due_date : application.payment_due_date ?? '',
    });

    function handleFinancialChange(field, value) {
        const next = { ...data, [field]: value };
        const sp   = parseFloat(next.selling_price) || 0;
        const np   = parseFloat(next.net_payable)   || 0;
        setData({
            ...next,
            income: sp && np ? (sp - np).toFixed(2) : next.income,
        });
    }

    function submit(e) {
        e.preventDefault();
        put(route('visa.update', application.id));
    }

    const agentOptions    = agentCodes.map((c) => ({ value: c, label: c }));
    const visaTypeOptions = visaTypes.map((t) => ({ value: t, label: t }));
    const statusOptions   = Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }));
    const paymentOptions  = Object.entries(paymentModes).map(([v, l]) => ({ value: v, label: l }));

    return (
        <AppShell>
            <div className="flex flex-col gap-[var(--space-3)]" style={{ padding: 'var(--space-4)' }}>

                <PageHeader
                    title={`Edit — ${application.customer_name}`}
                    subtitle={application.visa_type}
                    actions={
                        <Button
                            variant="ghost"
                            icon={ArrowLeft}
                            onClick={() => history.back()}
                        >
                            Back
                        </Button>
                    }
                />

                <form onSubmit={submit} className="flex flex-col gap-[var(--space-3)]">

                    {/* ── Application Details ─────────────────────────────────── */}
                    <Card>
                        <div className="font-heading text-[var(--color-text)] mb-[var(--space-3)]" style={{ fontSize: 'var(--font-size-heading)' }}>
                            Application Details
                        </div>
                        <div className="grid grid-cols-1 gap-[var(--space-2)] md:grid-cols-2 lg:grid-cols-3">
                            <Select
                                label="Agent *"
                                options={agentOptions}
                                value={data.agent_code}
                                onChange={(e) => setData('agent_code', e.target.value)}
                                error={errors.agent_code}
                            />
                            <Input
                                label="Date *"
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                error={errors.date}
                            />
                            <Input
                                label="Agency"
                                value={data.agency}
                                onChange={(e) => setData('agency', e.target.value)}
                                error={errors.agency}
                            />
                            <div className="md:col-span-2">
                                <Input
                                    label="Customer Name *"
                                    value={data.customer_name}
                                    onChange={(e) => setData('customer_name', e.target.value)}
                                    error={errors.customer_name}
                                />
                            </div>
                            <Select
                                label="Visa / Service Type *"
                                options={visaTypeOptions}
                                value={data.visa_type}
                                onChange={(e) => setData('visa_type', e.target.value)}
                                error={errors.visa_type}
                            />
                        </div>
                    </Card>

                    {/* ── Financials ──────────────────────────────────────────── */}
                    <Card>
                        <div className="font-heading text-[var(--color-text)] mb-[var(--space-3)]" style={{ fontSize: 'var(--font-size-heading)' }}>
                            Financials
                        </div>
                        <div className="grid grid-cols-1 gap-[var(--space-2)] md:grid-cols-3">
                            <Input
                                label="Selling Price (SP)"
                                type="number"
                                value={data.selling_price}
                                onChange={(e) => handleFinancialChange('selling_price', e.target.value)}
                                error={errors.selling_price}
                            />
                            <Input
                                label="Net Payable (NP)"
                                type="number"
                                value={data.net_payable}
                                onChange={(e) => handleFinancialChange('net_payable', e.target.value)}
                                error={errors.net_payable}
                            />
                            <Input
                                label="Income"
                                type="number"
                                value={data.income}
                                onChange={(e) => setData('income', e.target.value)}
                                error={errors.income}
                            />
                        </div>
                    </Card>

                    {/* ── Status & Payment ────────────────────────────────────── */}
                    <Card>
                        <div className="font-heading text-[var(--color-text)] mb-[var(--space-3)]" style={{ fontSize: 'var(--font-size-heading)' }}>
                            Status & Payment
                        </div>
                        <div className="grid grid-cols-1 gap-[var(--space-2)] md:grid-cols-2 lg:grid-cols-3">
                            <Select
                                label="Status"
                                options={statusOptions}
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                error={errors.status}
                            />
                            <Select
                                label="Mode of Payment"
                                options={[{ value: '', label: 'Select mode...' }, ...paymentOptions]}
                                value={data.mode_of_payment}
                                onChange={(e) => setData('mode_of_payment', e.target.value)}
                                error={errors.mode_of_payment}
                            />
                            <Input
                                label="Payment Date"
                                type="date"
                                value={data.payment_date}
                                onChange={(e) => setData('payment_date', e.target.value)}
                                error={errors.payment_date}
                            />
                            <Input
                                label="Payment Due Date (Embassy)"
                                type="date"
                                value={data.payment_due_date}
                                onChange={(e) => setData('payment_due_date', e.target.value)}
                                error={errors.payment_due_date}
                            />
                        </div>
                    </Card>

                    {/* ── Reference Numbers ───────────────────────────────────── */}
                    <Card>
                        <div className="font-heading text-[var(--color-text)] mb-[var(--space-3)]" style={{ fontSize: 'var(--font-size-heading)' }}>
                            Reference Numbers
                        </div>
                        <div className="grid grid-cols-1 gap-[var(--space-2)] md:grid-cols-3">
                            <Input label="SOA #" value={data.soa_number} onChange={(e) => setData('soa_number', e.target.value)} error={errors.soa_number} />
                            <Input label="SI #"  value={data.si_number}  onChange={(e) => setData('si_number',  e.target.value)} error={errors.si_number}  />
                            <Input label="AR #"  value={data.ar_number}  onChange={(e) => setData('ar_number',  e.target.value)} error={errors.ar_number}  />
                        </div>
                    </Card>

                    {/* ── Notes ───────────────────────────────────────────────── */}
                    <Card>
                        <div className="font-heading text-[var(--color-text)] mb-[var(--space-3)]" style={{ fontSize: 'var(--font-size-heading)' }}>
                            Notes
                        </div>
                        <Textarea
                            label="Notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={4}
                            error={errors.notes}
                        />
                    </Card>

                    {/* ── Actions ─────────────────────────────────────────────── */}
                    <div className="flex justify-end gap-[var(--space-2)]">
                        <Button variant="ghost" type="button" onClick={() => history.back()}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" loading={processing}>
                            Save Changes
                        </Button>
                    </div>

                </form>
            </div>
        </AppShell>
    );
}
