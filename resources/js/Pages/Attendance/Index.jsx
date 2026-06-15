import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import {
    Clock, Users, UserCheck, AlertTriangle, Calendar,
    Search, Download, Plus, Eye, Edit2, ChevronLeft, ChevronRight,
    LogIn, LogOut, CheckCircle, XCircle, MinusCircle, Shield,
    TrendingUp, Coffee,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import SharedStatCard from '../../Components/Shared/StatCard';
import StatGrid from '../../Components/Shared/StatGrid';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import DataTable from '../../Components/Shared/DataTable';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Modal from '../../Components/UI/Modal';
import DetailPanel, {
    TableWithPanel, useDetailPanel, PanelSection, PanelField,
    PanelFieldRow, PanelDivider, PanelColumns, PanelCol, PanelColRight,
} from '../../Components/Shared/DetailPanel';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fmtLong = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '—';

const fmtTime = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12  = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
};

const fmtMinutes = (min) => {
    if (!min) return '—';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

const fmtDateTime = (dt) =>
    dt ? new Date(dt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_VARIANT = {
    present:                     'success',
    late:                        'warning',
    undertime:                   'warning',
    half_day:                    'warning',
    absent:                      'error',
    rest_day:                    'neutral',
    regular_holiday:             'neutral',
    special_non_working_holiday: 'neutral',
    present_regular_holiday:     'success',
    present_special_holiday:     'success',
    on_sil:                      'info',
    birthday_leave:              'info',
    on_leave:                    'info',
};

// ── Attendance panel content ──────────────────────────────────────────────────

function AttendancePanelContent({ data }) {
    const { record, statuses, leaveTypes } = data;

    const workedPct = record.minutes_worked
        ? Math.min(100, Math.round((record.minutes_worked / (8 * 60)) * 100))
        : 0;

    return (
        <PanelColumns>
            <PanelCol>
                <PanelSection title="Time Summary">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Badge variant={STATUS_VARIANT[record.status] ?? 'neutral'}>
                            {statuses?.[record.status] ?? record.status}
                        </Badge>
                        {record.leave_type && (
                            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-info)' }}>
                                {leaveTypes?.[record.leave_type] ?? record.leave_type}
                            </span>
                        )}
                    </div>

                    <PanelFieldRow>
                        <PanelField label="Time In"  value={fmtTime(record.time_in)} />
                        <PanelField label="Time Out" value={fmtTime(record.time_out)} />
                    </PanelFieldRow>

                    {/* Break info */}
                    {(record.break_start || record.break_end) && (
                        <PanelFieldRow>
                            <PanelField label="Break Start" value={fmtTime(record.break_start)} />
                            <PanelField label="Break End"   value={fmtTime(record.break_end)} />
                        </PanelFieldRow>
                    )}

                    {/* Late / Undertime / Overtime / Overbreak */}
                    {(record.minutes_late > 0 || record.minutes_undertime > 0 ||
                      record.minutes_overtime > 0 || record.minutes_overbreak > 0) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {record.minutes_late > 0 && (
                                <span style={{
                                    padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(234,179,8,0.12)', color: 'var(--color-warning)',
                                    fontSize: 11, fontWeight: 600,
                                }}>
                                    {record.minutes_late}m late
                                </span>
                            )}
                            {record.minutes_undertime > 0 && (
                                <span style={{
                                    padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(234,179,8,0.12)', color: 'var(--color-warning)',
                                    fontSize: 11, fontWeight: 600,
                                }}>
                                    {record.minutes_undertime}m undertime
                                </span>
                            )}
                            {record.minutes_overtime > 0 && (
                                <span style={{
                                    padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(34,197,94,0.12)', color: 'var(--color-success)',
                                    fontSize: 11, fontWeight: 600,
                                }}>
                                    {record.minutes_overtime}m overtime
                                </span>
                            )}
                            {record.minutes_overbreak > 0 && (
                                <span style={{
                                    padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(239,68,68,0.12)', color: 'var(--color-error)',
                                    fontSize: 11, fontWeight: 600,
                                }}>
                                    {record.minutes_overbreak}m overbreak
                                </span>
                            )}
                        </div>
                    )}

                    {/* Hours worked bar */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                                Hours Worked
                            </span>
                            <span className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                                {fmtMinutes(record.minutes_worked)} / 8h
                            </span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'var(--color-bg)', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${workedPct}%`,
                                borderRadius: 3,
                                background: workedPct >= 100 ? 'var(--color-success)' : workedPct >= 75 ? 'var(--color-primary)' : 'var(--color-warning)',
                            }} />
                        </div>
                    </div>
                </PanelSection>

                <PanelDivider />

                <PanelSection title="Details">
                    <PanelField label="Employee"  value={record.user?.name ?? `#${record.employee_id}`} />
                    <PanelField label="Branch"    value={record.branch?.name} />
                    <PanelField label="Work Date" value={fmtLong(record.work_date)} />
                    <PanelField label="IP Address" value={record.ip_address} mono />
                    {record.remarks && <PanelField label="Remarks" value={record.remarks} />}
                </PanelSection>
            </PanelCol>

            <PanelColRight>
                {record.hr_override && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 10px',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid var(--color-info)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-info)',
                        fontSize: 'var(--font-size-small)',
                    }}>
                        <Shield size={14} />
                        <span className="font-body" style={{ fontSize: 'var(--font-size-small)' }}>
                            <strong>HR Override</strong>
                            {record.override_reason ? ` — ${record.override_reason}` : ''}
                        </span>
                    </div>
                )}

                <PanelSection title="Audit Trail">
                    <PanelField label="Clocked In At"  value={fmtDateTime(record.time_in_at)} />
                    <PanelField label="Clocked Out At" value={fmtDateTime(record.time_out_at)} />
                    <PanelField label="Recorded By"    value={record.recorded_by?.name} />
                    <PanelField label="Created"        value={fmtDateTime(record.created_at)} />
                    <PanelField label="Last Updated"   value={fmtDateTime(record.updated_at)} />
                </PanelSection>
            </PanelColRight>
        </PanelColumns>
    );
}

