<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Package::create([
            'name' => 'Silver Paket',
            'personnel_limit' => 5,
            'customer_limit' => 50,
            'job_limit' => 100,
            'appointment_feature' => true,
            'appointment_limit' => 100,
            'service_tracking_feature' => true,
            'service_tracking_limit' => 50,
            'service_tracking_category_feature' => false,
            'proposal_feature' => true,
            'proposal_limit' => 20,
            'backup_feature' => false,
            'backup_limit' => 0,
            'services_section_feature' => true,
            'service_limit' => 10,
            'step_templates_feature' => true,
            'step_template_limit' => 5,
            'cash_register_limit' => 2,
            'api_key_feature' => false,
            'disk_usage_limit' => 500, // 500 MB
            'is_active' => true,
        ]);

        \App\Models\Package::create([
            'name' => 'Gold Paket',
            'personnel_limit' => 15,
            'customer_limit' => 200,
            'job_limit' => 500,
            'appointment_feature' => true,
            'appointment_limit' => 500,
            'service_tracking_feature' => true,
            'service_tracking_limit' => 200,
            'service_tracking_category_feature' => true,
            'proposal_feature' => true,
            'proposal_limit' => 100,
            'backup_feature' => true,
            'backup_limit' => 5,
            'services_section_feature' => true,
            'service_limit' => 50,
            'step_templates_feature' => true,
            'step_template_limit' => 20,
            'cash_register_limit' => 5,
            'api_key_feature' => true,
            'disk_usage_limit' => 2048, // 2 GB
            'is_active' => true,
        ]);

        \App\Models\Package::create([
            'name' => 'Platinum Paket (Sınırsız)',
            'personnel_limit' => 9999,
            'customer_limit' => 9999,
            'job_limit' => 9999,
            'appointment_feature' => true,
            'appointment_limit' => 9999,
            'service_tracking_feature' => true,
            'service_tracking_limit' => 9999,
            'service_tracking_category_feature' => true,
            'proposal_feature' => true,
            'proposal_limit' => 9999,
            'backup_feature' => true,
            'backup_limit' => 9999,
            'services_section_feature' => true,
            'service_limit' => 9999,
            'step_templates_feature' => true,
            'step_template_limit' => 9999,
            'cash_register_limit' => 99,
            'api_key_feature' => true,
            'disk_usage_limit' => 10240, // 10 GB
            'is_active' => true,
        ]);
    }
}
