<?php

use Illuminate\Support\Facades\Route;

// All web routes return the SPA view
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
