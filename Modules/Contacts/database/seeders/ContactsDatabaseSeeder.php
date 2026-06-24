<?php

namespace Modules\Contacts\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ContactsDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── Helper closure for cleaner inserts ────────────────────────────────
        $contact = fn(string $type, string $name, ?string $notes = null, string $currency = 'PHP') => [
            'type'           => $type,
            'name'           => $name,
            'tin'            => null,
            'address'        => null,
            'contact_person' => null,
            'contact_number' => null,
            'email'          => null,
            'payment_terms'  => null,
            'currency'       => $currency,
            'account_number' => null,
            'notes'          => $notes,
            'branch_id'      => null,
            'is_active'      => true,
            'created_by'     => null,
            'updated_by'     => null,
            'created_at'     => $now,
            'updated_at'     => $now,
        ];

        DB::table('contacts')->insertOrIgnore([

            // ── Consolidator / Operator ───────────────────────────────────────
            $contact('supplier', 'Mariposa Travel Agency',
                'External partner consolidator/travel agency. Ormoc branch sends P.O.s to Mariposa for international bookings that cannot be issued under Amkor\'s own registration and authority.'),

            // ── Banks (Amkor accounts — printed on SOA) ───────────────────────
            array_merge($contact('bank', 'BDO Unibank', 'PHP account. Account name: Amkor Travel and Tours Inc. Printed on SOA.'), ['account_number' => '0002-7006-7663']),
            array_merge($contact('bank', 'BDO Unibank', 'USD account. Account name: Amkor Travel and Tours Inc. Printed on SOA.', 'USD'), ['account_number' => '1002-7006-7671']),
            array_merge($contact('bank', 'BPI', 'PHP account. Account name: Amkor Travel and Tours Inc. Printed on SOA.'), ['account_number' => '0433-203-194']),
            array_merge($contact('bank', 'BPI', 'USD account. Account name: Amkor Travel and Tours Inc. Printed on SOA.', 'USD'), ['account_number' => '0434-028-396']),

            // ── Embassies / Consulates (Visa payables — sourced from Visa Excel) ──
            // These are the operators the Visa team sends payment to.
            $contact('supplier', 'Japan Embassy Manila',       'Visa payable — Japan Visa applications routed through embassy.'),
            $contact('supplier', 'Korean Embassy Manila',      'Visa payable — Korea Visa and Korea Business Visa.'),
            $contact('supplier', 'Australian Embassy Manila',  'Visa payable — Australia Visa.'),
            $contact('supplier', 'US Embassy Manila',          'Visa payable — US Visa.'),
            $contact('supplier', 'Chinese Embassy Manila',     'Visa payable — China Visa.'),
            $contact('supplier', 'French Embassy Manila',      'Visa payable — France Visa (Schengen).'),
            $contact('supplier', 'British Embassy Manila',     'Visa payable — UK Visa.'),
            $contact('supplier', 'German Embassy Manila',      'Visa payable — Germany Visa (Schengen).'),
            $contact('supplier', 'Italian Embassy Manila',     'Visa payable — Italy Visa (Schengen).'),
            $contact('supplier', 'Spanish Embassy Manila',     'Visa payable — Spain Visa (Schengen).'),
            $contact('supplier', 'Greek Embassy Manila',       'Visa payable — Greece Visa (Schengen).'),
            $contact('supplier', 'Swiss Embassy Manila',       'Visa payable — Switzerland Visa (Schengen).'),
            $contact('supplier', 'Netherlands Embassy Manila', 'Visa payable — Netherlands Visa (Schengen).'),
            $contact('supplier', 'Norwegian Embassy Manila',   'Visa payable — Norway Visa (Schengen).'),
            $contact('supplier', 'Swedish Embassy Manila',     'Visa payable — Sweden Visa (Schengen).'),
            $contact('supplier', 'Canadian Embassy Manila',    'Visa payable — Canada Visa.'),
            $contact('supplier', 'Irish Embassy Manila',       'Visa payable — Ireland Visa.'),
            $contact('supplier', 'New Zealand Embassy Manila', 'Visa payable — New Zealand Visa.'),
            $contact('supplier', 'Indian Embassy Manila',      'Visa payable — India Visa and India E-Visa.'),
            $contact('supplier', 'Portuguese Embassy Manila',  'Visa payable — Portugal Visa (Schengen).'),
            $contact('supplier', 'Czech Embassy Manila',       'Visa payable — Czech Republic Visa (Schengen).'),
            $contact('supplier', 'Turkey Embassy Manila',      'Visa payable — Türkiye Visa and Türkiye E-Visa.'),
            $contact('supplier', 'UAE Embassy Manila',         'Visa payable — Dubai Visa.'),
            $contact('supplier', 'VFS Global',                 'Visa application centre — used for multiple Schengen and UK visa filings. Payee for VFS service fees (seen in CC transactions as 2C2P*VFS Services Phil, Makati).'),

            // ── Couriers (Visa OR returns — sourced from Visa For Collection Excel) ──
            $contact('supplier', '2GO Express',  'OR return courier — used by Visa team for delivering documents/ORs to clients (e.g. Ticzon US Visa batch May 2026).'),
            $contact('supplier', 'Grab Express', 'OR return courier — used for local deliveries (e.g. Dela Cruz Japan Visa Feb 2026).'),

            // ── Key sub-agents / travel agencies (sourced from Visa By Agency Excel) ──
            // These are the most active agencies appearing in the Visa transaction data.
            // Staff can add more via the Contacts module UI; this seeds the common ones.
            $contact('sub_agent', 'Golden Sky Travel',         'Sub-agent — appears in Visa Excel (Japan Visa Feb 2026 Dela Cruz group).'),
            $contact('sub_agent', 'MyTravelicious',            'Sub-agent — appears in CC transactions (birthday cake charge Jan 2025).'),
            $contact('sub_agent', '3G Travel',                 'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Charmed Travel',            'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Citybreak Travel',          'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Costwise Travel',           'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'De Thomas Travel',          'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Eaglesky Travel',           'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'First Choice Travel',       'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Game Travel',               'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Greenline Travel',          'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'iFleet Travel',             'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Jezreel Travel',            'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Leisurelife Travel',        'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Luxury Travel',             'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'MKRD Travel',               'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Oh Travel',                 'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Palgen Travel',             'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Peak Perks Travel',         'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Primeluxe Travel',          'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Q2 Travel & Tours',         'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Ramyer Travel',             'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Redpines Travel',           'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Rilopa Travel',             'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Royal Sun Travel',          'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Sams Travel',               'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Sky Angel Travel',          'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Skycab Travel',             'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Small World Travel',        'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'SMR Travel',                'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Southgateway Travel',       'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Sun & Moon Travel',         'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Thousand Miles Travel',     'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Travel Specialist',         'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Travelways',                'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Uni Wander Travel',         'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Upright Travel',            'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'Wanderstruck Travel',       'Sub-agent — listed in Visa by-agency analytics.'),
            $contact('sub_agent', 'World Express Travel',      'Sub-agent — listed in Visa by-agency analytics.'),

            // ── Corporate accounts (from Collectibles Excel — named tabs) ─────
            // Yamaha and Ibayad have dedicated tabs in the AR Excel.
            $contact('corporate', 'Yamaha Motor Philippines',  'Corporate account — has a dedicated tab in the Collectibles Monitoring Excel. Filter by this name in the AR module.'),
            $contact('corporate', 'Ibayad',                    'Corporate account — has a dedicated tab in the Collectibles Monitoring Excel. Filter by this name in the AR module.'),
        ]);
    }
}
