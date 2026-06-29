import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import {
    ArrowLeft, Edit2, Send, CheckCircle, XCircle, Globe,
    Archive, FileImage, AlertCircle, DollarSign,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal, { ModalCancelButton } from '../../Components/UI/Modal';
import Textarea from '../../Components/UI/Textarea';
import ApprovalStepper from '../../Components/Shared/ApprovalStepper';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fmtDt = (d) =>
    d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_VARIANT = {
    draft:     'neutral',
    submitted: 'warning',
    approved:  'info',
    published: 'success',
    archived:  'neutral',
};

const PHP = (n) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n ?? 0);

// ── Detail row ────────────────────────────────────────────────────────────────

function DetailRow({ label, value }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5 }}>
                {label}
            </span>
            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                {value || '—'}
            </span>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MarketingShow({
    material,
    totalSpend,
    materialTypes,
    statuses,
    platforms,
    canCreate,
    canReview,
}) {
    const { flash } = usePage().props;
    const [rejectOpen, setRejectOpen] = useState(false);

    const { data: rejectData, setData: setRejectData, post: submitReject, processing: rejecting } = useForm({
        revision_notes: '',
    });

    function handleSubmit() {
        router.post(route('marketing.submit', material.id));
    }

    function handleApprove() {
        router.post(route('marketing.approve', material.id));
    }

    function handleReject() {
        submitReject(route('marketing.reject', material.id), {
            onSuccess: () => setRejectOpen(false),
        });
    }

    function handlePublish() {
        router.post(route('marketing.publish', material.id));
    }

    function handleArchive() {
        if (confirm('Archive this material? It will be removed from the active list.')) {
            router.post(route('marketing.archive', material.id));
        }
    }

    const status = material.status;

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

                {/* Flash */}
                {flash?.message && (
                    <div className="font-body" style={{
                        padding: 'var(--space-2)',
                        background: flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : flash.type === 'warning' ? 'var(--color-warning)' : 'var(--color-info)',
                        color: '#fff',
                        fontSize: 'var(--font-size-small)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title={material.title}
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                            <Button variant="ghost" icon={ArrowLeft} onClick={() => router.get(route('marketing.index'))}>
                                Back
                            </Button>

                            {/* Edit — only marketer, only on draft/archived */}
                            {canCreate && (status === 'draft' || status === 'archived') && (
                                <Button variant="primary" icon={Edit2} onClick={() => router.get(route('marketing.edit', material.id))}>
                                    Edit
                                </Button>
                            )}

                            {/* Submit — marketer, draft only */}
                            {canCreate && status === 'draft' && (
                                <Button icon={Send} onClick={handleSubmit}>
                                    Submit for Review
                                </Button>
                            )}

                            {/* Archive — marketer */}
                            {canCreate && (status === 'published' || status === 'approved') && (
                                <Button variant="ghost" icon={Archive} onClick={handleArchive}>
                                    Archive
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Revision notes banner (when sent back) */}
                {status === 'draft' && material.revision_notes && (
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-1)',
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid var(--color-warning)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <AlertCircle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-warning)' }}>
                                Revision requested by {material.reviewed_by_user?.name ?? 'Reviewer'}
                            </div>
                            <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', marginTop: 2 }}>
                                {material.revision_notes}
                            </div>
                        </div>
                    </div>
                )}

                {/* Two-column layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--space-3)', alignItems: 'start' }}>

                    {/* Left: details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

                        {/* Core details */}
                        <Card>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                        Details
                                    </span>
                                    <Badge variant={STATUS_VARIANT[status] ?? 'neutral'}>
                                        {statuses[status] ?? status}
                                    </Badge>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                    <DetailRow label="Material Type"     value={materialTypes[material.material_type] ?? material.material_type} />
                                    <DetailRow label="Platform"          value={platforms[material.platform] ?? material.platform} />
                                    <DetailRow label="Target Publish"    value={fmt(material.publish_date)} />
                                    <DetailRow label="Published At"      value={fmtDt(material.published_at)} />
                                    <DetailRow label="Created By"        value={material.created_by_user?.name} />
                                    <DetailRow label="Created"           value={fmt(material.created_at)} />
                                </div>

                                {material.description && (
                                    <div>
                                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5, marginBottom: 4 }}>
                                            Description
                                        </div>
                                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                                            {material.description}
                                        </div>
                                    </div>
                                )}

                                {material.caption && (
                                    <div>
                                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5, marginBottom: 4 }}>
                                            Caption / Post Copy
                                        </div>
                                        <div className="font-body" style={{
                                            fontSize: 'var(--font-size-small)',
                                            color: 'var(--color-text)',
                                            whiteSpace: 'pre-wrap',
                                            background: 'var(--color-bg)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: 'var(--space-2)',
                                        }}>
                                            {material.caption}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Associated expenses */}
                        {material.expenses?.length > 0 && (
                            <Card>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                    <span className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                        Expenses
                                    </span>
                                    <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-primary)', fontWeight: 600 }}>
                                        {PHP(totalSpend)} total
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {material.expenses.map((exp) => (
                                        <div key={exp.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                            padding: 'var(--space-1) 0',
                                            borderBottom: 'var(--border-container)',
                                        }}>
                                            <div>
                                                <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', fontWeight: 600 }}>
                                                    {exp.campaign_name}
                                                </div>
                                                <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5 }}>
                                                    {exp.category} · {fmt(exp.expense_date)}
                                                </div>
                                            </div>
                                            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', fontWeight: 600 }}>
                                                {PHP(exp.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right: approval sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <Card>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                <span className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                    Workflow
                                </span>
                                <ApprovalStepper fmtDt={fmtDt} steps={[
                                    {
                                        label : 'Created',
                                        done  : true,
                                        person: material.created_by_user?.name,
                                        at    : material.created_at,
                                    },
                                    {
                                        label : 'Submitted',
                                        done  : ['submitted', 'approved', 'published', 'archived'].includes(status),
                                        person: material.submitted_by_user?.name,
                                        at    : null,
                                    },
                                    {
                                        label : 'Approved',
                                        done  : ['approved', 'published', 'archived'].includes(status),
                                        person: material.approved_by_user?.name,
                                        at    : material.approved_at,
                                        action: canReview && status === 'submitted'
                                            ? <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                                                <Button size="sm" icon={CheckCircle} onClick={handleApprove}>Approve</Button>
                                                <Button variant="ghost" size="sm" icon={XCircle} onClick={() => setRejectOpen(true)}>Send Back</Button>
                                              </div>
                                            : null,
                                    },
                                    {
                                        label : 'Published',
                                        done  : status === 'published',
                                        person: material.published_by_user?.name,
                                        at    : material.published_at,
                                        action: canCreate && status === 'approved'
                                            ? <Button size="sm" icon={Globe} onClick={handlePublish}>Mark as Published</Button>
                                            : null,
                                    },
                                ]} />
                            </div>
                        </Card>

                        {/* Spend summary */}
                        <Card>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                    background: 'var(--color-bg)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <DollarSign size={16} style={{ color: 'var(--color-primary)' }} />
                                </div>
                                <div>
                                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55 }}>
                                        Total Spend
                                    </div>
                                    <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-text)' }}>
                                        {PHP(totalSpend)}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Reject / send back modal */}
            <Modal
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                title="Send Back for Revision"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                        <ModalCancelButton onClick={() => setRejectOpen(false)} />
                        <Button
                            variant="danger"
                            icon={XCircle}
                            loading={rejecting}
                            onClick={handleReject}
                        >
                            Send Back
                        </Button>
                    </div>
                }
            >
                <Textarea
                    label="Revision Notes"
                    value={rejectData.revision_notes}
                    onChange={(e) => setRejectData('revision_notes', e.target.value)}
                    rows={4}
                    placeholder="Explain what needs to be revised…"
                    error={null}
                />
            </Modal>
        </AppShell>
    );
}