// ── Clock widget (today's card) ───────────────────────────────────────────────

function ClockWidget({ todayRecord, currentUser, now, canManage }) {
    const [showConfirm, setShowConfirm] = useState(null); // 'in' | 'out' | null

    const { post, processing } = useForm({});

    function handleClock(type) {
        setShowConfirm(null);
        post(route(type === 'in' ? 'attendance.clock-in' : 'attendance.clock-out'), {
            preserveScroll: true,
        });
    }

    const nowDate = new Date(now);
    const timeStr = nowDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    const dateStr = nowDate.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const isClockedIn  = todayRecord?.time_in && !todayRecord?.time_out;
    const isClockedOut = todayRecord?.time_in && todayRecord?.time_out;

    return (
        <>
            <Card>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'space-between' }}>
                    {/* Date/time display */}
                    <div>
                        <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-text)' }}>
                            {timeStr}
                        </div>
                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55 }}>
                            {dateStr}
                        </div>
                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.7, marginTop: 2 }}>
                            {currentUser.name}
                        </div>
                    </div>

                    {/* Today's status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {isClockedOut ? (
                            <div style={{ textAlign: 'right' }}>
                                <Badge variant="success">Clocked Out</Badge>
                                <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55, marginTop: 4 }}>
                                    {fmtTime(todayRecord.time_in)} → {fmtTime(todayRecord.time_out)}
                                    {' · '}{fmtMinutes(todayRecord.minutes_worked)}
                                </div>
                                {todayRecord.minutes_overtime > 0 && (
                                    <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 2 }}>
                                        +{todayRecord.minutes_overtime}m overtime
                                    </div>
                                )}
                                {todayRecord.minutes_overbreak > 0 && (
                                    <div style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 2 }}>
                                        {todayRecord.minutes_overbreak}m overbreak
                                    </div>
                                )}
                            </div>
                        ) : isClockedIn ? (
                            <div style={{ textAlign: 'right' }}>
                                <Badge variant="warning">Clocked In</Badge>
                                <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55, marginTop: 4 }}>
                                    Since {fmtTime(todayRecord.time_in)}
                                    {todayRecord.minutes_late > 0 && (
                                        <span style={{ color: 'var(--color-warning)', marginLeft: 6 }}>
                                            {todayRecord.minutes_late}m late
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    icon={LogOut}
                                    loading={processing}
                                    onClick={() => setShowConfirm('out')}
                                    style={{ marginTop: 8 }}
                                >
                                    Clock Out
                                </Button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'right' }}>
                                <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55, marginBottom: 8 }}>
                                    Not yet clocked in today
                                </div>
                                <Button
                                    icon={LogIn}
                                    loading={processing}
                                    onClick={() => setShowConfirm('in')}
                                >
                                    Clock In
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Confirm modal */}
            <Modal
                open={!!showConfirm}
                onClose={() => setShowConfirm(null)}
                title={showConfirm === 'in' ? 'Confirm Clock In' : 'Confirm Clock Out'}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                        <Button variant="ghost" onClick={() => setShowConfirm(null)}>Cancel</Button>
                        <Button
                            variant={showConfirm === 'in' ? 'primary' : 'danger'}
                            icon={showConfirm === 'in' ? LogIn : LogOut}
                            loading={processing}
                            onClick={() => handleClock(showConfirm)}
                        >
                            {showConfirm === 'in' ? 'Clock In Now' : 'Clock Out Now'}
                        </Button>
                    </div>
                }
            >
                <p className="font-body" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)' }}>
                    {showConfirm === 'in'
                        ? `Record your time in now (${timeStr})?`
                        : `Record your time out now (${timeStr})?`}
                </p>
            </Modal>
        </>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AttendanceIndex({
    records,
    stats,
    filters,
    todayRecord,
    statuses,
    leaveTypes,
    branches,
    employees,
    canManage,
    currentUser,
    now,
}) {
    const { flash } = usePage().props;
    const [searchInput, setSearchInput] = useState(filters.search ?? '');

    // ─── Detail panel ──────────────────────────────────────────────────────────
    const panel = useDetailPanel((id) => route('attendance.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;

    function openPanel(row) { setShowPanel(true); panel.open(row); }

    // Month navigation
    const month = filters.month;
    const year  = filters.year;

    function goMonth(delta) {
        let m = month + delta;
        let y = year;
        if (m > 12) { m = 1; y++; }
        if (m < 1)  { m = 12; y--; }
        router.get(route('attendance.index'), { ...filters, month: m, year: y, page: 1 }, { preserveState: true });
    }

    function applyFilter(overrides = {}) {
        router.get(
            route('attendance.index'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true }
        );
    }

    function handleSearchKey(e) {
        if (e.key === 'Enter') applyFilter();
    }

    function clearFilters() {
        setSearchInput('');
        router.get(route('attendance.index'), { month, year }, { preserveState: false });
    }

    const hasActiveFilters = filters.search || filters.status || filters.employee_id || filters.branch_id;

    const columns = [
        {
            key: 'work_date',
            label: 'Date',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {fmt(row.work_date)}
                </span>
            ),
        },
        {
            key: 'employee',
            label: 'Employee',
            render: (row) => (
                <div>
                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', fontWeight: 600 }}>
                        {row.user?.name ?? `Employee #${row.employee_id}`}
                    </div>
                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5 }}>
                        {row.branch?.name ?? '—'}
                    </div>
                </div>
            ),
        },
        {
            key: 'time_in',
            label: 'Time In',
            render: (row) => (
                <div>
                    <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                        {fmtTime(row.time_in)}
                    </span>
                    {row.minutes_late > 0 && (
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--color-warning)' }}>
                            {row.minutes_late}m late
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'time_out',
            label: 'Time Out',
            render: (row) => (
                <div>
                    <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                        {fmtTime(row.time_out)}
                    </span>
                    {row.minutes_undertime > 0 && (
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--color-warning)' }}>
                            {row.minutes_undertime}m early
                        </span>
                    )}
                    {row.minutes_overtime > 0 && (
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--color-success)' }}>
                            +{row.minutes_overtime}m OT
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'minutes_worked',
            label: 'Hours',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {fmtMinutes(row.minutes_worked)}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                    <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>
                        {statuses[row.status] ?? row.status}
                    </Badge>
                    {row.leave_type && (
                        <span style={{ fontSize: 11, color: 'var(--color-info)' }}>
                            {leaveTypes[row.leave_type] ?? row.leave_type}
                        </span>
                    )}
                    {row.minutes_overbreak > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--color-error)' }}>
                            {row.minutes_overbreak}m overbreak
                        </span>
                    )}
                    {row.hr_override && (
                        <span style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.45 }}>
                            HR override
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                    <Button variant="ghost" size="sm" icon={Eye} onClick={(e) => { e.stopPropagation(); openPanel(row); }} />
                    {canManage && (
                        <Button variant="ghost" size="sm" icon={Edit2} onClick={() => router.get(route('attendance.edit', row.id))} />
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppShell>
            <PageStack>

                {/* Flash */}
                {flash?.message && (
                    <div className="font-body" style={{
                        padding: 'var(--space-2)',
                        background: flash.type === 'success' ? 'var(--color-success)' : flash.type === 'error' ? 'var(--color-error)' : 'var(--color-info)',
                        color: '#fff',
                        fontSize: 'var(--font-size-small)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {flash.message}
                    </div>
                )}

                <PageHeader
                    title="Attendance"
                    subtitle="Timekeeping records"
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                            <Button variant="primary" icon={Download} onClick={() => {}}>
                                Export
                            </Button>
                            <Button variant="primary" icon={Calendar} onClick={() => router.get(route('attendance.report'))}>
                                Report
                            </Button>
                            {canManage && (
                                <Button icon={Plus} onClick={() => router.get(route('attendance.create'))}>
                                    Add Record
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Clock widget */}
                <ClockWidget
                    todayRecord={todayRecord}
                    currentUser={currentUser}
                    now={now}
                    canManage={canManage}
                />

                {/* Stats — Excel column order: Present | Absent | OT | Late | OB | Undertime */}
                <StatGrid min="130px">
                    <SharedStatCard icon={CheckCircle}  label="Present"    value={stats.total_present}   tone="success" />
                    <SharedStatCard icon={XCircle}      label="Absent"     value={stats.total_absent}    tone="error" />
                    <SharedStatCard icon={MinusCircle}  label="Half Day"   value={stats.total_half_day}  tone="warning" />
                    <SharedStatCard icon={Users}        label="On Leave"   value={stats.total_on_leave}  tone="info" />
                    <SharedStatCard icon={TrendingUp}   label="Overtime"   value={stats.total_overtime}  tone="success" />
                    <SharedStatCard icon={AlertTriangle} label="Late"      value={stats.total_late}      tone="warning" />
                    <SharedStatCard icon={Coffee}       label="Overbreak"  value={stats.total_overbreak} tone="error" />
                    <SharedStatCard icon={Clock}        label="Undertime"  value={stats.total_undertime} tone="warning" />
                </StatGrid>

                <TableWithPanel
                    panelOpen={showPanel}
                    panel={
                        <DetailPanel
                            open={showPanel}
                            onClose={() => { setShowPanel(false); panel.close(); }}
                            loading={panel.loading}
                            error={panel.error}
                            title={d?.record ? (d.record.user?.name ?? `Employee #${d.record.employee_id}`) : ''}
                            subtitle={d?.record ? fmtLong(d.record.work_date) : ''}
                            badges={d?.record && (
                                <Badge variant={STATUS_VARIANT[d.record.status] ?? 'neutral'}>
                                    {d.statuses?.[d.record.status] ?? d.record.status}
                                </Badge>
                            )}
                        >
                            {d?.record && <AttendancePanelContent data={d} />}
                        </DetailPanel>
                    }
                >
                    <DataTable
                        panelOpen={showPanel}
                        selectedKey={panel.id}
                        columns={columns}
                        rows={records.data ?? []}
                        pagination={records}
                        onPageChange={(page) =>
                            router.get(route('attendance.index'), { ...filters, search: searchInput, page }, { preserveState: true })
                        }
                        toolbar={
                            <FilterStrip>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flex: '0 0 auto' }}>
                                    <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => goMonth(-1)} />
                                    <span className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', minWidth: 120, textAlign: 'center', color: 'var(--color-text)' }}>
                                        {MONTHS[month - 1]} {year}
                                    </span>
                                    <Button variant="ghost" size="sm" icon={ChevronRight} onClick={() => goMonth(1)} />
                                </div>
                                <FilterField grow>
                                    <Input
                                        placeholder="Search employee…"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={handleSearchKey}
                                        icon={Search}
                                    />
                                </FilterField>
                                <FilterField>
                                    <Select
                                        options={[
                                            { value: '', label: 'All Statuses' },
                                            ...Object.entries(statuses).map(([v, l]) => ({ value: v, label: l })),
                                        ]}
                                        value={filters.status ?? ''}
                                        onChange={(e) => applyFilter({ status: e.target.value || undefined, page: 1 })}
                                    />
                                </FilterField>
                                {branches?.length > 1 && (
                                    <FilterField>
                                        <Select
                                            options={[
                                                { value: '', label: 'All Branches' },
                                                ...branches.map((b) => ({ value: b.id, label: b.name })),
                                            ]}
                                            value={filters.branchId ?? ''}
                                            onChange={(e) => applyFilter({ branch_id: e.target.value || undefined, page: 1 })}
                                        />
                                    </FilterField>
                                )}
                                {hasActiveFilters && (
                                    <Button variant="ghost" onClick={clearFilters}>Clear</Button>
                                )}
                            </FilterStrip>
                        }
                    />
                </TableWithPanel>
            </PageStack>
        </AppShell>
    );
}
