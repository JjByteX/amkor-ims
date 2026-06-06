<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Marketing Materials (poster / itinerary / collateral workflow) ───────
        Schema::create('marketing_materials', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->enum('material_type', [
                'poster', 'itinerary', 'social_media', 'email_blast',
                'event_collateral', 'office_material', 'tv_ad', 'other',
            ]);
            $table->text('description')->nullable();

            // Approval workflow: draft → submitted → approved → published → archived
            $table->enum('status', ['draft', 'submitted', 'approved', 'published', 'archived'])
                  ->default('draft');

            // File attachment handled by spatie/laravel-media-library — no path stored here
            $table->string('platform')->nullable();     // facebook, tiktok, instagram, etc.
            $table->text('caption')->nullable();
            $table->text('revision_notes')->nullable(); // COO feedback on rejection
            $table->date('publish_date')->nullable();

            // Approval chain
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('submitted_by')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();  // COO
            $table->timestamp('reviewed_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();  // COO
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('published_by')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('submitted_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('published_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });

        // ── Marketing Expenses ────────────────────────────────────────────────────
        Schema::create('marketing_expenses', function (Blueprint $table) {
            $table->id();

            $table->string('campaign_name');
            $table->enum('category', [
                'paid_ads', 'events', 'printing', 'production',
                'email_blast', 'photography', 'social_media', 'other',
            ]);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('PHP');
            $table->date('expense_date');

            // Period (month/year for grouping in reports)
            $table->unsignedTinyInteger('period_month');
            $table->unsignedSmallInteger('period_year');

            $table->string('vendor')->nullable();
            $table->text('remarks')->nullable();
            $table->enum('status', ['draft', 'submitted', 'approved'])->default('draft');

            // Material linkage (optional)
            $table->unsignedBigInteger('material_id')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->foreign('material_id')->references('id')->on('marketing_materials')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });

        // ── Campaign Analytics snapshots ─────────────────────────────────────────
        Schema::create('marketing_analytics', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('material_id')->nullable();
            $table->string('platform');
            $table->date('recorded_date');
            $table->unsignedBigInteger('reach')->default(0);
            $table->unsignedBigInteger('impressions')->default(0);
            $table->unsignedBigInteger('engagements')->default(0);
            $table->unsignedBigInteger('clicks')->default(0);
            $table->unsignedBigInteger('conversions')->default(0);
            $table->decimal('spend', 10, 2)->default(0);
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();

            $table->timestamps();

            $table->foreign('material_id')->references('id')->on('marketing_materials')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_analytics');
        Schema::dropIfExists('marketing_expenses');
        Schema::dropIfExists('marketing_materials');
    }
};
