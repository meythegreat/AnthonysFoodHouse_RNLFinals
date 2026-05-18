import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTable } from '../context/TableContext'; // <-- Import useTable
import logo from '../assets/anthonys-logo.png';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsTableModalOpen } = useTable(); // <-- Extract modal trigger toggle
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const getLinkStyle = (path: string) => {
    const isActive = location.pathname === path;
    return isActive
      ? "flex items-center gap-3 bg-green-600 text-white py-3.5 px-4 rounded-xl font-bold shadow-md shadow-green-600/20 transition-transform hover:-translate-y-0.5"
      : "flex items-center gap-3 text-left text-gray-500 font-semibold py-3.5 px-4 rounded-xl hover:bg-green-50 hover:text-green-700 transition-colors";
  };

  const NavigationLinks = () => (
    <>
      <button onClick={() => { navigate('/pos'); setIsMobileSidebarOpen(false); }} className={getLinkStyle('/pos')}>
        <span className="text-xl">🍽️</span> POS Menu
      </button>
      
      {/* WIRED UP: Both mobile and desktop clicks now unlock the shared context modal overlay */}
      <button 
        onClick={() => { setIsTableModalOpen(true); setIsMobileSidebarOpen(false); }}
        className="flex items-center gap-3 text-left text-gray-500 font-semibold py-3.5 px-4 rounded-xl hover:bg-green-50 hover:text-green-700 transition-colors"
      >
        <span className="text-xl">📋</span> Table Services
      </button>
      
      <button onClick={() => { navigate('/inventory'); setIsMobileSidebarOpen(false); }} className={getLinkStyle('/inventory')}>
        <span className="text-xl">📦</span> Inventory
      </button>
      <button 
        onClick={() => { navigate('/employees'); setIsMobileSidebarOpen(false); }} 
        className={getLinkStyle('/employees')}
      >
        <span className="text-xl">👥</span> Employees
      </button>
      <button 
        onClick={() => { navigate('/reports'); setIsMobileSidebarOpen(false); }} 
        className={getLinkStyle('/reports')}
      >
        <span className="text-xl">📊</span> Reports
      </button>
      <button 
        onClick={() => { navigate('/settings'); setIsMobileSidebarOpen(false); }} 
        className={getLinkStyle('/settings')}
      >
        <span className="text-xl">⚙️</span> Settings
      </button>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans relative overflow-hidden text-gray-800">
      <div className="hidden md:flex w-72 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-col gap-6 z-20 border-r border-gray-100">
        <div className="pt-8 pb-6 border-b border-gray-100 flex justify-center px-6">
           <img src={logo} alt="Anthony's Food House Logo" className="h-20 w-auto object-contain drop-shadow-sm" />
        </div>
        <nav className="flex flex-col gap-2 px-4">
          <NavigationLinks />
        </nav>
      </div>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col gap-6 border-r border-gray-100 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pt-8 pb-6 border-b border-gray-100 flex justify-between items-center px-6">
           <img src={logo} alt="Anthony's Food House Logo" className="h-14 w-auto object-contain" />
           <button onClick={() => setIsMobileSidebarOpen(false)} className="w-9 h-9 flex items-center justify-center bg-gray-50 text-gray-500 rounded-full font-bold border border-gray-100">✕</button>
        </div>
        <nav className="flex flex-col gap-2 px-4">
          <NavigationLinks />
        </nav>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="md:hidden bg-white p-4 flex justify-between items-center shadow-xs z-30 border-b border-gray-100 shrink-0">
           <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl text-xl">☰</button>
             <img src={logo} alt="Logo" className="h-9 w-auto object-contain" />
           </div>
        </header>
        {children}
      </div>
    </div>
  );
}