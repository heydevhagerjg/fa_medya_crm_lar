<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Str;

class SystemBackupController extends Controller
{
    public function index()
    {
        $backupDisks = ['local', 's3'];
        $results = [];

        foreach ($backupDisks as $diskName) {
            try {
                $disk = Storage::disk($diskName);
                $files = $disk->allFiles(env('APP_NAME', 'FamedyaCRM_System_Backup'));
                
                // Sort by last modified
                usort($files, function($a, $b) use ($disk) {
                    return $disk->lastModified($b) <=> $disk->lastModified($a);
                });

                $diskBackups = [];
                foreach ($files as $file) {
                    if (substr($file, -4) == '.zip') {
                        $diskBackups[] = [
                            'name' => basename($file),
                            'path' => $file,
                            'size' => $this->humanFileSize($disk->size($file)),
                            'last_modified' => date('d.m.Y H:i:s', $disk->lastModified($file)),
                        ];
                    }
                }
                
                $results[$diskName] = $diskBackups;
            } catch (\Exception $e) {
                $results[$diskName] = [];
            }
        }

        return response()->json($results);
    }

    public function create()
    {
        try {
            // Run backup in background or immediately? Better start it and return
            // We'll use artisan but notice it might take time.
            Artisan::queue('backup:run');
            
            return response()->json(['message' => 'Yedekleme işlemi başlatıldı. Arka planda tamamlanacaktır.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Yedekleme başlatılamadı: ' . $e->getMessage()], 500);
        }
    }

    public function download(Request $request)
    {
        $request->validate([
            'disk' => 'required|string',
            'path' => 'required|string',
        ]);

        $diskName = $request->disk;
        $path = $request->path;

        if (!Storage::disk($diskName)->exists($path)) {
            return response()->json(['message' => 'Dosya bulunamadı.'], 404);
        }

        return Storage::disk($diskName)->download($path);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'disk' => 'required|string',
            'path' => 'required|string',
        ]);

        $diskName = $request->disk;
        $path = $request->path;

        if (Storage::disk($diskName)->exists($path)) {
            Storage::disk($diskName)->delete($path);
            return response()->json(['message' => 'Yedek başarıyla silindi.']);
        }

        return response()->json(['message' => 'Yedek bulunamadı.'], 404);
    }

    private function humanFileSize($size, $unit = "")
    {
        if ((!$unit && $size >= 1 << 30) || $unit == "GB")
            return number_format($size / (1 << 30), 2) . " GB";
        if ((!$unit && $size >= 1 << 20) || $unit == "MB")
            return number_format($size / (1 << 20), 2) . " MB";
        if ((!$unit && $size >= 1 << 10) || $unit == "KB")
            return number_format($size / (1 << 10), 2) . " KB";
        return number_format($size) . " bytes";
    }
}
