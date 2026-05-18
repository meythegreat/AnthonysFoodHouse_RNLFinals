<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    // 1. Fetch All Configuration Matrix Options
    public function index()
    {
        // Returns settings as a clean key => value object dictionary
        return response()->json(Setting::pluck('value', 'key'));
    }

    // 2. Bulk Sync Updates
    public function updateBulk(Request $request)
    {
        $settings = $request->validate([
            'store_name' => 'required|string|max:255',
            'store_phone' => 'nullable|string|max:50',
            'store_address' => 'nullable|string|max:500',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'receipt_footer' => 'nullable|string|max:255',
        ]);

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json([
            'message' => 'System settings updated and synced successfully!'
        ]);
    }
}
