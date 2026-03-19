<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestS3Command extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:s3';

    protected $description = 'Test S3 upload for first configured tenant';

    public function handle()
    {
        $admin = \App\Models\Admin::whereNotNull('aws_access_key_id')->first();
        if (!$admin) {
            $this->error('No admin with S3 configured.');
            return;
        }

        $region = $admin->aws_region ?? 'eu-central-1';
        $diskName = 'test_s3_command';
        
        \Illuminate\Support\Facades\Config::set("filesystems.disks.{$diskName}", [
            'driver' => 's3',
            'key'    => $admin->aws_access_key_id,
            'secret' => $admin->aws_secret_access_key,
            'region' => $region,
            'bucket' => $admin->aws_bucket_name,
            'url'    => "https://{$admin->aws_bucket_name}.s3.{$region}.amazonaws.com",
            'use_path_style_endpoint' => false,
            'throw'  => true,
        ]);

        try {
            $disk = \Illuminate\Support\Facades\Storage::disk($diskName);
            $disk->put('test_command.txt', 'test content');
            $this->info("Upload successful!");
            $disk->delete('test_command.txt');
            $this->info("Delete successful!");
        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
        }
    }
}
