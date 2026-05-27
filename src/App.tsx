import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Clients from './pages/Clients';
import Supplier from './pages/Supplier';
import Templates from './pages/Templates';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const colorSchemeManager = localStorageColorSchemeManager({ key: 'color-scheme' });

export default function App() {
  return (
    <MantineProvider theme={theme} colorSchemeManager={colorSchemeManager} defaultColorScheme="auto">
      <Notifications position="top-right" zIndex={9999} />
      <ModalsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/new" element={<InvoiceDetail />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="clients" element={<Clients />} />
              <Route path="supplier" element={<Supplier />} />
              <Route path="templates" element={<Templates />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  );
}
