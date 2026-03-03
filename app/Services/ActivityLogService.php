<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Str;

class ActivityLogService
{
    public static function log(
        User $user,
        string $action,
        string $entityType,
        string|int|null $entityId,
        string|null $entityName,
        string|null $details = null
    ): void {
        ActivityLog::create([
            'tenant_id'   => $user->tenant_id,
            'user_id'     => $user->id,
            'action'      => $action,
            'entity_type' => $entityType,
            'entity_id'   => $entityId ? (string) $entityId : null,
            'entity_name' => $entityName,
            'details'     => $details,
            'created_at'  => now(),
        ]);
    }
}
