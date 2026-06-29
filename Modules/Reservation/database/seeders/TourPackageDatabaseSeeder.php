<?php

namespace Modules\Reservation\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the tour_packages table with the packages currently listed on the
 * Amkor Travel website (https://amkortravel.com.ph).
 *
 * This gives staff a working catalogue on day one so the directory is never
 * empty after deployment. All packages can be edited or extended through the
 * Tour Packages UI — this seeder just provides the starting data.
 *
 * Pricing notes:
 * - All prices are in USD, matching the website.
 * - Australia uses explicit pax tiers (min_pax → price).
 * - China uses flat pricing with a minimum pax operational rule (not a tier).
 * - Europe uses room-type tiers (type → price): TWIN/TPL, SINGLE, CHILD.
 * - departure_dates stores {date, surcharge} objects so peak surcharges are
 *   permanently attached to the date they belong to.
 *
 * Autofill behaviour (Phase 5):
 * - Australia: priceForPax() picks highest min_pax ≤ actual pax count.
 * - China: single tier, always returns the one published price.
 * - Europe: form shows a Room Type dropdown; price comes from selected type.
 * - On departure date selection, surcharge is added before USD→PHP conversion.
 */
class TourPackageDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('tour_packages')->delete();

        $now = now();

        $packages = [

            // ── 1. Spectacular Australia ─────────────────────────────────────
            // Pricing model: pax tiers (Australia-style)
            [
                'country'         => 'Australia',
                'package_name'    => 'Spectacular Australia',
                'destinations'    => 'Brisbane - Sydney - Canberra - Melbourne',
                'duration_days'   => 12,
                'duration_nights' => 11,
                'particulars'     => 'Spectacular Australia 12D/11N',
                'inclusions'      => implode("\n", [
                    'Roundtrip airfare with 30kg checked baggage',
                    '4-star hotel accommodation',
                    '3-star hotel in Port Macquarie',
                    'Daily breakfast',
                    'Meals: 6 lunches and 7 dinners',
                    'Luxury private coach',
                    'Tour escort',
                    'Pre-departure briefing',
                ]),
                'exclusions'      => implode("\n", [
                    'Tips for driver / guide',
                    'Visa Fee',
                    'Tourist City Tax',
                    'Travel Insurance',
                    'Drinks and Beverages',
                    'Porterage',
                ]),
                // No fixed carrier for Australia — airline left null so booking
                // staff can specify the actual carrier on each reservation.
                'airline'         => null,
                // Tiers stored ascending by min_pax — matching logic iterates
                // in order and keeps the last qualifying tier (highest applicable).
                'tour_costs'      => json_encode([
                    ['min_pax' => 15, 'price' => 4480],
                    ['min_pax' => 20, 'price' => 4100],
                    ['min_pax' => 25, 'price' => 3880],
                ]),
                'departure_dates' => json_encode([
                    ['date' => '2026-07-13', 'surcharge' => 0],
                ]),
                'is_active'       => true,
                'created_by'      => null,
                'updated_by'      => null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],

            // ── 2. Best of the West — Chongqing & Chengdu ───────────────────
            // Pricing model: flat price (China-style)
            // Min 20 pax is an operational rule, not a price break.
            [
                'country'         => 'China',
                'package_name'    => 'Best of the West',
                'destinations'    => 'Chongqing - Leshan - Dujiangyan - Chengdu',
                'duration_days'   => 6,
                'duration_nights' => 5,
                'particulars'     => 'Best of the West 6D/5N (Chongqing & Chengdu)',
                'inclusions'      => implode("\n", [
                    'Roundtrip airfare via Philippine Airlines',
                    'Roundtrip airport transfers',
                    '23kg baggage and 5kg hand carry',
                    '5 nights hotel accommodation',
                    'Tours and meals based on the itinerary',
                    'Private bus with English-speaking tour guide',
                ]),
                'exclusions'      => implode("\n", [
                    'Tipping for local guide - per pax per day',
                    'PH Travel Tax',
                    'Meals not stated in the itinerary',
                    'Anything not listed under Tour Includes',
                ]),
                'airline'         => 'Philippine Airlines',
                // Single tier — autofill always returns this price regardless of pax count.
                // Sep 06 carries a +$20 peak surcharge.
                'tour_costs'      => json_encode([
                    ['min_pax' => 20, 'price' => 529],
                ]),
                'departure_dates' => json_encode([
                    ['date' => '2026-08-30', 'surcharge' => 0],
                    ['date' => '2026-09-06', 'surcharge' => 20],
                ]),
                'is_active'       => true,
                'created_by'      => null,
                'updated_by'      => null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],

            // ── 3. Classic Modern Shanghai ───────────────────────────────────
            // Pricing model: flat price (China-style)
            // Oct 30 carries a +$100 peak surcharge.
            // Flight details (PR 336/337) belong on the booking, not here.
            [
                'country'         => 'China',
                'package_name'    => 'Classic Modern Shanghai',
                'destinations'    => 'Shanghai',
                'duration_days'   => 4,
                'duration_nights' => 3,
                'particulars'     => 'Classic Modern Shanghai 4D/3N',
                'inclusions'      => implode("\n", [
                    'Roundtrip airfare via Philippine Airlines',
                    'Roundtrip airport transfers',
                    '23kg baggage and 7kg hand carry',
                    '3 nights hotel accommodation (Fangyu or Tong Pai or similar)',
                    'Tours and meals based on the itinerary',
                    'FREE travel insurance (0-59 years old)',
                    'FREE guaranteed visa',
                ]),
                'exclusions'      => implode("\n", [
                    'Tipping for local guide - per pax per day',
                    'PH Travel Tax',
                    'Meals not stated in the itinerary',
                    'Anything not listed under Tour Includes',
                ]),
                'airline'         => 'Philippine Airlines',
                'tour_costs'      => json_encode([
                    ['min_pax' => 20, 'price' => 448],
                ]),
                'departure_dates' => json_encode([
                    ['date' => '2026-08-21', 'surcharge' => 0],
                    ['date' => '2026-10-30', 'surcharge' => 100],
                ]),
                'is_active'       => true,
                'created_by'      => null,
                'updated_by'      => null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],

            // ── 4. Essence of Eastern Europe ─────────────────────────────────
            // Pricing model: room-type tiers (Europe-style)
            // Form shows a Room Type dropdown instead of pax-count matching.
            // June 08 and June 24 are past dates — seeded as-is; nextDeparture()
            // on the model already skips them when autofilling the booking form.
            [
                'country'         => 'Europe',
                'package_name'    => 'Essence of Eastern Europe',
                'destinations'    => 'Hungary - Slovakia - Austria - Czech Republic - Poland',
                'duration_days'   => 12,
                'duration_nights' => 11, // inferred: 12 days − 1 = 11 nights
                'particulars'     => 'Essence of Eastern Europe 12D/11N — 5 Countries',
                'inclusions'      => implode("\n", [
                    'Roundtrip airfare',
                    '4-star hotel accommodation',
                    'Daily breakfast',
                    'Luxury private coach',
                    'Tour coordinator',
                    'Pre-departure briefing',
                ]),
                'exclusions'      => implode("\n", [
                    'Visa Fee',
                    'Travel Tax and Airline Tax',
                    'Tourist City Tax',
                    'Travel Insurance',
                    'Drinks and Beverages',
                    'Porterage',
                    'Tips for driver / guide: USD 10 x 10 days = USD 100',
                ]),
                // No fixed carrier for Europe — airline left null so booking
                // staff can specify the actual carrier on each reservation.
                'airline'         => null,
                // Room-type tiers — form detects `type` key and shows a dropdown.
                'tour_costs'      => json_encode([
                    ['type' => 'TWIN/TPL', 'price' => 2990],
                    ['type' => 'SINGLE',   'price' => 3550],
                    ['type' => 'CHILD',    'price' => 2750],
                ]),
                'departure_dates' => json_encode([
                    ['date' => '2026-06-08', 'surcharge' => 0], // past — skipped by nextDeparture()
                    ['date' => '2026-06-24', 'surcharge' => 0], // past — skipped by nextDeparture()
                    ['date' => '2026-09-08', 'surcharge' => 0],
                    ['date' => '2026-10-08', 'surcharge' => 0],
                ]),
                'is_active'       => true,
                'created_by'      => null,
                'updated_by'      => null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],

        ];

        DB::table('tour_packages')->insert($packages);
    }
}
