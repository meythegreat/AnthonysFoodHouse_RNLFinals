<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function getDashboardStats(Request $request)
    {
        // 1. Handle Timeframe Filter (Default to 7 days if not provided)
        $days = $request->query('days', 7);
        $startDate = Carbon::now()->subDays($days)->startOfDay();

        // --- SECTION A: SUMMARY METRICS ---
        $summary = [
            'total_sales' => Order::where('created_at', '>=', $startDate)
                                  ->where('status', '!=', 'Cancelled')
                                  ->sum('total_amount'),

            'total_orders' => Order::where('created_at', '>=', $startDate)
                                   ->where('status', '!=', 'Cancelled')
                                   ->count(),
        ];

        // Calculate AOV safely to avoid division by zero
        $summary['average_order_value'] = $summary['total_orders'] > 0
            ? $summary['total_sales'] / $summary['total_orders']
            : 0;


        // --- SECTION B: TIMELINE (Line/Area Chart Data) ---
        // Group revenue and order counts by individual day
        $timeline = Order::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('COUNT(id) as order_count')
            )
            ->where('created_at', '>=', $startDate)
            ->where('status', '!=', 'Cancelled')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'asc')
            ->get();


        // --- SECTION C: ORDER DISTRIBUTION (Bar Chart Data) ---
        $order_distribution = Order::select('order_type', DB::raw('count(*) as count'))
            ->where('created_at', '>=', $startDate)
            ->where('status', '!=', 'Cancelled')
            ->groupBy('order_type')
            ->get();


        // --- SECTION D: TOP PRODUCTS RANKING (Table Data) ---
        $top_products = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.created_at', '>=', $startDate)
            ->where('orders.status', '!=', 'Cancelled')
            ->select(
                'products.name',
                'products.category',
                DB::raw('SUM(order_items.quantity) as total_units_sold'),
                DB::raw('SUM(order_items.sub_total) as total_revenue')
            )
            ->groupBy('products.name', 'products.category', 'products.id')
            ->orderByDesc('total_units_sold')
            ->limit(5)
            ->get();

        // Return the exact JSON structure the React app expects
        return response()->json([
            'summary' => $summary,
            'timeline' => $timeline,
            'order_distribution' => $order_distribution,
            'top_products' => $top_products
        ]);
    }
}
