<?php

namespace Modules\SalesSummary\Listeners;

use App\Events\DashboardSummaryRequested;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\SalesSummary\Models\SalesTarget;

class ContributeDashboardSummary
{
    /**
     * Source tables that contribute to sales figures.
     * [table, date_col, status_col, confirmed_statuses]
     *
     * Verified against actual migrations:
     *   reservation_bookings — status: inquiry|quoted|confirmed|cancelled
     *   ormoc_bookings       — status: inquiry|quoted|confirmed|cancelled
     *   visa_applications    — status: pending|on_process|approved|completed|denied|forfeited|refunded
     */
    private const SOURCES = [
        ['reservation_bookings', 'date', 'status', ['confirmed'],             'RESA'],
        ['ormoc_bookings',       'date', 'status', ['confirmed'],             'Ormoc'],
        ['visa_applications',    'date', 'status', ['approved', 'completed'], 'Visa'],
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

        // ── KPI: Sales MTD ────────────────────────────────────────────────
        $salesMtd = 0.0;
        foreach (self::SOURCES as [$table, $dateCol, $statusCol, $statuses]) {
            if (! Schema::hasTable($table)) continue;
            $salesMtd += (float) DB::table($table)
                ->whereNull("{$table}.deleted_at")
                ->whereYear("{$table}.{$dateCol}", $year)
                ->whereMonth("{$table}.{$dateCol}", $month)
                ->whereIn("{$table}.{$statusCol}", $statuses)
                ->sum("{$table}.income");
        }

        $collector->addCard('sales', 'Sales', 'Sales MTD',
            'PHP ' . number_format($salesMtd, 2),
            'ChartSpline', 'primary', href: '/sales'
        );

        // ── KPI: Sales YTD ────────────────────────────────────────────────
        $salesYtd = 0.0;
        foreach (self::SOURCES as [$table, $dateCol, $statusCol, $statuses]) {
            if (! Schema::hasTable($table)) continue;
            $salesYtd += (float) DB::table($table)
                ->whereNull("{$table}.deleted_at")
                ->whereYear("{$table}.{$dateCol}", $year)
                ->whereIn("{$table}.{$statusCol}", $statuses)
                ->sum("{$table}.income");
        }

        $collector->addCard('sales', 'Sales', 'Sales YTD',
            'PHP ' . number_format($salesYtd, 2),
            'Target', 'primary', href: '/sales'
        );

        // ── Chart: monthly sales by department ────────────────────────────
        $series = [];
        foreach (self::SOURCES as [$table, $dateCol, $statusCol, $statuses, $label]) {
            if (! Schema::hasTable($table)) continue;
            $monthlyData = collect(range(1, 12))->map(fn ($m) =>
                round((float) DB::table($table)
                    ->whereNull("{$table}.deleted_at")
                    ->whereYear("{$table}.{$dateCol}", $year)
                    ->whereMonth("{$table}.{$dateCol}", $m)
                    ->whereIn("{$table}.{$statusCol}", $statuses)
                    ->sum("{$table}.income"), 2)
            )->values()->all();

            $series[] = ['name' => $label, 'data' => $monthlyData];
        }

        if (! empty($series)) {
            $collector->addChartData('sales', 'Sales', 'monthly_by_department', [
                'labels' => $months,
                'series' => $series,
            ]);
        }

        // ── Chart: progress curve — cumulative target vs achieved ─────────
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
            $runTarget += $monthlyTarget;
            $monthIncome = 0.0;
            foreach (self::SOURCES as [$table, $dateCol, $statusCol, $statuses]) {
                if (! Schema::hasTable($table)) continue;
                $monthIncome += (float) DB::table($table)
                    ->whereNull("{$table}.deleted_at")
                    ->whereYear("{$table}.{$dateCol}", $year)
                    ->whereMonth("{$table}.{$dateCol}", $m)
                    ->whereIn("{$table}.{$statusCol}", $statuses)
                    ->sum("{$table}.income");
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

        // ── Chart: top performers this month ──────────────────────────────
        // Aggregate income by agent_code across all confirmed source tables.
        // reservation_bookings.agent_code is nullable; ormoc/visa are NOT NULL.
        $performerMap = [];
        foreach (self::SOURCES as [$table, $dateCol, $statusCol, $statuses]) {
            if (! Schema::hasTable($table)) continue;
            $rows = DB::table($table)
                ->whereNull("{$table}.deleted_at")
                ->whereYear("{$table}.{$dateCol}", $year)
                ->whereMonth("{$table}.{$dateCol}", $month)
                ->whereIn("{$table}.{$statusCol}", $statuses)
                ->whereNotNull("{$table}.agent_code")
                ->where("{$table}.agent_code", '!=', '')
                ->selectRaw("agent_code, SUM(income) as total")
                ->groupBy('agent_code')
                ->get();

            foreach ($rows as $row) {
                $code = strtoupper(trim($row->agent_code));
                $performerMap[$code] = ($performerMap[$code] ?? 0.0) + (float) $row->total;
            }
        }

        arsort($performerMap);
        $top = array_slice($performerMap, 0, 8, true);

        if (! empty($top)) {
            $collector->addChartData('sales', 'Sales', 'top_performers', [
                'labels' => array_keys($top),
                'series' => [
                    ['name' => 'Income MTD', 'data' => array_map(fn ($v) => round($v, 2), array_values($top))],
                ],
            ]);
        }
    }
}
