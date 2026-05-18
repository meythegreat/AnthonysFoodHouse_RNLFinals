import { useEffect, useState } from 'react';
import axios from '../services/axiosConfig';
import MainLayout from '../layouts/MainLayout';
import { useToast } from '../context/ToastContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Coins, ClipboardList, TrendingUp } from 'lucide-react';

type AnalyticsData = {
  summary: { total_sales: number; total_orders: number; average_order_value: number; };
  timeline: Array<{ date: string; revenue: number; order_count: number }>;
  top_products: Array<{ name: string; category: string; total_units_sold: number; total_revenue: number }>;
  order_distribution: Array<{ order_type: string; count: number }>;
};

const TIMEFRAMES = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 }
];

export default function ReportsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(7);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<AnalyticsData>(`/api/analytics/summary?days=${timeframe}`);
      setData(response.data);
    } catch (error) {
      showToast('Could not compile sales intelligence matrices.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const COLORS = ['#16a34a', '#eab308', '#2563eb'];

  return (
    <MainLayout>
      <div className="bg-white/80 backdrop-blur-md p-6 md:px-10 md:pt-6 md:pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 border-b border-gray-100 sticky top-0">
         <div>
           <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Reports & Analytics</h1>
           <p className="text-sm text-gray-500 mt-0.5 font-medium">Real-time business performance summaries for Anthony's Food House.</p>
         </div>
         <div className="flex bg-gray-100 p-1 rounded-xl self-stretch sm:self-auto">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`py-2 px-4 flex-1 sm:flex-none rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                  timeframe === tf.value ? 'bg-white text-gray-800 shadow-md' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tf.label}
              </button>
            ))}
         </div>
      </div>

      <main className="flex-1 overflow-auto p-4 md:p-10 space-y-6 pb-24 md:pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="bg-green-50 p-4 rounded-2xl text-green-600"><Coins className="w-8 h-8" /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Revenue</p>
              <h3 className="text-2xl md:text-3xl font-black text-gray-800 mt-0.5">
                ₱{isLoading ? '...' : (data?.summary.total_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><ClipboardList className="w-8 h-8" /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Orders Processed</p>
              <h3 className="text-2xl md:text-3xl font-black text-gray-800 mt-0.5">
                {isLoading ? '...' : data?.summary.total_orders} Tickets
              </h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="bg-purple-50 p-4 rounded-2xl text-purple-600"><TrendingUp className="w-8 h-8" /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Order Value (AOV)</p>
              <h3 className="text-2xl md:text-3xl font-black text-gray-800 mt-0.5">
                ₱{isLoading ? '...' : (data?.summary.average_order_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-xs lg:col-span-2 flex flex-col">
            <div className="mb-4">
              <h4 className="font-bold text-gray-800 text-base">Revenue Flow Trend</h4>
              <p className="text-xs text-gray-400 font-medium">Daily visualization charts metrics scaling timeline limits.</p>
            </div>
            <div className="w-full flex-1 min-h-70">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium text-sm">Loading visual matrix arrays...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} stroke="#cbd5e1" />
                    <Tooltip 
                      formatter={(value: any) => [`₱${Number(value).toFixed(2)}`, 'Revenue']}
                      labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col">
            <div className="mb-4">
              <h4 className="font-bold text-gray-800 text-base">Channel Distribution</h4>
              <p className="text-xs text-gray-400 font-medium">Fulfillment methods tracking volume allocations.</p>
            </div>
            <div className="w-full flex-1 min-h-70 flex items-center justify-center">
              {isLoading ? (
                <div className="text-gray-400 font-medium text-sm">Loading segments allocation...</div>
              ) : data?.order_distribution.length === 0 ? (
                <div className="text-gray-300 font-bold text-sm text-center">No transactional history available yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.order_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="order_type" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} stroke="#e2e8f0" />
                    <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} stroke="#cbd5e1" allowDecimals={false} />
                    <Tooltip 
                      formatter={(value: any) => [value, 'Tickets Logged']}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={45}>
                      {data?.order_distribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h4 className="font-bold text-gray-800 text-base">Top 5 Best Selling Menu Items</h4>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Highest volume producing elements ranked descendingly by unit volume.</p>
          </div>
          <div className="grid grid-cols-12 gap-4 px-5 py-3.5 bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5 md:col-span-6">Product / Dish Name</div>
            <div className="col-span-3 md:col-span-2 text-center">Units Sold</div>
            <div className="col-span-3 text-right pr-4">Total Revenue</div>
          </div>
          <div className="divide-y divide-gray-100">
            {isLoading ? (
               <div className="p-10 text-center text-gray-400 font-medium text-sm">Compiling item matrix rankings...</div>
            ) : !data || data.top_products.length === 0 ? (
               <div className="p-14 text-center text-gray-400 font-medium text-sm">No transaction items calculated matching choices.</div>
            ) : (
              data.top_products.map((item, index) => (
                <div key={item.name} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-gray-50/30 transition-colors group">
                  <div className="col-span-1 flex justify-center">
                    <span className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center border ${
                      index === 0 ? 'bg-yellow-50 text-yellow-600 border-yellow-200 shadow-inner' :
                      index === 1 ? 'bg-slate-50 text-slate-500 border-slate-200' :
                      index === 2 ? 'bg-orange-50 text-orange-600 border-orange-200' :
                      'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="col-span-5 md:col-span-6">
                    <h5 className="font-bold text-gray-800 text-sm md:text-base group-hover:text-green-600 transition-colors">{item.name}</h5>
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase mt-1 inline-block tracking-wide">
                      {item.category}
                    </span>
                  </div>
                  <div className="col-span-3 md:col-span-2 font-extrabold text-gray-700 text-center text-sm md:text-base">
                    {item.total_units_sold}x
                  </div>
                  <div className="col-span-3 font-black text-green-600 text-right pr-4 text-sm md:text-base">
                    ₱{Number(item.total_revenue).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </MainLayout>
  );
}