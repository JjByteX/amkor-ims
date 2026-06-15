<?php

namespace Modules\DocumentGeneration\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use mikehaertl\pdftk\Pdf;
use Modules\BirCompliance\Models\BirTransaction;
use Modules\Disbursement\Models\Voucher;
use Modules\Reservation\Models\ReservationBooking;

class DocumentGenerationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Document Generation Controller
    |--------------------------------------------------------------------------
    |
    | Generates all document types as print-ready PDFs.
    |
    | AR, SI, CV, Check Voucher — fill AcroForm fields on pre-designed PDF
    | templates using pdftk (mikehaertl/php-pdftk).
    | Templates live in storage/app/templates/.
    |
    | SOA (Gap #6 fix) — Blade → PDF via wkhtmltopdf / Browsershot.
    | Switched from pdftk because SOA now has dynamic line items (up to 15
    | rows) that cannot be expressed as fixed AcroForm fields.
    |
    | Quotation (Gap #5) — Blade → PDF via the same Blade renderer.
    | Quotations are generated directly from a ReservationBooking record
    | at any time while status = 'inquiry' or 'confirmed'.
    |
    | Documents: AR, SI, SOA, Cash Voucher, Check Voucher, Quotation
    |
    | BIR-critical: AR (TIN required), SI (ATP 089AU2025, VAT breakdown)
    | Not BIR-critical: SOA, CV, Check Voucher, Quotation
    |
    */

    private const COMPANY = [
        'name'          => 'Amkor Travel & Tours Inc.',
        'tin_main'      => '223-586-994-00000',
        'tin_ormoc'     => '223-586-994-001',
        'address_main'  => 'Suite 108 West City Plaza Bldg. #66, West Avenue, Quezon City',
        'address_ormoc' => 'Unit 315 Robinsons Place Ormoc, Cogon, Ormoc City, Leyte',
        'iata'          => 'Yes',
        'ptaa'          => 'Yes',
    ];

    private const BANK_DETAILS = [
        ['bank' => 'BDO Unibank', 'currency' => 'PHP', 'account_name' => 'Amkor Travel and Tours Inc', 'account_number' => '0002-7006-7663'],
        ['bank' => 'BDO Unibank', 'currency' => 'USD', 'account_name' => 'Amkor Travel and Tours Inc', 'account_number' => '1002-7006-7671'],
        ['bank' => 'BPI',         'currency' => 'PHP', 'account_name' => 'Amkor Travel and Tours Inc', 'account_number' => '0433-203-194'],
        ['bank' => 'BPI',         'currency' => 'USD', 'account_name' => 'Amkor Travel and Tours Inc', 'account_number' => '0434-028-396'],
    ];

    // ─── Blade → PDF helper ──────────────────────────────────────────────────

    /**
     * Render a Blade view to an HTML string then convert to PDF via
     * wkhtmltopdf (via the barryvdh/laravel-snappy package, or swap for
     * spatie/browsershot — the view contract is identical either way).
     *
     * @param  array<string, mixed>  $data
     */
    private function bladeToDownload(string $view, array $data, string $downloadFilename): HttpResponse
    {
        $html = view($view, $data)->render();

        // barryvdh/laravel-snappy (wkhtmltopdf)
        $pdf = app('snappy.pdf.wrapper');
        $pdf->loadHTML($html);
        $pdf->setOption('page-size', 'A4');
        $pdf->setOption('margin-top', '0');
        $pdf->setOption('margin-bottom', '0');
        $pdf->setOption('margin-left', '0');
        $pdf->setOption('margin-right', '0');
        $pdf->setOption('encoding', 'UTF-8');
        $pdf->setOption('enable-local-file-access', true);

        $output = $pdf->output();

        return response($output, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$downloadFilename.'"',
        ]);
    }

    // ─── pdftk AcroForm helper ───────────────────────────────────────────────

    /**
     * Path to the directory containing the fillable PDF templates.
     */
    private function templatePath(string $filename): string
    {
        return storage_path('app/templates/'.$filename);
    }

    /**
     * Fill a PDF template with the given field data and stream it as a download.
     *
     * @param  array<string, string>  $fields
     */
    private function fillAndDownload(string $templateFilename, array $fields, string $downloadFilename): HttpResponse
    {
        $pdf = new Pdf($this->templatePath($templateFilename));

        $pdf->fillForm($fields)
            ->needAppearances();

        $tmpPath = tempnam(sys_get_temp_dir(), 'pdftk_').'.pdf';

        if (! $pdf->saveAs($tmpPath)) {
            abort(500, 'Failed to generate PDF: '.$pdf->getError());
        }

        $output = file_get_contents($tmpPath);
        @unlink($tmpPath);

        if ($output === false) {
            abort(500, 'Failed to read generated PDF.');
        }

        return response($output, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$downloadFilename.'"',
        ]);
    }

    // ────────────────────────────────────────────────────────────────────────
    // ACKNOWLEDGEMENT RECEIPT (AR)
    // BIR-critical: TIN required on all ARs
    // ────────────────────────────────────────────────────────────────────────

    public function generateAr(Request $request, BirTransaction $birTransaction): HttpResponse
    {
        $this->requireAccess($request);

        if ($birTransaction->document_type !== 'AR') {
            abort(422, 'This transaction is not an Acknowledgement Receipt.');
        }

        $fields = [
            'document_number'  => (string) $birTransaction->document_number,
            'transaction_date' => $birTransaction->transaction_date->format('F d, Y'),
            'client_name'      => (string) $birTransaction->client_name,
            'tin'              => (string) ($birTransaction->tin ?? ''),
            'address'          => (string) ($birTransaction->address ?? ''),
            'business_style'   => (string) ($birTransaction->business_style ?? ''),
            'amount_in_words'  => BirTransaction::amountInWords((float) $birTransaction->gross_amount),
            'gross_amount'     => number_format((float) $birTransaction->gross_amount, 2),
            'particulars'      => (string) ($birTransaction->particulars ?? ''),
            'check_number'     => (string) ($birTransaction->check_number ?? ''),
            'total_amount'     => number_format((float) $birTransaction->gross_amount, 2),
        ];

        $birTransaction->update([
            'pdf_generated'    => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "AR-{$birTransaction->document_number}-".now()->format('Ymd').'.pdf';

        return $this->fillAndDownload('acknowledgement-receipt-template.pdf', $fields, $filename);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SERVICE INVOICE (SI)
    // BIR-critical: BIR ATP No. 089AU2025, full VAT breakdown required
    // ────────────────────────────────────────────────────────────────────────

    public function generateSi(Request $request, BirTransaction $birTransaction): HttpResponse
    {
        $this->requireAccess($request);

        if ($birTransaction->document_type !== 'SI') {
            abort(422, 'This transaction is not a Service Invoice.');
        }

        $fields = [
            'document_number'        => (string) $birTransaction->document_number,
            'transaction_date'       => $birTransaction->transaction_date->format('F d, Y'),
            'client_name'            => (string) $birTransaction->client_name,
            'tin'                    => (string) ($birTransaction->tin ?? ''),
            'address'                => (string) ($birTransaction->address ?? ''),
            'business_style'         => (string) ($birTransaction->business_style ?? ''),
            'amount_in_words'        => BirTransaction::amountInWords((float) $birTransaction->gross_amount),
            'gross_amount'           => number_format((float) $birTransaction->gross_amount, 2),
            'particulars'            => (string) ($birTransaction->particulars ?? ''),
            'total_sales_vat_inclusive' => number_format((float) $birTransaction->total_sales_vat_inclusive, 2),
            'vat_amount'             => number_format((float) $birTransaction->vat_amount, 2),
            'vatable_sales'          => number_format((float) $birTransaction->vatable_sales, 2),
            'sc_pwd_discount'        => number_format((float) $birTransaction->sc_pwd_discount, 2),
            'net_amount_due'         => number_format((float) $birTransaction->net_amount_due, 2),
            'withholding_tax'        => number_format((float) $birTransaction->withholding_tax, 2),
            'vatable_sales_summary'  => number_format((float) $birTransaction->vatable_sales, 2),
            'vat_exempt_sales'       => number_format((float) $birTransaction->vat_exempt_sales, 2),
            'vat_zero_rated_sales'   => number_format((float) $birTransaction->vat_zero_rated_sales, 2),
            'vat_amount_summary'     => number_format((float) $birTransaction->vat_amount, 2),
            'total_sales_summary'    => number_format((float) $birTransaction->gross_amount, 2),
            'check_number'           => (string) ($birTransaction->check_number ?? ''),
            'total_amount'           => number_format((float) $birTransaction->gross_amount, 2),
        ];

        $birTransaction->update([
            'pdf_generated'    => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "SI-{$birTransaction->document_number}-".now()->format('Ymd').'.pdf';

        return $this->fillAndDownload('service-invoice-template.pdf', $fields, $filename);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STATEMENT OF ACCOUNT (SOA)  — Gap #6 fix
    //
    // Now uses Blade → PDF (wkhtmltopdf) instead of pdftk, because the SOA
    // has up to 15 dynamic line items that cannot be expressed as fixed
    // AcroForm fields on a pre-designed template.
    //
    // The $lineItems array is padded to exactly 15 rows by paddedLineItems()
    // on the model, so the blade can iterate a predictable count.
    // ────────────────────────────────────────────────────────────────────────

    public function generateSoa(Request $request, BirTransaction $birTransaction): HttpResponse
    {
        $this->requireAccess($request);

        if ($birTransaction->document_type !== 'SOA') {
            abort(422, 'This transaction is not a Statement of Account.');
        }

        // Pad line items to 15 rows (empty rows render as blank cells)
        $lineItems     = $birTransaction->paddedLineItems(15);
        $amountInWords = BirTransaction::amountInWords((float) $birTransaction->gross_amount);

        $birTransaction->update([
            'pdf_generated'    => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "SOA-{$birTransaction->document_number}-".now()->format('Ymd').'.pdf';

        return $this->bladeToDownload(
            'documentgeneration::pdf.statement-of-account',
            compact('birTransaction', 'lineItems', 'amountInWords'),
            $filename
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    // QUOTATION — Gap #5
    //
    // Generated from a ReservationBooking record. Available at any stage
    // (inquiry through confirmed). A sequential quotation number is derived
    // from the booking_no so it is traceable back to the source record.
    // ────────────────────────────────────────────────────────────────────────

    public function generateQuotation(Request $request, ReservationBooking $booking): HttpResponse
    {
        $this->requireQuotationAccess($request);

        $booking->load(['branch', 'createdBy']);

        // Quotation number: QUO-{booking_no} — unique per booking, traceable
        $quotationNumber = 'QUO-'.$booking->booking_no;
        $preparedBy      = $request->user()?->name ?? '';

        $filename = "Quotation-{$booking->booking_no}-".now()->format('Ymd').'.pdf';

        return $this->bladeToDownload(
            'documentgeneration::pdf.quotation',
            compact('booking', 'quotationNumber', 'preparedBy'),
            $filename
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    // CASH VOUCHER
    // Not BIR-critical — pulled from Disbursement module Voucher records
    // ────────────────────────────────────────────────────────────────────────

    public function generateCashVoucher(Request $request, Voucher $voucher): HttpResponse
    {
        $this->requireVoucherAccess($request);

        if ($voucher->type !== 'cash') {
            abort(422, 'This voucher is not a Cash Voucher.');
        }

        $voucher->load(['branch', 'createdBy', 'checker', 'approver', 'releaser']);

        $fields = [
            'voucher_no'          => (string) $voucher->voucher_no,
            'date_month'          => \Carbon\Carbon::parse($voucher->date)->format('F'),
            'date_year'           => \Carbon\Carbon::parse($voucher->date)->format('y'),
            'payee'               => (string) $voucher->payee,
            'payee_address'       => (string) ($voucher->payee_address ?? ''),
            'details'             => (string) $voucher->details,
            'amount'              => number_format((float) $voucher->amount, 2),
            'account_description' => (string) ($voucher->account_description ?? ''),
            'account_code'        => (string) ($voucher->account_code ?? ''),
            'prepared_by'         => (string) ($voucher->createdBy?->name ?? ''),
            'checked_by'          => (string) ($voucher->checker?->name ?? ''),
            'approved_by'         => (string) ($voucher->approver?->name ?? ''),
            'amount_in_words'     => BirTransaction::amountInWords((float) $voucher->amount),
        ];

        $voucher->update([
            'pdf_generated'    => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "CV-{$voucher->voucher_no}-".now()->format('Ymd').'.pdf';

        return $this->fillAndDownload('cash-voucher-template.pdf', $fields, $filename);
    }

    // ────────────────────────────────────────────────────────────────────────
    // CHECK VOUCHER
    // ────────────────────────────────────────────────────────────────────────

    public function generateCheckVoucher(Request $request, Voucher $voucher): HttpResponse
    {
        $this->requireVoucherAccess($request);

        if ($voucher->type !== 'check') {
            abort(422, 'This voucher is not a Check Voucher.');
        }

        $voucher->load(['branch', 'createdBy', 'checker', 'approver', 'releaser']);

        $fields = [
            'voucher_no'          => (string) $voucher->voucher_no,
            'date_month'          => \Carbon\Carbon::parse($voucher->date)->format('F'),
            'date_year'           => \Carbon\Carbon::parse($voucher->date)->format('y'),
            'payee'               => (string) $voucher->payee,
            'payee_address'       => (string) ($voucher->payee_address ?? ''),
            'details'             => (string) $voucher->details,
            'check_no'            => (string) ($voucher->check_no ?? ''),
            'amount'              => number_format((float) $voucher->amount, 2),
            'account_description' => (string) ($voucher->account_description ?? ''),
            'account_code'        => (string) ($voucher->account_code ?? ''),
            'prepared_by'         => (string) ($voucher->createdBy?->name ?? ''),
            'checked_by'          => (string) ($voucher->checker?->name ?? ''),
            'approved_by'         => (string) ($voucher->approver?->name ?? ''),
            'amount_in_words'     => BirTransaction::amountInWords((float) $voucher->amount),
        ];

        $voucher->update([
            'pdf_generated'    => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "CHV-{$voucher->voucher_no}-".now()->format('Ymd').'.pdf';

        return $this->fillAndDownload('check-voucher-template.pdf', $fields, $filename);
    }

    // ─── Access helpers ──────────────────────────────────────────────────────

    private function requireAccess(Request $request): void
    {
        $role    = $request->user()?->getRoleNames()->first();
        $allowed = [
            'disbursement_officer',
            'accounting_officer',
            'admin_auditor',
            'general_manager',
            'resa_officer',
            'visa_documentation_officer',
            'ormoc_branch_officer',
        ];
        if (! in_array($role, $allowed, true)) {
            abort(403, 'You do not have permission to generate documents.');
        }
    }

    private function requireVoucherAccess(Request $request): void
    {
        $role    = $request->user()?->getRoleNames()->first();
        $allowed = [
            'disbursement_officer',
            'accounting_officer',
            'admin_auditor',
            'general_manager',
        ];
        if (! in_array($role, $allowed, true)) {
            abort(403, 'You do not have permission to generate voucher PDFs.');
        }
    }

    private function requireQuotationAccess(Request $request): void
    {
        // Same roles that can create/view reservations may generate quotations
        $role    = $request->user()?->getRoleNames()->first();
        $allowed = [
            'resa_officer',
            'ormoc_branch_officer',
            'visa_documentation_officer',
            'accounting_officer',
            'admin_auditor',
            'general_manager',
        ];
        if (! in_array($role, $allowed, true)) {
            abort(403, 'You do not have permission to generate quotation PDFs.');
        }
    }
}
