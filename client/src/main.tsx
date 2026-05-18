import React from 'react';
import ReactDOM from 'react-dom/client'; // <-- This fixes the ReactDOM error
import App from './App';                 // <-- This fixes the App error
import { AuthProvider } from './context/AuthContext';
import './index.css'; // (Or wherever your Tailwind CSS is imported)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);