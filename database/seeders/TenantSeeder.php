<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenant = Tenant::updateOrCreate(
            ['id' => 'test-tenant-001'],
            [
                'name' => 'FA Medya Yazılım Çözümleri',
                'slug' => Str::slug('FA Medya Yazılım Çözümleri'),
                'email' => 'iletisim@famedya.com',
                'phone' => '+90 (212) 555-1234',
                'address' => 'İstanbul, Türkiye',
                'website' => 'https://www.famedya.com',
                'logo' => null, // Logo S3'e manuel yüklenir
                'storage_used' => 0,
                'is_active' => true,
            ]
        );

        echo "✓ Tenant oluşturuldu/güncellendi: {$tenant->id}\n";
    }
}

