<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\InventoryItem;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name' => 'Pork Belly (Sisig/Kawali)', 'category' => 'Meat', 'quantity' => 15.5, 'unit' => 'kg', 'low_stock_threshold' => 5],
            ['name' => 'Bangus', 'category' => 'Meat', 'quantity' => 8.0, 'unit' => 'kg', 'low_stock_threshold' => 3],
            ['name' => 'White Rice', 'category' => 'Produce', 'quantity' => 50.0, 'unit' => 'kg', 'low_stock_threshold' => 15],
            ['name' => 'Eggs', 'category' => 'Produce', 'quantity' => 120, 'unit' => 'pcs', 'low_stock_threshold' => 30],
            ['name' => 'Cooking Oil', 'category' => 'Pantry', 'quantity' => 4.5, 'unit' => 'L', 'low_stock_threshold' => 2],
            ['name' => 'Takeout Boxes', 'category' => 'Packaging', 'quantity' => 250, 'unit' => 'pcs', 'low_stock_threshold' => 50],
        ];

        foreach ($items as $item) {
            InventoryItem::create($item);
        }
    }
}
