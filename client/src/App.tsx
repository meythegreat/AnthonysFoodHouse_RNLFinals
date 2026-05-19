import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import EmployeesPage from './pages/EmployeesPage';
import { ToastProvider } from './context/ToastContext';
import { TableProvider } from './context/TableContext'; // <-- Import
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <ToastProvider>
      <TableProvider> {/* Slots in beautifully right here */}
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Accessible by BOTH Admins and Cashiers */}
            <Route path="/pos" element={
              <ProtectedRoute allowedRoles={['Admin', 'Cashier']}>
                <POSPage />
              </ProtectedRoute>
            } />

            {/* Accessible ONLY by Admins */}
            <Route path="/inventory" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <InventoryPage />
              </ProtectedRoute>
            } />
            
            <Route path="/employees" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <EmployeesPage />
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <ReportsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <SettingsPage />
              </ProtectedRoute>
            } />

            {/* Redirect any unknown URLs to the POS */}
            <Route path="*" element={<Navigate to="/pos" replace />} />
          </Routes>
        </BrowserRouter>
      </TableProvider>
    </ToastProvider>
  );
}