<?php

namespace App\Http\Controllers;

use App\Models\Table;
use Illuminate\Http\Request;

class TableController extends Controller
{
    // Fetches all tables
    public function index()
    {
        return response()->json(Table::all());
    }

    // NEW: Updates a specific table's status
    public function updateStatus(Request $request, string $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:Available,Waiting,Done'
        ]);

        // Find the table row or throw a graceful 404 response framework
        $table = Table::findOrFail($id);

        // Overwrite status metric
        $table->update([
            'status' => $validated['status']
        ]);

        return response()->json([
            'message' => 'Table status updated successfully!',
            'table' => $table
        ]);
    }
}
