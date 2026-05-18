<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    // Tell Laravel it's safe to insert data into these specific columns
    protected $fillable = [
        'name',
        'price',
        'category',
        'type',
        'image_path',
    ];
}
