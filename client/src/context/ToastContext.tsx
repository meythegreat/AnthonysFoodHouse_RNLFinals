import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- Individual Animated Toast Component ---
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 300); // Wait for slide-out animation to finish
  }, [onDismiss]);

  // Automatically trigger dismiss sequence after 4 seconds
  React.useEffect(() => {
    const timer = setTimeout(handleDismiss, 4000);
    return () => clearTimeout(timer);
  }, [handleDismiss]);

  // Type-specific iconography and layout configurations
  const config = {
    success: { bg: 'bg-green-50/95 border-green-200 text-green-900', bar: 'bg-green-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    error: { bg: 'bg-red-50/95 border-red-200 text-red-900', bar: 'bg-red-500', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
    warning: { bg: 'bg-yellow-50/95 border-yellow-200 text-yellow-900', bar: 'bg-yellow-500', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    info: { bg: 'bg-slate-50/95 border-slate-200 text-slate-900', bar: 'bg-slate-600', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  }[toast.type];

  return (
    <div className={`w-80 md:w-96 rounded-2xl shadow-xl backdrop-blur-md border pl-5 pr-4 py-4 relative overflow-hidden transform transition-all duration-300 pointer-events-auto flex items-start gap-3.5 ${config.bg} ${
      isExiting ? 'translate-x-12 opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'
    }`}>
      
      {/* Premium SVG Vector Icon */}
      <svg className="w-6 h-6 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
      </svg>
      
      {/* Alert Metadata text content */}
      <div className="flex-1 pr-2">
        <p className="text-sm font-bold leading-snug tracking-wide select-none">
          {toast.message}
        </p>
      </div>

      {/* Manual Dismiss Trigger Button */}
      <button 
        onClick={handleDismiss}
        className="text-gray-400 hover:text-gray-600 font-bold text-xs p-1 rounded-lg transition-colors"
      >
        ✕
      </button>

      {/* Dynamic Decrementing Visual Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
        <div 
          className={`h-full transition-all linear duration-4000ms ${config.bar} origin-left ${
            isExiting ? 'w-0' : 'w-full animate-toast-progress'
          }`}
          style={{ animation: 'toastProgress 4000ms linear forwards' }}
        />
      </div>
    </div>
  );
}

// --- Main Queue Provider Framework ---
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Overlay Queue Dock Station - Stacks notifications upward column-reversely */}
      <div className="fixed top-6 right-6 z-100 flex flex-col gap-3 pointer-events-none max-w-full">
        {toasts.map(toast => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onDismiss={() => removeToast(toast.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}