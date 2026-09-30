import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { SiteProvider } from './context/SiteContext.jsx';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import './styles.css';
import './app.css';
import './admin/admin.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SiteProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </SiteProvider>
    </BrowserRouter>
  </StrictMode>
);
