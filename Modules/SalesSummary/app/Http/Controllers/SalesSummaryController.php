<?php

namespace Modules\SalesSummary\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Modules\SalesSummary\Exports\SalesSummaryExport;
use Modules\SalesSummary\Models\SalesTarget;

class SalesSummaryController extends Controller
{
    // ─── Roles ─────────────────────────────────────────────────────────────────
    // Canonical slugs per Amkor_IMS___Roles___Permissions_Matrix_1.md (Module 12)

    // Roles that see only their own agent code rows (🔒)
    private const OWN_AGENT_ROLES = [
        'sales_reservation_officer',
        'sales_ticketing_officer',
        'group_sales_officer',
        'visa_documentation_officer',
        'branch_sales_officer',
    ];

    private const VIEW_ROLES = [
        'president',                      // all branches, all departments
        'chief_operating_officer',        // all branches, all departments
        'finance_admin_supervisor',       // all branches, all departments
        'general_sales_manager',          // all branches, all departments
        'business_development_manager',   // Business Development + Visa departments only
        'accounting_assistant',           // all departments (needed for reconciliation)
        'visa_documentation_supervisor',  // Visa department only
        'visa_documentation_officer',     // 🔒 own agent summary only
        'sales_reservation_officer',      // 🔒 own agent summary only
        'sales_ticketing_officer',        // 🔒 own agent summary only
        'group_sales_officer',            // 🔒 own agent summary only
        'branch_supervisor',              // 🌿 Ormoc branch summary only
        'branch_sales_officer',           // 🔒 own agent summary only
    ];

    public function index(Request $request): Response
    {
        $this->requireViewer($request);

        $filters     = $this->filters($request);
        $rows        = $this->salesRows($filters, $request);
        $totals      = $this->totals($rows);
        $departments = $this->departmentSummary($rows);
        $targets     = $this->targets($filters, $request);

        return Inertia::render('SalesSummary/Index', [
            'rows'              => $rows->values(),
            'totals'            => $totals,
            'departments'       => $departments,
            'targets'           => $targets,
            'filters'           => $filters,
            'departmentOptions' => SalesTarget::DEPARTMENTS,
            'branches'          => Branch::active()->orderBy('name')->get(['id', 'name']),
            'agentCodes'        => $this->agentCodes($request),
            'canSetTargets'     => $request->user()?->can('sales.set_monthly_target') ?? false,
            'canExport'         => $request->user()?->can('sales.export') ?? false,
        ]);
    }

    public function storeTarget(Request $request): RedirectResponse
    {
        if (! ($request->user()?->can('sales.set_monthly_target') ?? false)) {
            abort(403);
        }

        $data = $request->validate([
            'department'    => ['required', 'in:'.implode(',', array_keys(SalesTarget::DEPARTMENTS))],
            'branch_id'     => ['nullable', 'integer', 'exists:branches,id'],
            'agent_code'    => ['nullable', 'string', 'max:20'],
            'year'          => ['required', 'integer', 'min:2020', 'max:2100'],
            'month'         => ['required', 'integer', 'min:1', 'max:12'],
            'target_amount' => ['required', 'numeric', 'min:0'],
            'remarks'       => ['nullable', 'string'],
        ]);

        SalesTarget::updateOrCreate(
            [
                'department' => $data['department'],
                'branch_id'  => $data['branch_id'] ?? null,
                'agent_code' => $data['agent_code'] ?? null,
                'year'       => $data['year'],
                'month'      => $data['month'],
            ],
            [
                'target_amount' => $data['target_amount'],
                'remarks'       => $data['remarks'] ?? null,
                'created_by'    => $request->user()->id,
                'updated_by'    => $request->user()->id,
            ],
        );

        return back()->with('flash', ['type' => 'success', 'message' => 'Sales target saved.']);
    }

    public function export(Request $request)
    {
        if (! ($request->user()?->can('sales.export') ?? false)) {
            abort(403);
        }

        $filters  = $this->filters($request);
        $rows     = $this->salesRows($filters, $request);
        $filename = sprintf('sales-summary-%s-%02d.xlsx', $filters['year'], $filters['month']);

        return Excel::download(new SalesSummaryExport($rows), $filename);
    }

