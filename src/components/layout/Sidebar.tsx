import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiBarChart2,
  FiFileText,
  FiSettings,
  FiBookOpen,
  FiHelpCircle,
  FiLogOut,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

const LogoutButton: React.FC<{ variant: SidebarVariant; onClose?: () => void }> = ({ variant, onClose }) => {
 let auth: { logout: () => void } | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    auth = useAuth();
  } catch {
    auth = null;
  }

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (auth?.logout) {
        await auth.logout();
      }
    } catch (err) {
      console.warn("Logout failed", err);
    }
    if (variant === "overlay" && onClose) onClose();
    navigate("/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-800"
    >
      <FiLogOut className="h-4 w-4 text-rose-600 dark:text-rose-300" />
      <span>Logout</span>
    </button>
  );
};

type SidebarVariant = "static" | "overlay";

interface SidebarProps {
  variant: SidebarVariant;
  open?: boolean;
  onClose?: () => void;
}

const navItems = [
  { name: "Dashboard", icon: FiGrid, to: "/dashboard" },
  { name: "Users", icon: FiUsers, to: "/users" },
  { name: "Analytics", icon: FiBarChart2, to: "/analytics" },
  { name: "Reports", icon: FiFileText, to: "/reports" },
  { name: "Content Control", icon: FiBookOpen, to: "/content-control" },
  { name: "Support", icon: FiHelpCircle, to: "/support" },
  { name: "Settings", icon: FiSettings, to: "/settings" },
];

const Sidebar: React.FC<SidebarProps> = ({ variant, open, onClose }) => {
  const location = useLocation();
  // Read current user role to conditionally show nav items
  let userRole: "superadmin" | "support" | null = null;
  try {
    const auth = useAuth();
    const role = auth.user?.adminData.role;
    userRole = role === "superadmin" || role === "support" ? role : null;
  } catch {
    userRole = null;
  }

  const content = (
    <aside className="flex h-full w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 px-4 py-4 shadow-sm">
      {/* Brand */}
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C7F7A] text-white text-sm font-semibold">
          P
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Paramount
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Credit Pathway</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1">
        {navItems
          .filter((it) => {
            // If user role is support, only show Support and Help
            if (userRole === "support") {
              return it.to === "/support";
            }
            // Otherwise show all
            return true;
          })
          .map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#FDF3D7] text-gray-900 dark:bg-[#3b2c23] dark:text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
                onClick={variant === "overlay" ? onClose : undefined}
              >
                <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* Help link at bottom */}
      <div className="mt-8 space-y-2">
        <NavLink
          to="/help"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={variant === "overlay" ? onClose : undefined}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-400 text-[11px] dark:border-gray-600">
            ?
          </span>
          <span>Help</span>
        </NavLink>

        <LogoutButton variant={variant} onClose={onClose} />
      </div>
    </aside>
  );

  // Static (desktop)
  if (variant === "static") return content;

  // Overlay (mobile)
  return (
    <div
      className={`lg:hidden ${open ? "fixed inset-0 z-40" : "hidden"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
        {content}
      </div>
    </div>
  );
};

export default Sidebar;
