<?php

namespace App\Http\Controllers;

use App\Models\DiningTable;
use Illuminate\Http\Request;

class DiningTableController extends Controller
{
    public function index()
    {
        // Fetch all tables, ordering them logically
        $tables = DiningTable::orderBy('name', 'asc')->get();
        return response()->json($tables);
    }
}
