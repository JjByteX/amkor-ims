<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('airline_rates')) {
            return;
        }

        Schema::create('airline_rates', function (Blueprint $table) {
            $table->id();
            $table->string('airline', 100);
            $table->string('origin', 10);
            $table->string('destination', 10);
            $table->string('fare_class', 30)->nullable();
            $table->decimal('rate', 12, 2);
            $table->string('currency', 3)->default('PHP');
            $table->date('effective_date');
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['effective_date']);
            $table->index(['airline', 'origin', 'destination', 'effective_date'], 'airline_rates_route_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('airline_rates');
    }
};
