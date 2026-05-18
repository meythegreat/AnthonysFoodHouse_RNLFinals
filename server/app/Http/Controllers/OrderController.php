<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validate the incoming React data
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
            // 2. Start the database transaction
            $order = DB::transaction(function () use ($validated, $request) {

                $subTotal = 0;
                $orderItemsData = [];

                // 3. Loop through cart, fetch REAL prices from DB, and calculate
                foreach ($validated['cart'] as $item) {
                    $product = Product::find($item['id']);
                    $itemTotal = $product->price * $item['quantity'];
                    $subTotal += $itemTotal;

                    $orderItemsData[] = [
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                        'price' => $product->price,
                        'sub_total' => $itemTotal,
                    ];
                }

                $tax = $subTotal * 0.05; // 5% tax
                $totalAmount = $subTotal + $tax;

                // 4. Create the main Order record
                $order = Order::create([
                    'user_id' => $request->user()->id, // The logged-in cashier
                    'table_number' => $validated['table_number'] ?? 'Table 1',
                    'customer_name' => $validated['customer_name'] ?? 'Walk-in',
                    'order_type' => $validated['order_type'],
                    'payment_method' => $validated['payment_method'],
                    'sub_total' => $subTotal,
                    'tax' => $tax,
                    'total_amount' => $totalAmount,
                    'status' => 'Completed',
                ]);

                $table = \App\Models\Table::where('name', $validated['table_number'])->first();
                if ($table && $table->status === 'Available') {
                    $table->update(['status' => 'Waiting']);
                }

                // 5. Attach the items to the order using the relationship ID
                foreach ($orderItemsData as $data) {
                    $data['order_id'] = $order->id;
                    OrderItem::create($data);
                }

                return $order;
            });

            return response()->json([
                'message' => 'Payment Success!',
                'order_id' => str_pad($order->id, 8, '0', STR_PAD_LEFT) // Formats as 00000012
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Order failed to process.', 'error' => $e->getMessage()], 500);
        }
    }
}
