import { useEffect, useState } from 'react';
import axios from '../services/axiosConfig';
import MainLayout from '../layouts/MainLayout';
import { useTable } from '../context/TableContext';
import { useToast } from '../context/ToastContext';

// --- Types ---
type Category = { id: number; name: string; itemCount: number; icon: string };
type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  type: string;
  image_path: string | null;
};
type CartItem = Product & { quantity: number };

const CATEGORIES: Category[] = [
  { id: 1, name: 'All', itemCount: 0, icon: '📋' },
  { id: 2, name: 'Sizzling Menu', itemCount: 0, icon: '🍳' },
  { id: 3, name: 'Silog', itemCount: 0, icon: '🍚' },
  { id: 4, name: 'Soup', itemCount: 0, icon: '🍲' },
  { id: 5, name: 'Drinks', itemCount: 0, icon: '🧋' },
];

export default function POSPage() {
  const { showToast } = useToast();
  const { selectedTable, guestName, setTableStatusByName, setIsTableModalOpen } = useTable();

  // --- Core POS States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // NEW: Dynamic Configuration Variable State
  const [liveTaxRate, setLiveTaxRate] = useState<number>(0.05); // Defaults safely to 5% if network drop occurs
  
  // --- Transaction Configuration States ---
  const [orderType, setOrderType] = useState<'Dine In' | 'Take Away' | 'Delivery'>('Dine In');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'QR Code'>('Cash');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // --- Dynamic Unified Data Fetch Engine ---
  useEffect(() => {
    const fetchPOSBlueprint = async () => {
      try {
        const [productsRes, settingsRes] = await Promise.all([
          axios.get<Product[]>('/api/products'),
          axios.get<Record<string, string>>('/api/settings') // <-- Fetches system settings object dictionary
        ]);
        
        setProducts(productsRes.data.map((p) => ({ ...p, price: Number(p.price) })));
        
        // Read the dynamic tax rate string, convert to a decimal float variable fraction
        if (settingsRes.data && settingsRes.data.tax_rate) {
          const parsedRate = parseFloat(settingsRes.data.tax_rate) / 100;
          setLiveTaxRate(parsedRate);
        }
      } catch (error) {
        showToast('Failed to sync POS configuration environment.', 'error');
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchPOSBlueprint();
  }, [showToast]);

  const filteredProducts = activeCategory === 'All' ? products : products.filter((p) => p.category === activeCategory);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) return { ...item, quantity: Math.max(0, item.quantity + delta) };
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  // --- Math Financial Pipeline Calculations ---
  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subTotal * liveTaxRate; // FIX: Multiplies dynamically by live settings parameter state
  const total = subTotal + tax;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return showToast('Your transactional cart is empty!', 'warning');
    setIsCheckingOut(true);
    try {
      await axios.get('/sanctum/csrf-cookie');
      await axios.post('/api/orders', {
        cart: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
        order_type: orderType,
        payment_method: paymentMethod,
        table_number: selectedTable,
        customer_name: guestName || 'Walk-in',
      });
      
      showToast(`Order logged successfully for ${selectedTable}!`, 'success');
      
      setTableStatusByName(selectedTable, 'Waiting');

      setCart([]);
      setIsMobileCartOpen(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to process checkout line.', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 flex h-full overflow-hidden relative">
        
        {/* Left Side Content - Product Interface Menu */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          
          {/* Top Search Action Bar */}
          <div className="bg-white/80 backdrop-blur-md p-4 md:px-8 md:py-5 flex items-center z-10 border-b border-gray-100 sticky top-0 shrink-0">
             <div className="relative w-full md:w-96">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
               <input 
                 type="text" 
                 placeholder="Search menu items..." 
                 className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-full bg-gray-50/50 outline-hidden focus:border-green-500 focus:bg-white text-sm font-medium"
               />
             </div>
          </div>

          {/* Primary Viewport Main Section */}
          <main className="flex-1 overflow-auto p-4 md:p-8 pb-28 md:pb-8">
            
            {/* Category Filter Cards Row */}
            <div className="flex gap-3 md:gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.name;
                const itemCount = cat.name === 'All' ? products.length : products.filter((p) => p.category === cat.name).length;
                return (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`relative px-5 py-4 rounded-2xl flex flex-col items-start min-w-[120px] md:min-w-[130px] transition-all shrink-0 border ${
                      isActive 
                        ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/30 transform -translate-y-1' 
                        : 'bg-white border-gray-100 text-gray-600 hover:border-green-200 hover:bg-green-50/50 hover:-translate-y-0.5'
                    }`}
                  >
                    <span className="text-2xl mb-3 bg-white/20 p-2 rounded-xl backdrop-blur-sm">{cat.icon}</span>
                    <span className="font-bold text-sm md:text-base tracking-wide">{cat.name}</span>
                    <span className={`text-xs mt-1 font-medium ${isActive ? 'text-green-100' : 'text-gray-400'}`}>
                      {itemCount} Items
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Grid Layout System Matrix */}
            {isLoadingData ? (
              <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
                <svg className="animate-spin h-10 w-10 text-green-500 mb-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="font-medium text-sm">Loading delicious food menu...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="group bg-white p-3 rounded-2xl shadow-xs border border-gray-100 flex flex-col transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1">
                    
                    <div className="h-32 md:h-40 bg-gray-100 rounded-xl mb-4 w-full relative overflow-hidden group-hover:shadow-inner transition-all">
                      {product.image_path ? (
                        <img 
                          src={`http://localhost:8000/storage/${product.image_path}`} 
                          alt={product.name}
                          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-tr from-gray-50 to-gray-100">
                          <span className="text-4xl opacity-20 transform transition-transform group-hover:scale-110">🍽️</span>
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-wider shadow-xs z-10">
                        {product.type}
                      </div>
                    </div>
                    
                    <div className="px-1 flex-1">
                      <h3 className="font-bold text-gray-800 text-base md:text-lg leading-tight mb-1">{product.name}</h3>
                      <p className="text-green-600 font-extrabold text-sm md:text-base">₱{product.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="mt-4 flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100/50">
                      <button onClick={() => updateQuantity(product.id, -1)} className="w-10 h-10 rounded-lg text-gray-500 hover:bg-white hover:text-red-500 font-bold text-lg transition-all flex items-center justify-center active:scale-95">-</button>
                      <span className="flex-1 text-center font-bold text-gray-800">{cart.find(item => item.id === product.id)?.quantity || 0}</span>
                      <button onClick={() => addToCart(product)} className="w-10 h-10 rounded-lg bg-green-500 text-white hover:bg-green-600 shadow-xs font-bold text-lg transition-all flex items-center justify-center active:scale-95">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Mobile Floating View Cart Overlay Bar */}
        {cart.length > 0 && (
          <button 
            onClick={() => setIsMobileCartOpen(true)}
            className="lg:hidden fixed bottom-6 left-4 right-4 bg-gray-900 text-white rounded-2xl py-4 px-6 shadow-2xl z-40 flex justify-between items-center transform transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="bg-green-500 text-white h-8 w-8 flex items-center justify-center rounded-full font-bold text-sm shadow-inner">{totalItems}</span>
              <span className="font-bold tracking-wide">View Cart Order</span>
            </div>
            <span className="font-extrabold text-green-400">₱{total.toFixed(2)}</span>
          </button>
        )}

        {/* Mobile Blackout Overlay */}
        {isMobileCartOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity" onClick={() => setIsMobileCartOpen(false)}></div>
        )}

        {/* Right Sidebar - Receipt POS Checkout Cart Panel */}
        <div className={`
          fixed inset-y-0 right-0 z-40 w-full sm:w-[400px] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.05)] flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-100
          lg:relative lg:translate-x-0
          ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {/* Top Cart Header Metadata */}
          <div 
            className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 cursor-pointer group hover:bg-gray-100/80 transition-colors"
            onClick={() => setIsTableModalOpen(true)}
          >
             <div>
               <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 group-hover:text-green-700 transition-colors flex items-center gap-2 uppercase tracking-wide">
                 {selectedTable} <span className="text-sm opacity-50">✏️</span>
               </h2>
               <p className="text-green-600 font-bold text-xs uppercase tracking-wider mt-0.5">Guest: {guestName}</p>
             </div>
             <button onClick={(e) => { e.stopPropagation(); setIsMobileCartOpen(false); }} className="lg:hidden w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-full font-bold shadow-xs active:scale-95 transition-all">
               ✕
             </button>
          </div>

          {/* Toggle Fulfillment Types Row */}
          <div className="px-5 md:px-6 py-4 border-b border-gray-100 shrink-0">
             <div className="flex bg-gray-100/80 p-1.5 rounded-xl">
                {['Dine In', 'Take Away', 'Delivery'].map(type => (
                  <button 
                    key={type}
                    onClick={() => setOrderType(type as any)}
                    className={`py-2.5 flex-1 rounded-lg text-xs md:text-sm font-bold transition-all ${
                      orderType === type 
                        ? 'bg-white text-gray-800 shadow-md' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
             </div>
          </div>

          {/* Scrolling Cart Entries Items List */}
          <div className="flex-1 overflow-auto p-5 md:p-6 flex flex-col gap-5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <span className="text-6xl mb-4">🛒</span>
                <p className="font-bold text-sm text-gray-400">Order cart is currently empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden shadow-inner border border-gray-200/80 shrink-0">
                       {item.image_path ? (
                         <img src={`http://localhost:8000/storage/${item.image_path}`} alt={item.name} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-xl">🍲</span>
                       )}
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                       <p className="text-xs font-bold text-gray-400 mt-0.5">₱{item.price.toFixed(2)}</p>
                     </div>
                  </div>
                  <div className="bg-green-50 text-green-700 font-extrabold px-3 py-1.5 rounded-lg text-sm border border-green-100/60 shrink-0">
                    {item.quantity}x
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Calculations and Pay Execution Footers Container */}
          <div className="p-5 md:p-6 bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] shrink-0">
             <div className="space-y-3 mb-5">
               <div className="flex justify-between text-sm font-semibold text-gray-400">
                 <span>Subtotal</span><span className="text-gray-700">₱{subTotal.toFixed(2)}</span>
               </div>
               
               {/* FIX: Formatted to show your live state tracking rate parameter dynamically */}
               <div className="flex justify-between text-sm font-semibold text-gray-400">
                 <span>VAT ({(liveTaxRate * 100).toFixed(0)}%)</span>
                 <span className="text-gray-700">₱{tax.toFixed(2)}</span>
               </div>
               
               <div className="flex justify-between items-end pt-3 border-t border-gray-100 border-dashed mt-3">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Amount</span>
                 <span className="text-2xl md:text-3xl font-black text-green-600 tracking-tight">₱{total.toFixed(2)}</span>
               </div>
             </div>

             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Payment Configuration</p>
             <div className="flex gap-2 mb-5">
               {(['Cash', 'Card', 'QR Code'] as const).map(method => (
                 <button 
                   key={method} 
                   onClick={() => setPaymentMethod(method)}
                   className={`flex-1 py-3 border-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                     paymentMethod === method 
                       ? 'border-green-500 bg-green-50 text-green-700' 
                       : 'border-gray-100 text-gray-400 hover:border-gray-200'
                   }`}
                 >
                   {method}
                 </button>
               ))}
             </div>

             <button 
               onClick={handleCheckout}
               disabled={isCheckingOut || cart.length === 0}
               className="w-full relative overflow-hidden bg-gray-900 text-white py-4 rounded-2xl font-bold text-base transition-all hover:bg-black active:scale-98 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
             >
               {isCheckingOut ? 'Processing Order...' : 'Confirm Checkout Payment'}
             </button>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}