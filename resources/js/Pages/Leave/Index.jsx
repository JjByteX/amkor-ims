import { useState, useEffect, useRef } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { Plus, CalendarOff, Check, X as XIcon, AlertTriangle, User } from 'lucide-react';

import AppShell from '@/Components/Layout/AppShell';
import PageHeader from '@/Components/Shared/PageHeader';
import PageStack from '@/Components/Shared/PageStack';
import LeaveBalanceCard from '@/Components/Shared/LeaveBalanceCard';
import LeaveRequestCard from '@/Components/Shared/LeaveRequestCard';
import EmptyState from '@/Components/Shared/EmptyState';
import DataTable from '@/Components/Shared/DataTable';
import FilterStrip, { FilterField } from '@/Components/Shared/FilterStrip';
import ConfirmDialog from '@/Components/Shared/ConfirmDialog';
import Badge from '@/Components/UI/Badge';
import Button from '@/Components/UI/Button';
import SlideOver from '@/Components/UI/SlideOver';
import SessionPicker from '@/Components/UI/SessionPicker';
import Modal from '@/Components/UI/Modal';
import Select from '@/Components/UI/Select';
import Textarea from '@/Components/UI/Textarea';
import DatePicker from '@/Components/UI/DatePicker';
import SegmentedControl from '@/Components/UI/SegmentedControl';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_VARIANT = {
    draft     : 'neutral',
    pending   : 'warning',
    approved  : 'success',
    rejected  : 'error',
    cancelled : 'neutral',
};

function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function diffDays(from, to) {
    if (!from || !to) return 0;
    const a = new Date(from), b = new Date(to);
    return Math.max(0, Math.round((b - a) / 86400000) + 1);
}

// ── Leave type options (ordered by frequency) ─────────────────────────────────

const LEAVE_TYPE_OPTIONS = [
    { value: 'sil',               label: 'Service Incentive Leave (SIL)' },
    { value: 'vl',                label: 'Vacation Leave (VL)'           },
    { value: 'sl',                label: 'Sick Leave'                    },
    { value: 'birthday_leave',    label: 'Birthday Leave'               },
    { value: 'emergency',         label: 'Emergency Leave'              },
    { value: 'official_business', label: 'Official Business'            },
    { value: 'offsetting',        label: 'Offsetting'                   },
    { value: 'other',             label: 'Other'                        },
];

// ── FilLeaveForm ──────────────────────────────────────────────────────────────

