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
        Schema::create('s3_configs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('aws_access_key_id')->nullable();
            $table->string('aws_secret_access_key')->nullable();
            $table->string('aws_region')->nullable();
            $table->string('aws_bucket_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('s3_configs');
    }
};
