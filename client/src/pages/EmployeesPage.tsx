import { useEffect, useState } from 'react';
import axios from '../services/axiosConfig';
import MainLayout from '../layouts/MainLayout';
import { useToast } from '../context/ToastContext';

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'Admin' | 'Cashier' | 'Kitchen Staff';
  status: 'Active' | 'Inactive' | 'On Break';
};

const ROLE_FILTERS = ['All', 'Admin', 'Cashier', 'Kitchen Staff'];
const ROLES = ['Admin', 'Cashier', 'Kitchen Staff'];
const STATUSES = ['Active', 'Inactive', 'On Break'];

export default function EmployeesPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState('All');

  // Modal Workspace States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);

  // Administrative Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Cashier' as Employee['role'],
    status: 'Active' as Employee['status'],
    pin: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get<Employee[]>('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      showToast('Failed to fetch personnel listings.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingEmployeeId(null);
    setFormData({ name: '', email: '', phone: '', role: 'Cashier', status: 'Active', pin: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setModalMode('edit');
    setEditingEmployeeId(employee.id);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      role: employee.role,
      status: employee.status,
      pin: '', // Keep PIN blank unless they want to rewrite it
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sanitize payload data schema
    const payload: Record<string, any> = { ...formData };
    if (modalMode === 'edit' && !payload.pin) {
      delete payload.pin; // Don't transmit a blank PIN block over the network on edit updates
    }

    try {
      if (modalMode === 'add') {
        await axios.post('/api/employees', payload);
        showToast(`Onboarded ${formData.name} to the team registry!`, 'success');
      } else {
        await axios.put(`/api/employees/${editingEmployeeId}`, payload);
        showToast(`Employee file updated successfully.`, 'success');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save staff records.';
      showToast(errorMsg, 'error');
    }
  };

  const handleDeleteEmployee = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from Anthony's Food House?`)) return;
    try {
      await axios.delete(`/api/employees/${id}`);
      showToast('Personnel cleared from system files.', 'info');
      fetchEmployees();
    } catch (error) {
      showToast('Could not delete employee record.', 'error');
    }
  };

  // Automated Registry Metric Counters
  const totalCount = Array.isArray(employees) ? employees.length : 0;
  const activeCount = Array.isArray(employees) ? employees.filter(e => e.status === 'Active').length : 0;
  const breakCount = Array.isArray(employees) ? employees.filter(e => e.status === 'On Break').length : 0;

  // Filter Pipeline Integration
  const filteredEmployees = Array.isArray(employees)
    ? employees.filter(employee => {
        const matchesSearch = (employee.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                              (employee.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesRole = activeRoleFilter === 'All' || employee.role === activeRoleFilter;
        return matchesSearch && matchesRole;
      })
    : [];

  return (
    <MainLayout>
      {/* Top Main Workspace Header Panel */}
      <div className="bg-white/80 backdrop-blur-md p-6 md:px-10 md:pt-6 md:pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 border-b border-gray-100 sticky top-0">
         <div>
           <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Employee Registry</h1>
           <p className="text-sm text-gray-500 mt-0.5 font-medium">Manage team directory assignments and checkout terminal pins.</p>
         </div>
         
         <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
             <input 
               type="text" 
               placeholder="Search employees..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-full bg-gray-50/50 outline-hidden focus:border-green-500 focus:bg-white text-sm font-medium"
             />
           </div>
           <button onClick={openAddModal} className="bg-green-600 text-white font-bold px-5 py-2.5 rounded-full shadow-md hover:bg-green-700 transition-all text-sm shrink-0 flex items-center gap-2 active:scale-95 transform">
             <span>➕</span> Onboard Staff
           </button>
         </div>
      </div>

      <main className="flex-1 overflow-auto p-4 md:p-10 space-y-6 pb-24 md:pb-10">
        
        {/* Metric Overview Performance Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
            <span className="text-3xl bg-blue-50 p-3 rounded-xl">👥</span>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Roster</p>
              <h3 className="text-2xl font-black text-gray-800 mt-0.5">{isLoading ? '...' : totalCount} Staff</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
            <span className="text-3xl bg-green-50 p-3 rounded-xl">🟢</span>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active On Shift</p>
              <h3 className="text-2xl font-black text-green-600 mt-0.5">{isLoading ? '...' : activeCount} Online</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
            <span className="text-3xl bg-yellow-50 p-3 rounded-xl">☕</span>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">On Break</p>
              <h3 className="text-2xl font-black text-yellow-600 mt-0.5">{isLoading ? '...' : breakCount} Personnel</h3>
            </div>
          </div>
        </div>

        {/* Roles Filter Navigation Row */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {ROLE_FILTERS.map(role => (
            <button
              key={role}
              onClick={() => setActiveRoleFilter(role)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all shrink-0 ${
                activeRoleFilter === role ? 'bg-gray-800 border-gray-800 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Core Administrative Ledger Grid Table Container */}
        <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-5 bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
            <div className="col-span-5 md:col-span-4">Employee Details</div>
            <div className="col-span-4 md:col-span-3">Contact Number</div>
            <div className="col-span-3 md:col-span-2 text-center">Role</div>
            <div className="hidden md:block col-span-2 text-center">Status</div>
            <div className="hidden md:block col-span-1 text-right pr-4">Actions</div>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                 <svg className="animate-spin h-8 w-8 text-green-500 mb-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 <p className="font-medium text-sm">Syncing staff roster files...</p>
               </div>
            ) : filteredEmployees.length === 0 ? (
               <div className="p-20 text-center text-gray-400 font-medium">
                 <span className="text-4xl block mb-2">👥</span> No employees found matching the search criteria.
               </div>
            ) : (
              filteredEmployees.map(employee => {
                // Color mapping rules for roles
                let roleStyles = 'bg-blue-50 text-blue-700 border-blue-100';
                if (employee.role === 'Admin') roleStyles = 'bg-purple-50 text-purple-700 border-purple-100';
                if (employee.role === 'Kitchen Staff') roleStyles = 'bg-orange-50 text-orange-700 border-orange-100';

                // Color mapping rules for shifting status fields
                let statusStyles = 'bg-green-100 text-green-700 border-green-200';
                if (employee.status === 'Inactive') statusStyles = 'bg-slate-100 text-slate-600 border-slate-200';
                if (employee.status === 'On Break') statusStyles = 'bg-yellow-100 text-yellow-700 border-yellow-200';

                return (
                  <div key={employee.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-gray-50/40 transition-colors group">
                    
                    {/* Employee Profile Metadata */}
                    <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-600 uppercase shadow-inner shrink-0">
                        {employee.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-gray-800 text-sm md:text-base group-hover:text-green-700 transition-colors truncate">{employee.name}</h4>
                        <p className="text-xs text-gray-400 font-medium truncate">{employee.email}</p>
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div className="col-span-4 md:col-span-3 font-semibold text-gray-500 text-xs md:text-sm truncate">
                      {employee.phone || 'No phone recorded'}
                    </div>

                    {/* Role Tag Pill */}
                    <div className="col-span-3 md:col-span-2 flex justify-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${roleStyles}`}>
                        {employee.role}
                      </span>
                    </div>

                    {/* Shifting State Status Badge */}
                    <div className="col-span-12 md:col-span-2 flex md:justify-center items-center justify-between mt-2 md:mt-0 pt-2 md:pt-0 border-t border-gray-100 md:border-none">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider md:hidden">Shift Status:</span>
                      <span className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wide ${statusStyles}`}>
                        {employee.status}
                      </span>
                    </div>

                    {/* Action Execution Row */}
                    <div className="col-span-12 md:col-span-1 flex items-center justify-end gap-1.5 mt-3 md:mt-0 pt-3 md:pt-0 border-t border-gray-100 md:border-none">
                      <button onClick={() => openEditModal(employee)} className="p-2 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:text-blue-600 shadow-xs active:scale-95 transition-transform flex-1 md:flex-initial flex justify-center">
                        ✏️
                      </button>
                      <button onClick={() => handleDeleteEmployee(employee.id, employee.name)} className="p-2 rounded-xl border border-gray-200 bg-white hover:border-red-300 hover:text-red-600 shadow-xs active:scale-95 transition-transform flex-1 md:flex-initial flex justify-center">
                        🗑️
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* --- SHEET POPUP ADMINISTRATIVE MODAL OVERLAY --- */}
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
              <h2 className="text-xl font-black text-gray-800 capitalize">{modalMode} Employee File</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold">✕</button>
            </div>

            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden" placeholder="e.g. Juan Dela Cruz" />
              </div>

              {/* Contact Information Group Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email Address</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden" placeholder="juan@gmail.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Phone Number</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden" placeholder="09123456789" />
                </div>
              </div>

              {/* Structural System Access Settings Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Designated Role</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Initial Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Terminal Encryption Secure Access Key PIN input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Terminal Session PIN {modalMode === 'edit' && <span className="text-[10px] text-gray-400 lowercase italic">(Leave blank to keep current)</span>}
                </label>
                <input 
                  type="password" 
                  maxLength={4}
                  pattern="\d*"
                  value={formData.pin} 
                  onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })} 
                  className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-bold tracking-widest outline-hidden" 
                  placeholder="••••" 
                />
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Provide a secure 4-digit terminal override access key.</p>
              </div>
            </div>

            <button type="submit" className="w-full mt-6 bg-gray-900 hover:bg-black text-white p-4 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all active:scale-98">
              {modalMode === 'add' ? 'Onboard Employee File' : 'Save System Changes'}
            </button>
          </form>
        </div>
      )}
    </MainLayout>
  );
}