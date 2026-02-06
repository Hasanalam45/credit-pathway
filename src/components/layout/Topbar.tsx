import React from "react";
import { FiBell, FiUser, FiMenu, FiSun, FiMoon } from "react-icons/fi";
import useTheme from "../../hooks/useTheme";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import ProfileModal from "../../auth/ProfileModal";

interface TopbarProps {
  pageTitle: string;
  onOpenSidebar: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ pageTitle, onOpenSidebar }) => {
  const navigate = useNavigate();
  const { user } = (() => {
    try {
      // avoid hook error if AuthProvider isn't mounted
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useAuth();
    } catch {
      return { user: null } as ReturnType<typeof useAuth>;
    }
  })();

  const [profileOpen, setProfileOpen] = React.useState(false);

  const handleProfileClick = () => {
    if (user?.adminData.role === "support") {
      setProfileOpen(true);
    } else {
      navigate("/settings");
    }
  };

  return (
    <>
      <header className="flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 sm:px-6">
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 lg:hidden dark:bg-gray-800 dark:border-gray-700"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <FiMenu className="h-5 w-5 text-gray-700 dark:text-gray-200" />
        </button>

        <div className="text-xs sm:text-sm">
          <span className="text-gray-400 dark:text-gray-400">Admin</span>
          <span className="mx-1 text-gray-300 dark:text-gray-500">/</span>
          <span className="font-medium text-gray-800 dark:text-gray-100">{pageTitle}</span>
        </div>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme toggle */}
        <ThemeToggle />
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm sm:h-10 sm:w-10 dark:bg-gray-800 dark:border-gray-700"
          aria-label="Notifications"
        >
          <FiBell className="h-4 w-4 text-gray-700 dark:text-gray-200 sm:h-5 sm:w-5" />
        </button>
        <button
          type="button"
          onClick={handleProfileClick}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E6D3BF] sm:h-10 sm:w-10 dark:bg-[#3b2c23]"
          aria-label="Account"
        >
          <FiUser className="h-4 w-4 text-white sm:h-5 sm:w-5" />
        </button>
      </div>
      </header>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
};

export default Topbar;

const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm sm:h-10 sm:w-10 dark:bg-gray-700 dark:border-gray-600"
    >
      {theme === "dark" ? (
        <FiSun className="h-4 w-4 text-yellow-400 sm:h-5 sm:w-5" />
      ) : (
        <FiMoon className="h-4 w-4 text-gray-700 sm:h-5 sm:w-5" />
      )}
    </button>
  );
};
