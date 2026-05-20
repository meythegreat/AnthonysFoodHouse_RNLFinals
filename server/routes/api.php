<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\AnalyticsController;

// ==========================================
// 1. PUBLIC ROUTES (No Login Required)
// ==========================================

Route::post('/login', [AuthController::class, 'login']);

// Moved outside the middleware so Flutter can grab it on boot!
Route::get('/tax-rate', function () {
    $taxSetting = \App\Models\Setting::where('key', 'tax_rate')->first();
    // Convert 1% to 0.01 for Flutter. Default to 0 if not found.
    $taxPercentage = $taxSetting ? (floatval($taxSetting->value) / 100) : 0;

    return response()->json(['tax_rate' => $taxPercentage]);
});

// ==========================================
// 2. PROTECTED ROUTES (Sanctum Login Required)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);

    // POS & Waiter App Orders
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/active', [OrderController::class, 'activeOrders']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::get('/orders/history', [OrderController::class, 'history']);
    Route::post('/orders/{id}/refund', [OrderController::class, 'refund']);

    // Products & Tables
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/tables', [TableController::class, 'index']);
    Route::patch('/tables/{id}/status', [TableController::class, 'updateStatus']);
    Route::patch('/tables/{id}/reset', [TableController::class, 'reset']);

    // Inventory Management
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory', [InventoryController::class, 'store']);
    Route::post('/inventory/{id}', [InventoryController::class, 'updateItem']);
    Route::patch('/inventory/{id}/stock', [InventoryController::class, 'update']);
    Route::delete('/inventory/{id}', [InventoryController::class, 'destroy']);

    // Admin, Analytics & Settings
    Route::apiResource('employees', EmployeeController::class);
    Route::get('/analytics/summary', [AnalyticsController::class, 'getDashboardStats']);
    Route::get('/settings', [SettingController::class, 'index']);
    Route::post('/settings/bulk', [SettingController::class, 'updateBulk']);

    // Logout
    Route::post('/logout', function (\Illuminate\Http\Request $request) {
        // Revoke the current user's token
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Successfully logged out']);
    });
});
