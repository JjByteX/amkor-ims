<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collectibles', function (Blueprint $table) {
            // Polymorphic link back to the source booking
            // source_type: 'reservation' | 'ormoc_booking'
            // source_id:   the pk of the source record
            $table->string('source_type')->nullable()->after('id');
            $table->unsignedBigInteger('source_id')->nullable()->after('source_type');
            $table->index(['source_type', 'source_id'], 'collectibles_source_index');
        });
    }

    public function down(): void
    {
        Schema::table('collectibles', function (Blueprint $table) {
            $table->dropIndex('collectibles_source_index');
            $table->dropColumn(['source_type', 'source_id']);
        });
    }
};
