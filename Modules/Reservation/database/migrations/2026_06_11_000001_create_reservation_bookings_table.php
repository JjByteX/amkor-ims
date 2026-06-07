<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('reservation_bookings')) {
            return;
        }

        Schema::create('reservation_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_no', 40)->unique();
            $table->date('date');
            $table->string('agent_code', 20)->nullable();

            $table->string('client_name');
            $table->string('contact_number', 40)->nullable();
            $table->string('email')->nullable();
            $table->string('corporate_account')->nullable();

            $table->string('destination')->nullable();
            $table->date('travel_date')->nullable();
            $table->date('return_date')->nullable();
            $table->unsignedSmallInteger('pax_count')->default(1);
            $table->string('service_type', 80)->default('package');
            $table->text('particulars')->nullable();
            $table->text('inclusions')->nullable();
            $table->text('exclusions')->nullable();

            $table->decimal('selling_price', 14, 2)->default(0);
            $table->decimal('net_payable', 14, 2)->default(0);
            $table->decimal('income', 14, 2)->default(0);
            $table->string('mode_of_payment', 40)->nullable();
            $table->date('payment_due_date')->nullable();

            $table->string('soa_number', 100)->nullable();
            $table->string('po_number', 100)->nullable();
            $table->string('si_number', 100)->nullable();
            $table->string('ar_number', 100)->nullable();
            $table->string('or_number', 100)->nullable();

            $table->string('status', 30)->default('inquiry');
            $table->boolean('forwarded_to_accounting')->default(false);
            $table->timestamp('forwarded_to_accounting_at')->nullable();
            $table->foreignId('forwarded_to_accounting_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();

            $table->text('remarks')->nullable();
            $table->text('audit_remarks')->nullable();

            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['branch_id', 'date']);
            $table->index(['status', 'date']);
            $table->index(['agent_code', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_bookings');
    }
};
