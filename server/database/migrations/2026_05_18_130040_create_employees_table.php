<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->enum('role', ['Admin', 'Cashier', 'Kitchen Staff'])->default('Cashier');
            $table->enum('status', ['Active', 'Inactive', 'On Break'])->default('Active');
            $table->string('pin', 4)->nullable(); // 4-digit terminal access key
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
