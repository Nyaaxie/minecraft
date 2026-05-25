import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { dbService } from '../services/dbService';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, Info, Calendar, Megaphone, Server, MessageSquare, ShoppingBag } from 'lucide-react';
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

const scrollbarStyles = `
  .notif-scroll::-webkit-scrollbar {
    width: 4px;
  }
  .notif-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .notif-scroll::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.08);
    border-radius: 999px;
  }
  .notif-scroll::-webkit-scrollbar-thumb:hover {
    background: #e11d48;
  }
`;

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const { unreadCounts } = useChatStore();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const instanceId = useMemo(() => Math.random().toString(36).substring(7), []);
  const totalUnreadMessages = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await dbService.getNotifications(user.id);
      setNotifications(data as Notification[]);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();

    const channelId = `notifications:${user.id}:${instanceId}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${user.id}`,
      }, (_payload) => {
        const newNotification = _payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        toast.success(`New Notification: ${newNotification.title}`);
      });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, instanceId, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = async (n: Notification) => {
    await markRead(n.id);
    if (n.link) { navigate(n.link); setIsOpen(false); }
  };

  const markRead = async (id: string) => {
    try {
      await dbService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    try {
      await dbService.markAllNotificationsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadSystemCount = notifications.filter(n => !n.is_read).length;
  const totalAlerts = unreadSystemCount + totalUnreadMessages;

  const getIcon = (type: string, message: string = '') => {
    const msg = message || '';
    if (msg.toLowerCase().includes('sold') || msg.toLowerCase().includes('purchase')) {
      return <ShoppingBag size={15} className="text-strawberry-500" />;
    }
    switch (type) {
      case 'event': return <Calendar size={15} className="text-blue-500" />;
      case 'announcement': return <Megaphone size={15} className="text-strawberry-500" />;
      case 'system': return <Server size={15} className="text-purple-500" />;
      case 'message': return <MessageSquare size={15} className="text-green-500" />;
      default: return <Info size={15} className="text-neutral-500" />;
    }
  };

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="relative" ref={containerRef}>
        {/* Bell button */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="relative flex items-center justify-center w-9 h-9 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-2xl transition-colors"
        >
          <Bell size={18} className="text-neutral-600 dark:text-neutral-400" />
          {totalAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-strawberry-600 rounded-full text-[9px] flex items-center justify-center text-white font-bold border-2 border-white dark:border-neutral-900">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 lg:right-auto lg:left-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
              style={{ zIndex: 9999 }}
            >
              {/* Header */}
              <div className="px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-strawberry-500" />
                  <h3 className="font-black text-sm uppercase tracking-widest italic text-neutral-900 dark:text-white">
                    Notifications
                  </h3>
                  {totalAlerts > 0 && (
                    <span className="px-1.5 py-0.5 bg-strawberry-500/10 text-strawberry-600 text-[9px] font-black rounded-md uppercase tracking-wider">
                      {totalAlerts} new
                    </span>
                  )}
                </div>
                {unreadSystemCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-strawberry-600 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Scrollable list */}
              <div className="notif-scroll max-h-[22rem] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-neutral-400">
                    <Bell size={28} className="opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">All caught up</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`
                        relative flex items-start gap-3 px-4 py-3.5 cursor-pointer
                        transition-colors duration-150
                        hover:bg-neutral-50 dark:hover:bg-white/5
                        ${i !== notifications.length - 1 ? 'border-b border-neutral-100 dark:border-white/5' : ''}
                        ${n.is_read ? 'opacity-40' : ''}
                      `}
                    >
                      {/* Unread dot */}
                      {!n.is_read && (
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-strawberry-500 rounded-full" />
                      )}

                      {/* Icon */}
                      <div className="mt-0.5 shrink-0 w-7 h-7 rounded-xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
                        {getIcon(n.type, n.message)}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-neutral-900 dark:text-white leading-snug truncate">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>

                      {/* Mark read */}
                      {!n.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                          className="shrink-0 mt-0.5 p-1 text-neutral-300 hover:text-strawberry-500 hover:bg-strawberry-50 dark:hover:bg-strawberry-500/10 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer fade hint when scrollable */}
              {notifications.length > 4 && (
                <div className="h-6 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent pointer-events-none -mt-6 relative z-10" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default NotificationCenter;