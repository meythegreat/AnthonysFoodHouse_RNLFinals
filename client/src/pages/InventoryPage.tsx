import { useEffect, useState, useRef } from 'react';
import axios from '../services/axiosConfig';
import MainLayout from '../layouts/MainLayout';
import { useToast } from '../context/ToastContext';
import { Search, Plus, Edit2, Trash2, Package, AlertTriangle, AlertOctagon, Loader2, PackageX, ImageOff, ImagePlus, Minus, X } from 'lucide-react';

type InventoryItem = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  low_stock_threshold: number;
  image_path: string | null;
};

const INVENTORY_CATEGORIES = ['All', 'Meat', 'Produce', 'Pantry', 'Packaging'];
const UNITS = ['kg', 'pcs', 'packs', 'L', 'cans', 'cases'];

export default function InventoryPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Modal Control States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  // Form Field States
  const [formData, setFormData] = useState({
    name: '',
    category: 'Meat',
    quantity: '0',
    unit: 'kg',
    low_stock_threshold: '5',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get<InventoryItem[]>('/api/inventory');
      const formattedData = response.data.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        low_stock_threshold: Number(item.low_stock_threshold)
      }));
      setItems(formattedData);
    } catch (error) {
      showToast('Failed to load inventory supplies.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingItemId(null);
    setFormData({ name: '', category: 'Meat', quantity: '0', unit: 'kg', low_stock_threshold: '5' });
    setSelectedFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setModalMode('edit');
    setEditingItemId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      low_stock_threshold: String(item.low_stock_threshold),
    });
    setSelectedFile(null);
    setImagePreview(item.image_path ? `http://localhost:8000/storage/${item.image_path}` : null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('category', formData.category);
    data.append('quantity', formData.quantity);
    data.append('unit', formData.unit);
    data.append('low_stock_threshold', formData.low_stock_threshold);
    if (selectedFile) {
      data.append('image', selectedFile);
    }

    try {
      if (modalMode === 'add') {
        await axios.post('/api/inventory', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Item added to inventory successfully!', 'success');
      } else {
        await axios.post(`/api/inventory/${editingItemId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Inventory item updated successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchInventory();
    } catch (error) {
      showToast('Failed to save item details.', 'error');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Are you absolutely sure you want to completely delete this item?')) return;
    try {
      await axios.delete(`/api/inventory/${id}`);
      showToast('Item deleted from dashboard.', 'info');
      fetchInventory();
    } catch (error) {
      showToast('Could not remove item.', 'error');
    }
  };

  // --- 1. The Debounce Timer Memory ---
  // This stores a unique countdown timer for every individual item ID
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // --- 2. The Optimized Adjust Stock Function ---
  const adjustStock = (item: InventoryItem, adjustment: number) => {
    // Calculate what the new quantity should be (preventing negative numbers)
    const newQty = Math.max(0, Number(item.quantity) + adjustment);
    
    // OPTIMISTIC UI: Update the React state instantly so the user sees the number change immediately
    setItems(items.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));

    // Optional: Trigger instant alerts if they hit critical thresholds
    if (newQty === 0) {
      showToast(`${item.name} is now completely OUT OF STOCK!`, 'error');
    } else if (newQty > 0 && newQty <= item.low_stock_threshold) {
      showToast(`${item.name} stock level is running critically low!`, 'warning');
    }

    // DEBOUNCING: If the user clicks again before 800ms, cancel the previous countdown
    if (debounceTimers.current[item.id]) {
      clearTimeout(debounceTimers.current[item.id]);
    }

    // Start a new 800ms countdown. When it hits zero, send ONE request to Laravel.
    debounceTimers.current[item.id] = setTimeout(async () => {
      try {
        await axios.patch(`/api/inventory/${item.id}/stock`, { quantity: newQty });
        // We do NOT show a toast here, otherwise the user would get spammed 800ms after they stop clicking.
      } catch (error) {
        showToast('Failed to sync stock alteration to database.', 'error');
        // REVERT: If the server request fails, fetch the true inventory from Laravel to fix the numbers on screen
        fetchInventory(); 
      }
    }, 800);
  };

  // Summary Metrics calculations
  const totalItemsCount = items.length;
  const lowStockCount = items.filter(i => i.quantity > 0 && i.quantity <= i.low_stock_threshold).length;
  const outOfStockCount = items.filter(i => i.quantity === 0).length;

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <MainLayout>
      {/* Top Header Panel */}
      <div className="bg-white/80 backdrop-blur-md p-6 md:px-10 md:pt-6 md:pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 border-b border-gray-100 sticky top-0">
         <div>
           <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Inventory Dashboard</h1>
           <p className="text-sm text-gray-500 mt-0.5 font-medium">Full management control rules for pantry supplies.</p>
         </div>
         
         <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
             <input 
               type="text" 
               placeholder="Search inventory..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-full bg-gray-50/50 outline-hidden focus:border-green-500 focus:bg-white text-sm font-medium"
             />
           </div>
           <button onClick={openAddModal} className="bg-green-600 text-white font-bold px-5 py-2.5 rounded-full shadow-md hover:bg-green-700 transition-all text-sm shrink-0 flex items-center gap-2 active:scale-95 transform">
             <Plus className="w-4 h-4" /> Add Stock Item
           </button>
         </div>
      </div>

      <main className="flex-1 overflow-auto p-4 md:p-10 space-y-6 pb-24 md:pb-10">
        
        {/* Prototype Summary Dashboard Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="text-blue-600 bg-blue-50 p-3 rounded-xl"><Package className="w-8 h-8" /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Items</p>
              <h3 className="text-2xl font-black text-gray-800 mt-0.5">{isLoading ? '...' : totalItemsCount}</h3>
            </div>
          </div>

          <div className={`bg-white p-5 rounded-2xl border flex items-center gap-4 transition-all ${lowStockCount > 0 ? 'border-yellow-200 bg-linear-to-tr from-white to-yellow-50/30' : 'border-gray-100'}`}>
            <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 bg-gray-50'}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Low Stock Alerts</p>
              <h3 className={`text-2xl font-black mt-0.5 ${lowStockCount > 0 ? 'text-yellow-600' : 'text-gray-800'}`}>{isLoading ? '...' : lowStockCount}</h3>
            </div>
          </div>

          <div className={`bg-white p-5 rounded-2xl border flex items-center gap-4 transition-all ${outOfStockCount > 0 ? 'border-red-200 bg-linear-to-tr from-white to-red-50/30' : 'border-gray-100'}`}>
            <div className={`p-3 rounded-xl ${outOfStockCount > 0 ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50'}`}>
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Out of Stock</p>
              <h3 className={`text-2xl font-black mt-0.5 ${outOfStockCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>{isLoading ? '...' : outOfStockCount}</h3>
            </div>
          </div>
        </div>

        {/* Categories Chips Filter Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {INVENTORY_CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all shrink-0 ${
                activeCategory === category ? 'bg-gray-800 border-gray-800 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Premium Synchronized Table Container */}
        <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-5 bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
            <div className="col-span-2 md:col-span-1">Image</div>
            <div className="col-span-4 md:col-span-4">Item Details</div>
            <div className="col-span-3 md:col-span-2">Category</div>
            <div className="col-span-3 md:col-span-2 text-center">Status</div>
            <div className="col-span-12 md:col-span-3 text-right pr-4 hidden md:block">Actions</div>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                 <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-3" />
                 <p className="font-medium text-sm">Loading pantry blueprints...</p>
               </div>
            ) : filteredItems.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-20 text-center text-gray-400 font-medium">
                 <PackageX className="w-12 h-12 mb-3 text-gray-300" />
                 <p>No items found matching these selections.</p>
               </div>
            ) : (
              filteredItems.map(item => {
                let statusStyles = 'bg-green-100 text-green-700 border-green-200';
                let statusText = 'In Stock';
                if (item.quantity === 0) {
                  statusStyles = 'bg-red-100 text-red-700 border-red-200';
                  statusText = 'Out of Stock';
                } else if (item.quantity <= item.low_stock_threshold) {
                  statusStyles = 'bg-yellow-100 text-yellow-700 border-yellow-200';
                  statusText = 'Low Stock';
                }

                return (
                  <div key={item.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-gray-50/40 transition-colors group">
                    
                    {/* 1. Thumbnail Image */}
                    <div className="col-span-2 md:col-span-1 w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center shadow-inner">
                      {item.image_path ? (
                        <img src={`http://localhost:8000/storage/${item.image_path}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageOff className="w-5 h-5 text-gray-300" />
                      )}
                    </div>

                    {/* 2. Text Meta Details */}
                    <div className="col-span-4 md:col-span-4">
                      <h4 className="font-bold text-gray-800 text-sm md:text-base group-hover:text-green-700 transition-colors">{item.name}</h4>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5 lg:block hidden">
                        Current: {item.quantity} {item.unit} (Alert at {item.low_stock_threshold})
                      </p>
                    </div>

                    {/* 3. Category Tag */}
                    <div className="col-span-3 md:col-span-2">
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-gray-200/50 uppercase tracking-wide">
                        {item.category}
                      </span>
                    </div>

                    {/* 4. Dynamic Status Pill */}
                    <div className="col-span-3 md:col-span-2 flex justify-center">
                      <span className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${statusStyles}`}>
                        {statusText}
                      </span>
                    </div>

                    {/* 5. Aligned Action Operations Column (Desktop Adjusters + CRUD) */}
                    <div className="col-span-12 md:col-span-3 flex items-center justify-end gap-4 mt-2 md:mt-0">
                      
                      {/* Desktop Only Adjuster Badge Group */}
                      <div className="hidden lg:flex items-center bg-gray-50/80 p-1 rounded-xl border border-gray-100 shadow-inner">
                        <button 
                          onClick={() => adjustStock(item, -1)} 
                          className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 font-bold transition-all flex items-center justify-center active:scale-95 shadow-xs"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <div className="w-16 text-center mx-1">
                          <span className="font-black text-gray-800 text-sm block leading-none">{item.quantity}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">{item.unit}</span>
                        </div>
                        
                        <button 
                          onClick={() => adjustStock(item, 1)} 
                          className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-200 font-bold transition-all flex items-center justify-center active:scale-95 shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Primary CRUD Buttons */}
                      <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
                        <button onClick={() => openEditModal(item)} className="p-2 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:text-blue-600 shadow-xs active:scale-95 transition-transform">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 rounded-xl border border-gray-200 bg-white hover:border-red-300 hover:text-red-600 shadow-xs active:scale-95 transition-transform">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* MOBILE QUICK ADJUST STRIP */}
                    <div className="col-span-12 lg:hidden flex items-center justify-between mt-2 pt-3 border-t border-gray-100 bg-gray-50/60 p-2.5 rounded-xl">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stock Level:</span>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => adjustStock(item, -1)} 
                          className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 font-bold flex items-center justify-center active:scale-95 shadow-xs"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <div className="w-20 text-center">
                          <span className="font-black text-gray-800 text-base block">{item.quantity}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mt-0.5">{item.unit}</span>
                        </div>
                        
                        <button 
                          onClick={() => adjustStock(item, 1)} 
                          className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 font-bold flex items-center justify-center active:scale-95 shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* --- ADD/EDIT SHEET POPUP MODAL OVERLAY --- */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity cursor-pointer"
          onClick={() => setIsModalOpen(false)} 
        >
          <form 
            onSubmit={handleFormSubmit} 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] cursor-default"
          >
            
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-black text-gray-800 capitalize">{modalMode} Inventory Item</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Picture Upload Element */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="w-20 h-20 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-8 h-8 text-gray-300" />}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Picture</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700" />
                </div>
              </div>

              {/* Input Name field */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Ingredient / Supply Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all" placeholder="e.g. White Rice Bag" />
              </div>

              {/* Grid Metadata Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all">
                    {INVENTORY_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Measurement Unit</label>
                  <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Initial Quantity</label>
                  <input type="number" step="0.01" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Low-Stock Alert Qty</label>
                  <input type="number" step="0.01" required value={formData.low_stock_threshold} onChange={e => setFormData({ ...formData, low_stock_threshold: e.target.value })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all" />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full mt-6 bg-gray-900 hover:bg-black text-white p-4 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all active:scale-98">
              {modalMode === 'add' ? 'Add Item to Dashboard' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

    </MainLayout>
  );
}