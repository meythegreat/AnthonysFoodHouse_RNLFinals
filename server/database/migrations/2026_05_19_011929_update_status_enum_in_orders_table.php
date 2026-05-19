<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Expand the ENUM to include all our new automated restaurant states
        DB::statement("ALTER TABLE tables MODIFY COLUMN status ENUM('Available', 'Waiting', 'Cooking', 'Food Ready', 'Dining', 'Reserved', 'Occupied') DEFAULT 'Available'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe fallback
        DB::statement("ALTER TABLE tables MODIFY COLUMN status ENUM('Available', 'Occupied', 'Reserved') DEFAULT 'Available'");
    }
};
