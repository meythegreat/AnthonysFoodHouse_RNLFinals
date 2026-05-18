import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../services/axiosConfig';
import { useToast } from './ToastContext';

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
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs z-60 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsTableModalOpen(false)} // <-- FIX: Clicking the dimmed backdrop closes the modal
        >
          <div 
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()} // <-- FIX: Stops click bubbling so clicking fields inside won't close it!
          >
             
             {/* Modal Header */}
             <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
               <div>
                 <h2 className="text-2xl font-extrabold text-gray-800">Table Services</h2>
                 <p className="text-sm text-gray-500 mt-1">Assign a table, or update an existing order's status.</p>
               </div>
               <button 
                 type="button"
                 onClick={() => setIsTableModalOpen(false)} 
                 className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-full font-bold shadow-xs active:scale-95 transition-transform"
               >
                 ✕
               </button>
             </div>
             
             {/* Guest Name Input */}
             <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Guest Name</label>
                <input 
                  type="text" 
                  value={guestName} 
                  onChange={(e) => setGuestName(e.target.value)} 
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-gray-800 outline-hidden font-medium focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10" 
                  placeholder="e.g. Walk-in, John Doe" 
                />
             </div>
             
             {/* Table Selection Grid Matrices */}
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Select a Table</label>
             <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 max-h-[40vh] overflow-y-auto pr-2 pb-2">
                {tables.map(table => {
                  let statusStyles = table.status === 'Available' ? 'border-gray-100 bg-white text-gray-500 hover:border-green-300' :
                                     table.status === 'Waiting' ? 'border-yellow-400 bg-yellow-50 text-yellow-700' :
                                     'border-green-500 bg-green-50 text-green-700';

                  if (selectedTable === table.name) statusStyles += ' ring-4 ring-green-500/30 ring-offset-1';

                  return (
                    <div key={table.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => { setSelectedTable(table.name); setIsTableModalOpen(false); }}
                        className={`w-full py-4 px-2 rounded-xl font-bold border-2 transition-all flex flex-col items-center justify-center gap-1 hover:-translate-y-0.5 overflow-hidden ${statusStyles}`}
                      >
                        {table.status !== 'Available' && (
                          <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${table.status === 'Waiting' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                        )}
                        <span className="text-xl">🪑</span>
                        <span className="text-sm">{table.name}</span>
                        <span className="text-[9px] uppercase tracking-wider opacity-70 mt-1 mb-2">{table.status}</span>
                      </button>

                      {table.status === 'Waiting' && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); updateTableStatus(table.id, 'Done'); }} className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-md active:scale-95">Serve Food</button>
                      )}
                      {table.status === 'Done' && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); updateTableStatus(table.id, 'Available'); }} className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-green-600 hover:bg-green-700 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-md active:scale-95">Clear Table</button>
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