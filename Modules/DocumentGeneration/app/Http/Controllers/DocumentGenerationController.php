<?php

namespace Modules\DocumentGeneration\Http\Controllers;

use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Modules\BirCompliance\Models\BirTransaction;
use Modules\Disbursement\Models\Voucher;

class DocumentGenerationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Document Generation Controller
    |--------------------------------------------------------------------------
    |
    | Generates all 5 document types as print-ready PDFs using DomPDF.
    | Templates live in Modules/DocumentGeneration/resources/views/pdf/
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

        $data = [
            'company' => self::COMPANY,
            'transaction' => $birTransaction,
            'amountInWords' => BirTransaction::amountInWords((float) $birTransaction->gross_amount),
            'generatedAt' => now()->format('F d, Y h:i A'),
        ];

        $pdf = Pdf::loadView('documentgeneration::pdf.acknowledgement-receipt', $data)
            ->setPaper('letter', 'portrait')
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', false);

        // Mark as generated
        $birTransaction->update([
            'pdf_generated' => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "AR-{$birTransaction->document_number}-".now()->format('Ymd').'.pdf';

        return $pdf->download($filename);
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

        $data = [
            'company' => self::COMPANY,
            'transaction' => $birTransaction,
            'amountInWords' => BirTransaction::amountInWords((float) $birTransaction->gross_amount),
            'atpNumber' => BirTransaction::BIR_ATP_NUMBER,
            'vatRate' => BirTransaction::VAT_RATE * 100,  // 12
            'generatedAt' => now()->format('F d, Y h:i A'),
        ];

        $pdf = Pdf::loadView('documentgeneration::pdf.service-invoice', $data)
            ->setPaper('letter', 'portrait')
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', false);

        $birTransaction->update([
            'pdf_generated' => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "SI-{$birTransaction->document_number}-".now()->format('Ymd').'.pdf';

        return $pdf->download($filename);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STATEMENT OF ACCOUNT (SOA)
    // Not BIR-critical but requires bank details and interest clause
    // ────────────────────────────────────────────────────────────────────────

    public function generateSoa(Request $request, BirTransaction $birTransaction): HttpResponse
    {
        $this->requireAccess($request);

        if ($birTransaction->document_type !== 'SOA') {
            abort(422, 'This transaction is not a Statement of Account.');
        }

        $data = [
            'company' => self::COMPANY,
            'transaction' => $birTransaction,
            'amountInWords' => BirTransaction::amountInWords((float) $birTransaction->gross_amount),
            'bankDetails' => self::BANK_DETAILS,
            'generatedAt' => now()->format('F d, Y h:i A'),
        ];

        $pdf = Pdf::loadView('documentgeneration::pdf.statement-of-account', $data)
            ->setPaper('letter', 'portrait')
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', false);

        $birTransaction->update([
            'pdf_generated' => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "SOA-{$birTransaction->document_number}-".now()->format('Ymd').'.pdf';

        return $pdf->download($filename);
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

        $data = [
            'company' => self::COMPANY,
            'voucher' => $voucher,
            'generatedAt' => now()->format('F d, Y h:i A'),
        ];

        $pdf = Pdf::loadView('documentgeneration::pdf.cash-voucher', $data)
            ->setPaper('letter', 'portrait')
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', false);

        $voucher->update([
            'pdf_generated' => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "CV-{$voucher->voucher_no}-".now()->format('Ymd').'.pdf';

        return $pdf->download($filename);
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

        $data = [
            'company' => self::COMPANY,
            'voucher' => $voucher,
            'generatedAt' => now()->format('F d, Y h:i A'),
        ];

        $pdf = Pdf::loadView('documentgeneration::pdf.check-voucher', $data)
            ->setPaper('letter', 'portrait')
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', false);

        $voucher->update([
            'pdf_generated' => true,
            'pdf_generated_at' => now(),
        ]);

        $filename = "CHV-{$voucher->voucher_no}-".now()->format('Ymd').'.pdf';

        return $pdf->download($filename);
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
