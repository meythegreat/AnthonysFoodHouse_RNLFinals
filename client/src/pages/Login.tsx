import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useTable } from '../context/TableContext';
import axios from '../services/axiosConfig';
import logo from '../assets/anthonys-logo.png';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { refreshTables } = useTable();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post('/api/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('employee', JSON.stringify(response.data.employee));
      }

      await refreshTables();

      showToast('Authentication successful. Welcome back!', 'success');
      navigate('/pos');
    } catch (error: any) {
      showToast(
        error.response?.data?.message || 'Invalid credentials. Please try again.', 
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50 text-gray-800">
      
      {/* LEFT SIDE: Brand & Imagery */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop" 
          alt="Anthony's Food House Kitchen" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay transform scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-end p-16 h-full w-full max-w-2xl">
          <div className="w-20 h-1 bg-green-500 mb-8 rounded-full"></div>
          <h1 className="text-5xl font-black text-white mb-6 leading-tight tracking-tight">
            Elevating the <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-green-400 to-emerald-300">
              Dining Experience.
            </span>
          </h1>
          <p className="text-gray-300 text-lg font-medium leading-relaxed max-w-md">
            Welcome to the official management terminal for Anthony's Food House by Ledesma.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 animate-fadeIn">
          
          <div className="flex flex-col items-center mb-10">
            <img src={logo} alt="Logo" className="h-20 w-auto mb-6 drop-shadow-sm" />
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Terminal Login</h2>
            <p className="text-sm text-gray-400 font-medium mt-1">Enter your credentials to access the system</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-semibold text-gray-800 outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400"
                  placeholder="Input email address here"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                4-Digit Access PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  required
                  maxLength={4}
                  inputMode="numeric"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-semibold text-gray-800 outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400 tracking-[0.25em]"
                  placeholder="••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-700 transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-xs font-bold text-green-600 hover:text-green-700 transition-colors">
                Forgot PIN?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full relative overflow-hidden bg-gray-900 text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-gray-900/20 transition-all hover:bg-black active:scale-98 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed mt-4 flex items-center justify-center"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  Authenticating...
                </span>
              ) : (
                'Access Terminal'
              )}
            </button>

          </form>
          
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by RNL Systems</p>
          </div>
        </div>
      </div>
    </div>
  );
}