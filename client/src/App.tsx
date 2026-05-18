import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import EmployeesPage from './pages/EmployeesPage';
import { ToastProvider } from './context/ToastContext';
import { TableProvider } from './context/TableContext'; // <-- Import
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <ToastProvider>
      <TableProvider> {/* Slots in beautifully right here */}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </BrowserRouter>
      </TableProvider>
    </ToastProvider>
  );
}