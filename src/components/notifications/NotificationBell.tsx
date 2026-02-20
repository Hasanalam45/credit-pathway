/**
 * Notification Bell Component
 * Displays notification icon with unread count badge in the header
 */

import React, { useState } from "react";
import { FiBell } from "react-icons/fi";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";

const NotificationBell: React.FC = () => {
  const { unreadCounts } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCounts.total > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {unreadCounts.total > 9 ? "9+" : unreadCounts.total}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-40">
            <NotificationDropdown onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
