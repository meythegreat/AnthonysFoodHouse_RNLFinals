<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function getAnalyticsSummary(Request $request)
    {
        // Default timeframe filter configuration to a rolling 7-day scale if not specified
        $days = $request->query('days', 7);
        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();

        // 1. Core Financial Performance Metrics Aggregation
        $financials = DB::table('orders')
            ->select(
                DB::raw('COUNT(id) as total_orders'),
                DB::raw('SUM(CASE WHEN status != "Cancelled" THEN total_amount ELSE 0 END) as total_sales'),
                DB::raw('AVG(CASE WHEN status != "Cancelled" THEN total_amount ELSE 0 END) as average_order_value')
            )
            ->where('created_at', '>=', $startDate)
            ->first();

        // 2. High-Visibility Volume Charts Timeline Mapping
        $salesTimeline = DB::table('orders')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('COUNT(id) as order_count')
            )
            ->where('created_at', '>=', $startDate)
            ->where('status', '!=', 'Cancelled')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'ASC')
            ->get();

        // 3. Top 5 Best Selling Menu Items Aggregations (Joins orders with your pivot items)
        $topProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->select(
                'products.name',
                'products.category',
                DB::raw('SUM(order_items.quantity) as total_units_sold'),
                DB::raw('SUM(order_items.quantity * order_items.price) as total_revenue')
            )
            ->where('orders.created_at', '>=', $startDate)
            ->where('orders.status', '!=', 'Cancelled')
            ->groupBy('products.id', 'products.name', 'products.category')
            ->orderBy('total_units_sold', 'DESC')
            ->limit(5)
            ->get();

        // 4. Distribution Metrics Across Fulfillment Streams
        $orderTypes = DB::table('orders')
            ->select('order_type', DB::raw('COUNT(id) as count'))
            ->where('created_at', '>=', $startDate)
            ->groupBy('order_type')
            ->get();

        return response()->json([
            'summary' => [
                'total_sales' => round($financials->total_sales ?? 0, 2),
                'total_orders' => (int)($financials->total_orders ?? 0),
                'average_order_value' => round($financials->average_order_value ?? 0, 2),
            ],
            'timeline' => $salesTimeline,
            'top_products' => $topProducts,
            'order_distribution' => $orderTypes
        ]);
    }
}
