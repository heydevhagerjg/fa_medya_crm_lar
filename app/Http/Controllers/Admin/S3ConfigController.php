<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\S3Config;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class S3ConfigController extends Controller
{
    public function index()
    {
        return response()->json(S3Config::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'                      => 'required|string|max:255',
            'aws_access_key_id'         => 'required|string|max:255',
            'aws_secret_access_key'     => 'required|string|max:255',
            'aws_region'                => 'required|string|max:255',
            'aws_bucket_name'           => 'required|string|max:255',
            'aws_endpoint'              => 'nullable|string|max:255',
            'public_url'                => 'nullable|url|max:255',
            'use_path_style_endpoint'   => 'nullable|boolean',
            'is_active'                 => 'boolean',
        ]);

        $config = S3Config::create($validated);
        return response()->json($config, 201);
    }

    public function show(string $id)
    {
        return response()->json(S3Config::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $config = S3Config::findOrFail($id);
        
        $validated = $request->validate([
            'name'                      => 'sometimes|string|max:255',
            'aws_access_key_id'         => 'sometimes|string|max:255',
            'aws_secret_access_key'     => 'sometimes|string|max:255',
            'aws_region'                => 'sometimes|string|max:255',
            'aws_bucket_name'           => 'sometimes|string|max:255',
            'aws_endpoint'              => 'nullable|string|max:255',
            'public_url'                => 'nullable|url|max:255',
            'use_path_style_endpoint'   => 'nullable|boolean',
            'is_active'                 => 'boolean',
        ]);

        $config->update($validated);
        return response()->json($config);
    }

    public function destroy(string $id)
    {
        $config = S3Config::findOrFail($id);
        $config->delete();
        return response()->json(null, 204);
    }
    
    public function testConnection(Request $request)
    {
        $validated = $request->validate([
            'aws_access_key_id'     => 'required|string',
            'aws_secret_access_key' => 'required|string',
            'aws_region'            => 'required|string',
            'aws_bucket_name'       => 'required|string',
            'aws_endpoint'          => 'nullable|string',
            'use_path_style_endpoint' => 'nullable|boolean',
        ]);

        try {
            $key = trim($validated['aws_access_key_id']);
            $secret = trim($validated['aws_secret_access_key']);
            $region = strtolower(trim($validated['aws_region']));
            $bucket = trim($validated['aws_bucket_name']);

            $disk = Storage::build([
                'driver' => 's3',
                'key'    => $key,
                'secret' => $secret,
                'region' => $region,
                'bucket' => $bucket,
                'endpoint' => $request->input('aws_endpoint') ? trim($request->input('aws_endpoint')) : null,
                'use_path_style_endpoint' => (bool)($request->input('use_path_style_endpoint') ?? false),
                'throw'  => true,
                'version' => 'latest'
            ]);
            
            $disk->files();
            $testPath = 'admin_connection_test_' . Str::random(8) . '.txt';
            $disk->put($testPath, 'CRM Admin S3 Test');
            $disk->delete($testPath);

            return response()->json(['success' => true, 'message' => 'Bağlantı başarılı!']);
        } catch (\Exception $e) {
            $message = $e->getMessage();
            if (str_contains($message, 'SignatureDoesNotMatch')) {
                $message = "İmza hatası (SignatureDoesNotMatch). Key/Secret kontrol edin.";
            } elseif (str_contains($message, '403 Forbidden')) {
                $message = "Erişim reddedildi (403). IAM yetkilerini kontrol edin.";
            } elseif (str_contains($message, 'Could not resolve host')) {
                $message = "Bucket veya Bölge hatalı.";
            }
            return response()->json(['success' => false, 'message' => 'Hata: ' . $message], 400);
        }
    }

    public function setupCors(string $id)
    {
        $config = S3Config::findOrFail($id);
        try {
            $disk = Storage::build([
                'driver' => 's3',
                'key'    => $config->aws_access_key_id,
                'secret' => $config->aws_secret_access_key,
                'region' => $config->aws_region,
                'bucket' => $config->aws_bucket_name,
                'endpoint' => $config->aws_endpoint,
                'use_path_style_endpoint' => (bool)$config->use_path_style_endpoint,
                'throw'  => true,
            ]);
            
            $client = $disk->getClient();
            $client->putBucketCors([
                'Bucket' => $config->aws_bucket_name,
                'CORSConfiguration' => [
                    'CORSRules' => [
                        [
                            'AllowedHeaders' => ['*'],
                            'AllowedMethods' => ['PUT', 'POST', 'GET', 'DELETE', 'HEAD'],
                            'AllowedOrigins' => ['*'],
                            'ExposeHeaders'  => ['ETag', 'Content-Type', 'Content-Length']
                        ],
                    ],
                ],
            ]);

            return response()->json(['success' => true, 'message' => 'CORS yapılandırması başarıyla tamamlandı. Artık tarayıcıdan doğrudan dosya yüklenebilir.']);
        } catch (\Exception $e) {
            $message = $e->getMessage();
            $isR2 = str_contains(strtolower((string) $config->aws_endpoint), 'r2.cloudflarestorage.com');

            if ($isR2 && str_contains($message, 'AccessDenied')) {
                $message = 'Cloudflare R2 AccessDenied: Bu anahtar object upload/download icin yeterli olabilir ama bucket CORS degisikligi (PutBucketCors) yetkisi yok. R2 panelinden bucket CORS ayarini manuel yapin veya bucket-level yonetim yetkili bir R2 API anahtari kullanin.';
            }

            return response()->json(['success' => false, 'message' => 'CORS hatasi: ' . $message], 400);
        }
    }
}
