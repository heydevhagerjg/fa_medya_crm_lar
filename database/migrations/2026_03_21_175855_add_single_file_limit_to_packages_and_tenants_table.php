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
            $table->integer('single_file_limit')->default(50); // In MB
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->integer('plan_single_file_limit')->default(50); // In MB
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn('single_file_limit');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('plan_single_file_limit');
        });
    }
};
