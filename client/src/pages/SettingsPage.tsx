import { useEffect, useState } from 'react';
import axios from '../services/axiosConfig';
import MainLayout from '../layouts/MainLayout';
import { useToast } from '../context/ToastContext';

type ActiveTab = 'store' | 'finance';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('store');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Core Functional Settings State Binder
  const [settings, setSettings] = useState({
    store_name: '',
    store_phone: '',
    store_address: '',
    tax_rate: '0',
    receipt_footer: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get<Record<string, string>>('/api/settings');
      // Set values or fallback to empty strings to avoid uncontrolled inputs
      setSettings({
        store_name: response.data.store_name || '',
        store_phone: response.data.store_phone || '',
        store_address: response.data.store_address || '',
        tax_rate: response.data.tax_rate || '0',
        receipt_footer: response.data.receipt_footer || '',
      });
    } catch (error) {
      showToast('Could not compile operational defaults.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: keyof typeof settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.post('/api/settings/bulk', settings);
      showToast('System variables updated and synced successfully!', 'success');
    } catch (error) {
      showToast('Failed to overwrite system parameters.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      {/* Top Configuration Sticky Panel */}
      <div className="bg-white/80 backdrop-blur-md p-6 md:px-10 md:pt-6 md:pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 border-b border-gray-100 sticky top-0">
         <div>
           <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">System Settings</h1>
           <p className="text-sm text-gray-500 mt-0.5 font-medium">Fine-tune restaurant variable rates, receipt headers, and store defaults.</p>
         </div>
      </div>

      <main className="flex-1 overflow-auto p-4 md:p-10 pb-24 md:pb-10 max-w-4xl w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <svg className="animate-spin h-8 w-8 text-green-500 mb-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="font-medium text-sm">Syncing environment system files...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            
            {/* Left Nav Tabs Layout Guide Bar */}
            <div className="w-full md:w-64 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100 p-4 space-y-1.5 shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
              <button
                type="button"
                onClick={() => setActiveTab('store')}
                className={`flex items-center gap-3 w-full text-left py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap md:whitespace-normal ${
                  activeTab === 'store' 
                    ? 'bg-gray-800 border border-gray-800 text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <span className="text-base">🏢</span> Store Identity
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab('finance')}
                className={`flex items-center gap-3 w-full text-left py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap md:whitespace-normal ${
                  activeTab === 'finance' 
                    ? 'bg-gray-800 border border-gray-800 text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <span className="text-base">🪙</span> Financials & Receipts
              </button>
            </div>

            {/* Right Dynamic Config View Panels */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
              
              {/* Tab 1: Store Properties Structure */}
              {activeTab === 'store' && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Store Profile Identity</h3>
                    <p className="text-xs text-gray-400 font-semibold">Configure outward-facing text configurations for digital headers.</p>
                  </div>
                  <hr className="border-gray-100" />

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Business Outlet Name</label>
                      <input 
                        type="text" 
                        required
                        value={settings.store_name}
                        onChange={e => handleInputChange('store_name', e.target.value)}
                        className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-semibold text-gray-700 outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Store Hotline Contact</label>
                      <input 
                        type="text" 
                        value={settings.store_phone}
                        onChange={e => handleInputChange('store_phone', e.target.value)}
                        className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-semibold text-gray-700 outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Physical Store Address</label>
                      <textarea 
                        rows={3}
                        value={settings.store_address}
                        onChange={e => handleInputChange('store_address', e.target.value)}
                        className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-semibold text-gray-700 outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Tax & Receipt Parameters */}
              {activeTab === 'finance' && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Financial Parameters & Printers</h3>
                    <p className="text-xs text-gray-400 font-semibold">Tweak default taxation variables and paper ticket sign-offs.</p>
                  </div>
                  <hr className="border-gray-100" />

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Value Added Tax Rate (VAT %)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.01"
                          required
                          min="0"
                          max="100"
                          value={settings.tax_rate}
                          onChange={e => handleInputChange('tax_rate', e.target.value)}
                          className="w-full p-3.5 pr-10 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-bold text-gray-700 outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">%</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold mt-1">This dynamically alters tax calculations inside the POS menu automatically.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Receipt Signature Footer Sign-Off</label>
                      <input 
                        type="text" 
                        value={settings.receipt_footer}
                        onChange={e => handleInputChange('receipt_footer', e.target.value)}
                        className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm font-semibold text-gray-700 outline-hidden focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Execution Panel Save Footer */}
              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end shrink-0">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-98 text-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Syncing Configurations...' : 'Save Configuration Changes'}
                </button>
              </div>

            </div>
          </form>
        )}
      </main>
    </MainLayout>
  );
}