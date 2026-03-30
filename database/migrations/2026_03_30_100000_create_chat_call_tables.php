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
        Schema::create('chat_call_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('chat_id')->index();
            $table->foreign('chat_id')->references('id')->on('chats')->onDelete('cascade');

            $table->string('tenant_id')->index();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');

            $table->string('started_by');
            $table->foreign('started_by')->references('id')->on('users')->onDelete('cascade');

            $table->enum('type', ['audio'])->default('audio');
            $table->enum('status', ['ringing', 'active', 'rejected', 'ended', 'cancelled'])->default('ringing')->index();

            $table->timestamp('started_at')->nullable();
            $table->timestamp('answered_at')->nullable();
            $table->timestamp('ended_at')->nullable();

            $table->string('ended_by')->nullable();
            $table->foreign('ended_by')->references('id')->on('users')->nullOnDelete();

            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('chat_call_participants', function (Blueprint $table) {
            $table->id();
            $table->uuid('call_session_id')->index();
            $table->foreign('call_session_id')->references('id')->on('chat_call_sessions')->onDelete('cascade');

            $table->string('user_id')->index();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->enum('status', ['invited', 'joined', 'rejected', 'left'])->default('invited')->index();

            $table->timestamp('invited_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();

            $table->timestamps();

            $table->unique(['call_session_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_call_participants');
        Schema::dropIfExists('chat_call_sessions');
    }
};
