<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\AccountsPayable\Database\Seeders\AccountsPayableDatabaseSeeder;
use Modules\AccountsReceivable\Database\Seeders\AccountsReceivableDatabaseSeeder;
use Modules\Attendance\Database\Seeders\AttendanceDatabaseSeeder;
use Modules\Auth\Database\Seeders\AuthDatabaseSeeder;
use Modules\BillsMonitoring\Database\Seeders\BillsMonitoringDatabaseSeeder;
use Modules\BirCompliance\Database\Seeders\BirComplianceDatabaseSeeder;
use Modules\Cashbond\Database\Seeders\CashbondDatabaseSeeder;
use Modules\Contacts\Database\Seeders\ContactsDatabaseSeeder;
use Modules\CreditCardMonitoring\Database\Seeders\CreditCardMonitoringDatabaseSeeder;
use Modules\Disbursement\Database\Seeders\DisbursementDatabaseSeeder;
use Modules\EmployeeRecords\Database\Seeders\EmployeeRecordsDatabaseSeeder;
use Modules\IataPayments\Database\Seeders\IataPaymentsDatabaseSeeder;
use Modules\Marketing\Database\Seeders\MarketingDatabaseSeeder;
use Modules\Reservation\Database\Seeders\ReservationDatabaseSeeder;
use Modules\SalesSummary\Database\Seeders\SalesSummaryDatabaseSeeder;
use Modules\Visa\Database\Seeders\VisaDatabaseSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Order matters — FK dependencies:
     *   1.  Auth              — branches, roles, permissions, users, agent codes
     *   2.  Contacts          — Mariposa (supplier), BDO PHP/USD, BPI PHP/USD (bank records)
     *   3.  Cashbond          — 5 portals + 8 cashbond reloads
     *   4.  EmployeeRecords   — 12 employees (one per user)
     *   5.  Disbursement      — 8 vouchers + 12 entries (hub — referenced by 5 modules)
     *   6.  Reservation       — 10 bookings (covers both QC and Ormoc, unified table)
     *   7.  Visa              — 10 applications
     *   8.  AccountsReceivable — 10 collectibles
     *   9.  AccountsPayable    — 8 payables (FK → vouchers)
     *  10.  BillsMonitoring    — 8 bills
     *  11.  CreditCardMonitoring — 3 cards + 6 payments
     *  12.  IataPayments       — 6 payments
     *  13.  BirCompliance      — 10 transactions
     *  14.  Attendance         — 30 records
     *  15.  Marketing          — 6 materials + 8 expenses + 12 analytics
     *  16.  SalesSummary       — 24 targets
     *
     * Note: OrmocBranchDatabaseSeeder removed — OrmocBranch module is disabled.
     * Ormoc bookings are now seeded via ReservationDatabaseSeeder (unified table).
     */
    public function run(): void
    {
        $this->call([
            AuthDatabaseSeeder::class,
            ContactsDatabaseSeeder::class,
            CashbondDatabaseSeeder::class,
            EmployeeRecordsDatabaseSeeder::class,
            DisbursementDatabaseSeeder::class,
            ReservationDatabaseSeeder::class,
            VisaDatabaseSeeder::class,
            AccountsReceivableDatabaseSeeder::class,
            AccountsPayableDatabaseSeeder::class,
            BillsMonitoringDatabaseSeeder::class,
            CreditCardMonitoringDatabaseSeeder::class,
            IataPaymentsDatabaseSeeder::class,
            BirComplianceDatabaseSeeder::class,
            AttendanceDatabaseSeeder::class,
            MarketingDatabaseSeeder::class,
            SalesSummaryDatabaseSeeder::class,
        ]);
    }
}
