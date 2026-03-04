<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Jobs\BackupTenantJob;

class AutoBackupTenants extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:tenants';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatch auto backup jobs for tenants with complete S3 credentials';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tenants = Tenant::whereNotNull('aws_access_key_id')
                         ->whereNotNull('aws_secret_access_key')
                         ->whereNotNull('aws_region')
                         ->whereNotNull('aws_bucket_name')
                         ->where('aws_access_key_id', '!=', '')
                         ->where('aws_secret_access_key', '!=', '')
                         ->where('aws_region', '!=', '')
                         ->where('aws_bucket_name', '!=', '')
                         ->get();

        $this->info("Found {$tenants->count()} tenant(s) with S3 configuration.");

        foreach ($tenants as $tenant) {
            BackupTenantJob::dispatch($tenant->id);
            $this->info("Dispatched backup job for tenant ID {$tenant->id}");
        }

        $this->info("All backup jobs dispatched successfully.");
    }
}
