<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('backup:run')->dailyAt('03:00');
Schedule::command('trash:cleanup')->daily();

// Clean up orphaned backup temp files and failed backups older than 7 days
Schedule::command('backup:cleanup-temp --older-than=7')->dailyAt('04:00');
