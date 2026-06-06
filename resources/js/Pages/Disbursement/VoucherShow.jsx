import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Edit2, ArrowLeft, CheckCircle, ThumbsUp, Package, FileText } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import CurrencyDisplay from '../../Components/Shared/CurrencyDisplay';

const APPROVAL_VARIANT = {
    pending:  'warning',
    checked:  'info',
    approved: 'success',
    released: 'neutral',
};

const TYPE_VARIANT = {
    cash:  'info',
    check: 'neutral',
};

function InfoRow({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.6 }}>{label}</span>
            <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
        </div>
    );
}

export default function VoucherShow({
    voucher, types, approvalStatuses, currencies,
    canWrite, canCheck, canApprove,
}) {
    const { flash } = usePage().props;
    const [submitting, setSubmitting] = useState(false);

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    function doPost(routeName) {
        setSubmitting(true);
        router.post(route(routeName, voucher.id), {}, {
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <AppShell>
            <PageHeader
                title={`${types[voucher.type] ?? voucher.type} — ${voucher.voucher_no}`}
                subtitle={`Payee: ${voucher.payee}`}
                action={
                    <div style={{ display: 'flex', gap: 8 }}>
                        {canWrite && voucher.approval_status === 'pending' && (
                            <Button
                                variant="secondary"
                                icon={<Edit2 size={16} />}
                                onClick={() => router.get(route('disbursement.vouchers.edit', voucher.id))}
                            >
                                Edit
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            icon={<ArrowLeft size={16} />}
                            onClick={() => router.get(route('disbursement.vouchers.index'))}
                        >
                            Back
                        </Button>
                    </div>
                }
            />

            {flash?.message && (
                <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, background: flash.type === 'error' ? 'var(--color-error)' : flash.type === 'success' ? 'var(--color-success)' : 'var(--color-info)', color: '#fff', fontSize: 'var(--font-size-small)' }}>
                    {flash.message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    <Card padding="p-6">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)' }}>Voucher Details</h2>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Badge variant={TYPE_VARIANT[voucher.type] ?? 'neutral'}>{types[voucher.type] ?? voucher.type}</Badge>
                                <Badge variant={APPROVAL_VARIANT[voucher.approval_status] ?? 'neutral'}>{approvalStatuses[voucher.approval_status] ?? voucher.approval_status}</Badge>
                            </div>
                        </div>
                        <InfoRow label="Voucher #" value={voucher.voucher_no} />
                        <InfoRow label="Date" value={fmt(voucher.date)} />
                        <InfoRow label="Payee" value={voucher.payee} />
                        <InfoRow label="Payee Address" value={voucher.payee_address} />
                        {voucher.type === 'check' && (
                            <>
                                <InfoRow label="Check #" value={voucher.check_no} />
                                <InfoRow label="Bank" value={voucher.bank_name} />
                                <InfoRow label="Check Date" value={fmt(voucher.check_date)} />
                            </>
                        )}
                        <InfoRow label="Details" value={voucher.details} />
                        <InfoRow label="Account Code" value={voucher.account_code} />
                        <InfoRow label="Account Description" value={voucher.account_description} />
                        <InfoRow label="Remarks" value={voucher.remarks} />
                    </Card>

                    <Card padding="p-6">
                        <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>Amount</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
                            {[
                                { label: 'PHP', val: voucher.amount, curr: 'PHP' },
                                { label: 'USD', val: voucher.amount_usd, curr: 'USD' },
                                { label: 'JPY', val: voucher.amount_jpy, curr: 'JPY' },
                            ].map(({ label, val, curr }) => (
                                <div key={label} style={{ padding: '12px 8px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.02)' }}>
                                    <p style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.5, marginBottom: 4 }}>{label}</p>
                                    <p className="font-heading" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                        <CurrencyDisplay amount={val ?? 0} currency={curr} />
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {(voucher.checker || voucher.approver || voucher.releaser) && (
                        <Card padding="p-6">
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>Approval Trail</h2>
                            {voucher.checker && <InfoRow label="Checked by" value={`${voucher.checker.name} — ${fmt(voucher.checked_at)}`} />}
                            {voucher.approver && <InfoRow label="Approved by" value={`${voucher.approver.name} — ${fmt(voucher.approved_at)}`} />}
                            {voucher.releaser && <InfoRow label="Released by" value={`${voucher.releaser.name} — ${fmt(voucher.released_at)}`} />}
                        </Card>
                    )}

                    {voucher.disbursement_entries?.length > 0 && (
                        <Card padding="p-6">
                            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', marginBottom: 16 }}>Disbursement Entries</h2>
                            {voucher.disbursement_entries.map((entry) => (
                                <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                    <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                        {fmt(entry.date)} — {entry.description ?? entry.payee}
                                    </span>
                                    <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', fontWeight: 600 }}>
                                        <CurrencyDisplay amount={entry.amount} currency={entry.currency ?? 'PHP'} />
                                    </span>
                                </div>
                            ))}
                        </Card>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Card padding="p-4">
                        <p className="font-heading" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', marginBottom: 12 }}>Actions</p>

                        {canCheck && voucher.approval_status === 'pending' && (
                            <Button
                                variant="secondary"
                                icon={<CheckCircle size={16} />}
                                loading={submitting}
                                onClick={() => doPost('disbursement.vouchers.check')}
                                style={{ width: '100%', marginBottom: 8 }}
                            >
                                Mark Checked
                            </Button>
                        )}

                        {canApprove && voucher.approval_status === 'checked' && (
                            <Button
                                variant="primary"
                                icon={<ThumbsUp size={16} />}
                                loading={submitting}
                                onClick={() => doPost('disbursement.vouchers.approve')}
                                style={{ width: '100%', marginBottom: 8 }}
                            >
                                Approve (JRT)
                            </Button>
                        )}

                        {canWrite && voucher.approval_status === 'approved' && (
                            <Button
                                variant="primary"
                                icon={<Package size={16} />}
                                loading={submitting}
                                onClick={() => doPost('disbursement.vouchers.release')}
                                style={{ width: '100%', marginBottom: 8 }}
                            >
                                Release
                            </Button>
                        )}

                        {['approved', 'released'].includes(voucher.approval_status) && (
                            <Button
                                variant="ghost"
                                icon={<FileText size={16} />}
                                loading={submitting}
                                onClick={() => doPost('disbursement.vouchers.pdf')}
                                style={{ width: '100%', marginBottom: 8 }}
                            >
                                Generate PDF (Phase 9)
                            </Button>
                        )}

                        {voucher.approval_status === 'released' && (
                            <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center', marginTop: 8 }}>
                                <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}>
                                    Released ✓
                                </p>
                            </div>
                        )}
                    </Card>

                    {voucher.pdf_generated && (
                        <Card padding="p-4">
                            <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-info)' }}>
                                PDF stub recorded {fmt(voucher.pdf_generated_at)}
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
