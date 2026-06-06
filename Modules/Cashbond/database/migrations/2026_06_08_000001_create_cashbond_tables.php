<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Cashbond Portals ──────────────────────────────────────────────────
        if (! Schema::hasTable('cashbond_portals')) {
            Schema::create('cashbond_portals', function (Blueprint $table) {
                $table->id();

                $table->string('name', 100)->unique(); // AirAsia, Jetstar, etc.
                $table->decimal('current_balance', 14, 2)->default(0);

                // Configurable maintaining balance threshold (set by Dalle at runtime)
                // NULL means no threshold alert is active yet
                $table->decimal('maintaining_balance', 14, 2)->nullable();

                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();

                $table->foreignId('created_by')
                      ->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')
                      ->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
            });
        }

        // ── Cashbond Reload Requests ──────────────────────────────────────────
        if (! Schema::hasTable('cashbond_reloads')) {
            Schema::create('cashbond_reloads', function (Blueprint $table) {
                $table->id();

                $table->foreignId('portal_id')
                      ->constrained('cashbond_portals')
                      ->cascadeOnDelete();

                // Reference number: CBR-YYYY-XXXXX
                $table->string('reload_no', 50)->unique();

                $table->decimal('amount', 14, 2);
                $table->date('request_date');
                $table->date('deposit_date')->nullable();

                // Approval chain: pending|checked|approved|released
                $table->string('approval_status', 30)->default('pending');
                $table->foreignId('checked_by')
                      ->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('checked_at')->nullable();
                $table->foreignId('approved_by')
                      ->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->foreignId('released_by')
                      ->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('released_at')->nullable();

                // Supplier confirmation
                $table->boolean('supplier_notified')->default(false);
                $table->timestamp('supplier_notified_at')->nullable();
                $table->boolean('balance_updated')->default(false);

                // Linked voucher
                $table->unsignedBigInteger('voucher_id')->nullable()->index();

                $table->text('remarks')->nullable();
                $table->text('audit_remarks')->nullable();

                $table->foreignId('created_by')
                      ->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')
                      ->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
                $table->softDeletes();
            });

            // FK to vouchers after both tables exist
            Schema::table('cashbond_reloads', function (Blueprint $table) {
                $table->foreign('voucher_id')
                      ->references('id')->on('vouchers')
                      ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cashbond_reloads');
        Schema::dropIfExists('cashbond_portals');
    }
};
