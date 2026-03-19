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
        Schema::table('packages', function (Blueprint $table) {
            $table->integer('trial_days')->after('name')->default(14);
            $table->string('paddle_product_id')->after('trial_days')->nullable();
            $table->string('paddle_price_id')->after('paddle_product_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn(['trial_days', 'paddle_product_id', 'paddle_price_id']);
        });
    }
};
