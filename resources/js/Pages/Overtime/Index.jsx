import { useState, useEffect, useRef } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Plus, Timer, Check, X as XIcon, User } from 'lucide-react';

import AppShell from '@/Components/Layout/AppShell';
import PageHeader from '@/Components/Shared/PageHeader';
import PageStack from '@/Components/Shared/PageStack';
import OvertimeRequestCard from '@/Components/Shared/OvertimeRequestCard';
import EmptyState from '@/Components/Shared/EmptyState';
import DataTable from '@/Components/Shared/DataTable';
import FilterStrip, { FilterField } from '@/Components/Shared/FilterStrip';
import ConfirmDialog from '@/Components/Shared/ConfirmDialog';
import Badge from '@/Components/UI/Badge';
import Button from '@/Components/UI/Button';
import SlideOver from '@/Components/UI/SlideOver';
import Modal, { ModalCancelButton } from '@/Components/UI/Modal';
import Select from '@/Components/UI/Select';
import Textarea from '@/Components/UI/Textarea';
import DatePicker from '@/Components/UI/DatePicker';
import SegmentedControl from '@/Components/UI/SegmentedControl';

// ── Shared ────────────────────────────────────────────────────────────────────

const STATUS_VARIANT = {
    pending   : 'warning',
    approved  : 'success',
    rejected  : 'error',
    cancelled : 'neutral',
};

function fmtDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function fmtTime(t) {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ── RequestOtForm (SlideOver body) ────────────────────────────────────────────

function RequestOtForm({ approver, reasons, compensations, requestTypes, employees: empList, canManage, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        request_type     : 'standard',
        employee_id      : '',
        work_date        : '',
        ot_start_time    : '',
        ot_end_time      : '',
        reason           : '',
        compensation_type: 'pay',
        remarks          : '',
        attachment       : null,
    });

    // Auto-compute duration label from times
    function computeDuration(start, end) {
        if (!start || !end) return null;
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        let mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins <= 0) mins += 24 * 60;
        const h = Math.floor(mins / 60), m = mins % 60;
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        return h > 0 ? `${h}h` : `${m}m`;
    }

    const duration = computeDuration(data.ot_start_time, data.ot_end_time);

    function submit() {
        post(route('overtime.store'), {
            forceFormData: true,
            onSuccess: () => { reset(); onClose(); },
        });
    }

    const reasonOpts      = Object.entries(reasons ?? {}).map(([v, l]) => ({ value: v, label: l }));
    const compOpts        = Object.entries(compensations ?? {}).map(([v, l]) => ({ value: v, label: l }));
    const requestTypeOpts = Object.entries(requestTypes ?? {}).map(([v, l]) => ({ value: v, label: l }));
    const empOpts         = (empList ?? []).map((e) => ({ value: e.id, label: `${e.last_name}, ${e.first_name}` }));

    const showOnBehalf = data.request_type === 'on_behalf' && canManage;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            {/* Request Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)' }}>
                    Request Type
                </span>
                <SegmentedControl
                    tabs={requestTypeOpts.map((o) => ({ key: o.value, label: o.label }))}
                    activeKey={data.request_type}
                    onChange={(k) => setData('request_type', k)}
                />
            </div>

            {/* On Behalf Of — employee picker */}
            {showOnBehalf && (
                <Select
                    label="Employee"
                    required
                    value={data.employee_id}
                    onChange={(e) => setData('employee_id', e.target.value)}
                    options={[{ value: '', label: 'Select employee…' }, ...empOpts]}
                    error={errors.employee_id}
                />
            )}

            {/* OT Date */}
            <DatePicker
                label="OT Date"
                required
                value={data.work_date}
                onChange={(e) => setData('work_date', e.target.value)}
                error={errors.work_date}
            />

            {/* OT Start / End Time */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
                    <label className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)' }}>
                        OT Start Time <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <input
                        type="time"
                        value={data.ot_start_time}
                        onChange={(e) => setData('ot_start_time', e.target.value)}
                        style={{
                            height: 'var(--height-input)',
                            border: 'var(--border-container)',
                            borderRadius: 'var(--radius-md)',
                            paddingLeft: 'var(--space-2)',
                            paddingRight: 'var(--space-2)',
                            fontSize: 'var(--font-size-body)',
                            fontFamily: 'var(--font-body)',
                            background: 'var(--color-card)',
                            color: 'var(--color-text)',
                            outline: 'none',
                        }}
                    />
                    {errors.ot_start_time && <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-error)', margin: 0 }}>{errors.ot_start_time}</p>}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
                    <label className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)' }}>
                        OT End Time <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <input
                        type="time"
                        value={data.ot_end_time}
                        onChange={(e) => setData('ot_end_time', e.target.value)}
                        style={{
                            height: 'var(--height-input)',
                            border: 'var(--border-container)',
                            borderRadius: 'var(--radius-md)',
                            paddingLeft: 'var(--space-2)',
                            paddingRight: 'var(--space-2)',
                            fontSize: 'var(--font-size-body)',
                            fontFamily: 'var(--font-body)',
                            background: 'var(--color-card)',
                            color: 'var(--color-text)',
                            outline: 'none',
                        }}
                    />
                    {errors.ot_end_time && <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-error)', margin: 0 }}>{errors.ot_end_time}</p>}
                </div>
            </div>

            {/* Duration (read-only) */}
            {duration && (
                <p className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', margin: 0 }}>
                    Duration: <strong style={{ color: 'var(--color-text)' }}>{duration}</strong>
                </p>
            )}

            {/* Reason */}
            <Select
                label="Reason"
                required
                value={data.reason}
                onChange={(e) => setData('reason', e.target.value)}
                options={[{ value: '', label: 'Select reason…' }, ...reasonOpts]}
                error={errors.reason}
            />

            {/* Compensation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)' }}>
                    Compensation
                </span>
                <SegmentedControl
                    tabs={compOpts.map((o) => ({ key: o.value, label: o.label }))}
                    activeKey={data.compensation_type}
                    onChange={(k) => setData('compensation_type', k)}
                />
            </div>

            {/* Remarks — required when reason = 'other' */}
            <Textarea
                label={data.reason === 'other' ? 'Remarks *' : 'Remarks'}
                value={data.remarks}
                onChange={(e) => setData('remarks', e.target.value)}
                rows={3}
                placeholder={data.reason === 'other' ? 'Required for "Others" reason…' : 'Optional notes…'}
                error={errors.remarks}
            />

            {/* Attachment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)' }}>
                    Attachment <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setData('attachment', e.target.files[0] ?? null)}
                    style={{ fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)' }}
                />
                {errors.attachment && <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-error)', margin: 0 }}>{errors.attachment}</p>}
            </div>

            {/* Approver preview */}
            {approver && (
                <div
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'var(--color-bg)',
                        border: 'var(--border-container)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-2) var(--space-3)',
                    }}
                >
                    <User size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    <p className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', margin: 0 }}>
                        Will be reviewed by:{' '}
                        <strong style={{ color: 'var(--color-text)' }}>{approver.name}</strong>
                        {approver.role ? ` (${approver.role.replace(/_/g, ' ')})` : ''}
                    </p>
                </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
                <ModalCancelButton size="sm" onClick={onClose} disabled={processing} />
                <Button variant="primary" size="sm" loading={processing} onClick={submit}>Submit</Button>
            </div>
        </div>
    );
}

// ── RejectModal ───────────────────────────────────────────────────────────────

function RejectModal({ open, onClose, onConfirm, processing }) {
    const [reason, setReason] = useState('');
    const [err, setErr]       = useState('');

    function handleConfirm() {
        if (!reason.trim()) { setErr('Rejection reason is required.'); return; }
        onConfirm(reason);
    }

    useEffect(() => { if (!open) { setReason(''); setErr(''); } }, [open]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Reject OT Request"
            footer={
                <>
                    <ModalCancelButton size="sm" onClick={onClose} disabled={processing} />
                    <Button variant="danger" size="sm" loading={processing} onClick={handleConfirm}>Reject</Button>
                </>
            }
        >
            <Textarea
                label="Reason for rejection"
                required
                value={reason}
                onChange={(e) => { setReason(e.target.value); setErr(''); }}
                rows={3}
                error={err}
            />
        </Modal>
    );
}

