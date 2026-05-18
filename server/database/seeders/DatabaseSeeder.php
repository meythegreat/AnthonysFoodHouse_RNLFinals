<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create your Manager account automatically so you don't need Tinker anymore!
        User::factory()->create([
            'name' => 'Miguel Basinillo',
            'email' => 'miguel@test.com',
            'password' => bcrypt('password123'),
            'role' => 'Manager'
        ]);

        // 2. Call your specific seeders
        $this->call([
            ProductSeeder::class,
            TableSeeder::class,
            InventorySeeder::class,
        ]);
    }
}
