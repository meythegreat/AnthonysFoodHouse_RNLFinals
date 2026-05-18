<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            // --- SIZZLING MENU ---
            ['name' => 'Pork Sisig', 'price' => 99.00, 'category' => 'Sizzling Menu', 'type' => 'Main', 'image_path' => 'products/pork-sisig.png'],
            ['name' => 'Bangus Sisig', 'price' => 99.00, 'category' => 'Sizzling Menu', 'type' => 'Main', 'image_path' => 'products/bangsisig.jpeg'],
            ['name' => 'Talaba Sisig', 'price' => 99.00, 'category' => 'Sizzling Menu', 'type' => 'Main', 'image_path' => 'products/talabasisig.jpeg'],
            ['name' => 'Scallops Sisig', 'price' => 89.00, 'category' => 'Sizzling Menu', 'type' => 'Main', 'image_path' => 'products/scallopsisig.jpeg'],
            ['name' => 'Lechon Kawali', 'price' => 149.00, 'category' => 'Sizzling Menu', 'type' => 'Main', 'image_path' => 'products/lechon-kawali.png'],
            ['name' => 'Burger Steak', 'price' => 139.00, 'category' => 'Sizzling Menu', 'type' => 'Main', 'image_path' => 'products/burger-steak.png'],
            ['name' => 'Chicken BBQ', 'price' => 129.00, 'category' => 'Sizzling Menu', 'type' => 'Main', 'image_path' => 'products/chicken-bbq.png'],
            ['name' => 'Shawarma Rice', 'price' => 109.00, 'category' => 'Sizzling Menu', 'type' => 'Main', 'image_path' => 'products/shawarma-rice.png'],
            ['name' => 'Dinakdakan', 'price' => 99.00, 'category' => 'Sizzling Menu', 'type' => 'Main', 'image_path' => 'products/dinakdakan.jpeg'],

            // --- SILOG MENU ---
            ['name' => 'Hotshot Silog', 'price' => 99.00, 'category' => 'Silog', 'type' => 'Main', 'image_path' => 'products/hotshotsilog.jpeg'],
            ['name' => 'Kawali Silog', 'price' => 149.00, 'category' => 'Silog', 'type' => 'Main', 'image_path' => 'products/kawalisilog.jpeg'],
            ['name' => 'Hungarian Silog', 'price' => 119.00, 'category' => 'Silog', 'type' => 'Main', 'image_path' => 'products/hungariansilog.jpeg'],
            ['name' => 'Bang Silog', 'price' => 89.00, 'category' => 'Silog', 'type' => 'Main', 'image_path' => 'products/bangsilog.jpeg'],
            ['name' => 'Tokwa\'t Baboy', 'price' => 89.00, 'category' => 'Silog', 'type' => 'Side', 'image_path' => 'products/tokwatbaboy.jpg'],

            // --- SOUP MENU ---
            ['name' => 'Beef Pares', 'price' => 89.00, 'category' => 'Soup', 'type' => 'Main', 'image_path' => 'products/beefpares.jpg'],
            ['name' => 'Pares Supreme', 'price' => 109.00, 'category' => 'Soup', 'type' => 'Main', 'image_path' => 'products/paressupreme.jpeg'],
            ['name' => 'Pares Mami', 'price' => 70.00, 'category' => 'Soup', 'type' => 'Main', 'image_path' => 'products/pares-mami.png'],
            ['name' => 'Pares Mami Overload', 'price' => 250.00, 'category' => 'Soup', 'type' => 'Main', 'image_path' => 'products/paresmamioverload.jpg'],
            ['name' => 'Bulalo Solo', 'price' => 99.00, 'category' => 'Soup', 'type' => 'Main', 'image_path' => 'products/bulalo.jpg'],
            ['name' => 'Bulalo Family', 'price' => 350.00, 'category' => 'Soup', 'type' => 'Sharing', 'image_path' => 'products/bulalooverload.jpeg'],

            // --- DRINKS MENU ---
            ['name' => 'Coke', 'price' => 20.00, 'category' => 'Drinks', 'type' => 'Beverage', 'image_path' => 'products/coke.jpg'],
            ['name' => 'Sprite', 'price' => 20.00, 'category' => 'Drinks', 'type' => 'Beverage', 'image_path' => 'products/sprite.jpeg'],
            ['name' => 'Mountain Dew', 'price' => 20.00, 'category' => 'Drinks', 'type' => 'Beverage', 'image_path' => 'products/mountaindew.webp'],
            ['name' => 'Royal', 'price' => 20.00, 'category' => 'Drinks', 'type' => 'Beverage', 'image_path' => 'products/royal.jpeg'],
            ['name' => 'Mineral Water', 'price' => 15.00, 'category' => 'Drinks', 'type' => 'Beverage', 'image_path' => 'products/mineralwater.webp'],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
