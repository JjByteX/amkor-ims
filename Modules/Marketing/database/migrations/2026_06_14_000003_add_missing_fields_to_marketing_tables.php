<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds fields identified as gaps when cross-referencing the client's
 * Excel Marketing Expense 2026 workbook against the existing marketing tables.
 *
 * Gaps addressed on marketing_analytics:
 *  - ctr                    (Click-Through Rate — stored as decimal percentage)
 *  - cpc                    (Cost Per Click)
 *  - cpa                    (Cost Per Acquisition)
 *  - roi                    (Return on Investment — decimal, e.g. -1.00)
 *  - acquisitions           (number of conversions / acquired customers)
 *  - pre_campaign_revenue   (revenue before campaign ran)
 *  - post_campaign_revenue  (revenue after campaign ran)
 *  - revenue_growth         (post - pre, stored for fast reporting)
 *  - campaign_profit        (post_campaign_revenue - spend)
 *
 * Gaps addressed on marketing_expenses:
 *  - voucher_number         (CV No. — disbursement voucher reference)
 *  - payee                  (who the payment was made to — maps to "Payee" in Excel)
 *  - platform               (Facebook/Instagram/Google Ads/TikTok/Meta Verified/Microsoft
 *                            — for the Ads tab per-platform invoice breakdown)
 *  - invoice_number         (invoice reference for the Ads tab)
 *  - budget                 (planned budget for this line, for Budget vs Spend column)
 *
 * Note: marketing_expenses already has `amount` (the spend).
 * The Excel "Ads" tab is a per-platform invoice view; it maps to marketing_expenses
 * filtered by category='paid_ads' with the platform and invoice_number fields.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── marketing_analytics — KPI columns ────────────────────────────────
        Schema::table('marketing_analytics', function (Blueprint $table) {

            // CTR — click-through rate as a percentage (e.g. 0.0312 = 3.12%)
            $table->decimal('ctr', 8, 6)->nullable()->after('conversions');

            // CPC — cost per click in PHP
            $table->decimal('cpc', 10, 2)->nullable()->after('ctr');

            // CPA — cost per acquisition in PHP
            $table->decimal('cpa', 10, 2)->nullable()->after('cpc');

            // Revenue figures for ROI calculation
            $table->decimal('pre_campaign_revenue', 14, 2)->nullable()->after('cpa');
            $table->decimal('post_campaign_revenue', 14, 2)->nullable()->after('pre_campaign_revenue');
            $table->decimal('revenue_growth', 14, 2)->nullable()->after('post_campaign_revenue');

            // Campaign profit = post_campaign_revenue - spend
            $table->decimal('campaign_profit', 14, 2)->nullable()->after('revenue_growth');

            // ROI = campaign_profit / spend (stored as decimal, e.g. -1.00)
            $table->decimal('roi', 10, 4)->nullable()->after('campaign_profit');

            // Acquisitions — number of conversions / leads acquired
            $table->unsignedBigInteger('acquisitions')->default(0)->after('roi');
        });

        // ── marketing_expenses — invoice/voucher/budget columns ───────────────
        Schema::table('marketing_expenses', function (Blueprint $table) {

            // Voucher number — maps to CV No. in the Excel transactions tab
            $table->string('voucher_number', 100)->nullable()->after('campaign_name');

            // Payee — who was paid (maps to Payee column in Marketing Transactions tab)
            $table->string('payee', 255)->nullable()->after('vendor');

            // Platform — for Ads tab: Facebook, Instagram, Google Ads, TikTok, etc.
            $table->string('platform', 100)->nullable()->after('category');

            // Invoice number — for Ads tab per-invoice breakdown
            $table->string('invoice_number', 100)->nullable()->after('voucher_number');

            // Budget — the planned spend for this line (enables Budget vs Spend column)
            $table->decimal('budget', 12, 2)->nullable()->after('amount');
        });
    }

    public function down(): void
    {
        Schema::table('marketing_analytics', function (Blueprint $table) {
            $table->dropColumn([
                'ctr', 'cpc', 'cpa',
                'pre_campaign_revenue', 'post_campaign_revenue',
                'revenue_growth', 'campaign_profit', 'roi',
                'acquisitions',
            ]);
        });

        Schema::table('marketing_expenses', function (Blueprint $table) {
            $table->dropColumn([
                'voucher_number', 'payee', 'platform',
                'invoice_number', 'budget',
            ]);
        });
    }
};
