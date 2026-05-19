import { useEffect, useState } from 'react';
import axios from '../services/axiosConfig';
import MainLayout from '../layouts/MainLayout';
import { useTable } from '../context/TableContext';
import { useToast } from '../context/ToastContext';
import { 
  Search, LayoutGrid, Flame, UtensilsCrossed, Soup, Coffee, ShoppingCart, 
  ImageOff, Plus, Minus, X as CloseIcon, Banknote, CreditCard, QrCode, ChevronRight 
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';

type Category = { id: number; name: string; itemCount: number; icon: React.ReactNode };
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
  { id: 1, name: 'All', itemCount: 0, icon: <LayoutGrid className="w-6 h-6" /> },
  { id: 2, name: 'Sizzling Menu', itemCount: 0, icon: <Flame className="w-6 h-6" /> },
  { id: 3, name: 'Silog', itemCount: 0, icon: <UtensilsCrossed className="w-6 h-6" /> },
  { id: 4, name: 'Soup', itemCount: 0, icon: <Soup className="w-6 h-6" /> },
  { id: 5, name: 'Drinks', itemCount: 0, icon: <Coffee className="w-6 h-6" /> },
];

export default function POSPage() {
  const [storeSettings, setStoreSettings] = useState<Record<string, string>>({});
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedOrderData, setCompletedOrderData] = useState<any>(null);
  const { showToast } = useToast();
  const { selectedTable, guestName, setTableStatusByName, setIsTableModalOpen } = useTable();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [liveTaxRate, setLiveTaxRate] = useState<number>(0.05); 
  
  const [orderType, setOrderType] = useState<'Dine In' | 'Take Away' | 'Delivery'>('Dine In');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'QR Code'>('Cash');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  useEffect(() => {
    const fetchPOSBlueprint = async () => {
      try {
        const [productsRes, settingsRes] = await Promise.all([
          axios.get<Product[]>('/api/products'),
          axios.get<Record<string, string>>('/api/settings')
        ]);
        
        setProducts(productsRes.data.map((p) => ({ ...p, price: Number(p.price) })));
        
        if (settingsRes.data && settingsRes.data.tax_rate) {
          const parsedRate = parseFloat(settingsRes.data.tax_rate) / 100;
          setLiveTaxRate(parsedRate);
          setStoreSettings(settingsRes.data);
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

  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subTotal * liveTaxRate; 
  const total = subTotal + tax;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return showToast('Your transactional cart is empty!', 'warning');
    setIsCheckingOut(true);
    
    // Get the logged-in cashier's name from localStorage
    const empData = localStorage.getItem('employee');
    const cashierName = empData ? JSON.parse(empData).name : 'Terminal Operator';

    try {
      await axios.get('/sanctum/csrf-cookie');
      await axios.post('/api/orders', {
        cart: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
        order_type: orderType,
        payment_method: paymentMethod,
        table_number: selectedTable,
        customer_name: guestName || 'Walk-in',
      });
      
      // 1. Save a snapshot of the order details BEFORE clearing the cart
      setCompletedOrderData({
        cart: [...cart],
        subTotal, tax, total, liveTaxRate, orderType, paymentMethod,
        tableNumber: selectedTable, guestName: guestName || 'Walk-in', cashierName
      });

      // 2. Open the receipt
      setIsReceiptOpen(true);
      
      // 3. Reset the background POS UI for the next customer
      setTableStatusByName(selectedTable, 'Waiting');
      setCart([]);
      setIsMobileCartOpen(false);
      showToast(`Order logged successfully!`, 'success');

    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to process checkout line.', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 flex h-full overflow-hidden relative">
        
        {/* --- LEFT SIDE: Menu & Products --- */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
          
          <div className="bg-white/80 backdrop-blur-md p-4 md:px-8 md:py-5 flex items-center z-10 border-b border-gray-100 sticky top-0 shrink-0">
             <div className="relative w-full md:w-96">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
               <input 
                 type="text" 
                 placeholder="Search menu items..." 
                 className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-full bg-gray-50/50 outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 text-sm font-medium transition-all"
               />
             </div>
          </div>

          <main className="flex-1 overflow-auto p-4 md:p-8 pb-28 md:pb-8">
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
                    <span className="mb-3 bg-white/20 p-2 rounded-xl backdrop-blur-sm text-inherit">
                      {cat.icon}
                    </span>
                    <span className="font-bold text-sm md:text-base tracking-wide">{cat.name}</span>
                    <span className={`text-xs mt-1 font-medium ${isActive ? 'text-green-100' : 'text-gray-400'}`}>
                      {itemCount} Items
                    </span>
                  </button>
                );
              })}
            </div>

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
                          <ImageOff className="w-10 h-10 text-gray-300 opacity-50 transform transition-transform group-hover:scale-110" />
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
                      <button onClick={() => updateQuantity(product.id, -1)} className="w-10 h-10 rounded-lg text-gray-500 hover:bg-white hover:text-red-500 font-bold text-lg transition-all flex items-center justify-center active:scale-95 shadow-xs">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="flex-1 text-center font-bold text-gray-800">{cart.find(item => item.id === product.id)?.quantity || 0}</span>
                      <button onClick={() => addToCart(product)} className="w-10 h-10 rounded-lg bg-green-500 text-white hover:bg-green-600 shadow-xs font-bold text-lg transition-all flex items-center justify-center active:scale-95">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* --- MOBILE FLOATING BUTTON --- */}
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

        {isMobileCartOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity" onClick={() => setIsMobileCartOpen(false)}></div>
        )}

        {/* --- RIGHT SIDEBAR: PREMIUM CART & CHECKOUT --- */}
        <div className={`
          fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.04)] flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-100
          lg:relative lg:translate-x-0
          ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          
          {/* Header & Table Selection */}
          <div 
            className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center cursor-pointer group transition-colors hover:bg-gray-50/50 shrink-0"
            onClick={() => setIsTableModalOpen(true)}
          >
             <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Order</p>
               <h2 className="text-xl md:text-2xl font-black text-gray-800 group-hover:text-green-600 transition-colors flex items-center gap-2 uppercase tracking-tight">
                 {selectedTable} 
                 <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-transform group-hover:translate-x-1" />
               </h2>
               <p className="text-gray-500 font-semibold text-xs mt-0.5">Guest: <span className="text-gray-800">{guestName || 'Walk-in'}</span></p>
             </div>
             <button onClick={(e) => { e.stopPropagation(); setIsMobileCartOpen(false); }} className="lg:hidden w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
               <CloseIcon className="w-5 h-5" />
             </button>
          </div>

          {/* Segmented Control for Order Type */}
          <div className="px-5 md:px-6 py-4 border-b border-gray-100 shrink-0 bg-white">
             <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                {['Dine In', 'Take Away', 'Delivery'].map(type => (
                  <button 
                    key={type}
                    onClick={() => setOrderType(type as any)}
                    className={`py-2.5 flex-1 rounded-lg text-xs font-bold transition-all ${
                      orderType === type 
                        ? 'bg-white text-gray-800 shadow-sm border border-gray-200/50' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
             </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-auto p-5 md:p-6 flex flex-col gap-4 bg-slate-50/30">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <ShoppingCart className="w-16 h-16 mb-4 text-gray-200" />
                <p className="font-bold text-sm text-gray-400">Order cart is currently empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between group bg-white p-3 rounded-2xl border border-gray-100 shadow-xs hover:border-green-100 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                       {item.image_path ? (
                         <img src={`http://localhost:8000/storage/${item.image_path}`} alt={item.name} className="w-full h-full object-cover" />
                       ) : (
                         <ImageOff className="w-5 h-5 text-gray-300" />
                       )}
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-gray-800 line-clamp-1 leading-tight">{item.name}</h4>
                       <p className="text-xs font-bold text-gray-400 mt-1">₱{item.price.toFixed(2)}</p>
                     </div>
                  </div>
                  <div className="bg-gray-50 text-gray-700 font-extrabold px-3.5 py-1.5 rounded-lg text-sm border border-gray-200 shrink-0">
                    {item.quantity}x
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Premium Checkout Footer */}
          <div className="p-5 md:p-6 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] shrink-0 z-20">
             
             {/* Receipt Math */}
             <div className="space-y-2 mb-6">
               <div className="flex justify-between text-sm font-semibold text-gray-400">
                 <span>Subtotal</span><span className="text-gray-600">₱{subTotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-sm font-semibold text-gray-400">
                 <span>VAT ({(liveTaxRate * 100).toFixed(0)}%)</span>
                 <span className="text-gray-600">₱{tax.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-end pt-4 mt-2 border-t border-dashed border-gray-200">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Amount</span>
                 <span className="text-3xl font-black text-green-600 tracking-tight">₱{total.toFixed(2)}</span>
               </div>
             </div>

             {/* Premium Payment Cards */}
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Payment Method</p>
             <div className="grid grid-cols-3 gap-2.5 mb-6">
               {[
                 { id: 'Cash', icon: <Banknote className="w-5 h-5 mb-1.5" /> },
                 { id: 'Card', icon: <CreditCard className="w-5 h-5 mb-1.5" /> },
                 { id: 'QR Code', icon: <QrCode className="w-5 h-5 mb-1.5" /> }
               ].map(method => (
                 <button 
                   key={method.id} 
                   onClick={() => setPaymentMethod(method.id as any)}
                   className={`flex flex-col items-center justify-center py-3.5 rounded-xl border-2 transition-all active:scale-95 ${
                     paymentMethod === method.id 
                       ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' 
                       : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                   }`}
                 >
                   {method.icon}
                   <span className="text-xs font-bold">{method.id}</span>
                 </button>
               ))}
             </div>

             {/* Action Button */}
             <button 
               onClick={handleCheckout}
               disabled={isCheckingOut || cart.length === 0}
               className="w-full relative flex justify-center items-center gap-2 overflow-hidden bg-gray-900 text-white py-4.5 rounded-2xl font-bold text-base transition-all hover:bg-black hover:shadow-xl hover:shadow-gray-900/20 active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
             >
               {isCheckingOut ? (
                 <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               ) : (
                 <>Confirm Checkout <ChevronRight className="w-5 h-5" /></>
               )}
             </button>
          </div>
        </div>

      </div>

      <ReceiptModal 
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        orderData={completedOrderData}
        storeSettings={storeSettings}
      />
      
    </MainLayout>
  );
}