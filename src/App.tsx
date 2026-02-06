import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";

import DashboardPage from "./pages/dashboard/DashboardPage";
import UsersPage from "./pages/users/UsersPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import ReportsPage from "./pages/reports/ReportsPage";
import ContentControlPage from "./pages/content/ContentControlPage";
import SettingsPage from "./pages/settings/SettingsPage";
import HelpPage from "./pages/help/HelpPage";
import SupportPage from "./pages/support/SupportPage";
import RequireRole from "./auth/RequireRole";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AdminLayout />}>
          {/* default -> dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<RequireRole allowed={["superadmin"]}><UsersPage /></RequireRole>} />
          <Route path="analytics" element={<RequireRole allowed={["superadmin"]}><AnalyticsPage /></RequireRole>} />
          <Route path="reports" element={<RequireRole allowed={["superadmin"]}><ReportsPage /></RequireRole>} />
          <Route path="content-control" element={<RequireRole allowed={["superadmin"]}><ContentControlPage /></RequireRole>} />
          <Route path="settings" element={<RequireRole allowed={["superadmin"]}><SettingsPage /></RequireRole>} />
          <Route path="help" element={<RequireRole allowed={["superadmin"]}><HelpPage /></RequireRole>} />
          <Route path="support" element={<RequireRole allowed={["superadmin","support"]}><SupportPage /></RequireRole>} />
        </Route>
        {/* Fallback for unknown routes: send to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
