<?php

namespace App\Support;

use App\Models\User;

class DashboardCollector
{
    /**
     * @var array<string, array{label: string, cards: array, attention: array, chartData: array}>
     */
    private array $sections = [];

    public function __construct(public readonly User $user) {}

    /**
     * @param  string[]|string  $roles
     */
    public function can(string|array $roles): bool
    {
        if ($roles === 'all') {
            return true;
        }

        return in_array($this->user->getRoleNames()->first(), (array) $roles, true);
    }

    public function addCard(
        string $section,
        string $sectionLabel,
        string $label,
        mixed $value,
        string $icon = 'ClipboardList',
        string $tone = 'default',
        ?string $sub = null,
        ?string $href = null,
    ): void {
        $this->ensureSection($section, $sectionLabel);

        $this->sections[$section]['cards'][] = [
            'label' => $label,
            'value' => $value,
            'icon'  => $icon,
            'tone'  => $tone,
            'sub'   => $sub,
            'href'  => $href,
        ];
    }

    public function addAttention(
        string $section,
        string $sectionLabel,
        string $label,
        mixed $value,
        string $tone = 'warning',
        ?string $href = null,
    ): void {
        $this->ensureSection($section, $sectionLabel);

        $this->sections[$section]['attention'][] = [
            'label' => $label,
            'value' => $value,
            'tone'  => $tone,
            'href'  => $href,
        ];
    }

    /**
     * addChartData
     * ─────────────────────────────────────────────────────────────────────────
     * Attaches chart data to a section. The front-end (DashboardCharts.jsx)
     * reads section.chartData[$dataKey] and normalises it for Recharts.
     *
     * Supported shapes:
     *
     *   Bar / Line / Area  (dataKey e.g. 'monthly_by_department'):
     *     [
     *       'labels' => ['Jan', 'Feb', …],
     *       'series' => [
     *           ['name' => 'RESA',   'data' => [0, 1500, …]],
     *           ['name' => 'Groups', 'data' => [0, 800, …]],
     *       ],
     *     ]
     *
     *   Donut  (dataKey e.g. 'status_breakdown'):
     *     [
     *       'slices' => [
     *           ['name' => 'Pending',   'value' => 4],
     *           ['name' => 'Completed', 'value' => 12],
     *       ],
     *     ]
     */
    public function addChartData(
        string $section,
        string $sectionLabel,
        string $dataKey,
        array $data,
    ): void {
        $this->ensureSection($section, $sectionLabel);
        $this->sections[$section]['chartData'][$dataKey] = $data;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function toArray(): array
    {
        return collect($this->sections)
            ->map(fn (array $section, string $key) => [
                'key'       => $key,
                'label'     => $section['label'],
                'cards'     => $section['cards'],
                'attention' => $section['attention'],
                'chartData' => $section['chartData'] ?? [],
            ])
            ->values()
            ->all();
    }

    private function ensureSection(string $key, string $label): void
    {
        $this->sections[$key] ??= [
            'label'     => $label,
            'cards'     => [],
            'attention' => [],
            'chartData' => [],
        ];
    }
}
