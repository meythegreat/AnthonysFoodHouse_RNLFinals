import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../services/axiosConfig';
import { useToast } from './ToastContext';
import { X, User, Armchair, CheckCircle, Utensils } from 'lucide-react';

type TableStatus = 'Available' | 'Waiting' | 'Done';
type TableData = { id: number; name: string; status: TableStatus };

interface TableContextType {
  tables: TableData[];
  selectedTable: string;
  guestName: string;
  isTableModalOpen: boolean;
  setSelectedTable: (name: string) => void;
  setGuestName: (name: string) => void;
  setIsTableModalOpen: (open: boolean) => void;
  updateTableStatus: (tableId: number, newStatus: TableStatus) => Promise<void>;
  setTableStatusByName: (tableName: string, newStatus: TableStatus) => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export function TableProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('Table 1');
  const [guestName, setGuestName] = useState<string>('Walk-in');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get<TableData[]>('/api/tables');
      setTables(response.data);
    } catch (error) {
      console.error('Failed to load tables', error);
    }
  };

  const updateTableStatus = async (tableId: number, newStatus: TableStatus) => {
    try {
      await axios.patch(`/api/tables/${tableId}/status`, { status: newStatus });
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: newStatus } : t));
    } catch (error) {
      showToast('Could not update table status.', 'error');
    }
  };

  const setTableStatusByName = useCallback((tableName: string, newStatus: TableStatus) => {
    setTables(prev => prev.map(t => t.name === tableName ? { ...t, status: newStatus } : t));
  }, []);

  return (
    <TableContext.Provider value={{
      tables, selectedTable, guestName, isTableModalOpen,
      setSelectedTable, setGuestName, setIsTableModalOpen,
      updateTableStatus, setTableStatusByName
    }}>
      {children}

      {/* GLOBAL MODAL SYSTEM */}
      {isTableModalOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
          onClick={() => setIsTableModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl cursor-default border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
             
             {/* Modal Header */}
             <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
               <div>
                 <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Table Services</h2>
                 <p className="text-sm font-medium text-gray-400 mt-0.5">Assign active room tracks or update terminal orders.</p>
               </div>
               <button 
                 type="button"
                 onClick={() => setIsTableModalOpen(false)} 
                 className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100 rounded-full transition-all active:scale-95"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             {/* Guest Name Input */}
             <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Guest Identifier</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    value={guestName} 
                    onChange={(e) => setGuestName(e.target.value)} 
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-12 pr-4 py-3.5 text-gray-800 font-semibold text-sm outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400" 
                    placeholder="e.g. Walk-in, John Doe" 
                  />
                </div>
             </div>
             
             {/* Table Selection Grid Matrices */}
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Select Dining Floor Target</label>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[40vh] overflow-y-auto pr-1 pb-2 scrollbar-hide">
                {tables.map(table => {
                  const isCurrent = selectedTable === table.name;
                  
                  let statusStyles = 'border-gray-100 bg-white text-gray-500 hover:border-green-300';
                  if (table.status === 'Waiting') statusStyles = 'border-yellow-400 bg-yellow-50/30 text-yellow-700 hover:bg-yellow-50/60';
                  if (table.status === 'Done') statusStyles = 'border-green-500 bg-green-50/30 text-green-700 hover:bg-green-50/60';

                  if (isCurrent) statusStyles += ' ring-4 ring-green-600/20 border-green-600 shadow-md';

                  return (
                    <div key={table.id} className="relative group min-h-[120px] flex flex-col">
                      <button
                        type="button"
                        onClick={() => { setSelectedTable(table.name); setIsTableModalOpen(false); }}
                        className={`w-full flex-1 p-4 rounded-2xl font-bold border-2 transition-all flex flex-col items-center justify-center gap-1.5 overflow-hidden ${statusStyles}`}
                      >
                        {/* Dynamic Floating Visual Status Dots */}
                        {table.status !== 'Available' && (
                          <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${table.status === 'Waiting' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
                        )}
                        
                        <Armchair className="w-5 h-5 text-current opacity-80" />
                        <span className="text-sm tracking-tight text-gray-800 font-black">{table.name}</span>
                        <span className="text-[9px] uppercase tracking-wider opacity-70 font-extrabold pb-4">{table.status}</span>
                      </button>

                      {/* Interactive Action Control Badges over Buttons */}
                      {table.status === 'Waiting' && (
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); updateTableStatus(table.id, 'Done'); }} 
                          className="absolute bottom-2.5 left-1/2 transform -translate-x-1/2 bg-yellow-500 hover:bg-yellow-600 text-white text-[9px] uppercase font-black px-3 py-1 rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-1 border border-yellow-600/10 tracking-wider"
                        >
                          <Utensils className="w-2.5 h-2.5" /> Serve
                        </button>
                      )}
                      {table.status === 'Done' && (
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); updateTableStatus(table.id, 'Available'); }} 
                          className="absolute bottom-2.5 left-1/2 transform -translate-x-1/2 bg-green-600 hover:bg-green-700 text-white text-[9px] uppercase font-black px-3 py-1 rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-1 border border-green-700/10 tracking-wider"
                        >
                          <CheckCircle className="w-2.5 h-2.5" /> Clear
                        </button>
                      )}
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      )}
    </TableContext.Provider>
  );
}

export function useTable() {
  const context = useContext(TableContext);
  if (!context) throw new Error('useTable must be used within a TableProvider');
  return context;
}