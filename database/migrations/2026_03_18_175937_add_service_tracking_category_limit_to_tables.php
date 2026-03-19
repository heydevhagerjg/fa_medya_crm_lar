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
            $table->integer('service_tracking_category_limit')->default(0)->after('service_tracking_category_feature');
        });

        Schema::table('tenants', function (Blueprint $table) {
             $table->integer('plan_service_tracking_category_limit')->default(0)->after('plan_service_tracking_category_feature');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn('service_tracking_category_limit');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('plan_service_tracking_category_limit');
        });
    }
};
