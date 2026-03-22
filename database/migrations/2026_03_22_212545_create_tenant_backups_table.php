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
        Schema::create('tenant_backups', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id');
            $table->string('filename');
            $table->string('path');
            $table->unsignedBigInteger('size')->nullable();
            $table->string('status')->default('pending'); // pending, processing, completed, failed
            $table->text('error')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_backups');
    }
};
