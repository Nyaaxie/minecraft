import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { dbService } from '../services/dbService';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, Info, Calendar, Megaphone, Server, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'event' | 'announcement' | 'message' | 'system';
  is_read: boolean;
  created_at: string;
  profile_id: string;
  link?: string | null;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const { unreadCounts } = useChatStore();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const totalUnreadMessages = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await dbService.getNotifications(user.id);
      setNotifications(data as Notification[]);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${user.id}`,
        },
        (_payload) => {
          const newNotification = _payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          toast.success(`New Notification: ${newNotification.title}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, user]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = async (n: Notification) => {
    await markRead(n.id);
    if (n.link) {
      navigate(n.link);
      setIsOpen(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await dbService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const unreadSystemCount = notifications.filter(n => !n.is_read).length;
  const totalAlerts = unreadSystemCount + totalUnreadMessages;

  const getIcon = (type: string) => {
    switch (type) {
      case 'event': return <Calendar size={16} className="text-blue-500" />;
      case 'announcement': return <Megaphone size={16} className="text-strawberry-500" />;
      case 'system': return <Server size={16} className="text-purple-500" />;
      case 'message': return <MessageSquare size={16} className="text-green-500" />;
      default: return <Info size={16} className="text-neutral-500" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
      >
        <Bell size={20} className="text-neutral-600 dark:text-neutral-400" />
        {totalAlerts > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-strawberry-600 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
            {totalAlerts > 9 ? '9+' : totalAlerts}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100"
            style={{ zIndex: 9999 }}
          >
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-neutral-900 dark:text-white">
              <h3 className="font-bold">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-500">No notifications.</p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${n.is_read ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(n.type)}
                      <div className="flex-1 text-neutral-900 dark:text-neutral-100">
                        <p className="font-bold text-sm">{n.title}</p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">{n.message}</p>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                          className="text-strawberry-600 dark:text-strawberry-500 cursor-pointer p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;