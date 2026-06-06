import { useEffect } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import Card from '../../Components/UI/Card';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

export default function CashbondReloadCreate({ portals }) {
    const { flash } = usePage().props;

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
            <div className="flex flex-col" style={{ gap: 'var(--space-3)', maxWidth: 600, margin: '0 auto' }}>

                {flash?.message && (
                    <div className="rounded font-body" style={{
                        padding: 'var(--space-2)', background: flash.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                        color: '#fff', fontSize: 'var(--font-size-small)', borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <Button variant="ghost" icon={ArrowLeft} onClick={() => router.visit(route('cashbond.index'))}>
                    Back to Cashbond
                </Button>

                <PageHeader title="New Reload Request" subtitle="Prepare a cashbond reload for audit and approval" />

                <Card>
                    <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 'var(--space-2)' }}>

                        <Select
                            label="Portal"
                            options={portalOptions}
                            value={form.data.portal_id}
                            onChange={(e) => form.setData('portal_id', e.target.value)}
                            error={form.errors.portal_id}
                            required
                        />

                        {selectedPortal && (
                            <div style={{
                                background   : 'var(--color-bg)',
                                borderRadius : 'var(--radius-md)',
                                padding      : 'var(--space-1) var(--space-2)',
                                fontSize     : 'var(--font-size-small)',
                                fontFamily   : 'var(--font-body)',
                                color        : 'var(--color-text)',
                            }}>
                                Current balance: <strong><CurrencyDisplay amount={selectedPortal.current_balance ?? 0} currency="PHP" /></strong>
                                {selectedPortal.maintaining_balance !== null && (
                                    <span className="text-gray-400 ml-2">
                                        · Maintaining: <CurrencyDisplay amount={selectedPortal.maintaining_balance} currency="PHP" />
                                    </span>
                                )}
                            </div>
                        )}

                        <Input
                            label="Amount (PHP)"
                            type="number" step="0.01" min="0.01"
                            value={form.data.amount}
                            onChange={(e) => form.setData('amount', e.target.value)}
                            error={form.errors.amount}
                            required
                        />

                        <Input
                            label="Request Date"
                            type="date"
                            value={form.data.request_date}
                            onChange={(e) => form.setData('request_date', e.target.value)}
                            error={form.errors.request_date}
                            required
                        />

                        <Textarea
                            label="Remarks"
                            rows={3}
                            value={form.data.remarks}
                            onChange={(e) => form.setData('remarks', e.target.value)}
                            error={form.errors.remarks}
                        />

                        <div className="flex justify-end" style={{ gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                            <Button variant="ghost" type="button" onClick={() => router.visit(route('cashbond.index'))}>Cancel</Button>
                            <Button variant="primary" type="submit" loading={form.processing}>Submit Request</Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppShell>
    );
}
