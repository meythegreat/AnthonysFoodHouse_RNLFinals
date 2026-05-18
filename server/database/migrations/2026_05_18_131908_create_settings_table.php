<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary(); // Unique identifier (e.g., 'store_name')
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed default foundational configurations so the app doesn't start empty
        DB::table('settings')->insert([
            ['key' => 'store_name', 'value' => "Anthony's Food House", 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'store_phone', 'value' => '09123456789', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'store_address', 'value' => 'Roxas City, Capiz', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'tax_rate', 'value' => '5.00', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'receipt_footer', 'value' => 'Thank you for dining with us!', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
