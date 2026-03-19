<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Admin>
 */
class AdminFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fakerAvailable = function_exists('fake') && @fake();

        return [
            'id' => (string) Str::uuid(),
            'name' => $fakerAvailable ? fake()->name() : 'Admin User',
            'email' => $fakerAvailable ? fake()->unique()->safeEmail() : 'admin'.Str::random(5).'@test.com',
            'password' => Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }
}
