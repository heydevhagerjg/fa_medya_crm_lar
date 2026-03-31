<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->unsignedInteger('call_minutes_limit')->default(0)->after('group_chat_limit');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->unsignedInteger('plan_call_minutes_limit')->default(0)->after('plan_group_chat_limit');
        });

        Schema::table('chat_call_sessions', function (Blueprint $table) {
            $table->unsignedInteger('duration_seconds')->nullable()->after('ended_at');
        });
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn('call_minutes_limit');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('plan_call_minutes_limit');
        });

        Schema::table('chat_call_sessions', function (Blueprint $table) {
            $table->dropColumn('duration_seconds');
        });
    }
};
