<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->string('trigger_model'); // App\Models\Proposal etc.
            $table->string('trigger_event'); // created, updated
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('workflow_conditions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->onDelete('cascade');
            $table->string('field');
            $table->string('operator'); // =, !=, >, <, contains
            $table->string('value')->nullable();
            $table->timestamps();
        });

        Schema::create('workflow_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->onDelete('cascade');
            $table->string('type'); // send_email, create_job, etc.
            $table->json('parameters'); // email recipient, subject, body, etc.
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('workflow_actions');
        Schema::dropIfExists('workflow_conditions');
        Schema::dropIfExists('workflows');
    }
};
