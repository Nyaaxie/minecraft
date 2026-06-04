import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { dbService } from '../services/dbService';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useNavigate } from 'react-router-dom';
import { Bell, Info, Calendar, Megaphone, Server, MessageSquare, ShoppingBag } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuthStore();
  const { unreadCounts } = useChatStore();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const instanceId = useMemo(() => Math.random().toString(36).substring(7), []);
  const totalUnreadMessages = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // ✅ Detect mobile vs desktop to flip dropdown direction
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      case 'event': return <Calendar size={15} className="text-strawberry-500" />;
      case 'announcement': return <Megaphone size={15} className="text-strawberry-500" />;
      case 'system': return <Server size={15} className="text-strawberry-500" />;
      case 'message': return <MessageSquare size={15} className="text-strawberry-500" />;
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
          className="relative flex items-center justify-center w-10 h-10 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 rounded-2xl transition-all border border-neutral-200 dark:border-white/5 shadow-sm"
        >
          <Bell size={20} className="text-neutral-600 dark:text-neutral-400" />
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
              // ✅ FIX: right-0 on mobile (bell is top-right of header)
              //         left-0 on desktop (bell is bottom-right of sidebar, opens into content)
              className={`absolute mt-3 w-[calc(100vw-2rem)] max-w-sm lg:w-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] shadow-2xl overflow-hidden ${isMobile ? 'right-0' : 'left-0'
                }`}
              style={{ zIndex: 9999 }}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-strawberry-500" />
                  <h3 className="font-black text-xs uppercase tracking-widest italic text-neutral-900 dark:text-white">
                    Notifications
                  </h3>
                </div>
                {unreadSystemCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-strawberry-600 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Scrollable list */}
              <div className="notif-scroll max-h-[26rem] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-400">
                    <div className="w-12 h-12 bg-neutral-100 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                      <Bell size={24} className="opacity-20" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest italic">All caught up</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`
                        relative flex items-start gap-3.5 px-5 py-4 cursor-pointer
                        transition-all duration-200
                        hover:bg-neutral-50 dark:hover:bg-white/[0.03]
                        ${i !== notifications.length - 1 ? 'border-b border-neutral-100 dark:border-white/5' : ''}
                        ${n.is_read ? 'opacity-40' : ''}
                      `}
                    >
                      {/* Unread indicator */}
                      {!n.is_read && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-strawberry-600 rounded-r-full" />
                      )}

                      {/* Icon */}
                      <div className="mt-0.5 shrink-0 w-8 h-8 rounded-xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center border border-neutral-200 dark:border-white/5">
                        {getIcon(n.type, n.message)}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black italic uppercase tracking-tight text-neutral-900 dark:text-white leading-tight truncate">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed font-bold">
                          {n.message}
                        </p>
                        <p className="text-[9px] text-neutral-300 dark:text-neutral-600 mt-1.5 font-black uppercase tracking-widest">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default NotificationCenter;