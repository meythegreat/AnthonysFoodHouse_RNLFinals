<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $fillable = ['name', 'category', 'quantity', 'unit', 'low_stock_threshold', 'image_path'];
}
