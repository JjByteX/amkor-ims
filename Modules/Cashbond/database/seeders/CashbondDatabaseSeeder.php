<?php

namespace Modules\Cashbond\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CashbondDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seed the 5 confirmed cashbond portals from project-brief.md
        // maintaining_balance is NULL — Dalle sets the threshold at runtime via the portal settings UI
        $portals = [
            'AirAsia',
            'Jetstar',
            'SupercatB2B',
            'Airswift',
            'Cebuana Lhuillier',
        ];

        foreach ($portals as $name) {
            DB::table('cashbond_portals')->updateOrInsert(
                ['name' => $name],
                [
                    'name' => $name,
                    'current_balance' => 0.00,
                    'maintaining_balance' => null,
                    'is_active' => true,
                    'notes' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
