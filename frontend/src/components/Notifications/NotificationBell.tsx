import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, AlertCircle, Clock, CheckCircle, UserPlus } from 'lucide-react';
import { notificationService } from '../../services/api.ts';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

// Custom time formatter - no external dependencies
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `${weeks}w ago`;
  } else if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return `${months}mo ago`;
  } else {
    const years = Math.floor(diffDay / 365);
    return `${years}y ago`;
  }
};

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications();
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'task_updated':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'task_completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'task_deleted':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return 'border-l-4 border-blue-500 bg-blue-50/30';
      case 'task_updated':
        return 'border-l-4 border-yellow-500 bg-yellow-50/30';
      case 'task_completed':
        return 'border-l-4 border-green-500 bg-green-50/30';
      case 'task_deleted':
        return 'border-l-4 border-red-500 bg-red-50/30';
      default:
        return 'border-l-4 border-gray-300 bg-gray-50/30';
    }
  };

  const visibleNotifications = showAll ? notifications : notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">You'll see notifications here when tasks are assigned or updated</p>
              </div>
            ) : (
              <>
                {visibleNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-all cursor-pointer ${!notification.is_read ? 'bg-blue-50/30' : ''} ${getNotificationColor(notification.type)}`}
                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-800 text-sm">
                            {notification.title}
                          </p>
                          <div className="flex gap-1 ml-2 flex-shrink-0">
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length > 5 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full p-2 text-center text-sm text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
                  >
                    {showAll ? 'Show less' : `Show ${notifications.length - 5} more notifications`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};