    /**
     * Returns a flat list of active agent codes for the dropdown.
     * Own-agent roles only see their own code; all other view roles see all codes.
     */
    private function agentCodes(Request $request): array
    {
        if (! Schema::hasTable('agent_codes')) {
            return [];
        }

        $user = $request->user();
        $role = $user?->getRoleNames()->first();

        // Own-agent roles: restrict to their own code only
        if (in_array($role, self::OWN_AGENT_ROLES, true) && $user?->agent_code) {
            return [['value' => $user->agent_code, 'label' => $user->agent_code]];
        }

        return DB::table('agent_codes')
            ->where('is_active', true)
            ->orderBy('department')
            ->orderBy('code')
            ->get(['code', 'department', 'sub_group'])
            ->map(fn ($row) => [
                'value' => $row->code,
                'label' => $row->code,
            ])
            ->unique('value')
            ->values()
            ->all();
    }

    private function filters(Request $request): array
    {
        $user = $request->user();
        $role = $user?->getRoleNames()->first();

        // Own-agent roles: always force the filter to their own code regardless
        // of what the URL says — prevents scope bypass by removing the param.
        if (in_array($role, self::OWN_AGENT_ROLES, true)) {
            $agentCode = $user->agent_code ?? null;
        } else {
            $agentCode = $request->string('agent_code')->toString() ?: null;
        }

        return [
            'year'       => (int) $request->integer('year', now()->year),
            'month'      => (int) $request->integer('month', now()->month),
            'department' => $request->string('department')->toString() ?: null,
            'branch_id'  => $request->integer('branch_id') ?: null,
            'agent_code' => $agentCode,
        ];
    }

    private function salesRows(array $filters, Request $request): Collection
    {
        return collect()
            ->merge($this->reservationRows($filters))
            ->merge($this->visaRows($filters))
            ->merge($this->receivableRows($filters))
            ->when(
                $request->user()?->getRoleNames()->first() === 'branch_supervisor',
                fn (Collection $rows) => $rows->where('branch_id', $request->user()->branch_id)
            )
            ->when($filters['department'], fn (Collection $rows) => $rows->where('department', $filters['department']))
            ->when($filters['branch_id'],  fn (Collection $rows) => $rows->where('branch_id', $filters['branch_id']))
            ->when($filters['agent_code'], fn (Collection $rows) => $rows->where('agent_code', $filters['agent_code']))
            ->sortByDesc('date')
            ->values();
    }

    /**
     * Reservation rows — covers ALL branches (QC and Ormoc) from the unified
     * reservation_bookings table.
     *
     * Phase 3.7 — department label now derived from branch AND agent sub_group:
     *   - Ormoc-origin bookings            → department = 'ormoc'
     *   - QC bookings, sub_group = 'groups' → department = 'groups'
     *   - QC bookings, all others           → department = 'reservation'
     *
     * This matches the client's Excel layout: four rows — Resa, Groups, Visa, Ormoc.
     * The agent_codes join is a LEFT JOIN so bookings with no matching agent code
     * (or a null agent_code) still appear, defaulting to 'reservation'.
     */
    private function reservationRows(array $filters): Collection
    {
        if (! Schema::hasTable('reservation_bookings')) {
            return collect();
        }

        return DB::table('reservation_bookings')
            ->leftJoin('branches', 'branches.id', '=', 'reservation_bookings.branch_id')
            ->leftJoin('agent_codes', function ($join) {
                // Match on code AND non-ormoc department so Ormoc agent codes
                // don't accidentally pull a QC sub_group label.
                $join->on('agent_codes.code', '=', 'reservation_bookings.agent_code')
                     ->where('agent_codes.department', '!=', 'ormoc');
            })
            ->whereNull('reservation_bookings.deleted_at')
            ->whereYear('reservation_bookings.date', $filters['year'])
            ->whereMonth('reservation_bookings.date', $filters['month'])
            ->whereIn('reservation_bookings.status', ['confirmed'])
            ->get([
                'reservation_bookings.id',
                'reservation_bookings.booking_no as reference',
                'reservation_bookings.date',
                'reservation_bookings.client_name as customer',
                'reservation_bookings.agent_code',
                'reservation_bookings.branch_id',
                'branches.name as branch_name',
                'branches.code as branch_code',
                'agent_codes.sub_group',
                'reservation_bookings.selling_price as gross_sales',
                'reservation_bookings.net_payable',
                'reservation_bookings.income',
                'reservation_bookings.status as collection_status',
            ])
            ->map(fn ($row) => (object) array_merge((array) $row, [
                'department' => match (true) {
                    $row->branch_code === 'ORMOC'       => 'ormoc',
                    $row->sub_group   === 'groups'      => 'groups',
                    default                             => 'reservation',
                },
                'department_label' => match (true) {
                    $row->branch_code === 'ORMOC'       => 'Ormoc Branch',
                    $row->sub_group   === 'groups'      => 'Groups',
                    default                             => 'Reservation',
                },
            ]));
    }

