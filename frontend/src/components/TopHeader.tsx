import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, Clock, PackageCheck, ReceiptText, TriangleAlert } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { loadNotifications, markAllNotificationsRead, markNotificationRead, type BackendNotification } from '../services/api';

const getNotificationIcon = (notification: BackendNotification) => {
  if (notification.severity === 'warning') return TriangleAlert;
  if (notification.severity === 'success') return CheckCircle;
  if (notification.channel === 'inventory') return PackageCheck;
  return ReceiptText;
};

const getIconClassName = (notification: BackendNotification) => {
  if (notification.severity === 'warning') return 'text-orange-600 bg-orange-50';
  if (notification.severity === 'error') return 'text-red-600 bg-red-50';
  if (notification.severity === 'success') return 'text-green-600 bg-green-50';
  return 'text-blue-600 bg-blue-50';
};

const formatRelativeTime = (dateText: string) => {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(dateText).getTime()) / 1000));
  if (diffSeconds < 60) return 'now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

export function TopHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const notificationCount = notifications.length;

  const refreshNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const nextNotifications = await loadNotifications(true);
      setNotifications(nextNotifications.slice(0, 20));
    } catch (error) {
      console.warn('Unable to load notifications.', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    refreshNotifications();

    // try websocket for real-time notifications (fall back to polling)
    let socket: WebSocket | null = null;
    const wsUrl = (() => {
      try {
        const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
        const origin = window.location.origin;
        return origin.replace(/^http/, 'ws') + '/ws/notifications/';
      } catch {
        return '';
      }
    })();

    if (wsUrl) {
      try {
        socket = new WebSocket(wsUrl);
        socket.addEventListener('message', () => {
          refreshNotifications();
        });
        socket.addEventListener('error', () => {
          // ignore and rely on polling
        });
      } catch (e) {
        socket = null;
      }
    }

    const timer = window.setInterval(refreshNotifications, 8000);
    window.addEventListener('pos:notifications-changed', refreshNotifications);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pos:notifications-changed', refreshNotifications);
      if (socket) {
        try { socket.close(); } catch {}
      }
    };
  }, []);

  const handleMarkRead = async (notificationId: number) => {
    setNotifications(previousNotifications => previousNotifications.filter(notification => notification.id !== notificationId));
    try {
      await markNotificationRead(notificationId);
    } catch (error) {
      console.warn('Unable to mark notification read.', error);
      refreshNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    const previousNotifications = notifications;
    setNotifications([]);
    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.warn('Unable to mark all notifications read.', error);
      setNotifications(previousNotifications);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-8 sm:py-4">
      <div />

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="hidden items-center gap-2 text-gray-700 sm:flex">
          <Clock className="w-4 h-4" />
          <div className="text-sm">
            <div className="font-semibold text-base">{formatTime(currentTime)}</div>
            <div className="text-xs text-gray-500">{formatDate(currentTime)}</div>
          </div>
        </div>

        <Popover onOpenChange={(open) => open && refreshNotifications()}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-red-500 p-0 text-xs hover:bg-red-600"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="mr-2 w-[calc(100vw-1rem)] max-w-sm border-gray-200 bg-white p-0 sm:mr-0 sm:w-96">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">
                  {isLoadingNotifications ? 'Refreshing...' : notificationCount > 0 ? `${notificationCount} unread updates` : 'No unread updates'}
                </p>
              </div>
              {notificationCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="h-8 px-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Mark all read
                </Button>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto sm:max-h-80">
              {notificationCount > 0 ? (
                notifications.map((notification) => {
                  const NotificationIcon = getNotificationIcon(notification);

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleMarkRead(notification.id)}
                      className="flex w-full gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                    >
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${getIconClassName(notification)}`}>
                        <NotificationIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <span className="whitespace-nowrap text-xs text-gray-400">{formatRelativeTime(notification.created_at)}</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-gray-600">{notification.message}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <Bell className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">You're all caught up</p>
                  <p className="mt-1 text-xs text-gray-500">New backend updates will appear here automatically.</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
