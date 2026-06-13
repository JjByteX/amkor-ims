<?php

namespace Modules\DocumentGeneration\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use mikehaertl\pdftk\Pdf;
use Modules\BirCompliance\Models\BirTransaction;
use Modules\Disbursement\Models\Voucher;

class DocumentGenerationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Document Generation Controller
    |--------------------------------------------------------------------------
    |
    | Generates all 5 document types as print-ready PDFs by filling AcroForm
    | fields on pre-designed PDF templates using pdftk (mikehaertl/php-pdftk).
    |
    | Templates live in storage/app/templates/:
    |   - acknowledgement-receipt-template.pdf
    |   - service-invoice-template.pdf
    |   - statement-of-account-template.pdf
    |   - cash-voucher-template.pdf
    |   - check-voucher-template.pdf
    |
    | Documents: AR, SI, SOA, Cash Voucher, Check Voucher
    |
    | BIR-critical: AR (TIN required), SI (ATP 089AU2025, VAT breakdown)
    | Not BIR-critical: SOA, CV, Check Voucher
    |
    | Access: All roles that can view the source module may generate PDFs.
    | Admin Auditor and General Manager can generate any document.
    */

    private const COMPANY = [
        'name' => 'Amkor Travel & Tours Inc.',
        'tin_main' => '223-586-994-00000',
        'tin_ormoc' => '223-586-994-001',
        'address_main' => 'Suite 108 West City Plaza Bldg. #66, West Avenue, Quezon City',
        'address_ormoc' => 'Unit 315 Robinsons Place Ormoc, Cogon, Ormoc City, Leyte',
        'phone' => '',
        'iata' => 'Yes',
        'ptaa' => 'Yes',
    ];

    private const BANK_DETAILS = [
        ['bank' => 'BDO Unibank', 'currency' => 'PHP', 'account_name' => 'Amkor Travel and Tours Inc', 'account_number' => '0002-7006-7663'],
        ['bank' => 'BDO Unibank', 'currency' => 'USD', 'account_name' => 'Amkor Travel and Tours Inc', 'account_number' => '1002-7006-7671'],
        ['bank' => 'BPI',         'currency' => 'PHP', 'account_name' => 'Amkor Travel and Tours Inc', 'account_number' => '0433-203-194'],
        ['bank' => 'BPI',         'currency' => 'USD', 'account_name' => 'Amkor Travel and Tours Inc', 'account_number' => '0434-028-396'],
    ];

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
            'Content-Type' => 'application/pdf',
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
            'document_number' => (string) $birTransaction->document_number,
            'transaction_date' => $birTransaction->transaction_date->format('F d, Y'),
            'client_name' => (string) $birTransaction->client_name,
            'tin' => (string) ($birTransaction->tin ?? ''),
            'address' => (string) ($birTransaction->address ?? ''),
            'business_style' => (string) ($birTransaction->business_style ?? ''),
            'amount_in_words' => BirTransaction::amountInWords((float) $birTransaction->gross_amount),
            'gross_amount' => number_format((float) $birTransaction->gross_amount, 2),
            'particulars' => (string) ($birTransaction->particulars ?? ''),
            'check_number' => (string) ($birTransaction->check_number ?? ''),
            'total_amount' => number_format((float) $birTransaction->gross_amount, 2),
        ];

        // Mark as generated
        $birTransaction->update([
            'pdf_generated' => true,
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
            'document_number' => (string) $birTransaction->document_number,
            'transaction_date' => $birTransaction->transaction_date->format('F d, Y'),
            'client_name' => (string) $birTransaction->client_name,
            'tin' => (string) ($birTransaction->tin ?? ''),
            'address' => (string) ($birTransaction->address ?? ''),
            'business_style' => (string) ($birTransaction->business_style ?? ''),
            'amount_in_words' => BirTransaction::amountInWords((float) $birTransaction->gross_amount),
            'gross_amount' => number_format((float) $birTransaction->gross_amount, 2),
            'particulars' => (string) ($birTransaction->particulars ?? ''),
            'total_sales_vat_inclusive' => number_format((float) $birTransaction->total_sales_vat_inclusive, 2),
            'vat_amount' => number_format((float) $birTransaction->vat_amount, 2),
            'vatable_sales' => number_format((float) $birTransaction->vatable_sales, 2),
            'sc_pwd_discount' => number_format((float) $birTransaction->sc_pwd_discount, 2),
            'net_amount_due' => number_format((float) $birTransaction->net_amount_due, 2),
            'withholding_tax' => number_format((float) $birTransaction->withholding_tax, 2),
            'vatable_sales_summary' => number_format((float) $birTransaction->vatable_sales, 2),
            'vat_exempt_sales' => number_format((float) $birTransaction->vat_exempt_sales, 2),
            'vat_zero_rated_sales' => number_format((float) $birTransaction->vat_zero_rated_sales, 2),
            'vat_amount_summary' => number_format((float) $birTransaction->vat_amount, 2),
            'total_sales_summary' => number_format((float) $birTransaction->gross_amount, 2),
            'check_number' => (string) ($birTransaction->check_number ?? ''),
            'total_amount' => number_format((float) $birTransaction->gross_amount, 2),
        ];

        $birTransaction->update([
            'pdf_generated' => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "SI-{$birTransaction->document_number}-".now()->format('Ymd').'.pdf';

        return $this->fillAndDownload('service-invoice-template.pdf', $fields, $filename);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STATEMENT OF ACCOUNT (SOA)
    // Not BIR-critical
    // ────────────────────────────────────────────────────────────────────────

    public function generateSoa(Request $request, BirTransaction $birTransaction): HttpResponse
    {
        $this->requireAccess($request);

        if ($birTransaction->document_type !== 'SOA') {
            abort(422, 'This transaction is not a Statement of Account.');
        }

        $fields = [
            'document_number' => (string) $birTransaction->document_number,
            'client_name' => (string) $birTransaction->client_name,
            'address' => (string) ($birTransaction->address ?? ''),
            'tel_no' => '', // BirTransaction has no tel_no column yet — left blank
            'transaction_date' => $birTransaction->transaction_date->format('F d, Y'),
            'due_date' => $birTransaction->due_date?->format('F d, Y') ?? '',
            'row_date' => $birTransaction->transaction_date->format('m/d/Y'),
            'row_particulars' => (string) ($birTransaction->particulars ?? ''),
            'row_amount' => number_format((float) $birTransaction->gross_amount, 2),
            'row_total_amount' => number_format((float) $birTransaction->gross_amount, 2),
            'amount_in_words' => BirTransaction::amountInWords((float) $birTransaction->gross_amount),
            'acr' => (string) $birTransaction->document_number, // cross-ref to AR — TODO: confirm intent
            'checked_by' => '', // not yet tracked on BirTransaction — left blank
            'received_by' => '', // filled manually
            'approved_by' => '', // not yet tracked on BirTransaction — left blank
            'date_received' => '', // filled manually
        ];

        $birTransaction->update([
            'pdf_generated' => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "SOA-{$birTransaction->document_number}-".now()->format('Ymd').'.pdf';

        return $this->fillAndDownload('statement-of-account-template.pdf', $fields, $filename);
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
            'voucher_no' => (string) $voucher->voucher_no,
            'date_month' => \Carbon\Carbon::parse($voucher->date)->format('F'),
            'date_year' => \Carbon\Carbon::parse($voucher->date)->format('y'),
            'payee' => (string) $voucher->payee,
            'payee_address' => (string) ($voucher->payee_address ?? ''),
            'details' => (string) $voucher->details,
            'amount' => number_format((float) $voucher->amount, 2),
            'account_description' => (string) ($voucher->account_description ?? ''),
            'account_code' => (string) ($voucher->account_code ?? ''),
            'prepared_by' => (string) ($voucher->createdBy?->name ?? ''),
            'checked_by' => (string) ($voucher->checker?->name ?? ''),
            'approved_by' => (string) ($voucher->approver?->name ?? ''),
            'amount_in_words' => BirTransaction::amountInWords((float) $voucher->amount),
        ];

        $voucher->update([
            'pdf_generated' => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "CV-{$voucher->voucher_no}-".now()->format('Ymd').'.pdf';

        return $this->fillAndDownload('cash-voucher-template.pdf', $fields, $filename);
    }

    // ────────────────────────────────────────────────────────────────────────
    // CHECK VOUCHER
    // Same as CV + check number column
    // ────────────────────────────────────────────────────────────────────────

    public function generateCheckVoucher(Request $request, Voucher $voucher): HttpResponse
    {
        $this->requireVoucherAccess($request);

        if ($voucher->type !== 'check') {
            abort(422, 'This voucher is not a Check Voucher.');
        }

        $voucher->load(['branch', 'createdBy', 'checker', 'approver', 'releaser']);

        $fields = [
            'voucher_no' => (string) $voucher->voucher_no,
            'date_month' => \Carbon\Carbon::parse($voucher->date)->format('F'),
            'date_year' => \Carbon\Carbon::parse($voucher->date)->format('y'),
            'payee' => (string) $voucher->payee,
            'payee_address' => (string) ($voucher->payee_address ?? ''),
            'details' => (string) $voucher->details,
            'check_no' => (string) ($voucher->check_no ?? ''),
            'amount' => number_format((float) $voucher->amount, 2),
            'account_description' => (string) ($voucher->account_description ?? ''),
            'account_code' => (string) ($voucher->account_code ?? ''),
            'prepared_by' => (string) ($voucher->createdBy?->name ?? ''),
            'checked_by' => (string) ($voucher->checker?->name ?? ''),
            'approved_by' => (string) ($voucher->approver?->name ?? ''),
            'amount_in_words' => BirTransaction::amountInWords((float) $voucher->amount),
        ];

        $voucher->update([
            'pdf_generated' => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "CHV-{$voucher->voucher_no}-".now()->format('Ymd').'.pdf';

        return $this->fillAndDownload('check-voucher-template.pdf', $fields, $filename);
    }

    // ─── Access helpers ──────────────────────────────────────────────────────

    private function requireAccess(Request $request): void
    {
        $role = $request->user()?->getRoleNames()->first();
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
        $role = $request->user()?->getRoleNames()->first();
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
}
