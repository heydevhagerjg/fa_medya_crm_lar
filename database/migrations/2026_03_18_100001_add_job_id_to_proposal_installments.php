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
            $table->unsignedBigInteger('proposal_id')->nullable()->change();
            $table->unsignedBigInteger('job_id')->nullable()->after('proposal_id');
            
            $table->foreign('job_id')->references('id')->on('jobs_crm')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proposal_installments', function (Blueprint $table) {
            $table->dropForeign(['job_id']);
            $table->dropColumn('job_id');
            $table->unsignedBigInteger('proposal_id')->nullable(false)->change();
        });
    }
};
