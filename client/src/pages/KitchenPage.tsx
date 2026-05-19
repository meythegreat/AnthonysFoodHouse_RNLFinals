import { useEffect, useState } from 'react';
import axios from '../services/axiosConfig';
import MainLayout from '../layouts/MainLayout';
import { useToast } from '../context/ToastContext';
import { ChefHat, Clock, CheckCircle, Utensils, Flame } from 'lucide-react';

type OrderItem = { id: number; name: string; quantity: number };
type Order = {
  id: number;
  table_number: string;
  customer_name: string;
  order_type: string;
  status: 'Pending' | 'Preparing' | 'Ready';
  cart: OrderItem[];
  created_at: string;
};

export default function KitchenPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Poll for new orders every 5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get<Order[]>('/api/orders/active');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to sync kitchen display.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (id: number, newStatus: string) => {
    // Optimistic UI Update for instant feedback
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
    try {
      await axios.patch(`/api/orders/${id}/status`, { status: newStatus });
      if (newStatus === 'Ready') showToast(`Order #${id} marked as Ready for pickup!`, 'success');
    } catch (error) {
      showToast('Failed to update ticket status.', 'error');
      fetchOrders(); // Revert on failure
    }
  };

  // Helper to calculate minutes waiting
  const getMinutesWaiting = (createdAt: string) => {
    const diff = new Date().getTime() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const preparingOrders = orders.filter(o => o.status === 'Preparing');
  const readyOrders = orders.filter(o => o.status === 'Ready');

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-900 text-gray-100">
        
        {/* Mobile-Responsive Header */}
        <div className="bg-gray-950 p-4 md:px-8 md:py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 border-b border-gray-800 shrink-0 shadow-md">
           <div className="flex items-center gap-3 md:gap-4">
             <div className="bg-orange-500/20 p-2 md:p-3 rounded-xl text-orange-500"><ChefHat className="w-6 h-6 md:w-8 md:h-8" /></div>
             <div>
               <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Kitchen Display</h1>
               <p className="text-xs md:text-sm text-gray-400 font-medium">Live Ticket Queue</p>
             </div>
           </div>
           
           <div className="flex gap-2 md:gap-4 text-xs md:text-sm font-bold w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              <span className="bg-red-500/10 text-red-400 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-red-500/20 whitespace-nowrap">
                {pendingOrders.length} Pending
              </span>
              <span className="bg-orange-500/10 text-orange-400 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-orange-500/20 whitespace-nowrap">
                {preparingOrders.length} Cooking
              </span>
           </div>
        </div>

        {/* Swipeable Kanban Board for Mobile */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-6 snap-x snap-mandatory scrollbar-hide">
          <div className="flex gap-4 md:gap-6 h-full">
            
            {/* COLUMN 1: PENDING */}
            <div className="w-[85vw] sm:w-[320px] lg:w-auto lg:flex-1 shrink-0 flex flex-col bg-gray-800/30 rounded-3xl border border-gray-800 overflow-hidden snap-center">
              <div className="bg-red-500/10 border-b border-red-500/20 p-3 md:p-4 flex justify-between items-center shrink-0">
                <h2 className="font-black text-red-400 uppercase tracking-widest flex items-center gap-2 text-sm md:text-base"><Clock className="w-4 h-4 md:w-5 md:h-5" /> New Tickets</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
                {pendingOrders.map(order => (
                  <TicketCard key={order.id} order={order} getMinutesWaiting={getMinutesWaiting} onAction={() => updateOrderStatus(order.id, 'Preparing')} actionText="Start Cooking" actionColor="bg-orange-600 hover:bg-orange-500" />
                ))}
              </div>
            </div>

            {/* COLUMN 2: PREPARING */}
            <div className="w-[85vw] sm:w-[320px] lg:w-auto lg:flex-1 shrink-0 flex flex-col bg-gray-800/30 rounded-3xl border border-gray-800 overflow-hidden snap-center">
              <div className="bg-orange-500/10 border-b border-orange-500/20 p-3 md:p-4 flex justify-between items-center shrink-0">
                <h2 className="font-black text-orange-400 uppercase tracking-widest flex items-center gap-2 text-sm md:text-base"><Flame className="w-4 h-4 md:w-5 md:h-5" /> Cooking Now</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
                {preparingOrders.map(order => (
                  <TicketCard key={order.id} order={order} getMinutesWaiting={getMinutesWaiting} onAction={() => updateOrderStatus(order.id, 'Ready')} actionText="Mark as Ready" actionColor="bg-green-600 hover:bg-green-500" />
                ))}
              </div>
            </div>

            {/* COLUMN 3: READY */}
            <div className="w-[85vw] sm:w-[320px] lg:w-auto lg:flex-1 shrink-0 flex flex-col bg-gray-800/30 rounded-3xl border border-gray-800 overflow-hidden snap-center">
              <div className="bg-green-500/10 border-b border-green-500/20 p-3 md:p-4 flex justify-between items-center shrink-0">
                <h2 className="font-black text-green-400 uppercase tracking-widest flex items-center gap-2 text-sm md:text-base"><CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> Ready to Serve</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
                {readyOrders.map(order => (
                  <div key={order.id} className="bg-gray-800 border-2 border-green-500/30 p-4 rounded-2xl opacity-75">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-black text-lg md:text-xl text-white">#{order.id} - {order.table_number}</h3>
                        <p className="text-xs md:text-sm text-gray-400">{order.order_type}</p>
                      </div>
                    </div>
                    <button onClick={() => updateOrderStatus(order.id, 'Served')} className="w-full py-3 rounded-xl font-bold text-xs md:text-sm bg-gray-700 hover:bg-gray-600 text-white transition-colors border border-gray-600">
                      Clear Ticket
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Sub-component for the individual Order Tickets (Also mobile scaled)
function TicketCard({ order, getMinutesWaiting, onAction, actionText, actionColor }: any) {
  const waitTime = getMinutesWaiting(order.created_at);
  const isUrgent = waitTime > 15;

  return (
    <div className={`bg-gray-800 p-4 md:p-5 rounded-2xl shadow-lg border-l-4 ${isUrgent ? 'border-red-500' : 'border-gray-600'}`}>
      <div className="flex justify-between items-start mb-3 md:mb-4 border-b border-gray-700 pb-3">
        <div>
          <h3 className="font-black text-xl md:text-2xl text-white">#{order.id}</h3>
          <p className="font-bold text-gray-300 mt-1 text-sm md:text-base">{order.table_number} <span className="text-gray-500 font-normal hidden sm:inline">({order.customer_name})</span></p>
        </div>
        <div className="text-right">
          <span className={`text-xs md:text-sm font-black px-2 py-1 rounded-md ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300'}`}>
            {waitTime} min
          </span>
          <p className="text-[10px] md:text-xs text-gray-400 mt-2 font-bold uppercase">{order.order_type}</p>
        </div>
      </div>
      
      <div className="space-y-2 md:space-y-3 mb-5 md:mb-6">
        {order.cart.map((item: any, idx: number) => (
          <div key={idx} className="flex gap-2 md:gap-3 text-base md:text-lg">
            <span className="font-black text-gray-400">{item.quantity}x</span>
            <span className="font-bold text-white leading-tight">{item.name}</span>
          </div>
        ))}
      </div>

      <button onClick={onAction} className={`w-full py-3 md:py-4 rounded-xl font-black text-xs md:text-sm text-white uppercase tracking-widest transition-all shadow-md active:scale-95 ${actionColor}`}>
        {actionText}
      </button>
    </div>
  );
}