<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    // Allow Laravel to mass-assign these columns
    protected $fillable = ['name', 'status'];
}
