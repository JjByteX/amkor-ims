<?php

namespace Modules\Disbursement\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * DisbursementAccessFileExport
 *
 * Phase 9 — Disbursement Access File Export.
 *
 * Generates the bimonthly disbursement ledger that Dalle sends to the Admin
 * Auditor on the 15th and at the end of each month.
 *
 * Period scoping:
 *   - 1st–15th  → $periodLabel = '1st–15th',  entries where date between 1st and 15th
 *   - 16th–EOM  → $periodLabel = '16th–EOM',  entries where date between 16th and last day
 *
 * Layout:
 *   Row 1 — Company name
 *   Row 2 — Address
 *   Row 3 — Period + branch
 *   Row 4 — Column headings (bold, shaded)
 *   Row 5+ — Data rows
 *   Last row — Totals (SUM formulas on amount columns)
 *
 * Columns:
 *   A  Date
 *   B  Category
 *   C  Fund Type
 *   D  Reference No.
 *   E  Payee
 *   F  Description
 *   G  Account Code
 *   H  Currency
 *   I  Amount (PHP)
 *   J  Amount (USD)
 *   K  Amount (JPY)
 *   L  Remarks
 *   M  Branch
 *   N  Prepared By
 */
class DisbursementAccessFileExport implements
    FromCollection,
    WithHeadings,
    WithTitle,
    WithStyles,
    ShouldAutoSize,
    WithColumnFormatting,
    WithEvents
{
    /** Spreadsheet row where data starts (after header + heading). */
    private const DATA_START_ROW = 5;

    /** Column constants — update both here and in headings() if layout changes. */
    private const LAST_COL = 'N';

    public function __construct(
        private readonly Collection $entries,
        private readonly string $periodLabel,   // e.g. '1st–15th' or '16th–EOM'
        private readonly string $periodDate,    // e.g. '2026-06-15' or '2026-06-30'
        private readonly string $branchName,    // e.g. 'Main Branch (QC)' or 'All Branches'
        private readonly string $monthYear,     // e.g. 'June 2026'
    ) {}

    // ─── Data ────────────────────────────────────────────────────────────────

    public function collection(): Collection
    {
        return $this->entries->map(fn ($entry) => [
            'date'          => $entry->date?->format('m/d/Y'),
            'category'      => $this->categoryLabel($entry->category),
            'fund_type'     => $this->fundTypeLabel($entry->fund_type),
            'reference_no'  => $entry->reference_no ?? '',
            'payee'         => $entry->payee ?? '',
            'description'   => $entry->description ?? '',
            'account_code'  => $entry->account_code ?? '',
            'currency'      => $entry->currency ?? 'PHP',
            // PHP amount: only when currency is PHP
            'amount_php'    => $entry->currency === 'PHP' ? (float) $entry->amount : 0,
            // USD amount: only when currency is USD
            'amount_usd'    => $entry->currency === 'USD' ? (float) $entry->amount : 0,
            // JPY amount: only when currency is JPY
            'amount_jpy'    => $entry->currency === 'JPY' ? (float) $entry->amount : 0,
            'remarks'       => $entry->remarks ?? '',
            'branch'        => $entry->branch?->name ?? '',
            'prepared_by'   => $entry->createdBy?->name ?? '',
        ]);
    }

    // ─── Headings ────────────────────────────────────────────────────────────

    public function headings(): array
    {
        return [
            'Date',
            'Category',
            'Fund Type',
            'Reference No.',
            'Payee',
            'Description',
            'Account Code',
            'Currency',
            'Amount (PHP)',
            'Amount (USD)',
            'Amount (JPY)',
            'Remarks',
            'Branch',
            'Prepared By',
        ];
    }

    // ─── Sheet title ─────────────────────────────────────────────────────────

    public function title(): string
    {
        return "Disbursement {$this->periodLabel}";
    }

    // ─── Column number formats ────────────────────────────────────────────────

    public function columnFormats(): array
    {
        return [
            'I' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'J' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'K' => '#,##0.00',   // JPY — no decimal in practice but keeps it consistent
        ];
    }

    // ─── Styles ──────────────────────────────────────────────────────────────

    public function styles(Worksheet $sheet): array
    {
        $headingRow = self::DATA_START_ROW - 1;   // row 4

        return [
            $headingRow => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FF1F3864']],
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FFD6E4F0'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    // ─── Post-sheet events ───────────────────────────────────────────────────

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet    = $event->sheet->getDelegate();
                $rowCount = $this->entries->count();
                $lastData = self::DATA_START_ROW + $rowCount - 1;
                $totRow   = $lastData + 1;
                $lastCol  = self::LAST_COL;

                // ── Prepend 3 header rows, push heading + data down ───────────
                $sheet->insertNewRowBefore(1, self::DATA_START_ROW - 1);

                // Row 1 — Company name
                $sheet->mergeCells("A1:{$lastCol}1");
                $sheet->setCellValue('A1', 'AMKOR TRAVEL AND TOURS INC.');
                $sheet->getStyle('A1')->applyFromArray([
                    'font'      => ['bold' => true, 'size' => 13],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                // Row 2 — Address
                $sheet->mergeCells("A2:{$lastCol}2");
                $sheet->setCellValue('A2', 'Suite 108 West City Plaza Bldg. #66, West Avenue, Quezon City');
                $sheet->getStyle('A2')->applyFromArray([
                    'font'      => ['size' => 10],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                // Row 3 — Report title + period + branch
                $sheet->mergeCells("A3:{$lastCol}3");
                $sheet->setCellValue(
                    'A3',
                    sprintf(
                        'DISBURSEMENT ACCESS FILE — %s  |  Period: %s  |  Branch: %s',
                        $this->monthYear,
                        $this->periodLabel,
                        $this->branchName,
                    )
                );
                $sheet->getStyle('A3')->applyFromArray([
                    'font'      => ['bold' => true, 'size' => 11, 'color' => ['argb' => 'FFFFFFFF']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    'fill'      => [
                        'fillType'   => Fill::FILL_SOLID,
                        'startColor' => ['argb' => 'FF1F3864'],
                    ],
                ]);
                $sheet->getRowDimension(3)->setRowHeight(20);

                // Recalculate actual rows after prepend
                // Header rows: 1, 2, 3 → heading at 4, data starts at 5
                $headingRow = 4;
                $dataStart  = 5;
                $actualLast = $dataStart + $rowCount - 1;
                $actualTot  = $actualLast + 1;

                // Re-apply heading style at the correct row (styles() ran before insert)
                $sheet->getStyle("A{$headingRow}:{$lastCol}{$headingRow}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FF1F3864']],
                    'fill' => [
                        'fillType'   => Fill::FILL_SOLID,
                        'startColor' => ['argb' => 'FFD6E4F0'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                // ── Totals row ────────────────────────────────────────────────
                $sheet->setCellValue("A{$actualTot}", 'TOTALS');
                $sheet->mergeCells("A{$actualTot}:H{$actualTot}");

                // SUM formulas for the three amount columns (I, J, K)
                foreach (['I', 'J', 'K'] as $col) {
                    $sheet->setCellValue(
                        "{$col}{$actualTot}",
                        "=SUM({$col}{$dataStart}:{$col}{$actualLast})"
                    );
                }

                $sheet->getStyle("A{$actualTot}:{$lastCol}{$actualTot}")->applyFromArray([
                    'font' => ['bold' => true],
                    'fill' => [
                        'fillType'   => Fill::FILL_SOLID,
                        'startColor' => ['argb' => 'FFFFF2CC'],
                    ],
                ]);

                // ── Grand total note below totals row ────────────────────────
                // Useful when entries span currencies — reminds reader PHP total is column I
                $noteRow = $actualTot + 1;
                $sheet->setCellValue("A{$noteRow}", 'Note: Amounts are split by currency. PHP total in column I, USD in column J, JPY in column K.');
                $sheet->mergeCells("A{$noteRow}:{$lastCol}{$noteRow}");
                $sheet->getStyle("A{$noteRow}")->applyFromArray([
                    'font'      => ['italic' => true, 'size' => 9, 'color' => ['argb' => 'FF666666']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                ]);

                // ── Borders on heading + data + totals ────────────────────────
                $sheet->getStyle("A{$headingRow}:{$lastCol}{$actualTot}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color'       => ['argb' => 'FFAAAAAA'],
                        ],
                    ],
                ]);

                // ── Freeze panes below heading row ────────────────────────────
                $sheet->freezePane("A{$dataStart}");

                // ── Row height ────────────────────────────────────────────────
                $sheet->getRowDimension(1)->setRowHeight(20);
                $sheet->getRowDimension(3)->setRowHeight(20);
            },
        ];
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function categoryLabel(string $category): string
    {
        return match ($category) {
            'cash'           => 'Cash',
            'check'          => 'Check',
            'liaison_admin'  => 'Liaison Travel (Admin)',
            'liaison_banks'  => 'Liaison Travel (Banks)',
            default          => $category,
        };
    }

    private function fundTypeLabel(string $fundType): string
    {
        return match ($fundType) {
            'cash_on_hand' => 'Cash on Hand',
            'cash_on_bank' => 'Cash on Bank',
            'petty_cash'   => 'Petty Cash',
            default        => $fundType,
        };
    }
}
