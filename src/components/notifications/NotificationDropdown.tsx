/**
 * Notification Dropdown Component
 * Displays recent notifications in a dropdown menu
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiAlertCircle, FiUserPlus, FiAlertTriangle } from "react-icons/fi";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../auth/AuthProvider";
import type { AdminNotification } from "../../services/notificationService";

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCounts, markAsRead, markAllAsRead } = useNotifications();
  
  // Filter notifications based on admin preferences
  const dashboardAlerts = user?.adminData?.dashboardAlerts;
  const filteredNotifications = notifications.filter(notification => {
    if (!dashboardAlerts) return true;
    return dashboardAlerts[notification.type] === true;
  }).slice(0, 10); // Show only 10 most recent

  const handleNotificationClick = async (notification: AdminNotification) => {
    try {
      if (notification.status === "unread" && user?.firebaseUser?.uid) {
        await markAsRead(notification.id);
      }
      
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
      
      onClose();
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "systemFailure":
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      case "newUserRegistration":
        return <FiUserPlus className="w-5 h-5 text-blue-500" />;
      case "apiError":
        return <FiAlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <FiAlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
          {unreadCounts.total > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {unreadCounts.total} unread
            </p>
          )}
        </div>
        {unreadCounts.total > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <FiCheckCircle className="w-3 h-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <FiAlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No notifications
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  notification.status === "unread"
                    ? "bg-blue-50/50 dark:bg-blue-900/10"
                    : ""
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {notification.title}
                      </p>
                      {notification.status === "unread" && (
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              navigate("/notifications");
              onClose();
            }}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium w-full text-center"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
