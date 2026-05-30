import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import type { Notification } from '../types/database.types';
import {
  Bell,
  Check,
  Clock,
  AlertCircle,
  Calendar,
  MessageSquare,
  Megaphone,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch (type) {
    case 'event': return <Calendar size={18} className="text-blue-500" />;
    case 'message': return <MessageSquare size={18} className="text-green-500" />;
    case 'announcement': return <Megaphone size={18} className="text-strawberry-500" />;
    default: return <AlertCircle size={18} className="text-neutral-500" />;
  }
};

const NotificationsPage = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const data = await dbService.getNotifications(profile.id);
      setNotifications(data as Notification[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchNotifications();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchNotifications]);

  const handleCardClick = async (notification: Notification) => {
    // Mark as read first
    if (!notification.is_read) {
      try {
        await dbService.markNotificationRead(notification.id);
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
      } catch (err) {
        console.error(err);
      }
    }
    // Navigate if there's a link
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await dbService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => dbService.markNotificationRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-neutral-900 dark:text-neutral-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Notifications</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Stay updated with the latest activity.</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-sm font-bold text-strawberry-600 dark:text-strawberry-500 hover:text-strawberry-700 dark:hover:text-strawberry-400 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-neutral-100 dark:bg-neutral-900 rounded-2xl animate-pulse" />
          ))
        ) : notifications.length > 0 ? (
          notifications.map((notification, i) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleCardClick(notification)}
              className={`p-4 rounded-2xl border flex items-start gap-4 transition-all group
                ${notification.link ? 'cursor-pointer' : 'cursor-default'}
                ${notification.is_read
                  ? 'bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 opacity-60 hover:opacity-80'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-lg hover:border-strawberry-500/30 hover:bg-neutral-50 dark:hover:bg-neutral-800/80'
                }`}
            >
              <div className={`p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 shrink-0 ${!notification.is_read && 'ring-1 ring-strawberry-500/50'}`}>
                <NotificationIcon type={notification.type} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm ${!notification.is_read ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-300'}`}>
                  {notification.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">{notification.message}</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                  <Clock size={10} />
                  <span>{new Date(notification.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!notification.is_read && (
                  <button
                    type="button"
                    onClick={(e) => handleMarkRead(e, notification.id)}
                    className="p-2 text-neutral-500 hover:text-strawberry-600 dark:hover:text-strawberry-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-all"
                    title="Mark as read"
                  >
                    <Check size={18} />
                  </button>
                )}
                {notification.link && (
                  <ChevronRight size={16} className="text-neutral-400 dark:text-neutral-600 group-hover:text-neutral-900 dark:group-hover:text-neutral-400 transition-colors" />
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-12 rounded-2xl text-center">
            <Bell className="mx-auto text-neutral-400 dark:text-neutral-700 mb-4" size={48} />
            <p className="text-neutral-600 dark:text-neutral-500 text-lg">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;