<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use App\Models\TenantBackup;

class CleanupBackupTemp extends Command
{
    protected $signature = 'backup:cleanup-temp {--older-than=3 : Days}';
    protected $description = 'Clean up orphaned backup-temp files and failed backup records';

    public function handle()
    {
        $olderThanDays = (int)$this->option('older-than');
        $baseTemp = storage_path('app/backup-temp');
        $cleanedDirs = 0;
        $cleanedRecords = 0;

        // 1. Clean up backup-temp directory
        if (File::isDirectory($baseTemp)) {
            $dirs = File::directories($baseTemp);
            
            foreach ($dirs as $dir) {
                // Get last modified time of directory
                $lastModified = filemtime($dir);
                $daysOld = (time() - $lastModified) / (60 * 60 * 24);
                
                if ($daysOld >= $olderThanDays) {
                    try {
                        File::deleteDirectory($dir);
                        $cleanedDirs++;
                        $this->info("Deleted orphaned temp directory: " . basename($dir));
                    } catch (\Exception $e) {
                        $this->warn("Failed to delete {$dir}: " . $e->getMessage());
                    }
                }
            }
            
            // Remove base temp if now empty
            if (File::isDirectory($baseTemp)) {
                $files = File::files($baseTemp);
                $dirs = File::directories($baseTemp);
                if (count($files) === 0 && count($dirs) === 0) {
                    File::deleteDirectory($baseTemp);
                    $this->info("Deleted empty backup-temp directory");
                }
            }
        }

        // 2. Clean up failed backups older than specified days
        $cutoffDate = now()->subDays($olderThanDays);
        $failedBackups = TenantBackup::where('status', 'failed')
            ->where('created_at', '<', $cutoffDate)
            ->get();

        foreach ($failedBackups as $backup) {
            // Delete associated file if exists
            if ($backup->path && File::exists(storage_path('app/' . $backup->path))) {
                try {
                    File::delete(storage_path('app/' . $backup->path));
                } catch (\Exception $e) {
                    $this->warn("Failed to delete backup file {$backup->path}: " . $e->getMessage());
                }
            }
            
            // Delete database record
            $backup->delete();
            $cleanedRecords++;
        }

        $this->info("Cleanup completed!");
        $this->info("- Deleted orphaned temp directories: {$cleanedDirs}");
        $this->info("- Cleaned up failed backup records: {$cleanedRecords}");
    }
}
