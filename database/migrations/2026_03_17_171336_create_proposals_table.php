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
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('tenant_id');
            $table->unsignedBigInteger('customer_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('total_price', 12, 2)->default(0);
            $table->enum('status', ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'REVISION_REQUESTED'])->default('DRAFT');
            $table->text('notes')->nullable(); // Internal Admin Notes
            $table->text('customer_notes')->nullable(); // Customer Revision Notes
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->index('tenant_id');
        });

        Schema::create('proposal_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('proposal_id');
            $table->string('description');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->timestamps();

            $table->foreign('proposal_id')->references('id')->on('proposals')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposal_items');
        Schema::dropIfExists('proposals');
    }
};
