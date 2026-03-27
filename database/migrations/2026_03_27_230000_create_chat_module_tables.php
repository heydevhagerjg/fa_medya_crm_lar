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
        // 1. CHATS Table (Polymorphic & Multi-tenant)
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            
            // Tenant isolation
            $table->string('tenant_id')->index();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');

            // Polymorphic relation
            $table->string('chateable_type')->nullable();
            $table->unsignedBigInteger('chateable_id')->nullable();
            $table->index(['chateable_type', 'chateable_id']);

            // Metadata
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->string('icon', 100)->nullable();
            
            // Stats & States
            $table->boolean('is_archived')->default(false);
            $table->boolean('is_pinned')->default(false);
            $table->bigInteger('message_count')->default(0);

            // Timestamps & Users
            $table->string('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->timestamp('last_message_at')->nullable()->index();
            $table->timestamps();
        });

        // 2. CHAT PARTICIPANTS Table
        Schema::create('chat_participants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('chat_id');
            $table->foreign('chat_id')->references('id')->on('chats')->onDelete('cascade');
            
            $table->string('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            // Roles & Status
            $table->enum('role', ['owner', 'admin', 'member'])->default('member');
            $table->boolean('is_muted')->default(false);
            $table->boolean('is_active')->default(true)->index();
            
            // Read receipts
            $table->unsignedBigInteger('last_read_message_id')->nullable();
            $table->timestamp('last_read_at')->nullable();
            $table->integer('unread_count')->default(0);
            
            // Timestamps
            $table->timestamp('joined_at')->nullable()->useCurrent();
            $table->timestamp('left_at')->nullable();
            $table->timestamps();

            $table->unique(['chat_id', 'user_id']);
        });

        // 3. MESSAGES Table
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('chat_id')->index();
            $table->foreign('chat_id')->references('id')->on('chats')->onDelete('cascade');
            
            $table->string('user_id')->nullable()->index();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            
            $table->longText('content')->nullable();
            $table->enum('type', ['text', 'file', 'system'])->default('text')->index();
            
            // Meta & Stats
            $table->json('metadata')->nullable();
            $table->timestamp('edited_at')->nullable();
            $table->softDeletes();
            $table->integer('read_count')->default(0);
            
            $table->timestamps();
            
            // Index for high-performance reading
            $table->index(['chat_id', 'created_at', 'id']);
        });

        // 4. MESSAGE ATTACHMENTS Table
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('message_id')->index();
            $table->foreign('message_id')->references('id')->on('messages')->onDelete('cascade');
            
            // File details
            $table->string('file_name');
            $table->enum('file_type', ['image', 'pdf', 'document', 'video', 'other'])->index();
            $table->bigInteger('file_size');
            
            // Storage details (S3)
            $table->string('s3_path', 500);
            $table->string('s3_url', 500)->nullable();
            $table->string('mime_type', 100);
            
            // Previews
            $table->string('preview_url', 500)->nullable();
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_attachments');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('chat_participants');
        Schema::dropIfExists('chats');
    }
};
