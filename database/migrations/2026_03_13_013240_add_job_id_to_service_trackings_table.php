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
        Schema::table('service_trackings', function (Blueprint $table) {
            $table->foreignId('job_id')->nullable()->after('category_id')->constrained('jobs_crm')->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_trackings', function (Blueprint $table) {
            $table->dropForeign(['job_id']);
            $table->dropColumn('job_id');
            $table->foreignId('customer_id')->nullable(false)->change();
        });
    }
};
