<?php

namespace Modules\Visa\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\Visa\Models\VisaApplication;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['president', 'chief_operating_officer', 'finance_admin_supervisor', 'administrative_assistant', 'general_sales_manager', 'accounting_assistant', 'visa_documentation_supervisor', 'liaison_officer_visa', 'visa_documentation_officer'])) {
            return;
        }

        $year  = now()->year;
        $query = VisaApplication::query();

        // ── KPI cards (unchanged from original, just expanded) ────────────────
        $collector->addCard('visa', 'Visa', 'Open applications',
            (clone $query)->whereNotIn('status', ['completed', 'denied', 'forfeited', 'refunded'])->count(),
            'FileCheck2', 'info', href: '/visa'
        );

        $collector->addCard('visa', 'Visa', 'Pending',
            (clone $query)->where('status', 'pending')->count(),
            'FileClock', 'warning', href: '/visa'
        );

        $collector->addCard('visa', 'Visa', 'On process',
            (clone $query)->where('status', 'on_process')->count(),
            'ClipboardList', 'info', href: '/visa'
        );

        $collector->addCard('visa', 'Visa', 'Completed',
            (clone $query)->where('status', 'completed')->whereYear('date', $year)->count(),
            'CircleCheckBig', 'success', href: '/visa'
        );

        // net_payable = what the client pays to the embassy (this is the "embassy payments" concept)
        $collector->addCard('visa', 'Visa', 'Embassy payments',
            'PHP ' . number_format(
                (float) (clone $query)->whereYear('date', $year)->sum('net_payable'),
                2
            ),
            'BanknoteArrowUp', 'primary', href: '/visa'
        );

        $collector->addAttention('visa', 'Visa', 'Visa in process',
            (clone $query)->whereIn('status', ['pending', 'on_process'])->count(),
            'warning', '/visa'
        );

        // ── Chart: application status breakdown (donut) ───────────────────────
        // Mirrors the "STATUS" table in the Visa Excel dashboard.
        $statusMap = [
            'pending'   => 'Pending',
            'on_process'=> 'On Process',
            'completed' => 'Completed',
            'approved'  => 'Approved',
            'denied'    => 'Denied',
            'forfeited' => 'Forfeited',
            'refunded'  => 'Refunded',
        ];

        $slices = [];
        foreach ($statusMap as $key => $label) {
            $count = (clone $query)->where('status', $key)->count();
            if ($count > 0) {
                $slices[] = ['name' => $label, 'value' => $count];
            }
        }

        if (! empty($slices)) {
            $collector->addChartData('visa', 'Visa', 'status_breakdown', [
                'slices' => $slices,
            ]);
        }

        // ── Chart: applications by status per month (stacked bar) ─────────────
        // Mirrors the monthly counts table in the Excel Visa Summary sheet.
        $months = collect(range(1, 12))
            ->map(fn ($m) => \Carbon\Carbon::create($year, $m)->format('M'))
            ->values()
            ->all();

        $trackStatuses = ['pending', 'on_process', 'completed', 'approved', 'denied'];
        $trackLabels   = ['Pending', 'On Process', 'Completed', 'Approved', 'Denied'];

        $series = [];
        foreach ($trackStatuses as $idx => $status) {
            $monthlyData = collect(range(1, 12))->map(fn ($m) =>
                (int) VisaApplication::query()
                    ->where('status', $status)
                    ->whereYear('date', $year)
                    ->whereMonth('date', $m)
                    ->count()
            )->values()->all();

            $series[] = ['name' => $trackLabels[$idx], 'data' => $monthlyData];
        }

        $collector->addChartData('visa', 'Visa', 'status_by_month', [
            'labels' => $months,
            'series' => $series,
        ]);

        // ── Chart: individual income per agent (bar) ──────────────────────────
        // Mirrors the "INDIVIDUAL INCOME" table in the Excel Visa Summary.
        // Uses the agent codes defined on the model constant.
        $incomeByAgent = VisaApplication::query()
            ->whereYear('date', $year)
            ->whereIn('agent_code', VisaApplication::AGENT_CODES)
            ->selectRaw('agent_code, SUM(income) as total')
            ->groupBy('agent_code')
            ->orderByDesc('total')
            ->get();

        if ($incomeByAgent->isNotEmpty()) {
            $collector->addChartData('visa', 'Visa', 'individual_income', [
                'labels' => $incomeByAgent->pluck('agent_code')->values()->all(),
                'series' => [
                    ['name' => 'Income YTD', 'data' => $incomeByAgent
                        ->pluck('total')
                        ->map(fn ($v) => round((float) $v, 2))
                        ->values()
                        ->all(),
                    ],
                ],
            ]);
        }
    }
}
