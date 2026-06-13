<?php

namespace Modules\SalesSummary\Listeners;

use App\Events\DashboardSummaryRequested;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\SalesSummary\Models\SalesTarget;

class ContributeDashboardSummary
{
    /**
     * Sales sources — each entry is [table, date_col, status_col, confirmed_statuses, label, ?where_clause].
     *
     * IMPORTANT: reservation_bookings is split into two logical departments:
     *
     *   RESA   = FIT + Corporate bookings (transaction_type IN ('fit', 'corporate') OR NULL)
     *   Groups = Group + Blocking bookings (transaction_type IN ('group', 'blocking'))
     *
     * This matches the four-panel Excel Sales Summary exactly:
     *   Resa | Groups | Visa | Ormoc
     *
     * transaction_type was added in migration 2026_06_14_000002. Rows that
     * predate this migration have transaction_type = NULL — these are treated
     * as RESA (legacy FIT/corporate entries).
     *
     * Verified status values against actual migrations:
     *   reservation_bookings — confirmed
     *   ormoc_bookings       — confirmed
     *   visa_applications    — approved | completed
     */
    private const SOURCES = [
        // RESA — FIT and Corporate (excludes group/blocking rows)
        [
            'table'    => 'reservation_bookings',
            'date_col' => 'date',
            'status_col' => 'status',
            'statuses' => ['confirmed'],
            'label'    => 'RESA',
            'where'    => "transaction_type IS NULL OR transaction_type IN ('fit', 'corporate')",
        ],

        // Groups — Group and Blocking bookings from the same table
        [
            'table'    => 'reservation_bookings',
            'date_col' => 'date',
            'status_col' => 'status',
            'statuses' => ['confirmed'],
            'label'    => 'Groups',
            'where'    => "transaction_type IN ('group', 'blocking')",
        ],

        // Ormoc
        [
            'table'    => 'ormoc_bookings',
            'date_col' => 'date',
            'status_col' => 'status',
            'statuses' => ['confirmed'],
            'label'    => 'Ormoc',
            'where'    => null,
        ],

        // Visa
        [
            'table'    => 'visa_applications',
            'date_col' => 'date',
            'status_col' => 'status',
            'statuses' => ['approved', 'completed'],
            'label'    => 'Visa',
            'where'    => null,
        ],
    ];

    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can([
            'general_manager', 'chief_operations_officer', 'general_sales_manager',
            'accounting_officer', 'admin_auditor', 'resa_officer',
            'ormoc_branch_officer', 'visa_documentation_officer',
        ])) {
            return;
        }

        $year  = now()->year;
        $month = now()->month;

        $months = collect(range(1, 12))
            ->map(fn ($m) => \Carbon\Carbon::create($year, $m)->format('M'))
            ->values()->all();

        // ── KPI: Sales MTD ────────────────────────────────────────────────────
        $salesMtd = 0.0;
        foreach (self::SOURCES as $src) {
            if (! Schema::hasTable($src['table'])) {
                continue;
            }
            $q = DB::table($src['table'])
                ->whereNull("{$src['table']}.deleted_at")
                ->whereYear("{$src['table']}.{$src['date_col']}", $year)
                ->whereMonth("{$src['table']}.{$src['date_col']}", $month)
                ->whereIn("{$src['table']}.{$src['status_col']}", $src['statuses']);
            if ($src['where']) {
                $q->whereRaw($src['where']);
            }
            $salesMtd += (float) $q->sum("{$src['table']}.income");
        }

        $collector->addCard('sales', 'Sales', 'Sales MTD',
            'PHP '.number_format($salesMtd, 2),
            'ChartSpline', 'primary', href: '/sales'
        );

        // ── KPI: Sales YTD ────────────────────────────────────────────────────
        $salesYtd = 0.0;
        foreach (self::SOURCES as $src) {
            if (! Schema::hasTable($src['table'])) {
                continue;
            }
            $q = DB::table($src['table'])
                ->whereNull("{$src['table']}.deleted_at")
                ->whereYear("{$src['table']}.{$src['date_col']}", $year)
                ->whereIn("{$src['table']}.{$src['status_col']}", $src['statuses']);
            if ($src['where']) {
                $q->whereRaw($src['where']);
            }
            $salesYtd += (float) $q->sum("{$src['table']}.income");
        }

        $collector->addCard('sales', 'Sales', 'Sales YTD',
            'PHP '.number_format($salesYtd, 2),
            'Target', 'primary', href: '/sales'
        );

        // ── Chart: monthly sales by department (4 series: RESA/Groups/Ormoc/Visa) ──
        $series = [];
        foreach (self::SOURCES as $src) {
            if (! Schema::hasTable($src['table'])) {
                continue;
            }
            $monthlyData = collect(range(1, 12))->map(function ($m) use ($src, $year) {
                $q = DB::table($src['table'])
                    ->whereNull("{$src['table']}.deleted_at")
                    ->whereYear("{$src['table']}.{$src['date_col']}", $year)
                    ->whereMonth("{$src['table']}.{$src['date_col']}", $m)
                    ->whereIn("{$src['table']}.{$src['status_col']}", $src['statuses']);
                if ($src['where']) {
                    $q->whereRaw($src['where']);
                }

                return round((float) $q->sum("{$src['table']}.income"), 2);
            })->values()->all();

            $series[] = ['name' => $src['label'], 'data' => $monthlyData];
        }

        if (! empty($series)) {
            $collector->addChartData('sales', 'Sales', 'monthly_by_department', [
                'labels' => $months,
                'series' => $series,
            ]);
        }

        // ── Chart: progress curve — cumulative target vs achieved ─────────────
        $annualTarget = (float) SalesTarget::query()
            ->where('year', $year)
            ->whereNull('agent_code')
            ->whereNull('branch_id')
            ->sum('target_amount');

        if ($annualTarget <= 0) {
            $annualTarget = (float) SalesTarget::query()
                ->where('year', $year)
                ->sum('target_amount');
        }

        $monthlyTarget = $annualTarget > 0 ? $annualTarget / 12 : 0;
        $cumTarget     = [];
        $cumAchieved   = [];
        $runTarget     = 0.0;
        $runAchieved   = 0.0;

        foreach (range(1, 12) as $m) {
            $runTarget   += $monthlyTarget;
            $monthIncome = 0.0;

            foreach (self::SOURCES as $src) {
                if (! Schema::hasTable($src['table'])) {
                    continue;
                }
                $q = DB::table($src['table'])
                    ->whereNull("{$src['table']}.deleted_at")
                    ->whereYear("{$src['table']}.{$src['date_col']}", $year)
                    ->whereMonth("{$src['table']}.{$src['date_col']}", $m)
                    ->whereIn("{$src['table']}.{$src['status_col']}", $src['statuses']);
                if ($src['where']) {
                    $q->whereRaw($src['where']);
                }
                $monthIncome += (float) $q->sum("{$src['table']}.income");
            }

            $runAchieved  += $monthIncome;
            $cumTarget[]   = round($runTarget, 2);
            $cumAchieved[] = round($runAchieved, 2);
        }

        $collector->addChartData('sales', 'Sales', 'progress_curve', [
            'labels' => $months,
            'series' => [
                ['name' => 'Cum. Target',   'data' => $cumTarget],
                ['name' => 'Cum. Achieved', 'data' => $cumAchieved],
            ],
        ]);

        // ── Chart: top performers by department — 4-panel breakdown ──────────
        // Mirrors the Excel four-panel "Top Performers" layout: RESA | Groups | Visa | Ormoc
        $departmentPerformers = [];

        foreach (self::SOURCES as $src) {
            if (! Schema::hasTable($src['table'])) {
                continue;
            }
            $q = DB::table($src['table'])
                ->whereNull("{$src['table']}.deleted_at")
                ->whereYear("{$src['table']}.{$src['date_col']}", $year)
                ->whereMonth("{$src['table']}.{$src['date_col']}", $month)
                ->whereIn("{$src['table']}.{$src['status_col']}", $src['statuses'])
                ->whereNotNull("{$src['table']}.agent_code")
                ->where("{$src['table']}.agent_code", '!=', '')
                ->selectRaw('agent_code, SUM(income) as total')
                ->groupBy('agent_code');
            if ($src['where']) {
                $q->whereRaw($src['where']);
            }

            $map = [];
            foreach ($q->get() as $row) {
                $code        = strtoupper(trim($row->agent_code));
                $map[$code]  = ($map[$code] ?? 0.0) + (float) $row->total;
            }
            arsort($map);
            $departmentPerformers[$src['label']] = array_slice($map, 0, 5, true);
        }

        // Flat top-performers chart (all departments merged) for compact dashboard widget
        $allPerformers = [];
        foreach ($departmentPerformers as $deptMap) {
            foreach ($deptMap as $code => $total) {
                $allPerformers[$code] = ($allPerformers[$code] ?? 0.0) + $total;
            }
        }
        arsort($allPerformers);
        $top = array_slice($allPerformers, 0, 8, true);

        if (! empty($top)) {
            $collector->addChartData('sales', 'Sales', 'top_performers', [
                'labels' => array_keys($top),
                'series' => [
                    ['name' => 'Income MTD', 'data' => array_map(fn ($v) => round($v, 2), array_values($top))],
                ],
            ]);
        }

        // Department-split performers — for the full Sales Summary page 4-panel view
        if (! empty($departmentPerformers)) {
            $collector->addChartData('sales', 'Sales', 'top_performers_by_department', [
                'departments' => array_map(function ($deptMap) {
                    return [
                        'labels' => array_keys($deptMap),
                        'data'   => array_map(fn ($v) => round($v, 2), array_values($deptMap)),
                    ];
                }, $departmentPerformers),
                'department_names' => array_keys($departmentPerformers),
            ]);
        }
    }
}
