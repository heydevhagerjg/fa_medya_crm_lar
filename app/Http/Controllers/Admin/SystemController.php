<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Throwable;

class SystemController extends Controller
{
    /**
     * Clear system caches to optimize the application without deleting data.
     */
    public function optimize(): JsonResponse
    {
        try {
            // Sadece geçici önbellekleri temizler
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');

            return response()->json([
                'success' => true,
                'message' => 'Sistem önbellekleri başarıyla temizlendi. Geçici dosyalar silindi.'
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Önbellek temizlenirken bir hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }
}
