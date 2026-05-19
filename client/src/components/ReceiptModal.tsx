import { Printer } from 'lucide-react';
import logo from '../assets/anthonys-logo.png';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  isReprint?: boolean; // <-- Added this flag
  orderData: {
    orderId?: number | string; // <-- Allow passing the real DB ID
    date?: string;             // <-- Allow passing the historical date
    cart: Array<{ id: number; name: string; price: number; quantity: number }>;
    subTotal: number;
    tax: number;
    total: number;
    taxRate: number;
    orderType: string;
    paymentMethod: string;
    tableNumber: string;
    guestName: string;
    cashierName: string;
  } | null;
  storeSettings: Record<string, string>;
}

export default function ReceiptModal({ isOpen, onClose, orderData, storeSettings, isReprint = false }: ReceiptModalProps) {
  if (!isOpen || !orderData) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Use historical data if it exists, otherwise generate for new POS orders
  const displayDate = orderData.date || currentDate;
  const displayOrderId = orderData.orderId || Math.floor(100000 + Math.random() * 900000);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:bg-white print:p-0 transition-opacity">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:w-[80mm] print:shadow-none print:rounded-none">
        
        <div className="p-6 overflow-y-auto flex-1 text-gray-800 font-mono text-sm print:p-0">
          <div className="text-center mb-6 flex flex-col items-center">
            <img src={logo} alt="Store Logo" className="w-16 h-16 object-contain mb-3 drop-shadow-xs print:grayscale print:contrast-125 print:drop-shadow-none" />
            <h2 className="text-xl font-black uppercase tracking-widest">{storeSettings.store_name || 'Anthony\'s Food House'}</h2>
            <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{storeSettings.store_address || '123 Culinary Ave\nFlavor Town'}</p>
            <p className="text-xs text-gray-500">Tel: {storeSettings.store_phone || '+63 900 000 0000'}</p>
          </div>

          <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 space-y-1 text-xs">
            <div className="flex justify-between"><span>Date:</span> <span>{displayDate}</span></div>
            <div className="flex justify-between"><span>Ticket:</span> <span>#{displayOrderId}</span></div>
            <div className="flex justify-between"><span>Cashier:</span> <span>{orderData.cashierName}</span></div>
            <div className="flex justify-between"><span>Type:</span> <span className="font-bold">{orderData.orderType}</span></div>
            <div className="flex justify-between"><span>Table/Guest:</span> <span>{orderData.tableNumber} / {orderData.guestName}</span></div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-xs font-bold border-b border-gray-200 pb-1">
              <span>QTY ITEM</span>
              <span>AMOUNT</span>
            </div>
            {orderData.cart.map((item, index) => (
              <div key={index} className="text-xs">
                <div className="flex justify-between">
                  <span className="font-bold w-3/4 leading-tight">{item.quantity}x {item.name}</span>
                  <span>₱{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
                <div className="text-gray-400 pl-4">@ ₱{Number(item.price).toFixed(2)} /ea</div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 pt-3 space-y-1 mb-6">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span> <span>₱{Number(orderData.subTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>VAT ({(orderData.taxRate * 100).toFixed(0)}%)</span> <span>₱{Number(orderData.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-black pt-2">
              <span>TOTAL</span> <span>₱{Number(orderData.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <span>Paid via:</span> <span className="uppercase font-bold">{orderData.paymentMethod}</span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 mt-8 mb-4">
            {/* Added Reprint Watermark */}
            {isReprint && <p className="font-black text-gray-800 mb-2 tracking-widest uppercase">*** REPRINT ***</p>}
            <p className="font-bold italic">{storeSettings.receipt_footer || 'Thank you for dining with us!'}</p>
            <p className="mt-2 text-[9px] uppercase tracking-widest text-gray-400">Powered by RNL Systems</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 print:hidden shrink-0">
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md">
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          <button onClick={onClose} className="flex items-center justify-center px-4 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-all active:scale-95">
            {isReprint ? 'Close' : 'New Order'}
          </button>
        </div>
      </div>
    </div>
  );
}