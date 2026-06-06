<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();

            // Type: corporate | sub_agent | supplier | bank
            $table->string('type', 20);

            $table->string('name');
            $table->string('tin', 30)->nullable();
            $table->text('address')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('contact_number', 50)->nullable();
            $table->string('email')->nullable();
            $table->string('payment_terms')->nullable();

            // Multi-currency support (PHP | USD | JPY)
            $table->string('currency', 10)->default('PHP');

            // Bank account number for supplier/bank records
            $table->string('account_number')->nullable();

            $table->text('notes')->nullable();

            // Contacts are global (not branch-scoped) but we track which branch added them
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();

            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('type');
            $table->index('name');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
