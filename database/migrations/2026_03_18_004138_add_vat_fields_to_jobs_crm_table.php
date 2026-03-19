<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('jobs_crm', function (Blueprint $table) {
            $table->boolean('is_vat_included')->default(false)->after('total_price');
            $table->integer('vat_rate')->default(0)->after('is_vat_included');
            $table->decimal('subtotal', 15, 2)->default(0)->after('vat_rate');
            $table->decimal('vat_amount', 15, 2)->default(0)->after('subtotal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jobs_crm', function (Blueprint $table) {
            $table->dropColumn(['is_vat_included', 'vat_rate', 'subtotal', 'vat_amount']);
        });
    }
};
