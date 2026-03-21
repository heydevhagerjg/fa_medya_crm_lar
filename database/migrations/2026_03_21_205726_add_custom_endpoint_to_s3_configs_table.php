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
        Schema::table('s3_configs', function (Blueprint $table) {
            $table->string('aws_endpoint')->nullable()->after('aws_bucket_name');
            $table->boolean('use_path_style_endpoint')->default(false)->after('aws_endpoint');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('s3_configs', function (Blueprint $table) {
            $table->dropColumn(['aws_endpoint', 'use_path_style_endpoint']);
        });
    }
};
