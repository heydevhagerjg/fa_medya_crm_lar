<?php

/**
 * Laravel PHP Built-in Server Router
 * Kullanım: php -S 0.0.0.0:8000 router.php -t public
 * VEYA:     php artisan serve
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Serve static files directly
if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri)) {
    return false;
}

// Route everything to Laravel's index.php
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/public/index.php';
$_SERVER['SCRIPT_NAME']     = '/index.php';

require __DIR__ . '/public/index.php';
