import { useEffect, useState } from 'react';
import axios from '../services/axiosConfig';
import MainLayout from '../layouts/MainLayout';
import { useToast } from '../context/ToastContext';
import { Receipt, RotateCcw, Search, XCircle, Clock, Printer } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';

type OrderItem = { id: number; name: string; quantity: number; price: number };
type Order = {
  id: number;
  table_number: string;
  customer_name: string;
  order_type: string;
  payment_method: string;
  sub_total: number;
  tax: number;
  total_amount: number;
  status: string;
  created_at: string;
  cart: OrderItem[];
  cashierName: string;
};

export default function OrderHistoryPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReprintOrder, setSelectedReprintOrder] = useState<Order | null>(null);
  
  // NEW: State to hold the actual store identity settings
  const [storeSettings, setStoreSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchHistory();
    fetchSettings(); // Fetch settings when the page loads
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get<Order[]>('/api/orders/history');
      setOrders(response.data);
    } catch (error) {
      showToast('Failed to fetch order history.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Fetch the settings from your backend
  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings'); 
      if (Array.isArray(response.data)) {
        const settingsObj: Record<string, string> = {};
        response.data.forEach((setting: any) => {
          settingsObj[setting.key] = setting.value;
        });
        setStoreSettings(settingsObj);
      } else {
        setStoreSettings(response.data || {});
      }
    } catch (error) {
      console.error('Failed to fetch store settings', error);
    }
  };

  const handleRefund = async (orderId: number) => {
    if (!window.confirm(`Are you sure you want to refund Order #${orderId}? This will cancel the ticket and return items to inventory.`)) {
      return;
    }

    try {
      await axios.post(`/api/orders/${orderId}/refund`);
      showToast(`Order #${orderId} has been successfully refunded.`, 'success');
      fetchHistory(); // Refresh the list to show the 'Cancelled' status
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to process refund.', 'error');
    }
  };

  const handleReprint = (order: Order) => {
    setSelectedReprintOrder(order);
  };

  const filteredOrders = orders.filter(o => 
    o.id.toString().includes(searchTerm) || 
    o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.table_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50">
        
        {/* Header Section */}
        <div className="bg-white p-6 border-b border-gray-200 shadow-xs z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Receipt className="w-7 h-7 text-blue-600" /> Order History & Refunds
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Review recent transactions and process cancellations.</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search ID, Guest, or Table..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm font-semibold transition-all outline-hidden"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-400 font-bold py-10">Loading history logs...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center text-gray-400 font-bold py-10">No orders found matching your search.</div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className={`bg-white rounded-2xl p-5 border shadow-xs transition-all ${order.status === 'Cancelled' ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:border-blue-300'}`}>
                
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  {/* Left Column: Order Meta */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-black text-gray-900">Order #{order.id}</span>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        order.status === 'Completed' || order.status === 'Served' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{order.order_type}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-600 mb-1">
                      {order.table_number} • <span className="text-gray-400 font-medium">Guest:</span> {order.customer_name}
                    </p>
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Middle Column: Items */}
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Cart Summary</p>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-2 scrollbar-hide">
                      {order.cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="font-bold text-gray-700">{item.quantity}x {item.name}</span>
                          <span className="text-gray-500">₱{(Number(item.price) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Financials & Actions */}
                  <div className="flex-1 flex flex-col justify-between items-end min-w-37.5">
                    <div className="text-right mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase">Total Paid ({order.payment_method})</p>
                      <p className="text-2xl font-black text-gray-900 leading-tight">₱{Number(order.total_amount).toFixed(2)}</p>
                    </div>
                    
                    {/* ACTION BUTTONS GROUP */}
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => handleReprint(order)}
                        className="flex items-center justify-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 font-bold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 shadow-sm"
                      >
                        <Printer className="w-4 h-4" /> Reprint Receipt
                      </button>

                      {order.status !== 'Cancelled' ? (
                        <button 
                          onClick={() => handleRefund(order.id)}
                          className="flex items-center justify-center gap-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 shadow-sm"
                        >
                          <RotateCcw className="w-4 h-4" /> Issue Refund
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-red-500 font-bold text-xs bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                          <XCircle className="w-4 h-4" /> Refunded
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Render the unified Receipt Modal with REAL store settings */}
      <ReceiptModal 
        isOpen={!!selectedReprintOrder}
        onClose={() => setSelectedReprintOrder(null)}
        isReprint={true}
        storeSettings={storeSettings} 
        orderData={selectedReprintOrder ? {
          orderId: selectedReprintOrder.id,
          date: new Date(selectedReprintOrder.created_at).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }),
          cart: selectedReprintOrder.cart,
          subTotal: selectedReprintOrder.sub_total,
          tax: selectedReprintOrder.tax,
          total: selectedReprintOrder.total_amount,
          taxRate: 0.05,
          orderType: selectedReprintOrder.order_type,
          paymentMethod: selectedReprintOrder.payment_method,
          tableNumber: selectedReprintOrder.table_number,
          guestName: selectedReprintOrder.customer_name,
          cashierName: selectedReprintOrder.cashierName
        } : null}
      />
    </MainLayout>
  );
}