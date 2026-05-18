<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'role',
        'status',
        'pin'
    ];

    // Protect sensitive data from being leaked in global network payloads
    protected $hidden = [
        'pin'
    ];
}