function FileLeaveForm({ balance, approver, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        leave_type : '',
        date_from  : '',
        date_to    : '',
        session    : 'full_day',
        remarks    : '',
        attachment : null,
        status     : 'pending',
    });

    const isOneDay = data.date_from && data.date_to && data.date_from === data.date_to;
    const totalDays = data.date_from && data.date_to
        ? (isOneDay
            ? (data.session === 'full_day' ? 1 : 0.5)
            : diffDays(data.date_from, data.date_to))
        : null;

    // SIL balance warning
    const silAfter = data.leave_type === 'sil' && totalDays != null
        ? (balance?.sil_remaining ?? 0) - totalDays
        : null;

    function submit(status) {
        setData('status', status);
        post(route('leave.store'), {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            {/* Leave Type */}
            <Select
                label="Leave Type"
                required
                value={data.leave_type}
                onChange={(e) => setData('leave_type', e.target.value)}
                options={LEAVE_TYPE_OPTIONS}
                error={errors.leave_type}
                placeholder="Select leave type…"
            />

            {/* Date range */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <DatePicker
                    label="Date From"
                    required
                    value={data.date_from}
                    onChange={(e) => setData('date_from', e.target.value)}
                    error={errors.date_from}
                />
                <DatePicker
                    label="Date To"
                    required
                    value={data.date_to}
                    onChange={(e) => setData('date_to', e.target.value)}
                    error={errors.date_to}
                />
            </div>

            {/* Duration display */}
            {totalDays != null && (
                <p className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', margin: 0 }}>
                    Duration: <strong style={{ color: 'var(--color-text)' }}>
                        {totalDays === 0.5 ? '½ day' : `${totalDays} day${totalDays !== 1 ? 's' : ''}`}
                    </strong>
                </p>
            )}

            {/* Session picker — only when single day */}
            {isOneDay && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <span
                        className="font-body"
                        style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)' }}
                    >
                        Session
                    </span>
                    <SessionPicker
                        value={data.session}
                        onChange={(v) => setData('session', v)}
                    />
                </div>
            )}

            {/* SIL balance warning */}
            {silAfter !== null && silAfter < 0 && (
                <div
                    style={{
                        display: 'flex', gap: 8, alignItems: 'flex-start',
                        background: 'rgba(var(--color-warning-rgb,245,158,11),0.08)',
                        border: '1px solid var(--color-warning)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-2)',
                    }}
                >
                    <AlertTriangle size={16} style={{ color: 'var(--color-warning)', marginTop: 1, flexShrink: 0 }} />
                    <p className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', margin: 0 }}>
                        This request exceeds your SIL balance by <strong>{Math.abs(silAfter)} day{Math.abs(silAfter) !== 1 ? 's' : ''}</strong>.
                        You can still submit — your HR admin will review it.
                    </p>
                </div>
            )}

            {/* Remarks */}
            <Textarea
                label="Remarks"
                value={data.remarks}
                onChange={(e) => setData('remarks', e.target.value)}
                rows={3}
                placeholder="Optional notes…"
                error={errors.remarks}
            />

            {/* Attachment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label
                    className="font-body"
                    style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text)' }}
                >
                    Attachment <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setData('attachment', e.target.files[0] ?? null)}
                    style={{ fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)' }}
                />
                {errors.attachment && (
                    <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-error)' }}>{errors.attachment}</p>
                )}
                <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', margin: 0 }}>
                    PDF, JPG, or PNG · max 5 MB
                </p>
            </div>

            {/* Leave validity — remaining after this request */}
            {data.leave_type === 'sil' && totalDays != null && (
                <div
                    style={{
                        background: 'var(--color-bg)',
                        border: 'var(--border-container)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-2) var(--space-3)',
                    }}
                >
                    <p className="font-body" style={{ fontSize: 'var(--font-size-small)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                        Leave Validity
                    </p>
                    <p className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', margin: 0 }}>
                        SIL remaining after this request:{' '}
                        <strong style={{ color: silAfter < 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                            {silAfter !== null ? `${Math.max(0, silAfter)} day${silAfter !== 1 ? 's' : ''}` : '—'}
                        </strong>
                    </p>
                </div>
            )}

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

            {/* Footer buttons rendered in parent SlideOver footer slot via portal */}
            <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
                <Button variant="ghost" size="sm" onClick={onClose} disabled={processing}>
                    Cancel
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    loading={processing}
                    onClick={() => submit('draft')}
                >
                    Save as Draft
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    loading={processing}
                    onClick={() => submit('pending')}
                >
                    Submit
                </Button>
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
            title="Reject Leave Request"
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={processing}>Cancel</Button>
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

function EmployeeView({ requests, balance, approver, filters, highlight }) {
    const [formOpen, setFormOpen]     = useState(false);
    const [activeTab, setActiveTab]   = useState(filters?.status ?? 'all');
    const [cancelling, setCancelling] = useState(null);
    const highlightRef                = useRef({});

    const tabs = [
        { key: 'pending',  label: 'Pending'             },
        { key: 'approved', label: 'Approved'            },
        { key: 'all',      label: 'All'                 },
    ];

    const filtered = activeTab === 'all'
        ? requests
        : requests.filter((r) => r.status === activeTab);

    function handleCancel(id) {
        setCancelling(id);
        router.patch(route('leave.cancel', id), {}, {
            onFinish: () => setCancelling(null),
        });
    }

    // Highlight effect for ?highlight=id deep-links from notifications
    useEffect(() => {
        if (!highlight) return;
        const el = highlightRef.current[highlight];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.outline = '2px solid var(--color-primary)';
            el.style.outlineOffset = '2px';
            setTimeout(() => {
                if (el) { el.style.outline = ''; el.style.outlineOffset = ''; }
            }, 1600);
        }
    }, [highlight]);

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

                {/* Balance cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
                    <LeaveBalanceCard
                        label="Service Incentive Leave (SIL)"
                        value={balance?.sil_remaining ?? 0}
                        total={balance?.sil_total ?? 5}
                        type="days"
                        note={`${balance?.sil_total ?? 5} days total`}
                    />
                    <LeaveBalanceCard
                        label="VL Fund"
                        value={balance?.vl_fund ?? 0}
                        type="currency"
                    />
                    <LeaveBalanceCard
                        label="Birthday Leave"
                        value={1}
                        total={1}
                        type="days"
                        note="1 day per year"
                    />
                </div>

                {/* Tab filter */}
                <SegmentedControl
                    tabs={tabs}
                    activeKey={activeTab}
                    onChange={setActiveTab}
                />

                {/* Request cards */}
                {filtered.length === 0 ? (
                    <EmptyState
                        icon={<CalendarOff size={40} strokeWidth={1.5} />}
                        title="No leave requests yet."
                        description="Your requests will appear here once filed."
                        action={
                            <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
                                File Your First Leave →
                            </Button>
                        }
                        className="py-16"
                    />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {filtered.map((req) => (
                            <div key={req.id} ref={(el) => (highlightRef.current[req.id] = el)} style={{ borderRadius: 'var(--radius-md)' }}>
                                <LeaveRequestCard
                                    request={req}
                                    onCancel={handleCancel}
                                    cancelling={cancelling === req.id}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* File leave SlideOver */}
            <SlideOver
                open={formOpen}
                onClose={() => setFormOpen(false)}
                title="File a Leave"
            >
                <FileLeaveForm
                    balance={balance}
                    approver={approver}
                    onClose={() => setFormOpen(false)}
                />
            </SlideOver>
        </>
    );
}

// ── HR Admin view ─────────────────────────────────────────────────────────────

function HrView({ requests, pendingCount, branches, employees, leaveTypes, filters, canApproveLeave, highlight }) {
    const [activeTab,    setActiveTab]    = useState(filters?.status ?? 'pending');
    const [formOpen,     setFormOpen]     = useState(false);
    const [approveId,    setApproveId]    = useState(null);
    const [rejectId,     setRejectId]     = useState(null);
    const [processing,   setProcessing]   = useState(false);
    const [localFilters, setLocalFilters] = useState({
        search    : filters?.search    ?? '',
        branch_id : filters?.branch_id ?? '',
        leave_type: filters?.leave_type ?? '',
        month     : filters?.month     ?? '',
    });
    const highlightRef = useRef({});

    const tabs = [
        { key: 'pending',  label: 'Pending',  count: pendingCount ?? undefined },
        { key: 'approved', label: 'Approved'  },
        { key: 'rejected', label: 'Rejected'  },
        { key: 'all',      label: 'All'       },
    ];

    function applyFilters(overrides = {}) {
        router.get(route('leave.index'), {
            status    : activeTab,
            ...localFilters,
            ...overrides,
        }, { preserveState: true, replace: true });
    }

    function handleTabChange(key) {
        setActiveTab(key);
        router.get(route('leave.index'), { status: key, ...localFilters }, { preserveState: true, replace: true });
    }

    function handleApprove() {
        setProcessing(true);
        router.patch(route('leave.approve', approveId), {}, {
            onFinish: () => { setApproveId(null); setProcessing(false); },
        });
    }

    function handleReject(reason) {
        setProcessing(true);
        router.patch(route('leave.reject', rejectId), { rejection_reason: reason }, {
            onFinish: () => { setRejectId(null); setProcessing(false); },
        });
    }

    // Highlight for notification deep-links
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

    const leaveTypeOptions = Object.entries(leaveTypes ?? {}).map(([value, label]) => ({ value, label }));

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
            key   : 'leave_type_label',
            label : 'Type',
            render: (row) => row.leave_type_label,
        },
        {
            key   : 'date_range',
            label : 'Date Range',
            render: (row) => row.date_from === row.date_to
                ? fmt(row.date_from)
                : `${fmt(row.date_from)} – ${fmt(row.date_to)}`,
        },
        {
            key   : 'days_requested',
            label : 'Days',
            render: (row) => Number(row.days_requested) === 0.5 ? '½' : row.days_requested,
        },
        {
            key   : 'created_at',
            label : 'Filed',
            render: (row) => fmt(row.created_at),
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
        ...(canApproveLeave ? [{
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
                    onRowClick={(row) => {
                        const el = highlightRef.current[row.id];
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
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
                                    className="w-full"
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
                            <FilterField>
                                <Select
                                    placeholder="All types"
                                    value={localFilters.leave_type}
                                    onChange={(e) => { const v = e.target.value; setLocalFilters((f) => ({ ...f, leave_type: v })); applyFilters({ leave_type: v }); }}
                                    options={[{ value: '', label: 'All types' }, ...leaveTypeOptions]}
                                />
                            </FilterField>
                            {branches?.length > 1 && (
                                <FilterField>
                                    <Select
                                        placeholder="All branches"
                                        value={localFilters.branch_id}
                                        onChange={(e) => { const v = e.target.value; setLocalFilters((f) => ({ ...f, branch_id: v })); applyFilters({ branch_id: v }); }}
                                        options={[{ value: '', label: 'All branches' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
                                    />
                                </FilterField>
                            )}
                            <FilterField>
                                <input
                                    type="month"
                                    value={localFilters.month ?? ''}
                                    onChange={(e) => { const v = e.target.value; setLocalFilters((f) => ({ ...f, month: v })); applyFilters({ month: v ? Number(v.split('-')[1]) : '', year: v ? Number(v.split('-')[0]) : '' }); }}
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
                            icon={<CalendarOff size={36} strokeWidth={1.5} />}
                            title="No leave requests found."
                            description="Try adjusting the filters."
                        />
                    }
                />

            {/* Row highlight refs — rendered invisibly alongside the table */}
            {rows.map((row) => (
                <span key={row.id} ref={(el) => (highlightRef.current[row.id] = el)} style={{ display: 'none' }} />
            ))}

            {/* File leave SlideOver */}
            <SlideOver open={formOpen} onClose={() => setFormOpen(false)} title="File a Leave">
                <FileLeaveForm approver={null} balance={null} onClose={() => setFormOpen(false)} />
            </SlideOver>

            {/* Approve confirm */}
            <ConfirmDialog
                open={approveId !== null}
                onClose={() => setApproveId(null)}
                onConfirm={handleApprove}
                title="Approve Leave Request"
                description="Approve this leave request? The employee will be notified."
                confirmLabel="Approve"
                dangerous={false}
                loading={processing}
            />

            {/* Reject modal */}
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

export default function LeaveIndex({
    requests,
    balance,
    approver,
    canManage,
    canApproveLeave,
    pendingCount,
    branches,
    employees,
    leaveTypes,
    filters,
    highlight,
}) {
    const [formOpen, setFormOpen] = useState(false);

    return (
        <AppShell>
            <PageStack>
                <PageHeader
                    title="Leave Requests"
                    actions={
                        <Button
                            variant="primary"
                            size="sm"
                            icon={<Plus size={16} />}
                            onClick={() => setFormOpen(true)}
                        >
                            File a Leave
                        </Button>
                    }
                />

                {canManage ? (
                    <HrView
                        requests={requests}
                        pendingCount={pendingCount}
                        branches={branches}
                        employees={employees}
                        leaveTypes={leaveTypes}
                        filters={filters}
                        canApproveLeave={canApproveLeave}
                        highlight={highlight}
                    />
                ) : (
                    <EmployeeView
                        requests={requests}
                        balance={balance}
                        approver={approver}
                        filters={filters}
                        highlight={highlight}
                    />
                )}

                {/* Global "File a Leave" from PageHeader button */}
                <SlideOver open={formOpen} onClose={() => setFormOpen(false)} title="File a Leave">
                    <FileLeaveForm
                        balance={balance}
                        approver={approver}
                        onClose={() => setFormOpen(false)}
                    />
                </SlideOver>
            </PageStack>
        </AppShell>
    );
}
