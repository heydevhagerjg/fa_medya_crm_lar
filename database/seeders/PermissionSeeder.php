<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Jobs
            'jobs.view', 'jobs.view_all', 'jobs.create', 'jobs.edit', 'jobs.delete',
            // Customers
            'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
            // Payments
            'payments.view', 'payments.view_all', 'payments.create', 'payments.edit', 'payments.delete',
            // Expenses
            'expenses.view', 'expenses.view_all', 'expenses.create', 'expenses.edit', 'expenses.delete',
            // Appointments
            'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.delete',
            // Settings
            'settings.view', 'settings.manage',
            // Users
            'users.view', 'users.manage',
            // Logs
            'logs.view',
            // Files
            'files.view', 'files.view_all', 'files.upload', 'files.rename', 'files.delete',
            // Chat
            'chat.create', 'chat.delete',
        ];

        foreach ($permissions as $permission) {
            \Spatie\Permission\Models\Permission::findOrCreate($permission, 'web');
        }
    }
}
