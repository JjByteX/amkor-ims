import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Edit2, ArrowLeft, FileText, Trash2 } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/UI/Modal';

const DOC_VARIANT = {
    AR:  'success',
    SI:  'info',
    SOA: 'neutral',
};

const php = (v) =>
    v != null ? '₱ ' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

function InfoRow({ label, value }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>{label}</span>
            <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                {value ?? <span className="text-gray-300">—</span>}
            </span>
        </div>
    );
}

function InfoRowHighlight({ label, value }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>{label}</span>
            <span className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-primary)' }}>
                {value ?? '—'}
            </span>
        </div>
    );
}

export default function BirShow({ transaction, documentTypes, sourceTypes, paymentModes, canGenerate, atpNumber }) {
    const { flash } = usePage().props;
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleting,    setDeleting]    = useState(false);

    const isSI  = transaction.document_type === 'SI';
    const isSOA = transaction.document_type === 'SOA';

    function handleDelete() {
        setDeleting(true);
        router.delete(route('bir.destroy', transaction.id), {
            onFinish: () => { setDeleting(false); setDeleteModal(false); },
        });
    }

    function generatePdf() {
        const routeMap = { AR: 'documents.ar', SI: 'documents.si', SOA: 'documents.soa' };
        const r = routeMap[transaction.document_type];
        if (r) window.open(route(r, transaction.id), '_blank');
    }

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

                {flash?.message && (
                    <div className="rounded font-body" style={{
                        padding     : 'var(--space-2)',
                        background  : flash.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                        color       : '#fff',
                        fontSize    : 'var(--font-size-small)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title={`${documentTypes[transaction.document_type] ?? transaction.document_type} — ${transaction.document_number ?? 'Unsaved'}`}
                    subtitle={`${transaction.client_name} · ${fmt(transaction.transaction_date)}`}
                    actions={
                        <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
                            <Button
                                variant="ghost"
                                icon={ArrowLeft}
                                onClick={() => router.get(route('bir.index'))}
                            >
                                Back
                            </Button>
                            {canGenerate && (
                                <Button
                                    variant="secondary"
                                    icon={Edit2}
                                    onClick={() => router.get(route('bir.edit', transaction.id))}
                                >
                                    Edit
                                </Button>
                            )}
                            <Button
                                icon={FileText}
                                onClick={generatePdf}
                            >
                                Generate PDF
                            </Button>
                            {canGenerate && (
                                <Button
                                    variant="danger"
                                    icon={Trash2}
                                    onClick={() => setDeleteModal(true)}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    }
                />

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>

                    {/* Left — transaction details */}
                    <div className="flex flex-col" style={{ gap: 'var(--space-3)' }}>

                        {/* Document header */}
                        <Card>
                            <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-2)' }}>
                                <div>
                                    <Badge variant={DOC_VARIANT[transaction.document_type] ?? 'neutral'} style={{ marginBottom: 8 }}>
                                        {transaction.document_type} — {documentTypes[transaction.document_type]}
                                    </Badge>
                                    <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-primary)', marginTop: 6 }}>
                                        {transaction.document_number ?? '—'}
                                    </div>
                                    {isSI && (
                                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: '#92400E', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 'var(--radius-md)', padding: '2px 8px', display: 'inline-block', marginTop: 6 }}>
                                            BIR ATP No.: {atpNumber}
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>Date</div>
                                    <div className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>{fmt(transaction.transaction_date)}</div>
                                    {isSOA && transaction.due_date && (
                                        <>
                                            <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)', marginTop: 4 }}>Due Date</div>
                                            <div className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-error)' }}>{fmt(transaction.due_date)}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                                <InfoRow label="Source"     value={sourceTypes[transaction.source_type] ?? transaction.source_type} />
                                <InfoRow label="Branch"     value={transaction.branch?.name} />
                                <InfoRow label="Created By" value={transaction.created_by?.name} />
                            </div>
                        </Card>

                        {/* Client */}
                        <Card>
                            <div className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)', marginBottom: 'var(--space-2)' }}>
                                Client Information
                            </div>
                            <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                                <InfoRow label="Client Name"    value={transaction.client_name} />
                                <InfoRow
                                    label="TIN"
                                    value={transaction.tin ?? (
                                        (isSI || transaction.document_type === 'AR')
                                            ? '⚠ Not set — required for BIR'
                                            : '—'
                                    )}
                                />
                                <InfoRow label="Business Style" value={transaction.business_style} />
                                <InfoRow label="Address"        value={transaction.address} />
                                <InfoRow label="Particulars"    value={transaction.particulars} />
                            </div>
                        </Card>

                        {/* Payment */}
                        <Card>
                            <div className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)', marginBottom: 'var(--space-2)' }}>
                                Payment
                            </div>
                            <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                                <InfoRow label="Mode of Payment" value={paymentModes[transaction.mode_of_payment] ?? transaction.mode_of_payment} />
                                {transaction.check_number && (
                                    <InfoRow label="Check Number" value={transaction.check_number} />
                                )}
                                <InfoRow label="Remarks" value={transaction.remarks} />
                            </div>
                        </Card>

                        {/* PDF status */}
                        <Card compact>
                            <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                                <FileText
                                    size={20}
                                    style={{
                                        color  : transaction.pdf_generated ? 'var(--color-success)' : 'var(--color-text)',
                                        opacity: transaction.pdf_generated ? 1 : 0.4,
                                    }}
                                />
                                <div>
                                    <div className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                                        PDF Status: {transaction.pdf_generated ? 'Generated' : 'Not yet generated'}
                                    </div>
                                    {transaction.pdf_generated_at && (
                                        <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                            Last generated: {fmt(transaction.pdf_generated_at)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right — amounts */}
                    <div className="flex flex-col" style={{ gap: 'var(--space-3)' }}>
                        <Card>
                            <div className="font-heading font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)', marginBottom: 'var(--space-2)' }}>
                                Amount Breakdown
                            </div>
                            <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                                <InfoRowHighlight label="Gross Amount"            value={php(transaction.gross_amount)} />
                                <InfoRow          label="Total (VAT Inclusive)"   value={php(transaction.total_sales_vat_inclusive)} />

                                {isSI && (
                                    <>
                                        <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '4px 0' }} />
                                        <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            BIR VAT Summary
                                        </div>
                                        <InfoRow label="VATAble Sales"        value={php(transaction.vatable_sales)} />
                                        <InfoRow label="VAT-Exempt Sales"     value={php(transaction.vat_exempt_sales)} />
                                        <InfoRow label="VAT Zero-Rated Sales" value={php(transaction.vat_zero_rated_sales)} />
                                        <InfoRow label="VAT Amount (12%)"     value={php(transaction.vat_amount)} />
                                        <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '4px 0' }} />
                                    </>
                                )}

                                {Number(transaction.sc_pwd_discount) > 0 && (
                                    <InfoRow label="SC/PWD Discount"      value={`- ${php(transaction.sc_pwd_discount)}`} />
                                )}
                                {Number(transaction.withholding_tax) > 0 && (
                                    <InfoRow label="Withholding Tax (2%)" value={`- ${php(transaction.withholding_tax)}`} />
                                )}
                            </div>

                            <div className="flex justify-between font-heading font-semibold" style={{
                                padding    : '10px 0',
                                fontSize   : 'var(--font-size-body)',
                                color      : 'var(--color-primary)',
                                borderTop  : '2px solid var(--color-primary)',
                                marginTop  : 'var(--space-1)',
                            }}>
                                <span>Net Amount Due</span>
                                <span>{php(transaction.net_amount_due)}</span>
                            </div>
                        </Card>

                        {/* Generate PDF action */}
                        <Card compact style={{ background: 'var(--color-bg)' }}>
                            <div className="font-body text-gray-400" style={{ fontSize: 'var(--font-size-small)', marginBottom: 'var(--space-1)' }}>
                                Generate a print-ready PDF for this {transaction.document_type}.
                            </div>
                            <Button
                                icon={FileText}
                                onClick={generatePdf}
                                style={{ width: '100%' }}
                            >
                                Download PDF
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete modal */}
            <Modal
                open={deleteModal}
                onClose={() => setDeleteModal(false)}
                title="Delete Transaction"
            >
                <p className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-body)', marginBottom: 'var(--space-2)' }}>
                    Are you sure you want to delete <strong>{transaction.document_number}</strong>? This is a soft delete — the record is retained for audit purposes.
                </p>
                <div className="flex justify-end" style={{ gap: 'var(--space-1)' }}>
                    <Button variant="ghost" onClick={() => setDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDelete} disabled={deleting} loading={deleting}>
                        Delete
                    </Button>
                </div>
            </Modal>
        </AppShell>
    );
}
