<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Auth\Database\Seeders\AuthDatabaseSeeder;
use Modules\Cashbond\Database\Seeders\CashbondDatabaseSeeder;
use Modules\Contacts\Database\Seeders\ContactsDatabaseSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Order matters:
     *   1. Auth — branches, roles, permissions, users, agent codes
     *   2. Contacts — Mariposa (supplier), BDO PHP/USD, BPI PHP/USD (bank records)
     *   3. Cashbond — 5 portals (AirAsia, Jetstar, SupercatB2B, Airswift, Cebuana Lhuillier)
     */
    public function run(): void
    {
        $this->call([
            AuthDatabaseSeeder::class,
            ContactsDatabaseSeeder::class,
            CashbondDatabaseSeeder::class,
        ]);
    }
}
