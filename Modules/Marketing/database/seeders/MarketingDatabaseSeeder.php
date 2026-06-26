<?php

namespace Modules\Marketing\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MarketingDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $marketing = DB::table('users')->where('email', 'marketing@amkor.ph')->value('id');
        $coo = DB::table('users')->where('email', 'marianne@amkor.ph')->value('id');

        // ── Marketing Materials ─────────────────────────────────────────────
        $materials = [
            [
                'title' => 'Summer Travel Promo 2026', 'material_type' => 'poster',
                'description' => 'Promotional poster for summer travel deals',
                'status' => 'published', 'platform' => 'print',
                'caption' => 'Book your summer getaway now!', 'revision_notes' => null,
                'publish_date' => '2026-03-01',
                'created_by' => $marketing, 'submitted_by' => $marketing,
                'approved_by' => $coo, 'approved_at' => '2026-02-28 10:00:00',
                'published_by' => $marketing, 'published_at' => '2026-03-01 09:00:00',
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'title' => 'Japan Visa Fast-Track Campaign', 'material_type' => 'social_media',
                'description' => 'Social media post for Japan visa fast-track service',
                'status' => 'published', 'platform' => 'facebook',
                'caption' => 'Get your Japan visa in 5 business days! Contact us now.',
                'revision_notes' => null, 'publish_date' => '2026-02-15',
                'created_by' => $marketing, 'submitted_by' => $marketing,
                'approved_by' => $coo, 'approved_at' => '2026-02-14 10:00:00',
                'published_by' => $marketing, 'published_at' => '2026-02-15 09:00:00',
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'title' => 'Corporate Travel Solutions Brochure', 'material_type' => 'event_collateral',
                'description' => 'Brochure for corporate travel packages',
                'status' => 'approved', 'platform' => 'print',
                'caption' => null, 'revision_notes' => 'Minor font adjustments',
                'publish_date' => null,
                'created_by' => $marketing, 'submitted_by' => $marketing,
                'approved_by' => $coo, 'approved_at' => '2026-04-10 10:00:00',
                'published_by' => null, 'published_at' => null,
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'title' => 'May Travel Deals Newsletter', 'material_type' => 'email_blast',
                'description' => 'Email blast for May 2026 travel deals',
                'status' => 'submitted', 'platform' => 'email',
                'caption' => 'Exclusive May deals! Up to 30% off select destinations.',
                'revision_notes' => null, 'publish_date' => null,
                'created_by' => $marketing, 'submitted_by' => $marketing,
                'approved_by' => null, 'approved_at' => null,
                'published_by' => null, 'published_at' => null,
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'title' => 'Amkor TikTok Launch Video', 'material_type' => 'social_media',
                'description' => 'Intro video for Amkor TikTok page',
                'status' => 'draft', 'platform' => 'tiktok',
                'caption' => null, 'revision_notes' => 'Needs voiceover',
                'publish_date' => null,
                'created_by' => $marketing, 'submitted_by' => null,
                'approved_by' => null, 'approved_at' => null,
                'published_by' => null, 'published_at' => null,
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'title' => 'Office Hours Signage', 'material_type' => 'office_material',
                'description' => 'Updated office hours signage for all branches',
                'status' => 'archived', 'platform' => 'office',
                'caption' => null, 'revision_notes' => null,
                'publish_date' => '2026-01-10',
                'created_by' => $marketing, 'submitted_by' => $marketing,
                'approved_by' => $coo, 'approved_at' => '2026-01-09 10:00:00',
                'published_by' => $marketing, 'published_at' => '2026-01-10 09:00:00',
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($materials as $m) {
            DB::table('marketing_materials')->insert($m);
        }

        $m1 = DB::table('marketing_materials')->where('title', 'Summer Travel Promo 2026')->value('id');
        $m2 = DB::table('marketing_materials')->where('title', 'Japan Visa Fast-Track Campaign')->value('id');
        $m3 = DB::table('marketing_materials')->where('title', 'Corporate Travel Solutions Brochure')->value('id');
        $m5 = DB::table('marketing_materials')->where('title', 'Amkor TikTok Launch Video')->value('id');

        // ── Marketing Expenses ──────────────────────────────────────────────
        $expenses = [
            [
                'campaign_name' => 'Summer Travel Promo', 'category' => 'printing',
                'amount' => 8500.00, 'currency' => 'PHP', 'expense_date' => '2026-02-25',
                'period_month' => 2, 'period_year' => 2026,
                'vendor' => 'PrintPro Manila', 'remarks' => '500 poster prints',
                'status' => 'approved', 'material_id' => $m1,
                'created_by' => $marketing, 'approved_by' => $coo, 'approved_at' => '2026-02-27 10:00:00',
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'campaign_name' => 'Japan Visa Fast-Track', 'category' => 'paid_ads',
                'amount' => 15000.00, 'currency' => 'PHP', 'expense_date' => '2026-02-15',
                'period_month' => 2, 'period_year' => 2026,
                'vendor' => 'Facebook Ads', 'remarks' => '2-week campaign boost',
                'status' => 'approved', 'material_id' => $m2,
                'created_by' => $marketing, 'approved_by' => $coo, 'approved_at' => '2026-02-14 10:00:00',
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'campaign_name' => 'Corporate Travel Solutions', 'category' => 'production',
                'amount' => 25000.00, 'currency' => 'PHP', 'expense_date' => '2026-04-05',
                'period_month' => 4, 'period_year' => 2026,
                'vendor' => 'Creative Studios PH', 'remarks' => 'Brochure design + print',
                'status' => 'approved', 'material_id' => $m3,
                'created_by' => $marketing, 'approved_by' => $coo, 'approved_at' => '2026-04-08 10:00:00',
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'campaign_name' => 'May Travel Deals', 'category' => 'email_blast',
                'amount' => 3000.00, 'currency' => 'PHP', 'expense_date' => '2026-04-28',
                'period_month' => 4, 'period_year' => 2026,
                'vendor' => 'Mailchimp', 'remarks' => 'Email platform subscription',
                'status' => 'submitted', 'material_id' => null,
                'created_by' => $marketing, 'approved_by' => null, 'approved_at' => null,
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'campaign_name' => 'TikTok Content', 'category' => 'photography',
                'amount' => 12000.00, 'currency' => 'PHP', 'expense_date' => '2026-05-10',
                'period_month' => 5, 'period_year' => 2026,
                'vendor' => 'Studio Shoot PH', 'remarks' => 'Video production for TikTok',
                'status' => 'draft', 'material_id' => $m5,
                'created_by' => $marketing, 'approved_by' => null, 'approved_at' => null,
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'campaign_name' => 'Office Hours Signage', 'category' => 'printing',
                'amount' => 2500.00, 'currency' => 'PHP', 'expense_date' => '2026-01-05',
                'period_month' => 1, 'period_year' => 2026,
                'vendor' => 'SignPro QC', 'remarks' => '3 branch signages',
                'status' => 'approved', 'material_id' => null,
                'created_by' => $marketing, 'approved_by' => $coo, 'approved_at' => '2026-01-06 10:00:00',
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'campaign_name' => 'Summer Travel Promo', 'category' => 'social_media',
                'amount' => 5000.00, 'currency' => 'PHP', 'expense_date' => '2026-03-01',
                'period_month' => 3, 'period_year' => 2026,
                'vendor' => 'Instagram Ads', 'remarks' => 'Social media boost',
                'status' => 'approved', 'material_id' => $m1,
                'created_by' => $marketing, 'approved_by' => $coo, 'approved_at' => '2026-02-28 10:00:00',
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'campaign_name' => 'Japan Visa Fast-Track', 'category' => 'other',
                'amount' => 4500.00, 'currency' => 'USD', 'expense_date' => '2026-02-20',
                'period_month' => 2, 'period_year' => 2026,
                'vendor' => 'Tokyo Design Co.', 'remarks' => 'Japan-themed design assets',
                'status' => 'approved', 'material_id' => $m2,
                'created_by' => $marketing, 'approved_by' => $coo, 'approved_at' => '2026-02-22 10:00:00',
                'updated_by' => $marketing,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($expenses as $e) {
            DB::table('marketing_expenses')->insert($e);
        }

        // ── Marketing Analytics ─────────────────────────────────────────────
        $analytics = [
            [
                'material_id' => $m1, 'platform' => 'facebook', 'recorded_date' => '2026-03-15',
                'reach' => 12500, 'impressions' => 35000, 'engagements' => 2800,
                'clicks' => 450, 'conversions' => 28, 'spend' => 5000.00,
                'notes' => 'Peak engagement on first week',
                'created_by' => $marketing, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'material_id' => $m1, 'platform' => 'instagram', 'recorded_date' => '2026-03-15',
                'reach' => 8200, 'impressions' => 22000, 'engagements' => 1900,
                'clicks' => 320, 'conversions' => 15, 'spend' => 3000.00,
                'notes' => null,
                'created_by' => $marketing, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'material_id' => $m2, 'platform' => 'facebook', 'recorded_date' => '2026-02-28',
                'reach' => 18000, 'impressions' => 52000, 'engagements' => 4500,
                'clicks' => 780, 'conversions' => 42, 'spend' => 15000.00,
                'notes' => 'Highest performing campaign this quarter',
                'created_by' => $marketing, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'material_id' => $m2, 'platform' => 'tiktok', 'recorded_date' => '2026-02-28',
                'reach' => 35000, 'impressions' => 95000, 'engagements' => 8200,
                'clicks' => 1200, 'conversions' => 65, 'spend' => 8000.00,
                'notes' => 'Viral potential identified',
                'created_by' => $marketing, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'material_id' => $m3, 'platform' => 'print', 'recorded_date' => '2026-04-15',
                'reach' => 500, 'impressions' => 500, 'engagements' => 0,
                'clicks' => 0, 'conversions' => 12, 'spend' => 25000.00,
                'notes' => 'Distributed at corporate events',
                'created_by' => $marketing, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'material_id' => $m1, 'platform' => 'facebook', 'recorded_date' => '2026-04-01',
                'reach' => 15000, 'impressions' => 40000, 'engagements' => 3200,
                'clicks' => 520, 'conversions' => 35, 'spend' => 6000.00,
                'notes' => 'Month 2 tracking - sustained interest',
                'created_by' => $marketing, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'material_id' => $m2, 'platform' => 'instagram', 'recorded_date' => '2026-03-01',
                'reach' => 9500, 'impressions' => 28000, 'engagements' => 2100,
                'clicks' => 380, 'conversions' => 22, 'spend' => 7000.00,
                'notes' => 'Instagram Reels performed well',
                'created_by' => $marketing, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'material_id' => $m5, 'platform' => 'tiktok', 'recorded_date' => '2026-05-15',
                'reach' => 0, 'impressions' => 0, 'engagements' => 0,
                'clicks' => 0, 'conversions' => 0, 'spend' => 0.00,
                'notes' => 'Pre-launch - no data yet',
                'created_by' => $marketing, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'material_id' => $m1, 'platform' => 'print', 'recorded_date' => '2026-03-10',
                'reach' => 300, 'impressions' => 300, 'engagements' => 0,
                'clicks' => 0, 'conversions' => 8, 'spend' => 8500.00,
                'notes' => 'Branch poster distribution',
                'created_by' => $marketing, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'material_id' => $m2, 'platform' => 'facebook', 'recorded_date' => '2026-03-15',
                'reach' => 20000, 'impressions' => 58000, 'engagements' => 5200,
                'clicks' => 890, 'conversions' => 48, 'spend' => 12000.00,
                'notes' => 'Extended campaign - continued strong performance',
                'created_by' => $marketing, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'material_id' => $m3, 'platform' => 'email', 'recorded_date' => '2026-04-20',
                'reach' => 1200, 'impressions' => 1200, 'engagements' => 180,
                'clicks' => 95, 'conversions' => 18, 'spend' => 0.00,
                'notes' => 'Email distribution to corporate database',
                'created_by' => $marketing, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'material_id' => $m1, 'platform' => 'tiktok', 'recorded_date' => '2026-03-20',
                'reach' => 42000, 'impressions' => 110000, 'engagements' => 9500,
                'clicks' => 1500, 'conversions' => 72, 'spend' => 4000.00,
                'notes' => 'Organic reach exceeded expectations',
                'created_by' => $marketing, 'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        foreach ($analytics as $a) {
            DB::table('marketing_analytics')->insert($a);
        }
    }
}
