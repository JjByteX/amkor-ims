<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2.4 — Replace the marketing_expenses category enum with a plain string.
 *
 * The existing enum values (paid_ads, events, printing, production,
 * email_blast, photography, social_media, other) do not match the client's
 * actual Excel categories. Enums are hard to extend; switching to a plain
 * string means future categories can be added without a schema migration.
 *
 * The valid values are now enforced at the application layer via
 * MarketingExpense::CATEGORIES (already updated in the model).
 *
 * The existing string-based category values stored in the database are
 * left in place — the old keys still appear in MarketingExpense::CATEGORIES
 * so existing rows remain valid.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marketing_expenses', function (Blueprint $table) {
            // Change the enum column to a plain varchar.
            // doctrine/dbal is required for ->change() on SQLite/MySQL.
            $table->string('category', 100)->change();
        });
    }

    public function down(): void
    {
        // Re-creating the original enum exactly is intentionally skipped:
        // any rows with the new category keys would fail the enum constraint.
        // Leaving as string on rollback is the safe behaviour.
        Schema::table('marketing_expenses', function (Blueprint $table) {
            $table->string('category', 100)->change();
        });
    }
};
