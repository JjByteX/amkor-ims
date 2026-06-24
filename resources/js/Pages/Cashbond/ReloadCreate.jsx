import { router, useForm, usePage } from '@inertiajs/react';
;
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormActions, FormCancelButton, FormEditButton, FormSubmitButton } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

export default function CashbondReloadCreate({ portals }) {
    // Pre-select portal if passed via query string
    const urlParams = new URLSearchParams(window.location.search);
    const preselected = urlParams.get('portal_id') ?? '';

    const form = useForm({
        portal_id:    preselected,
        amount:       '',
        request_date: new Date().toISOString().split('T')[0],
        remarks:      '',
    });

    const selectedPortal = portals.find((p) => String(p.id) === String(form.data.portal_id)) ?? null;

    const portalOptions = [
        { value: '', label: 'Select portal…' },
        ...portals.map((p) => ({ value: p.id, label: p.name })),
    ];

    function handleSubmit(e) {
        e.preventDefault();
        form.post(route('cashbond.reloads.store'));
    }

    return (
        <AppShell>
            <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout>
                    <PageHeader
                        breadcrumb={[{ label: 'Cashbond', href: route('cashbond.index') }]}
                        title="New Reload Request"
                        subtitle="Prepare a cashbond reload for audit and approval"
                        actions={
                            <>
                                <FormCancelButton onClick={() => router.visit(route('cashbond.index'))} />
                                <FormSubmitButton loading={form.processing} />
                            </>
                        }
                    />

                    <FormCard title="Reload Details">
                        <Select label="Portal" options={portalOptions} value={form.data.portal_id} onChange={(e) => form.setData('portal_id', e.target.value)} error={form.errors.portal_id} required />
                        {selectedPortal && (
                            <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}>
                                Current balance: <strong><CurrencyDisplay amount={selectedPortal.current_balance ?? 0} currency="PHP" /></strong>
                                {selectedPortal.maintaining_balance !== null && (
                                    <span className="text-gray-400 ml-2">
                                        · Maintaining: <CurrencyDisplay amount={selectedPortal.maintaining_balance} currency="PHP" />
                                    </span>
                                )}
                            </div>
                        )}
                        <Input label="Amount (PHP)" type="number" step="0.01" min="0.01" value={form.data.amount} onChange={(e) => form.setData('amount', e.target.value)} error={form.errors.amount} required />
                        <Input label="Request Date" type="date" value={form.data.request_date} onChange={(e) => form.setData('request_date', e.target.value)} error={form.errors.request_date} required />
                        <Textarea label="Remarks" rows={3} value={form.data.remarks} onChange={(e) => form.setData('remarks', e.target.value)} error={form.errors.remarks} />
                    </FormCard>

                    <FormActions>
                        <FormCancelButton onClick={() => router.visit(route('cashbond.index'))} />
                        <FormSubmitButton loading={form.processing} />
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
