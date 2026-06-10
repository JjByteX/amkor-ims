import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Edit2, CheckCircle, ThumbsUp, Package, FileText } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, {PanelActions, PanelCol, PanelColRight, PanelColumns, PanelDivider, PanelField, PanelFieldRow, PanelFullRow, PanelSection} from '../../Components/Shared/DetailPanel';
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

export function VoucherContent({
    voucher, types, approvalStatuses, currencies,
    canWrite, canCheck, canApprove,
}) {

    const { url } = usePage();
    const isPanel = url?.includes('panel=1');
    const [submitting, setSubmitting] = useState(false);

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

    function doPost(routeName) {
        setSubmitting(true);
        router.post(route(routeName, voucher.id), {}, { onFinish: () => setSubmitting(false) });
    }

    const content = (
        <>
            <PanelColumns>
                {/* LEFT — voucher details */}
                <PanelCol>
                    <PanelSection title="Voucher Details">
                        <PanelFieldRow>
                            <PanelField label="Voucher #" value={voucher.voucher_no} mono />
                            <PanelField label="Date"      value={fmt(voucher.date)} />
                        </PanelFieldRow>
                        <PanelField label="Payee"         value={voucher.payee} highlight />
                        <PanelField label="Payee Address" value={voucher.payee_address} />
                        {voucher.type === 'check' && (
                            <>
                                <PanelDivider />
                                <PanelFieldRow>
                                    <PanelField label="Check #"    value={voucher.check_no}    mono />
                                    <PanelField label="Check Date" value={fmt(voucher.check_date)} />
                                </PanelFieldRow>
                                <PanelField label="Bank" value={voucher.bank_name} />
                            </>
                        )}
                        <PanelDivider />
                        <PanelField label="Details"              value={voucher.details} />
                        <PanelFieldRow>
                            <PanelField label="Account Code"        value={voucher.account_code} mono />
                            <PanelField label="Account Description" value={voucher.account_description} />
                        </PanelFieldRow>
                        {voucher.remarks && <PanelField label="Remarks" value={voucher.remarks} />}
                    </PanelSection>

                    {(voucher.checker || voucher.approver || voucher.releaser) && (
                        <>
                            <PanelDivider />
                            <PanelSection>
                                {voucher.checker  && <PanelField label="Checked by"  value={`${voucher.checker.name} — ${fmt(voucher.checked_at)}`} />}
                                {voucher.approver && <PanelField label="Approved by" value={`${voucher.approver.name} — ${fmt(voucher.approved_at)}`} />}
                                {voucher.releaser && <PanelField label="Released by" value={`${voucher.releaser.name} — ${fmt(voucher.released_at)}`} />}
                            </PanelSection>
                        </>
                    )}
                </PanelCol>

                {/* RIGHT — amounts + actions */}
                <PanelColRight>
                    <PanelSection title="Amounts">
                        <PanelFieldRow>
                            <PanelField label="PHP" value={<CurrencyDisplay amount={voucher.amount ?? 0}     currency="PHP" />} highlight />
                            <PanelField label="USD" value={<CurrencyDisplay amount={voucher.amount_usd ?? 0} currency="USD" />} />
                        </PanelFieldRow>
                        <PanelField label="JPY" value={<CurrencyDisplay amount={voucher.amount_jpy ?? 0} currency="JPY" />} />
                    </PanelSection>

                    <PanelDivider />

                    <PanelActions>
                        {canWrite && voucher.approval_status === 'pending' && (
                            <Button variant="secondary" icon={Edit2}
                                onClick={() => router.get(route('disbursement.vouchers.edit', voucher.id))}
                                style={{ width: '100%' }}>
                                Edit Voucher
                            </Button>
                        )}
                        {canCheck && voucher.approval_status === 'pending' && (
                            <Button variant="secondary" icon={CheckCircle} loading={submitting}
                                onClick={() => doPost('disbursement.vouchers.check')} style={{ width: '100%' }}>
                                Mark Checked
                            </Button>
                        )}
                        {canApprove && voucher.approval_status === 'checked' && (
                            <Button variant="primary" icon={ThumbsUp} loading={submitting}
                                onClick={() => doPost('disbursement.vouchers.approve')} style={{ width: '100%' }}>
                                Approve (JRT)
                            </Button>
                        )}
                        {canWrite && voucher.approval_status === 'approved' && (
                            <Button variant="primary" icon={Package} loading={submitting}
                                onClick={() => doPost('disbursement.vouchers.release')} style={{ width: '100%' }}>
                                Release
                            </Button>
                        )}
                        {['approved', 'released'].includes(voucher.approval_status) && (
                            <Button variant="ghost" icon={FileText} loading={submitting}
                                onClick={() => doPost('disbursement.vouchers.pdf')} style={{ width: '100%' }}>
                                Generate PDF
                            </Button>
                        )}
                        {voucher.approval_status === 'released' && (
                            <div style={{ padding: 'var(--space-2)', background: 'color-mix(in srgb, var(--color-success) 10%, var(--color-card))', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)' }}>
                                    Released ✓
                                </span>
                            </div>
                        )}
                    </PanelActions>
                </PanelColRight>
            </PanelColumns>

            {/* Disbursement entries — full width */}
            {voucher.disbursement_entries?.length > 0 && (
                <PanelFullRow title={`Disbursement Entries (${voucher.disbursement_entries.length})`}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-small)' }}>
                            <thead>
                                <tr>
                                    {['Date', 'Description', 'Amount'].map((h) => (
                                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', borderBottom: 'var(--border-table-header)', background: 'var(--color-table-header-bg)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {voucher.disbursement_entries.map((entry) => (
                                    <tr key={entry.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                        <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{fmt(entry.date)}</td>
                                        <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>{entry.description ?? entry.payee}</td>
                                        <td style={{ padding: '10px 12px', color: 'var(--color-text)', fontWeight: 600 }}>
                                            <CurrencyDisplay amount={entry.amount} currency={entry.currency ?? 'PHP'} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </PanelFullRow>
            )}
        </>
    );


    return content;
}

export default function VoucherShow({
    voucher, types, approvalStatuses, currencies,
    canWrite, canCheck, canApprove,
}) {
    const { url } = usePage();
    const isPanel = url?.includes('panel=1');

    if (isPanel) {
        return (
            <DetailPanel
                open
                onClose={() => router.visit(route('disbursement.vouchers.index'), { preserveState: false })}
                title={`${types[voucher.type] ?? voucher.type} — ${voucher.voucher_no}`}
                subtitle={`Payee: ${voucher.payee}`}
                badges={
                <>
                <Badge variant={TYPE_VARIANT[voucher.type] ?? 'neutral'}>
                {types[voucher.type] ?? voucher.type}
                </Badge>
                <Badge variant={APPROVAL_VARIANT[voucher.approval_status] ?? 'neutral'}>
                {approvalStatuses[voucher.approval_status] ?? voucher.approval_status}
                </Badge>
                </>
                }
            >
                <VoucherContent voucher={voucher} types={types} approvalStatuses={approvalStatuses} currencies={currencies} canWrite={canWrite} canCheck={canCheck} canApprove={canApprove} />
            </DetailPanel>
        );
    }

    return <AppShell><VoucherContent voucher={voucher} types={types} approvalStatuses={approvalStatuses} currencies={currencies} canWrite={canWrite} canCheck={canCheck} canApprove={canApprove} /></AppShell>;
}
