/**
 * Notifications Page
 * Full page view for managing admin notifications
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle, FiUserPlus, FiAlertTriangle, FiCheckCircle, FiFilter } from "react-icons/fi";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../auth/AuthProvider";
import { getNotificationTypeLabel } from "../../services/notificationService";
import type { AdminNotification, NotificationType } from "../../services/notificationService";
import Button from "../../components/shared/buttons/Button";

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCounts, markAsRead, markAllAsRead } = useNotifications();
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">("all");

  // Filter notifications based on admin preferences and selected filters
  const dashboardAlerts = user?.adminData?.dashboardAlerts;
  const filteredNotifications = notifications.filter(notification => {
    // Filter by admin preferences
    if (dashboardAlerts && !dashboardAlerts[notification.type]) {
      return false;
    }
    
    // Filter by type
    if (filterType !== "all" && notification.type !== filterType) {
      return false;
    }
    
    // Filter by status
    if (filterStatus !== "all" && notification.status !== filterStatus) {
      return false;
    }
    
    return true;
  });

  const handleNotificationClick = async (notification: AdminNotification) => {
    try {
      if (notification.status === "unread" && user?.firebaseUser?.uid) {
        await markAsRead(notification.id);
      }
      
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {unreadCounts.total > 0
              ? `${unreadCounts.total} unread notification${unreadCounts.total > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCounts.total > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllAsRead}
            leftIcon={<FiCheckCircle className="w-4 h-4" />}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filters:
            </span>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as NotificationType | "all")}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="systemFailure">System Failure</option>
              <option value="newUserRegistration">New User Registration</option>
              <option value="apiError">API Error</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "unread" | "read")}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          {/* Unread Counts */}
          <div className="ml-auto flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                System: {unreadCounts.systemFailure}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                Users: {unreadCounts.newUserRegistration}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                API: {unreadCounts.apiError}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FiAlertCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No notifications to display
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {filterType !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  notification.status === "unread"
                    ? "bg-blue-50/50 dark:bg-blue-900/10"
                    : ""
                }`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </h3>
                          {notification.status === "unread" && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {getNotificationTypeLabel(notification.type)} • {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {notification.message}
                    </p>
                    {notification.errorDetails && (
                      <details className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                          Technical details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                          {notification.errorDetails}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
