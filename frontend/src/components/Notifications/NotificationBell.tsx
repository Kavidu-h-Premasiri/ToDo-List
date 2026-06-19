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
        return <UserPlus className="w-5 h-5 text-purple-400" />;
      case 'task_updated':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'task_completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'task_deleted':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return 'border-l-4 border-purple-500 bg-purple-500/5';
      case 'task_updated':
        return 'border-l-4 border-yellow-500 bg-yellow-500/5';
      case 'task_completed':
        return 'border-l-4 border-green-500 bg-green-500/5';
      case 'task_deleted':
        return 'border-l-4 border-red-500 bg-red-500/5';
      default:
        return 'border-l-4 border-gray-500 bg-gray-500/5';
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
        className="relative p-2 text-gray-400 hover:text-purple-400 transition-all duration-300 rounded-xl hover:bg-white/5 border border-transparent hover:border-purple-500/30 group"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_0_80px_-20px_rgba(255,0,255,0.15)] z-50 overflow-hidden flex flex-col animate-slide-up">
          {/* Gradient border glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-20"></div>
          
          {/* Header */}
          <div className="relative flex justify-between items-center p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-cyan-600/10">
            <h3 className="font-bold text-white flex items-center gap-2 font-mono tracking-wider">
              <Bell className="w-4 h-4 text-purple-400" />
              NOTIFICATIONS
              {unreadCount > 0 && (
                <span className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                  {unreadCount} NEW
                </span>
              )}
            </h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 px-2 py-1 hover:bg-purple-500/10 rounded-lg transition-all duration-300 font-mono tracking-wider border border-purple-500/20 hover:border-purple-500/40"
                >
                  <CheckCheck className="w-3 h-3" />
                  MARK ALL
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/5 rounded-lg transition-all duration-300 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="relative flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3 shadow-[0_0_30px_rgba(168,85,247,0.2)]"></div>
                <p className="text-gray-400 font-mono text-sm tracking-wider">LOADING...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/10">
                  <Bell className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-white font-mono tracking-wider">NO NOTIFICATIONS</p>
                <p className="text-xs text-gray-400 font-mono mt-1 tracking-wider">SYSTEM QUIET</p>
              </div>
            ) : (
              <>
                {visibleNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative p-4 border-b border-white/5 hover:bg-white/5 transition-all duration-300 cursor-pointer group/notification ${!notification.is_read ? 'bg-purple-500/5' : ''} ${getNotificationColor(notification.type)}`}
                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-pink-600/0 to-cyan-600/0 group-hover/notification:from-purple-600/5 group-hover/notification:via-pink-600/5 group-hover/notification:to-cyan-600/5 transition-all duration-500"></div>
                    
                    <div className="relative flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-white text-sm font-mono tracking-wider">
                            {notification.title}
                          </p>
                          <div className="flex gap-1 ml-2 flex-shrink-0">
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                              className="text-gray-500 hover:text-red-400 transition-all duration-300 hover:scale-110"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 mt-1 font-mono">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1.5 font-mono tracking-wider">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length > 5 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="relative w-full p-3 text-center text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/5 transition-all duration-300 border-t border-white/10 font-mono tracking-wider group"
                  >
                    <span className="group-hover:tracking-widest transition-all duration-300">
                      {showAll ? 'SHOW LESS' : `VIEW ${notifications.length - 5} MORE`}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        .animate-slide-up {
          animation: slide-up 0.2s ease-out forwards;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        /* Custom scrollbar for notifications */
        .overflow-y-auto::-webkit-scrollbar {
          width: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #06b6d4);
          border-radius: 10px;
        }
        
        /* Smooth transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
      `}</style>
    </div>
  );
};