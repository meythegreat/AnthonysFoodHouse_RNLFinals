import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../services/axiosConfig';
import logo from '../assets/anthonys-logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await axios.get('/sanctum/csrf-cookie');
      const response = await axios.post('/api/login', { email, password });
      login(response.data.user);
      navigate('/pos');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen items-center justify-center bg-linear-to-br from-green-800 via-green-700 to-green-900 p-4 sm:p-8 overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-green-500 opacity-20 blur-[100px]"></div>
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-yellow-500 opacity-20 blur-[100px]"></div>
      
      {/* Optional: Your food background image with a heavy dark overlay */}
      <div className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none" 
           style={{ backgroundImage: "url('/path-to-your-food-bg.jpg')" }}></div>

      {/* Main Login Card - Modern Glass/Premium look */}
      <div className="z-10 w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-md p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 mx-auto transform transition-all">
        
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <img 
            src={logo} 
            alt="Anthony's Food House Logo" 
            className="h-28 w-auto object-contain drop-shadow-md mb-2 transition-transform hover:scale-105" 
          />
          {/* Optional: You can delete this text below if your PNG logo already includes the words "Ledesma Food House" */}
          <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">
            Anthony's Food House by Ledesma
          </h1>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4 text-center text-sm font-medium text-red-600 shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="group">
            <label className="mb-1.5 block text-xs font-bold text-gray-500 uppercase tracking-wide transition-colors group-focus-within:text-green-600">
              Username / Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-gray-800 outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
              placeholder="admin@ledesma.com"
            />
          </div>

          <div className="group">
            <label className="mb-1.5 block text-xs font-bold text-gray-500 uppercase tracking-wide transition-colors group-focus-within:text-green-600">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-gray-800 outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center gap-3 px-1 mt-1">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                id="remember" 
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 checked:border-green-600 checked:bg-green-600 transition-all" 
              />
              <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <label htmlFor="remember" className="text-sm font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 transition-colors">
              Keep me logged in
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full rounded-xl bg-green-600 p-4 text-base font-bold text-white shadow-lg shadow-green-600/30 transition-all hover:bg-green-700 hover:shadow-green-700/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Authenticating...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm font-medium text-gray-500">
            Need access? <a href="#" className="text-green-600 hover:text-green-700 hover:underline transition-all">Contact Admin</a>
          </p>
        </div>
      </div>
    </div>
  );
}