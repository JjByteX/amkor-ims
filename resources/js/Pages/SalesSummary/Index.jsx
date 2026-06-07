import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Download, Save, Search, Target, TrendingUp } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import DataTable from '../../Components/Shared/DataTable';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';

const money = (v) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(v ?? 0));
const date = (v) => v ? new Date(v).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

function Stat({ icon: Icon, label, value }) {
    return (
        <Card compact>
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-[var(--color-bg)]" style={{ borderRadius: 'var(--radius-md)' }}>
                    <Icon size={18} className="text-[var(--color-primary)]" />
                </div>
                <div>
                    <div className="text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>{label}</div>
                    <div className="font-heading font-semibold text-[var(--color-text)]">{value}</div>
                </div>
            </div>
        </Card>
    );
}

export default function SalesSummaryIndex({ rows, totals, departments, targets, filters, departmentOptions, branches, canSetTargets, canExport }) {
    const [agent, setAgent] = useState(filters.agent_code ?? '');
    const target = useForm({
        department: filters.department ?? 'reservation',
        branch_id: filters.branch_id ?? '',
        agent_code: filters.agent_code ?? '',
        year: filters.year,
        month: filters.month,
        target_amount: '',
        remarks: '',
    });

    function apply(overrides = {}) {
        router.get(route('sales.index'), { ...filters, agent_code: agent, ...overrides }, { preserveState: true, preserveScroll: true });
    }

    function saveTarget(e) {
        e.preventDefault();
        target.post(route('sales.targets.store'), { preserveScroll: true });
    }

    const monthValue = `${filters.year}-${String(filters.month).padStart(2, '0')}`;
    const columns = [
        { key: 'department', label: 'Department', render: (row) => <Badge variant="info">{row.department_label}</Badge> },
        { key: 'date', label: 'Date', render: (row) => date(row.date) },
        { key: 'reference', label: 'Reference', render: (row) => row.reference ?? '-' },
        { key: 'customer', label: 'Customer' },
        { key: 'branch_name', label: 'Branch', render: (row) => row.branch_name ?? '-' },
        { key: 'agent_code', label: 'Agent', render: (row) => row.agent_code ?? '-' },
        { key: 'gross_sales', label: 'Gross', render: (row) => money(row.gross_sales) },
        { key: 'net_payable', label: 'Net', render: (row) => money(row.net_payable) },
        { key: 'income', label: 'Income', render: (row) => money(row.income) },
    ];

    return (
        <AppShell>
            <div className="flex min-h-0 flex-1 flex-col" style={{ gap: 'var(--space-section)' }}>
                <PageHeader
                    title="Sales Summary"
                    subtitle="Aggregated operational sales across departments"
                    actions={canExport && <Button icon={Download} onClick={() => router.visit(route('sales.export', filters))}>Export</Button>}
                />

                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                    <Stat icon={Search} label="Records" value={totals.records} />
                    <Stat icon={TrendingUp} label="Gross Sales" value={money(totals.gross_sales)} />
                    <Stat icon={TrendingUp} label="Net Payable" value={money(totals.net_payable)} />
                    <Stat icon={TrendingUp} label="Income" value={money(totals.income)} />
                </div>

                <Card compact>
                    <div className="grid gap-3 lg:grid-cols-[180px_220px_180px_160px_auto]">
                        <Input type="month" value={monthValue} onChange={(e) => {
                            const [year, month] = e.target.value.split('-');
                            apply({ year, month });
                        }} />
                        <Select value={filters.department ?? ''} onChange={(e) => apply({ department: e.target.value })} options={[{ value: '', label: 'All departments' }, ...Object.entries(departmentOptions).map(([value, label]) => ({ value, label }))]} />
                        <Select value={filters.branch_id ?? ''} onChange={(e) => apply({ branch_id: e.target.value })} options={[{ value: '', label: 'All branches' }, ...branches.map((branch) => ({ value: branch.id, label: branch.name }))]} />
                        <Input value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="Agent code" />
                        <Button variant="secondary" onClick={() => apply()}>Apply</Button>
                    </div>
                </Card>

                <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
                    <div className="flex min-h-[420px] flex-col">
                        <DataTable rows={rows ?? []} columns={columns} pageSize={20} />
                    </div>

                    <div className="flex flex-col gap-4">
                        <Card>
                            <div className="mb-3 flex items-center gap-2 font-heading font-semibold text-[var(--color-text)]">
                                <Target size={18} /> Department Progress
                            </div>
                            <div className="flex flex-col gap-3">
                                {(departments ?? []).map((item) => {
                                    const targetRow = (targets ?? []).find((t) => t.department === item.department);
                                    const targetAmount = Number(targetRow?.target_amount ?? 0);
                                    const pct = targetAmount > 0 ? Math.min(100, Math.round((Number(item.gross_sales) / targetAmount) * 100)) : 0;
                                    return (
                                        <div key={item.department}>
                                            <div className="mb-1 flex justify-between text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-small)' }}>
                                                <span>{item.label}</span>
                                                <span>{targetAmount > 0 ? `${pct}%` : 'No target'}</span>
                                            </div>
                                            <div className="h-2 bg-[var(--color-bg)]" style={{ borderRadius: 'var(--radius-md)' }}>
                                                <div className="h-2 bg-[var(--color-primary)]" style={{ width: `${pct}%`, borderRadius: 'var(--radius-md)' }} />
                                            </div>
                                            <div className="mt-1 text-gray-400" style={{ fontSize: 'var(--font-size-small)' }}>
                                                {money(item.gross_sales)} / {money(targetAmount)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {canSetTargets && (
                            <Card as="form" onSubmit={saveTarget}>
                                <div className="mb-3 font-heading font-semibold text-[var(--color-text)]">Set Monthly Target</div>
                                <div className="flex flex-col gap-3">
                                    <Select label="Department" value={target.data.department} onChange={(e) => target.setData('department', e.target.value)} options={Object.entries(departmentOptions).map(([value, label]) => ({ value, label }))} error={target.errors.department} />
                                    <Select label="Branch" value={target.data.branch_id} onChange={(e) => target.setData('branch_id', e.target.value)} options={[{ value: '', label: 'All branches' }, ...branches.map((branch) => ({ value: branch.id, label: branch.name }))]} error={target.errors.branch_id} />
                                    <Input label="Agent Code" value={target.data.agent_code} onChange={(e) => target.setData('agent_code', e.target.value)} error={target.errors.agent_code} />
                                    <Input label="Target Amount" type="number" step="0.01" value={target.data.target_amount} onChange={(e) => target.setData('target_amount', e.target.value)} error={target.errors.target_amount} />
                                    <Button type="submit" icon={Save} loading={target.processing}>Save Target</Button>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
