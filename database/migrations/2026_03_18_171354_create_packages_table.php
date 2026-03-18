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
        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('personnel_limit')->default(0);
            $table->integer('customer_limit')->default(0);
            $table->integer('job_limit')->default(0);
            
            $table->boolean('appointment_feature')->default(false);
            $table->integer('appointment_limit')->default(0);
            
            $table->boolean('service_tracking_feature')->default(false);
            $table->integer('service_tracking_limit')->default(0);
            $table->boolean('service_tracking_category_feature')->default(false);
            
            $table->boolean('proposal_feature')->default(false);
            $table->integer('proposal_limit')->default(0);
            
            $table->boolean('backup_feature')->default(false);
            $table->integer('backup_limit')->default(0);
            
            $table->boolean('services_section_feature')->default(false);
            $table->integer('service_limit')->default(0);
            
            $table->boolean('step_templates_feature')->default(false);
            $table->integer('step_template_limit')->default(0);
            
            $table->integer('cash_register_limit')->default(0);
            $table->boolean('api_key_feature')->default(false);
            $table->bigInteger('disk_usage_limit')->default(0); // In MB
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->foreignId('package_id')->nullable()->constrained('packages')->onDelete('set null');
            
            // Limit snapshot fields (to allow manual adjustment and persistence)
            $table->integer('plan_personnel_limit')->default(0);
            $table->integer('plan_customer_limit')->default(0);
            $table->integer('plan_job_limit')->default(0);
            
            $table->boolean('plan_appointment_feature')->default(false);
            $table->integer('plan_appointment_limit')->default(0);
            
            $table->boolean('plan_service_tracking_feature')->default(false);
            $table->integer('plan_service_tracking_limit')->default(0);
            $table->boolean('plan_service_tracking_category_feature')->default(false);
            
            $table->boolean('plan_proposal_feature')->default(false);
            $table->integer('plan_proposal_limit')->default(0);
            
            $table->boolean('plan_backup_feature')->default(false);
            $table->integer('plan_backup_limit')->default(0);
            
            $table->boolean('plan_services_section_feature')->default(false);
            $table->integer('plan_service_limit')->default(0);
            
            $table->boolean('plan_step_templates_feature')->default(false);
            $table->integer('plan_step_template_limit')->default(0);
            
            $table->integer('plan_cash_register_limit')->default(0);
            $table->boolean('plan_api_key_feature')->default(false);
            $table->bigInteger('plan_disk_usage_limit')->default(0); // In MB
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['package_id']);
            $table->dropColumn([
                'package_id', 'plan_personnel_limit', 'plan_customer_limit', 'plan_job_limit',
                'plan_appointment_feature', 'plan_appointment_limit', 'plan_service_tracking_feature', 
                'plan_service_tracking_limit', 'plan_service_tracking_category_feature',
                'plan_proposal_feature', 'plan_proposal_limit', 'plan_backup_feature', 'plan_backup_limit',
                'plan_services_section_feature', 'plan_service_limit', 'plan_step_templates_feature',
                'plan_step_template_limit', 'plan_cash_register_limit', 'plan_api_key_feature',
                'plan_disk_usage_limit'
            ]);
        });
        Schema::dropIfExists('packages');
    }
};
