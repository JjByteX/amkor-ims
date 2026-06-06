import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import { Plus, RefreshCw, AlertTriangle, CheckCircle2, Pencil } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Card from '../../Components/UI/Card';
import Modal from '../../Components/UI/Modal';
import Input from '../../Components/UI/Input';
import Textarea from '../../Components/UI/Textarea';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const APPROVAL_VARIANT = {
    pending  : 'warning',
    checked  : 'info',
    approved : 'success',
    released : 'neutral',
};

function FlashBanner({ flash }) {
    if (!flash?.message) return null;
    const bg = flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)';
    return (
        <div className="rounded font-body" style={{ padding: 'var(--space-2)', background: bg, color: '#fff', fontSize: 'var(--font-size-small)', borderRadius: 'var(--radius-md)' }}>
            {flash.message}
        </div>
    );
}

export default function CashbondIndex({ portals, pendingReloads, approvalStatuses, canWrite, canCheck, canApprove }) {
    const { flash } = usePage().props;
    const [editPortal, setEditPortal] = useState(null);

    const portalForm = useForm({ maintaining_balance: '', current_balance: '', notes: '' });

    function openEditPortal(portal) {
        setEditPortal(portal);
        portalForm.setData({
            maintaining_balance: portal.maintaining_balance ?? '',
            current_balance:     portal.current_balance ?? '',
            notes:               portal.notes ?? '',
        });
    }

    function submitPortal(e) {
        e.preventDefault();
        portalForm.patch(route('cashbond.portals.update', editPortal.id), {
            onSuccess: () => setEditPortal(null),
        });
    }

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    return (
        <AppShell>
            <div className="flex flex-col" style={{ gap: 'var(--space-3)' }}>

                <FlashBanner flash={flash} />

                <PageHeader
                    title="Cashbond Monitoring"
                    subtitle="Portal balances and reload requests"
                    actions={canWrite && (
                        <Button variant="primary" icon={Plus} onClick={() => router.visit(route('cashbond.reloads.create'))}>
                            New Reload Request
                        </Button>
                    )}
                />

                {/* Portal cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-2)' }}>
                    {portals.map((portal) => {
                        const below = portal.maintaining_balance !== null && parseFloat(portal.current_balance) < parseFloat(portal.maintaining_balance);
                        return (
                            <div key={portal.id} style={{
                                background   : 'var(--color-card)',
                                borderRadius : 'var(--radius-lg)',
                                padding      : 'var(--space-3)',
                                boxShadow    : 'var(--shadow-card)',
                                borderLeft   : `4px solid ${below ? 'var(--color-error)' : 'var(--color-success)'}`,
                            }}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)' }}>
                                        {portal.name}
                                    </div>
                                    {canWrite && (
                                        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEditPortal(portal)} title="Update portal" />
                                    )}
                                </div>

                                <div className="flex flex-col" style={{ gap: 6, marginTop: 'var(--space-2)' }}>
                                    <div>
                                        <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>Current Balance</div>
                                        <div className="font-heading font-semibold" style={{
                                            fontSize  : 20,
                                            color     : below ? 'var(--color-error)' : 'var(--color-success)',
                                        }}>
                                            <CurrencyDisplay amount={portal.current_balance ?? 0} currency="PHP" />
                                        </div>
                                    </div>
                                    {portal.maintaining_balance !== null && (
                                        <div className="flex items-center gap-1">
                                            {below
                                                ? <AlertTriangle size={14} color="var(--color-error)" />
                                                : <CheckCircle2 size={14} color="var(--color-success)" />
                                            }
                                            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: below ? 'var(--color-error)' : 'var(--color-text)' }}>
                                                Maintaining: <CurrencyDisplay amount={portal.maintaining_balance} currency="PHP" />
                                            </span>
                                        </div>
                                    )}
                                    <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                        {portal.reloads_count ?? 0} reload{portal.reloads_count !== 1 ? 's' : ''}
                                    </div>
                                </div>

                                {canWrite && (
                                    <div style={{ marginTop: 'var(--space-2)' }}>
                                        <Button variant="secondary" size="sm" icon={RefreshCw}
                                            onClick={() => router.visit(route('cashbond.reloads.create', { portal_id: portal.id }))}>
                                            Request Reload
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Pending reloads */}
                {pendingReloads.length > 0 && (
                    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)', marginBottom: 'var(--space-2)' }}>
                            Pending Reload Requests ({pendingReloads.length})
                        </div>
                        <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
                            {pendingReloads.map((reload) => (
                                <div key={reload.id}
                                    className="flex items-center justify-between flex-wrap cursor-pointer"
                                    style={{ padding: 'var(--space-1) var(--space-2)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', gap: 8 }}
                                    onClick={() => router.visit(route('cashbond.reloads.show', reload.id))}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                                            {reload.reload_no}
                                        </span>
                                        <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                            {reload.portal?.name} · {fmt(reload.request_date)} · by {reload.created_by?.name ?? '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-center" style={{ gap: 8 }}>
                                        <span className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                                            <CurrencyDisplay amount={reload.amount} currency="PHP" />
                                        </span>
                                        <Badge variant={APPROVAL_VARIANT[reload.approval_status] ?? 'neutral'}>
                                            {approvalStatuses[reload.approval_status] ?? reload.approval_status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 'var(--space-2)' }}>
                            <Button variant="ghost" size="sm" onClick={() => router.visit(route('cashbond.reloads.index'))}>
                                View all reloads →
                            </Button>
                        </div>
                    </div>
                )}

                {pendingReloads.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text)', opacity: 0.5 }}>
                        <CheckCircle2 size={32} style={{ margin: '0 auto var(--space-1)' }} />
                        <p className="font-body" style={{ fontSize: 'var(--font-size-small)' }}>No pending reload requests.</p>
                    </div>
                )}
            </div>

            {/* Edit portal modal */}
            <Modal open={!!editPortal} onClose={() => setEditPortal(null)} title={`Update Portal — ${editPortal?.name}`}>
                <form onSubmit={submitPortal} className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                    <Input
                        label="Current Balance (PHP)"
                        type="number" step="0.01"
                        value={portalForm.data.current_balance}
                        onChange={(e) => portalForm.setData('current_balance', e.target.value)}
                        error={portalForm.errors.current_balance}
                    />
                    <Input
                        label="Maintaining Balance (PHP)"
                        type="number" step="0.01"
                        value={portalForm.data.maintaining_balance}
                        onChange={(e) => portalForm.setData('maintaining_balance', e.target.value)}
                        error={portalForm.errors.maintaining_balance}
                    />
                    <Textarea
                        label="Notes"
                        rows={2}
                        value={portalForm.data.notes}
                        onChange={(e) => portalForm.setData('notes', e.target.value)}
                    />
                    <div className="flex justify-end" style={{ gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                        <Button variant="ghost" type="button" onClick={() => setEditPortal(null)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={portalForm.processing}>Save</Button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
}
