<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class OrderController extends Controller
{
    // --- 1. POS Checkout: Create Order ---
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cart' => 'required|array|min:1',
            'cart.*.id' => 'required|exists:products,id',
            'cart.*.quantity' => 'required|integer|min:1',
            'order_type' => 'required|in:Dine In,Take Away,Delivery',
            'payment_method' => 'required|in:Cash,Card,QR Code',
            'table_number' => 'nullable|string',
            'customer_name' => 'nullable|string',
        ]);

        try {
            $orderItemsData = [];

            $result = DB::transaction(function () use ($validated, $request, &$orderItemsData) {
                $subTotal = 0;

                foreach ($validated['cart'] as $item) {
                    $product = Product::find($item['id']);
                    $itemTotal = $product->price * $item['quantity'];
                    $subTotal += $itemTotal;

                    $orderItemsData[] = [
                        'product_id' => $product->id,
                        'name' => $product->name,
                        'quantity' => $item['quantity'],
                        'price' => $product->price,
                        'sub_total' => $itemTotal,
                    ];
                }

                // FETCH DYNAMIC TAX RATE FROM DATABASE
                $taxSetting = \App\Models\Setting::where('key', 'tax_rate')->first();
                // If found, divide by 100 (e.g., 5 becomes 0.05). If missing, default to 0.
                $taxPercentage = $taxSetting ? (floatval($taxSetting->value) / 100) : 0;

                $tax = $subTotal * $taxPercentage;
                $totalAmount = $subTotal + $tax;

                $order = Order::create([
                    'user_id' => ($request->user() && method_exists($request->user(), 'getMorphClass') && $request->user()->getMorphClass() === 'App\Models\Employee') ? 1 : ($request->user()->id ?? 1),
                    'table_number' => $validated['table_number'] ?? 'Table 1',
                    'customer_name' => $validated['customer_name'] ?? 'Walk-in',
                    'order_type' => $validated['order_type'],
                    'sub_total' => $subTotal,
                    'tax' => $tax,
                    'total_amount' => $totalAmount,
                    'payment_method' => $validated['payment_method'],
                    'status' => 'Pending',
                ]);

                $table = \App\Models\Table::where('name', $validated['table_number'])->first();
                if ($table && $table->status === 'Available') {
                    $table->update(['status' => 'Waiting']);
                }

                foreach ($orderItemsData as $data) {
                    $data['order_id'] = $order->id;
                    OrderItem::create($data);

                    // THE AUTO-DEDUCTION ENGINE
                    $recipes = \App\Models\Recipe::where('product_id', $data['product_id'])->get();
                    foreach ($recipes as $recipe) {
                        $inventoryItem = \App\Models\InventoryItem::find($recipe->inventory_item_id);
                        if ($inventoryItem) {
                            $totalDeduction = $recipe->quantity_required * $data['quantity'];
                            $inventoryItem->quantity = max(0, $inventoryItem->quantity - $totalDeduction);
                            $inventoryItem->save();
                        }
                    }
                }

                return [
                    'order' => $order,
                    'items' => $orderItemsData
                ];
            });

            $order = $result['order'];

            // Trigger n8n webhooks
            Http::post('http://127.0.0.1:5678/webhook/8cdb04f2-6067-47e9-b8af-ffe8d453e192', [ //Group Workflow
                'order_id' => $order->id,
                'customer' => $order->customer_name,
                'sub_total' => number_format($order->sub_total, 2, '.', ''),
                'tax' => number_format($order->tax, 2, '.', ''),
                'total' => number_format($order->total_amount, 2, '.', ''),
                'payment_method' => $order->payment_method,
                'status' => $order->status,
                'items' => $orderItemsData
            ]);

            Http::post('http://localhost:5678/webhook/41a22261-8226-4aee-ad3a-16384c3d1e83', [ // Basinillo Individual Workflow
                'order_id' => $order->id,
                'customer' => $order->customer_name,
                'sub_total' => number_format($order->sub_total, 2, '.', ''),
                'tax' => number_format($order->tax, 2, '.', ''),
                'total' => number_format($order->total_amount, 2, '.', ''),
                'payment_method' => $order->payment_method,
                'status' => $order->status,
                'items' => $orderItemsData,
                'date' => now()->format('F d, Y h:i A')
            ]);

            return response()->json([
                'message' => 'Payment Success!',
                'order_id' => str_pad($order->id, 8, '0', STR_PAD_LEFT)
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Order failed to process.', 'error' => $e->getMessage()], 500);
        }
    }

    // --- 2. KDS: Fetch Live Orders for Kitchen ---
    public function activeOrders()
    {
        $orders = Order::with('items.product')
            ->whereIn('status', ['Pending', 'Preparing', 'Ready'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($order) {
                $cart = $order->items->map(function ($item) {
                    return [
                        'id' => $item->product_id,
                        'name' => $item->product ? $item->product->name : 'Unknown Item',
                        'quantity' => $item->quantity,
                    ];
                });

                return [
                    'id' => $order->id,
                    'table_number' => $order->table_number,
                    'customer_name' => $order->customer_name,
                    'order_type' => $order->order_type,
                    'status' => $order->status,
                    'cart' => $cart,
                    'created_at' => $order->created_at,
                ];
            });

        return response()->json($orders);
    }

    // --- 3. KDS: Update Order Status ---
    public function updateStatus(Request $request, int $id)
    {
        $request->validate([
            'status' => 'required|string|in:Pending,Preparing,Ready,Served,Completed'
        ]);

        $order = Order::findOrFail($id);
        $order->status = $request->status;
        $order->save();

        if ($order->order_type === 'Dine In' && $order->table_number && $order->table_number !== 'Walk-in') {
            $table = \App\Models\Table::where('name', $order->table_number)->first();

            if ($table) {
                switch ($request->status) {
                    case 'Preparing':
                        $table->update(['status' => 'Cooking']);
                        break;
                    case 'Ready':
                        $table->update(['status' => 'Food Ready']);
                        break;
                    case 'Served':
                        $table->update(['status' => 'Dining']);
                        break;
                    case 'Completed':
                        $table->update(['status' => 'Available']);
                        break;
                }
            }
        }

        return response()->json(['message' => 'Order and Table statuses synced successfully.']);
    }

    // --- 4. HISTORY: Fetch Recent Orders for Cashier ---
    public function history()
    {
        $orders = Order::with('items.product')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($order) {
                $cart = $order->items->map(function ($item) {
                    return [
                        'id' => $item->product_id,
                        'name' => $item->product ? $item->product->name : 'Unknown Item',
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                    ];
                });

                return [
                    'id' => $order->id,
                    'table_number' => $order->table_number,
                    'customer_name' => $order->customer_name,
                    'order_type' => $order->order_type,
                    'payment_method' => $order->payment_method,
                    'sub_total' => $order->sub_total,
                    'tax' => $order->tax,
                    'total_amount' => $order->total_amount,
                    'status' => $order->status,
                    'created_at' => $order->created_at,
                    'cart' => $cart,
                    'cashierName' => 'Terminal Operator'
                ];
            });

        return response()->json($orders);
    }

    // --- 5. REFUND: Cancel Order & Restore Inventory ---
    public function refund(int $id)
    {
        $order = Order::with('items')->findOrFail($id);

        if ($order->status === 'Cancelled') {
            return response()->json(['message' => 'This order is already cancelled.'], 400);
        }

        foreach ($order->items as $item) {
            $recipes = \App\Models\Recipe::where('product_id', $item->product_id)->get();
            foreach ($recipes as $recipe) {
                $inventoryItem = \App\Models\InventoryItem::find($recipe->inventory_item_id);
                if ($inventoryItem) {
                    $amountToRestore = $recipe->quantity_required * $item->quantity;
                    $inventoryItem->quantity += $amountToRestore;
                    $inventoryItem->save();
                }
            }
        }

        $order->status = 'Cancelled';
        $order->save();

        if ($order->order_type === 'Dine In' && $order->table_number !== 'Walk-in') {
            $table = \App\Models\Table::where('name', $order->table_number)->first();
            if ($table) {
                $table->update(['status' => 'Available']);
            }
        }

        return response()->json(['message' => 'Order refunded and inventory restored.']);
    }
}
