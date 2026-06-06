<?php

namespace Modules\Contacts\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ContactsDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('contacts')->insertOrIgnore([
            // Mariposa — external partner travel agency / consolidator
            // Ormoc sends P.O.s here for international bookings outside Amkor's own issuance authority.
            // No system login — supplier directory record only.
            [
                'type'           => 'supplier',
                'name'           => 'Mariposa Travel Agency',
                'tin'            => null,
                'address'        => null,
                'contact_person' => null,
                'contact_number' => null,
                'email'          => null,
                'payment_terms'  => null,
                'currency'       => 'PHP',
                'account_number' => null,
                'notes'          => 'External partner consolidator/travel agency. Ormoc branch sends P.O.s to Mariposa for international bookings that cannot be issued under Amkor\'s own registration and authority.',
                'branch_id'      => null,
                'is_active'      => true,
                'created_by'     => null,
                'updated_by'     => null,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],

            // BDO Unibank — PHP account (printed on SOA)
            [
                'type'           => 'bank',
                'name'           => 'BDO Unibank',
                'tin'            => null,
                'address'        => null,
                'contact_person' => null,
                'contact_number' => null,
                'email'          => null,
                'payment_terms'  => null,
                'currency'       => 'PHP',
                'account_number' => '0002-7006-7663',
                'notes'          => 'PHP account. Account name: Amkor Travel and Tours Inc. Printed on SOA.',
                'branch_id'      => null,
                'is_active'      => true,
                'created_by'     => null,
                'updated_by'     => null,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],

            // BDO Unibank — USD account (printed on SOA)
            [
                'type'           => 'bank',
                'name'           => 'BDO Unibank',
                'tin'            => null,
                'address'        => null,
                'contact_person' => null,
                'contact_number' => null,
                'email'          => null,
                'payment_terms'  => null,
                'currency'       => 'USD',
                'account_number' => '1002-7006-7671',
                'notes'          => 'USD account. Account name: Amkor Travel and Tours Inc. Printed on SOA.',
                'branch_id'      => null,
                'is_active'      => true,
                'created_by'     => null,
                'updated_by'     => null,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],

            // BPI — PHP account (printed on SOA)
            [
                'type'           => 'bank',
                'name'           => 'BPI',
                'tin'            => null,
                'address'        => null,
                'contact_person' => null,
                'contact_number' => null,
                'email'          => null,
                'payment_terms'  => null,
                'currency'       => 'PHP',
                'account_number' => '0433-203-194',
                'notes'          => 'PHP account. Account name: Amkor Travel and Tours Inc. Printed on SOA.',
                'branch_id'      => null,
                'is_active'      => true,
                'created_by'     => null,
                'updated_by'     => null,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],

            // BPI — USD account (printed on SOA)
            [
                'type'           => 'bank',
                'name'           => 'BPI',
                'tin'            => null,
                'address'        => null,
                'contact_person' => null,
                'contact_number' => null,
                'email'          => null,
                'payment_terms'  => null,
                'currency'       => 'USD',
                'account_number' => '0434-028-396',
                'notes'          => 'USD account. Account name: Amkor Travel and Tours Inc. Printed on SOA.',
                'branch_id'      => null,
                'is_active'      => true,
                'created_by'     => null,
                'updated_by'     => null,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
        ]);
    }
}
