<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable; // <-- 1. Must extend Authenticatable
use Laravel\Sanctum\HasApiTokens; // <-- 2. Import the Sanctum trait

class Employee extends Authenticatable // <-- 3. Change 'Model' to 'Authenticatable'
{
    use HasApiTokens, HasFactory; // <-- 4. Add HasApiTokens right here

    protected $fillable = [
        'name',
        'email',
        'phone',
        'role',
        'status',
        'pin'
    ];

    // Hide the PIN from API responses for security
    protected $hidden = [
        'pin',
    ];
}
