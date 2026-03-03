<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── TENANTS (must be first CRM table) ───────────────────────────────
        Schema::create('tenants', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo')->nullable();
            $table->bigInteger('storage_used')->default(0);
            $table->timestamps();
        });

        // ─── ADD tenant_id FK to users ────────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('set null');
            $table->index('tenant_id');
        });

        // ─── CASH REGISTERS ───────────────────────────────────────────────────
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // ─── EXPENSE CATEGORIES ───────────────────────────────────────────────
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // ─── SERVICES ─────────────────────────────────────────────────────────
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->json('config')->nullable();
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // ─── CUSTOM FIELDS ────────────────────────────────────────────────────
        Schema::create('custom_fields', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('service_id');
            $table->string('label');
            $table->string('type')->default('text');
            $table->boolean('required')->default(false);
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
        });

        // ─── JOB STATUSES ─────────────────────────────────────────────────────
        Schema::create('job_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->string('color')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // ─── STEP TEMPLATES ───────────────────────────────────────────────────
        Schema::create('step_templates', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // ─── DEFAULT STEPS ────────────────────────────────────────────────────
        Schema::create('default_steps', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('template_id');
            $table->string('title');
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('template_id')->references('id')->on('step_templates')->onDelete('cascade');
        });

        // ─── CUSTOMERS ────────────────────────────────────────────────────────
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index('tenant_id');
        });

        // ─── JOBS CRM ─────────────────────────────────────────────────────────
        Schema::create('jobs_crm', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('service_id')->nullable();
            $table->unsignedBigInteger('job_status_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('PENDING'); // PENDING|IN_PROGRESS|COMPLETED|CANCELLED
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('total_price', 12, 2)->default(0);
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('service_id')->references('id')->on('services')->onDelete('set null');
            $table->foreign('job_status_id')->references('id')->on('job_statuses')->onDelete('set null');
            $table->index('tenant_id');
            $table->index('customer_id');
        });

        // ─── JOB DETAILS ──────────────────────────────────────────────────────
        Schema::create('job_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_id')->unique();
            $table->text('customer_requests')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->foreign('job_id')->references('id')->on('jobs_crm')->onDelete('cascade');
        });

        // ─── JOB FILES ────────────────────────────────────────────────────────
        Schema::create('job_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_id');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamps();
            $table->foreign('job_id')->references('id')->on('jobs_crm')->onDelete('cascade');
        });

        // ─── JOB STEPS ────────────────────────────────────────────────────────
        Schema::create('job_steps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_id');
            $table->string('title');
            $table->boolean('is_completed')->default(false);
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->foreign('job_id')->references('id')->on('jobs_crm')->onDelete('cascade');
        });

        // ─── PAYMENTS ─────────────────────────────────────────────────────────
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('job_id')->nullable();
            $table->unsignedBigInteger('cash_register_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->date('payment_date');
            $table->string('payment_type')->default('FINAL'); // ADVANCE|PARTIAL|FINAL
            $table->text('description')->nullable();
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('job_id')->references('id')->on('jobs_crm')->onDelete('set null');
            $table->foreign('cash_register_id')->references('id')->on('cash_registers')->onDelete('set null');
        });

        // ─── EXPENSES ─────────────────────────────────────────────────────────
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('job_id')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->unsignedBigInteger('cash_register_id')->nullable();
            $table->string('title');
            $table->decimal('amount', 12, 2);
            $table->date('date');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('job_id')->references('id')->on('jobs_crm')->onDelete('set null');
            $table->foreign('category_id')->references('id')->on('expense_categories')->onDelete('set null');
            $table->foreign('cash_register_id')->references('id')->on('cash_registers')->onDelete('set null');
        });

        // ─── CUSTOM FIELD VALUES ──────────────────────────────────────────────
        Schema::create('custom_field_values', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_id');
            $table->unsignedBigInteger('custom_field_id');
            $table->text('value')->nullable();
            $table->timestamps();
            $table->foreign('job_id')->references('id')->on('jobs_crm')->onDelete('cascade');
            $table->foreign('custom_field_id')->references('id')->on('custom_fields')->onDelete('cascade');
            $table->unique(['job_id', 'custom_field_id']);
        });

        // ─── API KEYS ─────────────────────────────────────────────────────────
        Schema::create('api_keys', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('tenant_id');
            $table->string('key', 64)->unique();
            $table->string('name')->nullable();
            $table->timestamp('last_used')->nullable();
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // ─── ACTIVITY LOGS ────────────────────────────────────────────────────
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('user_id')->nullable();
            $table->string('action');       // CREATE | UPDATE | DELETE
            $table->string('entity_type'); // CUSTOMER | JOB | PAYMENT | etc.
            $table->string('entity_id')->nullable();
            $table->string('entity_name')->nullable();
            $table->text('details')->nullable();
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('api_keys');
        Schema::dropIfExists('custom_field_values');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('job_steps');
        Schema::dropIfExists('job_files');
        Schema::dropIfExists('job_details');
        Schema::dropIfExists('jobs_crm');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('default_steps');
        Schema::dropIfExists('step_templates');
        Schema::dropIfExists('job_statuses');
        Schema::dropIfExists('custom_fields');
        Schema::dropIfExists('services');
        Schema::dropIfExists('expense_categories');
        Schema::dropIfExists('cash_registers');

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['tenant_id']);
        });

        Schema::dropIfExists('tenants');
    }
};
