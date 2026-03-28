<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->boolean('chat_feature')->default(false)->after('api_key_feature');
            $table->integer('chat_limit')->default(5)->after('chat_feature');
            $table->integer('group_chat_limit')->default(2)->after('chat_limit');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->boolean('plan_chat_feature')->default(false)->after('plan_api_key_feature');
            $table->integer('plan_chat_limit')->default(5)->after('plan_chat_feature');
            $table->integer('plan_group_chat_limit')->default(2)->after('plan_chat_limit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn(['chat_feature', 'chat_limit', 'group_chat_limit']);
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['plan_chat_feature', 'plan_chat_limit', 'plan_group_chat_limit']);
        });
    }
};
