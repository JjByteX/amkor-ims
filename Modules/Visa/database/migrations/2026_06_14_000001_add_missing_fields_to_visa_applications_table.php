<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds all fields identified as gaps when cross-referencing the client's
 * Excel workbook (For Collection / Expo tabs) against the existing
 * visa_applications table.
 *
 * Gaps addressed:
 *  - Split payment columns: cash, bdo, bpi, metrobank, card, check (PHP)
 *  - USD cash payable amount
 *  - Bank deposit column (separate from the per-bank split)
 *  - Credit-card amount on the payables side
 *  - CV No. (cash voucher number linked to the disbursement voucher)
 *  - Date Requested (disbursement request date — distinct from payment_request_sent_at)
 *  - Courier / operator name (Grab, 2GO, China Embassy, etc.)
 *  - Date Received (OR physically received back from courier)
 *  - Payables status (cross-module surface of the linked AP payable status)
 *  - Date Filed (embassy filing date)
 *  - Date of Birth (applicant DOB — separate from Contact until Contact linkage is complete)
 *  - Embassy / operator name (the actual embassy, e.g. "China Embassy", "Japan Embassy")
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_applications', function (Blueprint $table) {

            // ── Applicant details ─────────────────────────────────────────────
            // DOB is tracked in the Excel per-row; Contact linkage (#10 gap) is
            // a separate migration. Store it here as a fallback / fast-access column.
            $table->date('date_of_birth')->nullable()->after('customer_name');

            // ── Embassy / operator ────────────────────────────────────────────
            // The embassy or consolidator processing the visa (e.g. "China Embassy",
            // "Japan Embassy via VFS"). Different from `agency` (the sub-agent).
            $table->string('embassy_name', 255)->nullable()->after('agency');

            // ── Split payment — client side (SP) ─────────────────────────────
            // Excel tracks per-bank breakdown for each transaction's selling price.
            $table->decimal('payment_cash', 12, 2)->nullable()->after('mode_of_payment');
            $table->decimal('payment_bdo', 12, 2)->nullable()->after('payment_cash');
            $table->decimal('payment_bpi', 12, 2)->nullable()->after('payment_bdo');
            $table->decimal('payment_metrobank', 12, 2)->nullable()->after('payment_bpi');
            $table->decimal('payment_card', 12, 2)->nullable()->after('payment_metrobank');
            $table->decimal('payment_check', 12, 2)->nullable()->after('payment_card');

            // ── Payables side (NP — amount paid to embassy/operator) ─────────
            $table->decimal('payable_cash', 12, 2)->nullable()->after('net_payable');
            $table->decimal('payable_cash_usd', 12, 2)->nullable()->after('payable_cash');
            $table->decimal('payable_bank_deposit', 12, 2)->nullable()->after('payable_cash_usd');
            $table->decimal('payable_credit_card', 12, 2)->nullable()->after('payable_bank_deposit');

            // CV No. — the cash voucher number in Disbursement linked to this payment
            $table->string('cv_number', 100)->nullable()->after('or_number');

            // Date the disbursement request was submitted (≠ payment_request_sent_at)
            $table->date('date_requested')->nullable()->after('cv_number');

            // Courier used to return the OR (Grab, 2GO, China Embassy pickup, etc.)
            $table->string('courier_name', 255)->nullable()->after('or_endorsed_at');

            // Date OR was physically received back (maps to "Date Received" in Excel)
            $table->date('date_received')->nullable()->after('courier_name');

            // Payables status — surface value synced from the linked AP payable
            // Values: pending | received | paid — kept in sync by an observer/listener
            $table->string('payables_status', 30)->nullable()->after('date_received');

            // ── Embassy filing ─────────────────────────────────────────────────
            // The date the application was physically filed at the embassy
            $table->date('date_filed')->nullable()->after('payables_status');
        });
    }

    public function down(): void
    {
        Schema::table('visa_applications', function (Blueprint $table) {
            $table->dropColumn([
                'date_of_birth',
                'embassy_name',
                'payment_cash',
                'payment_bdo',
                'payment_bpi',
                'payment_metrobank',
                'payment_card',
                'payment_check',
                'payable_cash',
                'payable_cash_usd',
                'payable_bank_deposit',
                'payable_credit_card',
                'cv_number',
                'date_requested',
                'courier_name',
                'date_received',
                'payables_status',
                'date_filed',
            ]);
        });
    }
};