// ── Employee view ─────────────────────────────────────────────────────────────

function EmployeeView({ requests, approver, filters, highlight, reasons, compensations, requestTypes }) {
    const [formOpen,    setFormOpen]    = useState(false);
    const [activeTab,   setActiveTab]   = useState(filters?.status ?? 'all');
    const [cancelling,  setCancelling]  = useState(null);
    const highlightRef                  = useRef({});

    const tabs = [
        { key: 'pending',  label: 'Pending'  },
        { key: 'approved', label: 'Approved' },
        { key: 'all',      label: 'All'      },
    ];

    const filtered = activeTab === 'all'
        ? requests
        : requests.filter((r) => r.status === activeTab);

    function handleCancel(id) {
        setCancelling(id);
        router.patch(route('overtime.cancel', id), {}, {
            onFinish: () => setCancelling(null),
        });
    }

    useEffect(() => {
        if (!highlight) return;
        const el = highlightRef.current[highlight];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.outline = '2px solid var(--color-primary)';
            el.style.outlineOffset = '2px';
            setTimeout(() => { if (el) { el.style.outline = ''; el.style.outlineOffset = ''; } }, 1600);
        }
    }, [highlight]);

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <SegmentedControl tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

                {filtered.length === 0 ? (
                    <EmptyState
                        icon={<Timer size={40} strokeWidth={1.5} />}
                        title="No overtime requests yet."
                        description="Your requests will appear here once filed."
                        action={
                            <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
                                Request Your First OT →
                            </Button>
                        }
                        className="py-16"
                    />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {filtered.map((req) => (
                            <div key={req.id} ref={(el) => (highlightRef.current[req.id] = el)} style={{ borderRadius: 'var(--radius-md)' }}>
                                <OvertimeRequestCard
                                    request={req}
                                    onCancel={handleCancel}
                                    cancelling={cancelling === req.id}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <SlideOver open={formOpen} onClose={() => setFormOpen(false)} title="Request Overtime">
                <RequestOtForm
                    approver={approver}
                    reasons={reasons}
                    compensations={compensations}
                    requestTypes={requestTypes}
                    canManage={false}
                    onClose={() => setFormOpen(false)}
                />
            </SlideOver>
        </>
    );
}

// ── HR Admin view ─────────────────────────────────────────────────────────────

function HrView({ requests, pendingCount, branches, employees, reasons, compensations, requestTypes, filters, canApproveOt, highlight }) {
    const [activeTab,    setActiveTab]    = useState(filters?.status ?? 'pending');
    const [approveId,    setApproveId]    = useState(null);
    const [rejectId,     setRejectId]     = useState(null);
    const [processing,   setProcessing]   = useState(false);
    const [localFilters, setLocalFilters] = useState({
        search           : filters?.search            ?? '',
        branch_id        : filters?.branch_id         ?? '',
        employee_id      : filters?.employee_id       ?? '',
        compensation_type: filters?.compensation_type ?? '',
        month            : filters?.month             ?? '',
    });
    const highlightRef = useRef({});

    const tabs = [
        { key: 'pending',  label: 'Pending',  count: pendingCount ?? undefined },
        { key: 'approved', label: 'Approved' },
        { key: 'rejected', label: 'Rejected' },
        { key: 'all',      label: 'All'      },
    ];

    function applyFilters(overrides = {}) {
        router.get(route('overtime.index'), {
            status: activeTab,
            ...localFilters,
            ...overrides,
        }, { preserveState: true, replace: true });
    }

    function handleTabChange(key) {
        setActiveTab(key);
        router.get(route('overtime.index'), { status: key, ...localFilters }, { preserveState: true, replace: true });
    }

    function handleApprove() {
        setProcessing(true);
        router.patch(route('overtime.approve', approveId), {}, {
            onFinish: () => { setApproveId(null); setProcessing(false); },
        });
    }

    function handleReject(reason) {
        setProcessing(true);
        router.patch(route('overtime.reject', rejectId), { rejection_reason: reason }, {
            onFinish: () => { setRejectId(null); setProcessing(false); },
        });
    }

    useEffect(() => {
        if (!highlight) return;
        setTimeout(() => {
            const el = highlightRef.current[highlight];
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.outline = '2px solid var(--color-primary)';
                el.style.outlineOffset = '2px';
                setTimeout(() => { if (el) { el.style.outline = ''; el.style.outlineOffset = ''; } }, 1600);
            }
        }, 150);
    }, [highlight]);

    const compOpts = Object.entries(compensations ?? {}).map(([v, l]) => ({ value: v, label: l }));

    const columns = [
        {
            key   : 'employee',
            label : 'Employee',
            render: (row) => (
                <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{row.employee?.display_name ?? '—'}</p>
                    {row.employee?.branch_name && (
                        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{row.employee.branch_name}</p>
                    )}
                </div>
            ),
        },
        {
            key   : 'work_date',
            label : 'OT Date',
            render: (row) => fmtDate(row.work_date),
        },
        {
            key   : 'time_range',
            label : 'Time Range',
            render: (row) => `${fmtTime(row.ot_start_time)} – ${fmtTime(row.ot_end_time)}`,
        },
        {
            key   : 'duration_label',
            label : 'Duration',
            render: (row) => row.duration_label ?? '—',
        },
        {
            key   : 'reason_label',
            label : 'Reason',
            render: (row) => row.reason_label ?? row.reason,
        },
        {
            key   : 'compensation_label',
            label : 'Type',
            render: (row) => row.compensation_label ?? row.compensation_type,
        },
        {
            key   : 'status',
            label : 'Status',
            render: (row) => (
                <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>
                    {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                </Badge>
            ),
        },
        ...(canApproveOt ? [{
            key   : 'actions',
            label : '',
            render: (row) => row.status === 'pending' ? (
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        icon={<Check size={14} />}
                        style={{ color: 'var(--color-success)' }}
                        onClick={(e) => { e.stopPropagation(); setApproveId(row.id); }}
                    >
                        Approve
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        icon={<XIcon size={14} />}
                        style={{ color: 'var(--color-error)' }}
                        onClick={(e) => { e.stopPropagation(); setRejectId(row.id); }}
                    >
                        Reject
                    </Button>
                </div>
            ) : null,
        }] : []),
    ];

    const rows = requests?.data ?? requests ?? [];

    return (
        <>
            <DataTable
                columns={columns}
                rows={rows}
                keyField="id"
                pagination={requests?.meta ?? requests}
                onPageChange={(page) => applyFilters({ page })}
                autoPageSize
                onPageSizeChange={(n) => applyFilters({ per_page: n, page: 1 })}
                toolbar={
                    <FilterStrip>
                        <SegmentedControl tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />
                            <FilterField grow>
                                <input
                                    type="search"
                                    placeholder="Search employee…"
                                    value={localFilters.search}
                                    onChange={(e) => setLocalFilters((f) => ({ ...f, search: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                                    style={{
                                        height: 'var(--height-input)',
                                        borderRadius: 'var(--radius-md)',
                                        border: 'var(--border-container)',
                                        paddingLeft: 'var(--space-2)',
                                        paddingRight: 'var(--space-2)',
                                        fontSize: 'var(--font-size-body)',
                                        fontFamily: 'var(--font-body)',
                                        background: 'var(--color-card)',
                                        color: 'var(--color-text)',
                                        outline: 'none',
                                        width: '100%',
                                    }}
                                />
                            </FilterField>
                            {branches?.length > 1 && (
                                <FilterField>
                                    <Select
                                        placeholder="All branches"
                                        value={localFilters.branch_id}
                                        onChange={(e) => { const v = e.target.value; setLocalFilters((f) => ({ ...f, branch_id: v })); applyFilters({ branch_id: v }); }}
                                        options={[{ value: '', label: 'All branches' }, ...(branches ?? []).map((b) => ({ value: b.id, label: b.name }))]}
                                    />
                                </FilterField>
                            )}
                            <FilterField>
                                <Select
                                    placeholder="All types"
                                    value={localFilters.compensation_type}
                                    onChange={(e) => { const v = e.target.value; setLocalFilters((f) => ({ ...f, compensation_type: v })); applyFilters({ compensation_type: v }); }}
                                    options={[{ value: '', label: 'All types' }, ...compOpts]}
                                />
                            </FilterField>
                            <FilterField>
                                <input
                                    type="month"
                                    value={localFilters.month ?? ''}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setLocalFilters((f) => ({ ...f, month: v }));
                                        applyFilters({
                                            month: v ? Number(v.split('-')[1]) : '',
                                            year : v ? Number(v.split('-')[0]) : '',
                                        });
                                    }}
                                    style={{
                                        height: 'var(--height-input)',
                                        borderRadius: 'var(--radius-md)',
                                        border: 'var(--border-container)',
                                        paddingLeft: 'var(--space-2)',
                                        paddingRight: 'var(--space-2)',
                                        fontSize: 'var(--font-size-body)',
                                        fontFamily: 'var(--font-body)',
                                        background: 'var(--color-card)',
                                        color: 'var(--color-text)',
                                        outline: 'none',
                                    }}
                                />
                            </FilterField>
                        </FilterStrip>
                    }
                    empty={
                        <EmptyState
                            icon={<Timer size={36} strokeWidth={1.5} />}
                            title="No overtime requests found."
                            description="Try adjusting the filters."
                        />
                    }
                />

            {/* highlight refs */}
            {rows.map((row) => (
                <span key={row.id} ref={(el) => (highlightRef.current[row.id] = el)} style={{ display: 'none' }} />
            ))}

            <ConfirmDialog
                open={approveId !== null}
                onClose={() => setApproveId(null)}
                onConfirm={handleApprove}
                title="Approve OT Request"
                description="Approve this overtime request? The employee will be notified."
                confirmLabel="Approve"
                dangerous={false}
                loading={processing}
            />

            <RejectModal
                open={rejectId !== null}
                onClose={() => setRejectId(null)}
                onConfirm={handleReject}
                processing={processing}
            />
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OvertimeIndex({
    requests,
    canManage,
    canApproveOt,
    pendingCount,
    branches,
    employees,
    approver,
    reasons,
    compensations,
    requestTypes,
    filters,
    highlight,
}) {
    const [formOpen, setFormOpen] = useState(false);

    return (
        <AppShell>
            <PageStack>
                <PageHeader
                    title="Overtime Requests"
                    actions={
                        <Button
                            variant="primary"
                            size="sm"
                            icon={<Plus size={16} />}
                            onClick={() => setFormOpen(true)}
                        >
                            Request OT
                        </Button>
                    }
                />

                {canManage ? (
                    <HrView
                        requests={requests}
                        pendingCount={pendingCount}
                        branches={branches}
                        employees={employees}
                        reasons={reasons}
                        compensations={compensations}
                        requestTypes={requestTypes}
                        filters={filters}
                        canApproveOt={canApproveOt}
                        highlight={highlight}
                    />
                ) : (
                    <EmployeeView
                        requests={requests}
                        approver={approver}
                        filters={filters}
                        highlight={highlight}
                        reasons={reasons}
                        compensations={compensations}
                        requestTypes={requestTypes}
                    />
                )}

                {/* Global "Request OT" from PageHeader */}
                <SlideOver open={formOpen} onClose={() => setFormOpen(false)} title="Request Overtime">
                    <RequestOtForm
                        approver={approver}
                        reasons={reasons}
                        compensations={compensations}
                        requestTypes={requestTypes}
                        employees={employees}
                        canManage={canManage}
                        onClose={() => setFormOpen(false)}
                    />
                </SlideOver>
            </PageStack>
        </AppShell>
    );
}
