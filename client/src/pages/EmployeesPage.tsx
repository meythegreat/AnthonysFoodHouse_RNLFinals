import { useEffect, useState } from 'react';
import axios from '../services/axiosConfig';
import MainLayout from '../layouts/MainLayout';
import { useToast } from '../context/ToastContext';
import { Search, UserPlus, Edit2, Trash2, Users, UserCheck, Coffee, Shield, Phone, Mail, Key, X, Loader2, UserX } from 'lucide-react';

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'Admin' | 'Cashier' | 'Kitchen Staff';
  status: 'Active' | 'Inactive' | 'On Break';
  pin: string | null;
};

const ROLES = ['All', 'Admin', 'Cashier', 'Kitchen Staff'];

export default function EmployeesPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRole, setActiveRole] = useState('All');

  // Modal Control States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Field States
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', role: 'Cashier', status: 'Active', pin: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<Employee[]>('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      showToast('Failed to load employee directory.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', role: 'Cashier', status: 'Active', pin: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setModalMode('edit');
    setEditingId(emp.id);
    setFormData({
      name: emp.name, email: emp.email, phone: emp.phone || '', 
      role: emp.role, status: emp.status, pin: emp.pin || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await axios.post('/api/employees', formData);
        showToast('Team member added successfully!', 'success');
      } else {
        await axios.put(`/api/employees/${editingId}`, formData);
        showToast('Employee profile updated.', 'success');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save record.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you absolutely sure you want to revoke this employee\'s access?')) return;
    try {
      await axios.delete(`/api/employees/${id}`);
      showToast('Employee access revoked.', 'info');
      fetchEmployees();
    } catch (error) {
      showToast('Could not remove employee.', 'error');
    }
  };

  // Summary Metrics
  const totalStaff = employees.length;
  const activeStaff = employees.filter(e => e.status === 'Active').length;
  const onBreakStaff = employees.filter(e => e.status === 'On Break').length;

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = activeRole === 'All' || emp.role === activeRole;
    return matchesSearch && matchesRole;
  });

  return (
    <MainLayout>
      {/* Top Header Panel */}
      <div className="bg-white/80 backdrop-blur-md p-6 md:px-10 md:pt-6 md:pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 border-b border-gray-100 sticky top-0">
         <div>
           <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Team Directory</h1>
           <p className="text-sm text-gray-500 mt-0.5 font-medium">Manage staff roles, access PINs, and shift statuses.</p>
         </div>
         
         <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
             <input 
               type="text" 
               placeholder="Search names or emails..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-full bg-gray-50/50 outline-hidden focus:border-green-500 focus:bg-white text-sm font-medium transition-all"
             />
           </div>
           <button onClick={openAddModal} className="bg-green-600 text-white font-bold px-5 py-2.5 rounded-full shadow-md hover:bg-green-700 transition-all text-sm shrink-0 flex items-center gap-2 active:scale-95 transform">
             <UserPlus className="w-4 h-4" /> Add Member
           </button>
         </div>
      </div>

      <main className="flex-1 overflow-auto p-4 md:p-10 space-y-6 pb-24 md:pb-10">
        
        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="text-blue-600 bg-blue-50 p-3 rounded-xl"><Users className="w-8 h-8" /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Headcount</p>
              <h3 className="text-2xl font-black text-gray-800 mt-0.5">{isLoading ? '...' : totalStaff}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="text-green-600 bg-green-50 p-3 rounded-xl"><UserCheck className="w-8 h-8" /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active on Shift</p>
              <h3 className="text-2xl font-black text-green-600 mt-0.5">{isLoading ? '...' : activeStaff}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="text-orange-500 bg-orange-50 p-3 rounded-xl"><Coffee className="w-8 h-8" /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Currently on Break</p>
              <h3 className="text-2xl font-black text-orange-500 mt-0.5">{isLoading ? '...' : onBreakStaff}</h3>
            </div>
          </div>
        </div>

        {/* Role Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all shrink-0 ${
                activeRole === role ? 'bg-gray-800 border-gray-800 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Enterprise Data Table */}
        <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-5 bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
            <div className="col-span-5 md:col-span-4">Profile & Contact</div>
            <div className="col-span-3 md:col-span-3">System Role</div>
            <div className="col-span-4 md:col-span-3 text-center">Shift Status</div>
            <div className="col-span-12 md:col-span-2 text-right pr-4 hidden md:block">Actions</div>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                 <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-3" />
                 <p className="font-medium text-sm">Compiling staff directory...</p>
               </div>
            ) : filteredEmployees.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-20 text-center text-gray-400 font-medium">
                 <UserX className="w-12 h-12 mb-3 text-gray-300" />
                 <p>No team members found matching these criteria.</p>
               </div>
            ) : (
              filteredEmployees.map(emp => {
                let statusStyles = 'bg-green-100 text-green-700 border-green-200';
                if (emp.status === 'Inactive') statusStyles = 'bg-gray-100 text-gray-600 border-gray-200';
                if (emp.status === 'On Break') statusStyles = 'bg-orange-100 text-orange-700 border-orange-200';

                return (
                  <div key={emp.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-gray-50/40 transition-colors group">
                    
                    {/* 1. Profile Data */}
                    <div className="col-span-5 md:col-span-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-linear-to-tr from-green-500 to-emerald-400 text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm md:text-base group-hover:text-green-700 transition-colors line-clamp-1">{emp.name}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400 font-semibold"><Mail className="w-3 h-3" /> {emp.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. System Role */}
                    <div className="col-span-3 md:col-span-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                        {emp.role === 'Admin' && <Shield className="w-4 h-4 text-purple-500" />}
                        {emp.role !== 'Admin' && <Key className="w-4 h-4 text-gray-400" />}
                        {emp.role}
                      </span>
                    </div>

                    {/* 3. Status Pill */}
                    <div className="col-span-4 md:col-span-3 flex justify-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider flex items-center gap-1.5 ${statusStyles}`}>
                        {emp.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                        {emp.status}
                      </span>
                    </div>

                    {/* 4. Action Buttons */}
                    <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-1.5 mt-2 md:mt-0">
                      <button onClick={() => openEditModal(emp)} className="p-2 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:text-blue-600 shadow-xs active:scale-95 transition-transform">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="p-2 rounded-xl border border-gray-200 bg-white hover:border-red-300 hover:text-red-600 shadow-xs active:scale-95 transition-transform">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* --- ADD/EDIT SHEET MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity cursor-pointer" onClick={() => setIsModalOpen(false)}>
          <form onSubmit={handleFormSubmit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] cursor-default">
            
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-black text-gray-800 capitalize">{modalMode} Employee Profile</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name & Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
                <div className="relative">
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all" placeholder="Juan Dela Cruz" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all" placeholder="juan@anthonys.com" />
                </div>
              </div>

              {/* Grid: Phone & PIN */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all" placeholder="09XX XXX XXXX" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Access PIN (4 Digits)</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" maxLength={4} value={formData.pin} onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })} className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all" placeholder="1234" />
                  </div>
                </div>
              </div>

              {/* Grid: Role & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">System Role</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all">
                    <option value="Admin">Admin</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Kitchen Staff">Kitchen Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Shift Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-medium outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all">
                    <option value="Active">Active</option>
                    <option value="On Break">On Break</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full mt-8 bg-gray-900 hover:bg-black text-white p-4 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all active:scale-98">
              {modalMode === 'add' ? 'Register Employee' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}

    </MainLayout>
  );
}