<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class InventoryController extends Controller
{
    // 1. Read All Items
    public function index()
    {
        return response()->json(InventoryItem::all());
    }

    // FIX: Added the explicit 'string' primitive type constraint hint
    public function update(Request $request, string $id)
    {
        $request->validate(['quantity' => 'required|numeric']);
        $item = InventoryItem::findOrFail($id);
        $item->update(['quantity' => $request->quantity]);

        return response()->json(['message' => 'Stock adjusted successfully', 'item' => $item]);
    }

    // 3. Create New Item
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'quantity' => 'required|numeric|min:0',                 // Fixed = to :
            'unit' => 'required|string|max:50',
            'low_stock_threshold' => 'required|numeric|min:0',       // Fixed = to :
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('inventory', 'public');
            $validated['image_path'] = $path;
        }

        $item = InventoryItem::create($validated);

        return response()->json(['message' => 'Item added successfully', 'item' => $item], 201);
    }

    // 4. Update Full Item Details
    public function updateItem(Request $request, string $id)
    {
        $item = InventoryItem::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'quantity' => 'required|numeric|min:0',                 // Fixed = to :
            'unit' => 'required|string|max:50',
            'low_stock_threshold' => 'required|numeric|min:0',       // Fixed = to :
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        if ($request->hasFile('image')) {
            if ($item->image_path) {
                Storage::disk('public')->delete($item->image_path);
            }
            $path = $request->file('image')->store('inventory', 'public');
            $validated['image_path'] = $path;
        }

        $item->update($validated);

        return response()->json(['message' => 'Item updated successfully', 'item' => $item]);
    }

    // 5. Delete Item
    public function destroy(string $id)
    {
        $item = InventoryItem::findOrFail($id);

        if ($item->image_path) {
            Storage::disk('public')->delete($item->image_path);
        }

        $item->delete();

        return response()->json(['message' => 'Item deleted from inventory']);
    }
}
