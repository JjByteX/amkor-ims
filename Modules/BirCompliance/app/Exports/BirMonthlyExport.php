<?php

namespace Modules\BirCompliance\Exports;

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
 * BirMonthlyExport
 *
 * Phase 10 — BIR Monthly Excel Export.
 *
 * Generates a compliant monthly BIR register for Amkor Travel & Tours Inc.
 * Covers all AR and SI document types for the selected month/year,
 * with full VAT breakdown columns required for BIR submission review.
 *
 * Layout mirrors the standard BIR Sales Journal format:
 *   - Company header (rows 1–3)
 *   - Period sub-header (row 4)
 *   - Column headings (row 5)
 *   - Data rows (row 6 onwards)
 *   - Totals row
 *
 * The user uploads this file to eBIR themselves — the system does not file directly.
 */
class BirMonthlyExport implements
    FromCollection,
    WithHeadings,
    WithTitle,
    WithStyles,
    ShouldAutoSize,
    WithColumnFormatting,
    WithEvents
{
    /** Row at which data starts (after headers). */
    private int $dataStartRow = 6;

    public function __construct(
        private readonly Collection $transactions,
        private readonly int $year,
        private readonly int $month,
        private readonly string $branchName = 'All Branches',
    ) {}

    // ─── Data ────────────────────────────────────────────────────────────────

    public function collection(): Collection
    {
        return $this->transactions->map(fn ($tx) => [
            'transaction_date'         => $tx->transaction_date?->format('m/d/Y'),
            'document_type'            => $tx->document_type,
            'document_number'          => $tx->document_number,
            'client_name'              => $tx->client_name,
            'tin'                      => $tx->tin ?? '',
            'address'                  => $tx->address ?? '',
            'mode_of_payment'          => $tx->mode_of_payment ?? '',
            'gross_amount'             => (float) $tx->gross_amount,
            'vatable_sales'            => (float) $tx->vatable_sales,
            'vat_exempt_sales'         => (float) $tx->vat_exempt_sales,
            'vat_zero_rated_sales'     => (float) $tx->vat_zero_rated_sales,
            'vat_amount'               => (float) $tx->vat_amount,
            'sc_pwd_discount'          => (float) $tx->sc_pwd_discount,
            'withholding_tax'          => (float) $tx->withholding_tax,
            'net_amount_due'           => (float) $tx->net_amount_due,
            'particulars'              => $tx->particulars ?? '',
            'branch_code'              => $tx->branch_code ?? '',
            'source_type'              => $tx->source_type,
        ]);
    }

    // ─── Headings ────────────────────────────────────────────────────────────

    /**
     * Returns the column heading row only.
     * The company header rows (1–4) are injected via WithEvents/AfterSheet
     * because maatwebsite/excel writes headings at row 1 — we prepend above them.
     */
    public function headings(): array
    {
        return [
            'Date',
            'Doc Type',
            'Document No.',
            'Client Name',
            'TIN',
            'Address',
            'Mode of Payment',
            'Gross Amount',
            'VATAble Sales',
            'VAT-Exempt Sales',
            'VAT Zero-Rated',
            'VAT Amount (12%)',
            'SC/PWD Discount',
            'Withholding Tax',
            'Net Amount Due',
            'Particulars',
            'Branch',
            'Source',
        ];
    }

    // ─── Sheet title ─────────────────────────────────────────────────────────

    public function title(): string
    {
        return sprintf('%s-%02d BIR Register', $this->year, $this->month);
    }

    // ─── Column number formats ────────────────────────────────────────────────

    public function columnFormats(): array
    {
        // Columns H–O (indices 8–15) are currency columns.
        // A = 1, H = 8 in phpspreadsheet.
        return [
            'H' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'I' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'J' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'K' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'L' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'M' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'N' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'O' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
        ];
    }

    // ─── Styles ──────────────────────────────────────────────────────────────

    public function styles(Worksheet $sheet): array
    {
        $lastDataRow = $this->dataStartRow + $this->transactions->count() - 1;
        $totalsRow   = $lastDataRow + 1;
        $lastCol     = 'R';

        return [
            // Heading row — bold, light blue background
            $this->dataStartRow - 1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FF1F3864']],
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FFD6E4F0'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
            // Totals row — bold
            $totalsRow => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FFFFF2CC'],
                ],
            ],
        ];
    }

    // ─── Post-sheet events (header rows + totals + borders) ──────────────────

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet     = $event->sheet->getDelegate();
                $rowCount  = $this->transactions->count();
                $lastData  = $this->dataStartRow + $rowCount - 1;
                $totalsRow = $lastData + 1;
                $lastCol   = 'R';

                // ── Prepend company/period header rows (shift data down 4 rows) ──
                $sheet->insertNewRowBefore(1, $this->dataStartRow - 1);

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

                // Row 3 — TIN + ATP
                $sheet->mergeCells("A3:{$lastCol}3");
                $sheet->setCellValue('A3', 'TIN: 223-586-994-00000  |  BIR ATP No.: 089AU2025');
                $sheet->getStyle('A3')->applyFromArray([
                    'font'      => ['size' => 10],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                // Row 4 — Period + branch
                $monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
                $sheet->mergeCells("A4:{$lastCol}4");
                $sheet->setCellValue(
                    'A4',
                    sprintf(
                        'MONTHLY BIR SALES REGISTER — %s %d  |  Branch: %s',
                        $monthNames[$this->month - 1],
                        $this->year,
                        $this->branchName,
                    )
                );
                $sheet->getStyle('A4')->applyFromArray([
                    'font'      => ['bold' => true, 'size' => 11],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    'fill'      => [
                        'fillType'   => Fill::FILL_SOLID,
                        'startColor' => ['argb' => 'FF1F3864'],
                    ],
                    'font' => ['bold' => true, 'size' => 11, 'color' => ['argb' => 'FFFFFFFF']],
                ]);

                // Empty spacer row 5 (headings are now at row 5 after insert)
                // recalculate actual heading / data rows after prepend
                $headingRow  = 5;
                $dataStart   = 6;
                $actualLast  = $dataStart + $rowCount - 1;
                $actualTot   = $actualLast + 1;

                // ── Totals row ────────────────────────────────────────────────
                $sheet->setCellValue("A{$actualTot}", 'TOTALS');
                $sheet->mergeCells("A{$actualTot}:G{$actualTot}");

                // SUM formulas for each numeric column (H–O)
                foreach (['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'] as $col) {
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

                // ── Borders on data + heading + totals ────────────────────────
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

                // ── Row height for header rows ────────────────────────────────
                $sheet->getRowDimension(1)->setRowHeight(20);
                $sheet->getRowDimension(4)->setRowHeight(22);
            },
        ];
    }
}
