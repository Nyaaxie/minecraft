import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { dbService } from '../services/dbService';
import type { Notification } from '../types/database.types';
import { 
  Bell, 
  Check, 
  Clock, 
  AlertCircle,
  Calendar,
  MessageSquare,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!profile) return;
    try {
      const data = await dbService.getNotifications(profile.id);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [profile]);

  const handleMarkRead = async (id: string) => {
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
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-neutral-400 mt-1">Stay updated with the latest activity.</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={handleMarkAllRead}
            className="text-sm font-bold text-strawberry-500 hover:text-strawberry-400 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-20 bg-neutral-900 rounded-2xl animate-pulse" />)
        ) : notifications.length > 0 ? (
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div 
                key={notification.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                  notification.is_read 
                    ? 'bg-neutral-900/50 border-neutral-800 opacity-60' 
                    : 'bg-neutral-900 border-neutral-800 shadow-lg'
                }`}
              >
                <div className={`p-2 rounded-xl bg-neutral-800 ${!notification.is_read && 'ring-1 ring-strawberry-500/50'}`}>
                  <NotificationIcon type={notification.type} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm ${!notification.is_read ? 'text-white' : 'text-neutral-300'}`}>
                    {notification.title}
                  </h3>
                  <p className="text-sm text-neutral-400 mt-0.5">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                    <Clock size={10} />
                    <span>{new Date(notification.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {!notification.is_read && (
                  <button 
                    onClick={() => handleMarkRead(notification.id)}
                    className="p-2 text-neutral-500 hover:text-strawberry-500 hover:bg-strawberry-500/5 rounded-lg transition-all"
                    title="Mark as read"
                  >
                    <Check size={18} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="bg-neutral-900/50 border border-dashed border-neutral-800 p-12 rounded-2xl text-center">
            <Bell className="mx-auto text-neutral-700 mb-4" size={48} />
            <p className="text-neutral-500 text-lg">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
