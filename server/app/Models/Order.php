<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'table_number',
        'customer_name',
        'order_type',
        'sub_total',
        'tax',
        'total_amount',
        'payment_method',
        'status'
    ];

    /**
     * Get the items associated with the order.
     */
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
