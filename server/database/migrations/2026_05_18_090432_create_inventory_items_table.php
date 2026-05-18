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
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category'); // e.g., Meat, Produce, Beverages, Packaging
            $table->decimal('quantity', 8, 2); // e.g., 50.5 (kgs)
            $table->string('unit'); // e.g., kg, pcs, packs
            $table->decimal('low_stock_threshold', 8, 2)->default(10); // When to turn the UI yellow/red
            $table->timestamps();
            $table->string('image_path')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
