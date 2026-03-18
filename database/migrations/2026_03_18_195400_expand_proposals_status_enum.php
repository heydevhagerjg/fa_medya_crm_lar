<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * ENUM sütununu CANCELLED ve RENEWAL_REQUESTED değerlerini de kapsayacak şekilde genişletir.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE `proposals` MODIFY COLUMN `status` ENUM(
            'DRAFT',
            'SENT',
            'ACCEPTED',
            'REJECTED',
            'REVISION_REQUESTED',
            'CANCELLED',
            'RENEWAL_REQUESTED'
        ) NOT NULL DEFAULT 'DRAFT'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE `proposals` MODIFY COLUMN `status` ENUM(
            'DRAFT',
            'SENT',
            'ACCEPTED',
            'REJECTED',
            'REVISION_REQUESTED'
        ) NOT NULL DEFAULT 'DRAFT'");
    }
};
