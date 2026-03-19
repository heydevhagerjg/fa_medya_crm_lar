<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

$email = 'admin@famedya.com';
$password = 'admin123';

$admin = Admin::where('email', $email)->first();
if (!$admin) {
    echo "Admin not found in DB.\n";
    exit;
}

if (Hash::check($password, $admin->password)) {
    echo "Password check: SUCCESS\n";
} else {
    echo "Password check: FAILED\n";
}

// Emulate login logic
try {
    $token = $admin->createToken('test-device', ['admin'])->plainTextToken;
    echo "Token creation: SUCCESS\n";
    echo "Token: $token\n";
} catch (\Exception $e) {
    echo "Token creation: FAILED - " . $e->getMessage() . "\n";
}
