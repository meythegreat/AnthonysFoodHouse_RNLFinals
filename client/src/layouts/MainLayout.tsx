import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTable } from '../context/TableContext'; 
import { useToast } from '../context/ToastContext';
import axios from '../services/axiosConfig';
import logo from '../assets/anthonys-logo.png';
import { Utensils, ClipboardList, Package, Users, BarChart3, Settings, LogOut, Menu, X, ChefHat, Receipt } from 'lucide-react';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsTableModalOpen } = useTable(); 
  const { showToast } = useToast(); 
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
    } catch (error) {
      console.error('Network logout failed, forcing local logout instead.');
    } finally {
      localStorage.removeItem('token'); 
      showToast('You have been securely logged out.', 'info');
      navigate('/login');
    }
  };

  const getLinkStyle = (path: string) => {
    const isActive = location.pathname === path;
    return isActive
      ? "flex items-center gap-3 bg-green-600 text-white py-3.5 px-4 rounded-xl font-bold shadow-md shadow-green-600/20 transition-transform hover:-translate-y-0.5"
      : "flex items-center gap-3 text-left text-gray-500 font-semibold py-3.5 px-4 rounded-xl hover:bg-green-50 hover:text-green-700 transition-colors";
  };

  const NavigationLinks = () => {
    // Safely parse the logged-in employee's role
    const employeeData = localStorage.getItem('employee');
    const role = employeeData ? JSON.parse(employeeData).role : '';
    const isAdmin = role === 'Admin';

    return (
      <>
        {/* EVERYONE sees POS and Tables */}
        <button onClick={() => { navigate('/pos'); setIsMobileSidebarOpen(false); }} className={getLinkStyle('/pos')}>
          <Utensils className="w-5 h-5 shrink-0" /> <span className="font-bold">POS Menu</span>
        </button>
        
        <button 
          onClick={() => { setIsTableModalOpen(true); setIsMobileSidebarOpen(false); }}
          className="flex items-center gap-3 text-left text-gray-500 font-semibold py-3.5 px-4 rounded-xl hover:bg-green-50 hover:text-green-700 transition-colors"
        >
          <ClipboardList className="w-5 h-5 shrink-0" /> <span className="font-bold">Table Services</span>
        </button>
        
        {/* ONLY ADMINS see these links */}
        {isAdmin && (
          <>
            <button onClick={() => { navigate('/inventory'); setIsMobileSidebarOpen(false); }} className={getLinkStyle('/inventory')}>
              <Package className="w-5 h-5 shrink-0" /> <span className="font-bold">Inventory</span>
            </button>

            <button onClick={() => { navigate('/employees'); setIsMobileSidebarOpen(false); }} className={getLinkStyle('/employees')}>
              <Users className="w-5 h-5 shrink-0" /> <span className="font-bold">Employees</span>
            </button>

            <button onClick={() => { navigate('/reports'); setIsMobileSidebarOpen(false); }} className={getLinkStyle('/reports')}>
              <BarChart3 className="w-5 h-5 shrink-0" /> <span className="font-bold">Reports</span>
            </button>

            <button onClick={() => { navigate('/settings'); setIsMobileSidebarOpen(false); }} className={getLinkStyle('/settings')}>
              <Settings className="w-5 h-5 shrink-0" /> <span className="font-bold">Settings</span>
            </button>

            {(role === 'Admin' || role === 'Kitchen Staff') && (
              <button onClick={() => { navigate('/kitchen'); setIsMobileSidebarOpen(false); }} className={getLinkStyle('/kitchen')}>
                <ChefHat className="w-5 h-5 shrink-0" /> <span className="font-bold">Kitchen Display</span>
              </button>
            )}

            {(role === 'Admin' || role === 'Cashier' || role === 'Manager') && (
              <button onClick={() => { navigate('/history'); setIsMobileSidebarOpen(false); }} className={getLinkStyle('/history')}>
                <Receipt className="w-5 h-5 shrink-0" /> <span className="font-bold">Order History</span>
              </button>
            )}

          </>
        )}
      </>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans relative overflow-hidden text-gray-800">
      
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-72 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-col z-20 border-r border-gray-100">
        <div className="pt-8 pb-6 border-b border-gray-100 flex justify-center px-6 shrink-0">
           <img src={logo} alt="Anthony's Food House Logo" className="h-20 w-auto object-contain drop-shadow-sm" />
        </div>
        
        <nav className="flex-1 flex flex-col gap-2 px-4 py-4 overflow-y-auto">
          <NavigationLinks />
        </nav>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-bold text-sm text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all active:scale-95 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              <LogOut className="w-5 h-5" />
            </span> 
            Logout
          </button>
        </div>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* MOBILE SIDEBAR PANEL */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col border-r border-gray-100 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pt-8 pb-6 border-b border-gray-100 flex justify-between items-center px-6 shrink-0">
           <img src={logo} alt="Anthony's Food House Logo" className="h-14 w-auto object-contain" />
           <button onClick={() => setIsMobileSidebarOpen(false)} className="w-9 h-9 flex items-center justify-center bg-gray-50 text-gray-500 rounded-full font-bold border border-gray-100">
             <X className="w-5 h-5" />
           </button>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2 px-4 py-4 overflow-y-auto">
          <NavigationLinks />
        </nav>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-bold text-sm text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all active:scale-95 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              <LogOut className="w-5 h-5" />
            </span> 
            Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT VIEWPORT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="md:hidden bg-white p-4 flex justify-between items-center shadow-xs z-30 border-b border-gray-100 shrink-0">
           <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl text-gray-700">
               <Menu className="w-5 h-5" />
             </button>
             <img src={logo} alt="Logo" className="h-9 w-auto object-contain" />
           </div>
        </header>
        {children}
      </div>
    </div>
  );
}