    private function visaRows(array $filters): Collection
    {
        if (! Schema::hasTable('visa_applications')) {
            return collect();
        }

        return DB::table('visa_applications')
            ->leftJoin('branches', 'branches.id', '=', 'visa_applications.branch_id')
            ->whereNull('visa_applications.deleted_at')
            ->whereYear('visa_applications.date', $filters['year'])
            ->whereMonth('visa_applications.date', $filters['month'])
            ->whereIn('visa_applications.status', ['approved', 'completed'])
            ->get([
                'visa_applications.id',
                'visa_applications.ar_number as reference',
                'visa_applications.date',
                'visa_applications.customer_name as customer',
                'visa_applications.agent_code',
                'visa_applications.branch_id',
                'branches.name as branch_name',
                'visa_applications.selling_price as gross_sales',
                'visa_applications.net_payable',
                'visa_applications.income',
                DB::raw("'visa' as department"),
                DB::raw("'Visa & Documentation' as department_label"),
                'visa_applications.status as collection_status',
            ]);
    }

    private function receivableRows(array $filters): Collection
    {
        if (! Schema::hasTable('collectibles')) {
            return collect();
        }

        return DB::table('collectibles')
            ->leftJoin('branches', 'branches.id', '=', 'collectibles.branch_id')
            ->whereNull('collectibles.deleted_at')
            ->whereYear('collectibles.date', $filters['year'])
            ->whereMonth('collectibles.date', $filters['month'])
            ->get([
                'collectibles.id',
                'collectibles.ar_number as reference',
                'collectibles.date',
                'collectibles.customer_name as customer',
                'collectibles.agent_code',
                'collectibles.branch_id',
                'branches.name as branch_name',
                'collectibles.collectible_amount_php as gross_sales',
                DB::raw('0 as net_payable'),
                DB::raw('0 as income'),
                DB::raw("'ar' as department"),
                DB::raw("'Accounts Receivable' as department_label"),
                'collectibles.status as collection_status',
            ]);
    }

    private function totals(Collection $rows): array
    {
        return [
            'records'     => $rows->count(),
            'gross_sales' => round((float) $rows->sum('gross_sales'), 2),
            'net_payable' => round((float) $rows->sum('net_payable'), 2),
            'income'      => round((float) $rows->sum('income'), 2),
        ];
    }

    private function departmentSummary(Collection $rows): Collection
    {
        return $rows->groupBy('department')->map(function (Collection $items) {
            return [
                'department'  => $items->first()->department,
                'label'       => $items->first()->department_label,
                'records'     => $items->count(),
                'gross_sales' => round((float) $items->sum('gross_sales'), 2),
                'net_payable' => round((float) $items->sum('net_payable'), 2),
                'income'      => round((float) $items->sum('income'), 2),
            ];
        })->values();
    }

    private function targets(array $filters, Request $request): Collection
    {
        $query = SalesTarget::with('branch')
            ->where('year', $filters['year'])
            ->where('month', $filters['month'])
            ->when($filters['department'], fn ($q) => $q->where('department', $filters['department']))
            ->when($filters['branch_id'],  fn ($q) => $q->where('branch_id', $filters['branch_id']))
            ->when($filters['agent_code'], fn ($q) => $q->where('agent_code', $filters['agent_code']));

        if ($request->user()?->getRoleNames()->first() === 'branch_supervisor') {
            $query->where('branch_id', $request->user()->branch_id);
        }

        return $query->orderBy('department')->get()->map(fn (SalesTarget $target) => [
            'id'               => $target->id,
            'department'       => $target->department,
            'department_label' => SalesTarget::DEPARTMENTS[$target->department] ?? $target->department,
            'branch_name'      => $target->branch?->name,
            'agent_code'       => $target->agent_code,
            'target_amount'    => (float) $target->target_amount,
        ]);
    }

    private function requireViewer(Request $request): void
    {
        if (! in_array($request->user()?->getRoleNames()->first() ?? '', self::VIEW_ROLES, true)) {
            abort(403);
        }
    }
}
