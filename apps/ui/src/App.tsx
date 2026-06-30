import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdmin } from './components/RequireAdmin';
import { AdminScansPage } from './pages/AdminScansPage';
import { DashboardPage } from './pages/DashboardPage';
import { JobsPage } from './pages/JobsPage';
import { LoginPage } from './pages/LoginPage';
import { NewScanPage } from './pages/NewScanPage';
import { ScanReportPage } from './pages/ScanReportPage';
import { ScanPrintPage } from './pages/ScanPrintPage';
import { ScansListPage } from './pages/ScansListPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/export/scans/:id/print" element={<ScanPrintPage exportMode />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="scans" element={<ScansListPage />} />
          <Route path="scans/new" element={<NewScanPage />} />
          <Route path="scans/:id" element={<ScanReportPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="admin" element={<AdminScansPage />} />
          </Route>
        </Route>
        <Route path="scans/:id/print" element={<ScanPrintPage />} />
      </Route>
    </Routes>
  );
}
