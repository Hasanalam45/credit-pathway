import React, { useState } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { useAuth } from "../auth/AuthProvider";

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();

  // Redirect to login if not authenticated
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const pathTitleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/users": "Users",
    "/analytics": "Analytics",
    "/reports": "Reports",
    "/content-control": "Content Control",
    "/settings": "Settings",
    "/help": "Help",
  };

  const currentTitle = pathTitleMap[location.pathname] ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-[#F7F5F1] text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Mobile sidebar (overlay) */}
      <Sidebar
        variant="overlay"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar variant="static" />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          pageTitle={currentTitle}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
