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
        Schema::table('proposal_installments', function (Blueprint $table) {
            // Drop current cascade foreign key
            $table->dropForeign(['job_id']);
            
            // Re-create with set null
            $table->foreign('job_id')->references('id')->on('jobs_crm')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proposal_installments', function (Blueprint $table) {
            $table->dropForeign(['job_id']);
            $table->foreign('job_id')->references('id')->on('jobs_crm')->onDelete('cascade');
        });
    }
};
