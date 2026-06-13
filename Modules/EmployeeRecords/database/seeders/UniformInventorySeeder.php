<?php

namespace Modules\EmployeeRecords\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the uniform_inventory table with beginning stock counts for 2026.
 *
 * Values sourced directly from the "Issuance of Uniforms" Excel tab,
 * "Beginning Inventory" row:
 *
 *   Hoodie Jacket                  : 30
 *   Bomber Jacket                  : 30
 *   Anniversary Shirt              : 40
 *   Corporate Jacket               : 40
 *   Amkor New Logo Subli Uniform   : 100
 *   Amkor New Logo Polo Shirt      : 150
 */
class UniformInventorySeeder extends Seeder
{
    public function run(): void
    {
        $year = 2026;

        // Only seed if not already present
        $exists = DB::table('uniform_inventory')->where('year', $year)->exists();
        if ($exists) {
            $this->command->info("UniformInventory: 2026 record already exists — skipping.");

            return;
        }

        DB::table('uniform_inventory')->insert([
            'year'                => $year,
            'hoodie_jacket'       => 30,
            'bomber_jacket'       => 30,
            'anniversary_shirt'   => 40,
            'corporate_jacket'    => 40,
            'amkor_subli_uniform' => 100,
            'amkor_polo_shirt'    => 150,
            'notes'               => 'Beginning inventory as of Jan 1, 2026 — from Excel Issuance of Uniforms tab.',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        $this->command->info("UniformInventory: 2026 beginning inventory seeded.");
    }
}
