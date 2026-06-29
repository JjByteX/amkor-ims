<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds a `currency` column to reservation_bookings.
 *
 * The client's Excel workbook confirms the business tracks PHP and USD as
 * separate parallel amounts throughout the collectibles monitoring and the
 * For Collection sheet (Cash PHP vs Cash USD as distinct payment columns).
 * This means some bookings stay in USD all the way through — they are not
 * all converted to PHP at booking time.
 *
 * The currency column tells downstream modules (Collectibles, Accounting)
 * which currency the selling_price is denominated in, so they can sum
 * into the correct column.
 *
 * Default is PHP — all existing bookings are assumed to be in PHP, which
 * is safe since the prior system had no currency distinction.
 *
 * Allowed values: 'PHP', 'USD'
 * Enforced in StoreReservationBookingRequest and ReservationBooking::CURRENCIES.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {
            $table->string('currency', 3)
                ->default('PHP')
                ->after('selling_price')
                ->comment('Currency of selling_price: PHP or USD');
        });
    }

    public function down(): void
    {
        Schema::table('reservation_bookings', function (Blueprint $table) {
            $table->dropColumn('currency');
        });
    }
};
