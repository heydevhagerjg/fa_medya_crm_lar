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
        $tableNames = config('permission.table_names');

        if (empty($tableNames)) {
            return;
        }

        Schema::table($tableNames['roles'], function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->nullable()->after('guard_name');
            $table->dropUnique(['name', 'guard_name']);
            $table->unique(['name', 'guard_name', 'tenant_id']);
        });

        Schema::table($tableNames['model_has_roles'], function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->index('tenant_id');
        });

        Schema::table($tableNames['model_has_permissions'], function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        $tableNames = config('permission.table_names');

        Schema::table($tableNames['roles'], function (Blueprint $table) {
            $table->dropUnique(['name', 'guard_name', 'tenant_id']);
            $table->unique(['name', 'guard_name']);
            $table->dropColumn('tenant_id');
        });

        Schema::table($tableNames['model_has_roles'], function (Blueprint $table) {
            $table->dropColumn('tenant_id');
        });

        Schema::table($tableNames['model_has_permissions'], function (Blueprint $table) {
            $table->dropColumn('tenant_id');
        });
    }
};
