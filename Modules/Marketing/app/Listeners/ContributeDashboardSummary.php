<?php

namespace Modules\Marketing\Listeners;

use App\Events\DashboardSummaryRequested;
use Modules\Marketing\Models\MarketingExpense;
use Modules\Marketing\Models\MarketingMaterial;

class ContributeDashboardSummary
{
    public function handle(DashboardSummaryRequested $event): void
    {
        $collector = $event->collector;

        if (! $collector->can(['president', 'chief_operating_officer', 'business_development_manager', 'sales_marketing_officer', 'accounting_assistant'])) {
            return;
        }

        $year      = now()->year;
        $materials = MarketingMaterial::query();
        $expenses  = MarketingExpense::query();

        // ── KPI cards ─────────────────────────────────────────────────────────
        // Note: marketing_expenses has no `budget` column — only `amount`.
        // Total spend = sum of all approved expenses for the year.
        $totalSpend = (float) (clone $expenses)
            ->where('period_year', $year)
            ->sum('amount');

        $collector->addCard('marketing', 'Marketing', 'Total spend',
            'PHP ' . number_format($totalSpend, 2),
            'BanknoteArrowDown', 'warning', href: '/marketing'
        );

        $collector->addCard('marketing', 'Marketing', 'Active campaigns',
            (clone $materials)->where('status', 'published')->count(),
            'Megaphone', 'primary', href: '/marketing'
        );

        $collector->addCard('marketing', 'Marketing', 'Pending approvals',
            (clone $materials)->where('status', 'submitted')->count(),
            'CircleCheckBig', 'warning', href: '/marketing'
        );

        $collector->addCard('marketing', 'Marketing', 'Scheduled blasts',
            (clone $materials)->where('status', 'scheduled')->whereNull('published_at')->count(),
            'Send', 'info', href: '/marketing'
        );

        $collector->addCard('marketing', 'Marketing', 'Total budget',
            '—',  // no budget column in schema; placeholder until budget tracking is added
            'Landmark', 'default', href: '/marketing'
        );

        $collector->addCard('marketing', 'Marketing', 'Budget variance',
            '—',
            'Target', 'default', href: '/marketing'
        );

        $collector->addAttention('marketing', 'Marketing', 'For approval',
            (clone $materials)->where('status', 'submitted')->count(),
            'warning', '/marketing'
        );

        // ── Chart: spend by category (bar) ────────────────────────────────────
        // Uses the real CATEGORIES constant from MarketingExpense.
        // Mirrors the "ADVERTISING EXPENSES / MET EXPENSES / OTHER EXPENSES" bars
        // in the Marketing Dashboard Excel.
        $spendByCategory = (clone $expenses)
            ->where('period_year', $year)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        if ($spendByCategory->isNotEmpty()) {
            $categoryLabels = MarketingExpense::CATEGORIES;

            $collector->addChartData('marketing', 'Marketing', 'budget_vs_spend', [
                'labels' => $spendByCategory
                    ->pluck('category')
                    ->map(fn ($c) => $categoryLabels[$c] ?? ucfirst(str_replace('_', ' ', $c)))
                    ->values()
                    ->all(),
                'series' => [
                    ['name' => 'Spend', 'data' => $spendByCategory
                        ->pluck('total')
                        ->map(fn ($v) => round((float) $v, 2))
                        ->values()
                        ->all(),
                    ],
                ],
            ]);
        }

        // ── Chart: spend by month (line) ──────────────────────────────────────
        // Shows marketing burn rate across the year.
        $months = collect(range(1, 12))
            ->map(fn ($m) => \Carbon\Carbon::create($year, $m)->format('M'))
            ->values()
            ->all();

        $monthlySpend = collect(range(1, 12))->map(fn ($m) =>
            round((float) MarketingExpense::query()
                ->where('period_year', $year)
                ->where('period_month', $m)
                ->sum('amount'), 2)
        )->values()->all();

        $collector->addChartData('marketing', 'Marketing', 'pre_post_revenue', [
            'labels' => $months,
            'series' => [
                ['name' => 'Spend', 'data' => $monthlySpend],
            ],
        ]);
    }
}
