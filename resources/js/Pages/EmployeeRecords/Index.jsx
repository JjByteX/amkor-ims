import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import DetailPanel, { TableWithPanel, useDetailPanel } from '../../Components/Shared/DetailPanel';
import { PanelQuickView } from './Show';

import {
    Plus, Search, Users, UserCheck, Clock, UserX,
    AlertTriangle, Download, Eye,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import StatCard from '../../Components/Shared/StatCard';
import StatGrid from '../../Components/Shared/StatGrid';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import DataTable from '../../Components/Shared/DataTable';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import SegmentedControl from '../../Components/UI/SegmentedControl';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const STATUS_VARIANT = {
    probationary: 'warning',
    regular:      'success',
    resigned:     'neutral',
    terminated:   'error',
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function EmployeeIndex({
    employees,
    stats,
    regularizationDue,
    filters,
    statuses,
    departments,
    canManage,
    canViewSalary,
}) {
    const { flash } = usePage().props;
    const [searchInput, setSearchInput] = useState(filters.search ?? '');

    // ─── Detail panel ──────────────────────────────────────────────────────────
    const panel = useDetailPanel((id) => route('employees.show', id));
    const [showPanel, setShowPanel] = useState(false);
    const d = panel.data;
    function openPanel(row) { setShowPanel(true); panel.open(row); }


    function applyFilter(overrides = {}) {
        router.get(
            route('employees.index'),
            { ...filters, search: searchInput, ...overrides },
            { preserveState: true, preserveScroll: true }
        );
    }

    function handleSearchKey(e) {
        if (e.key === 'Enter') applyFilter();
    }

    function clearFilters() {
        setSearchInput('');
        router.get(route('employees.index'), {}, { preserveState: false });
    }

    const hasActiveFilters = filters.search || filters.status || filters.dept;

    const columns = [
        {
            key: 'name',
            label: 'Employee',
            render: (row) => (
                <div>
                    <div className="font-body font-semibold text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                        {row.last_name}, {row.first_name} {row.middle_name ? row.middle_name[0] + '.' : ''}
                    </div>
                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5 }}>
                        {row.employee_code ?? '—'}
                    </div>
                </div>
            ),
        },
        {
            key: 'position',
            label: 'Position',
            render: (row) => (
                <div>
                    <div className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                        {row.position}
                    </div>
                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5 }}>
                        {row.department ?? '—'}
                    </div>
                </div>
            ),
        },
        {
            key: 'branch',
            label: 'Branch',
            render: (row) => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.branch?.name ?? '—'}
                </span>
            ),
        },
        {
            key: 'date_hired',
            label: 'Date Hired',
            render: (row) => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {fmt(row.date_hired)}
                </span>
            ),
        },
        {
            key: 'employment_status',
            label: 'Status',
            render: (row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                    <Badge variant={STATUS_VARIANT[row.employment_status] ?? 'neutral'}>
                        {statuses[row.employment_status] ?? row.employment_status}
                    </Badge>
                    {/* Regularization due warning */}
                    {row.employment_status === 'probationary' && row.date_hired &&
                        new Date(row.date_hired) <= new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) &&
                        !row.regularization_date && (
                            <span style={{ fontSize: 11, color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <AlertTriangle size={11} /> Reg. due
                            </span>
                        )
                    }
                </div>
            ),
        },
        {
            key: 'sil',
            label: 'SIL Balance',
            render: (row) => {
                const remaining = Math.max(0, (row.sil_total ?? 5) - (row.sil_used ?? 0));
                const color = remaining === 0 ? 'var(--color-error)'
                    : remaining <= 2 ? 'var(--color-warning)'
                    : 'var(--color-success)';
                return (
                    <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color }}>
                        {remaining} / {row.sil_total ?? 5} days
                    </span>
                );
            },
        },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={(e) => { e.stopPropagation(); openPanel(row); }}
                    />
                </div>
            ),
        },
    ];

    if (canViewSalary) {
        columns.splice(columns.length - 1, 0, {
            key: 'salary',
            label: 'Salary',
            render: (row) => (
                <span className="font-body text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                    {row.salary_increase_amount
                        ? `₱ ${Number(row.salary_increase_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                        : '—'}
                </span>
            ),
        });
    }

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
                    title="Employees"
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                            <Button variant="primary" icon={Download} onClick={() => {}}>
                                Export
                            </Button>
                            {canManage && (
                                <Button icon={Plus} onClick={() => router.get(route('employees.create'))}>
                                    Add Employee
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Regularization alert */}
                {regularizationDue > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid var(--color-warning)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-warning)',
                        fontSize: 'var(--font-size-small)',
                    }}>
                        <AlertTriangle size={16} />
                        <span className="font-body">
                            <strong>{regularizationDue}</strong> probationary employee{regularizationDue !== 1 ? 's are' : ' is'} due for regularization review (6+ months on probation without regularization date set).
                        </span>
                    </div>
                )}

                <StatGrid>
                    <StatCard icon={Users} label="Total" value={stats.total} />
                    <StatCard icon={UserCheck} label="Active" value={stats.active} tone="success" />
                    <StatCard icon={Clock} label="Probationary" value={stats.probationary} tone="warning" />
                    <StatCard icon={UserCheck} label="Regular" value={stats.regular} tone="primary" />
                    <StatCard icon={UserX} label="Inactive" value={stats.inactive} tone="error" />
                </StatGrid>

                <TableWithPanel
                    panelOpen={showPanel}
                    panel={
                        <DetailPanel
                            open={showPanel}
                            onClose={() => { setShowPanel(false); panel.close(); }}
                            loading={panel.loading}
                            error={panel.error}
                            title={d?.employee?.display_name ?? ''}
                            subtitle={d?.employee ? `${d.employee.employee_code ?? 'No code'} · ${d.employee.position} · ${d.employee.tenure}` : ''}
                            badges={d?.employee && (
                                <>
                                    <Badge variant={STATUS_VARIANT[d.employee.employment_status] ?? 'neutral'}>
                                        {d.statuses?.[d.employee.employment_status] ?? d.employee.employment_status}
                                    </Badge>
                                    {d.employee.regularization_due && <Badge variant="warning">Reg. Due</Badge>}
                                </>
                            )}
                        >
                            {d?.employee && <PanelQuickView employee={d.employee} statuses={d.statuses} canManage={d.canManage} />}
                        </DetailPanel>
                    }
                >
                    <DataTable
                        panelOpen={showPanel}
                        selectedKey={panel.id}
                        columns={columns}
                        rows={employees.data ?? []}
                        pagination={employees}
                        onPageChange={(page) =>
                            router.get(route('employees.index'), { ...filters, search: searchInput, page }, { preserveState: true })
                        }
                        autoPageSize
                        onPageSizeChange={(n) =>
                            router.get(route('employees.index'), { ...filters, search: searchInput, per_page: n, page: 1 }, { preserveState: true })
                        }
                        toolbar={
                            <FilterStrip>
                                <SegmentedControl
                                    tabs={[
                                        { key: '',             label: 'All',          count: stats.total        },
                                        { key: 'active',       label: 'Active',       count: stats.active       },
                                        { key: 'probationary', label: 'Probationary', count: stats.probationary },
                                        { key: 'inactive',     label: 'Inactive',     count: stats.inactive     },
                                    ]}
                                    activeKey={filters.status ?? ''}
                                    onChange={(key) => applyFilter({ status: key || undefined, page: 1 })}
                                />
                                <FilterField grow>
                                    <Input
                                        placeholder="Name, code, position..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={handleSearchKey}
                                        icon={Search}
                                    />
                                </FilterField>
                                <FilterField width={190}>
                                    <Select
                                        options={[
                                            { value: '', label: 'All Departments' },
                                            ...Object.entries(departments).map(([v, l]) => ({ value: v, label: l })),
                                        ]}
                                        value={filters.dept ?? ''}
                                        onChange={(e) => applyFilter({ dept: e.target.value || undefined, page: 1 })}
                                    />
                                </FilterField>
                                {hasActiveFilters && (
                                    <Button variant="ghost" onClick={clearFilters} style={{ backgroundColor: 'var(--color-card)', border: 'var(--border-container)', color: 'var(--color-text)' }}>Clear</Button>
                                )}
                            </FilterStrip>
                        }
                    />
                </TableWithPanel>
            
        </PageStack>
        </AppShell>
    );
}
