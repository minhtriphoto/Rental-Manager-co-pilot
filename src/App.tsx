/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './lib/store';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Rooms } from './pages/Rooms';
import { Tenants } from './pages/Tenants';
import { Contracts } from './pages/Contracts';
import { Billing } from './pages/Billing';
import { Utilities } from './pages/Utilities';
import { Maintenance } from './pages/Maintenance';
import { Finance } from './pages/Finance';
import { Debts } from './pages/Debts';
import { Assets } from './pages/Assets';
import { Reminders } from './pages/Reminders';
import { AiAssistant } from './pages/AiAssistant';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { Buildings } from './pages/Buildings';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="ai-assistant" element={<AiAssistant />} />
            <Route path="buildings" element={<Buildings />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="finance" element={<Finance />} />
            <Route path="billing" element={<Billing />} />
            <Route path="utilities" element={<Utilities />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="debts" element={<Debts />} />
            <Route path="assets" element={<Assets />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
