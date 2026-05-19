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

// Public route (anyone can try to log in)
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (must be logged in via Sanctum to access these)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/active', [OrderController::class, 'activeOrders']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::patch('/tables/{id}/status', [TableController::class, 'updateStatus']);
    Route::get('/tables', [TableController::class, 'index']);
    Route::patch('/inventory/{id}/stock', [InventoryController::class, 'updateStock']);
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory', [InventoryController::class, 'store']);
    Route::post('/inventory/{id}', [InventoryController::class, 'updateItem']); // Update (Using POST for handling uploads cleanly)
    Route::patch('/inventory/{id}/stock', [InventoryController::class, 'update']);
    Route::delete('/inventory/{id}', [InventoryController::class, 'destroy']); // Delete
    Route::apiResource('employees', EmployeeController::class);
    Route::get('/analytics/summary', [ReportController::class, 'getAnalyticsSummary']);
    Route::get('/settings', [SettingController::class, 'index']);
    Route::post('/settings/bulk', [SettingController::class, 'updateBulk']);
    Route::get('/analytics/summary', [AnalyticsController::class, 'getDashboardStats']);
    Route::patch('/tables/{id}/reset', [\App\Http\Controllers\TableController::class, 'reset']);

    Route::post('/logout', function (\Illuminate\Http\Request $request) {
        // Revoke the current user's token
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Successfully logged out']);
    });

    // We will add the POS, Menu, and Inventory routes here later!
});
