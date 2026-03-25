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
        Schema::table('workflow_logs', function (Blueprint $table) {
            $table->string('tenant_id')->change();
            $table->string('model_id')->change();
        });

        Schema::table('workflows', function (Blueprint $table) {
            $table->string('tenant_id')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No easy way back if they were IDs before, but we assume UUID is the standard now.
    }
};
