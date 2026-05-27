import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import { ThemeToggle } from './ThemeToggle';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Map as MapIcon,
  Sparkle,
  UsersRound,
  ShoppingBag,
  ShieldCheck,
  Server,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const SidebarItem = ({ icon: Icon, label, to, active, onClick }: { icon: any, label: string, to: string, active: boolean, onClick?: () => void }) => {
  const unreadCounts = useChatStore((state) => state.unreadCounts);

  const count = to === '/messages'
    ? Object.values(unreadCounts).reduce((sum, c) => sum + c, 0)
    : 0;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${active
        ? 'bg-strawberry-600 text-white shadow-lg shadow-strawberry-600/30 scale-[1.02]'
        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white'
        }`}
    >
      <div className="relative">
        <Icon size={22} className={`${active ? 'text-white' : 'group-hover:text-strawberry-500'} transition-colors`} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </div>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </Link>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile, signOut } = useAuthStore();
  const unreadCounts = useChatStore((state) => state.unreadCounts);

  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const menuGroups = [
    {
      title: 'Explore',
      items: [
        { icon: MapIcon, label: 'Live Map', to: '/dynamap' },
        { icon: Calendar, label: 'Events', to: '/events' },
        { icon: Server, label: 'Server Info', to: '/server-info' },
        { icon: ShieldCheck, label: 'Rules', to: '/rules' },
        { icon: Info, label: 'Help', to: '/help' },
      ]
    },
    {
      title: 'Community',
      items: [
        { icon: UsersRound, label: 'Members', to: '/members' },
        { icon: ShoppingBag, label: 'Shops', to: '/shops' },
        { icon: MessageSquare, label: 'Messages', to: '/messages', unreadCount: totalUnread },
        { icon: Sparkle, label: 'Suggestions', to: '/suggestions' },
        { icon: User, label: 'Profile', to: '/profile' },
      ]
    }
  ];
  if (profile?.role === 'admin') {
    menuGroups.push({
      title: 'Administration',
      items: [{ icon: Settings, label: 'Admin Panel', to: '/admin' }]
    });
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-strawberry-500/30">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-neutral-200 dark:border-white/5 bg-white/80 dark:bg-neutral-900/50 backdrop-blur-xl p-6 fixed h-screen z-50 transition-all duration-300">
        <div className="flex items-center gap-3 px-2 py-4 mb-8">
          <motion.div
            whileHover={{ rotate: 15 }}
            className="p-2.5 bg-strawberry-600 rounded-2xl text-white shadow-lg shadow-strawberry-600/30 flex items-center justify-center shrink-0"
          >
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          </motion.div>
          <span style={{ fontFamily: "'Genty', serif" }} className="text-xl font-black italic tracking-tighter text-neutral-900 dark:text-white flex-1 min-w-0">
            Strawberry<span className="text-strawberry-600">SMP</span>
          </span>
          <div className="hidden lg:flex items-center shrink-0 -mr-1">
            <NotificationCenter />
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto pr-2 -mr-2 hide-scrollbar">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <h4 className="px-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2 flex items-center gap-2">
                {group.title === 'Explore' && <LayoutDashboard size={12} />}
                {group.title === 'Community' && <UsersRound size={12} />}
                {group.title === 'Administration' && <Settings size={12} />}
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.to}
                    icon={item.icon}
                    label={item.label}
                    to={item.to}
                    active={location.pathname === item.to}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-white/5">
          <div className="flex items-center gap-4 p-4 mb-4 bg-neutral-100 dark:bg-white/5 rounded-[2rem] border border-transparent dark:hover:border-white/10 transition-all group">
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-neutral-200 dark:bg-neutral-800 border-2 border-white dark:border-neutral-900 flex items-center justify-center overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User size={24} className="text-neutral-500" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-black italic uppercase tracking-tight truncate">{profile?.username || 'Player'}</span>
              <span className="text-[10px] font-bold text-strawberry-600 uppercase tracking-widest">{profile?.role || 'Member'}</span>
            </div>
            <ThemeToggle />
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-3 w-full px-4 py-4 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/5 rounded-2xl transition-all font-bold text-sm uppercase tracking-widest italic"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-white/5 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-strawberry-600 rounded-xl text-white shadow-lg shadow-strawberry-600/20">
            <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <span style={{ fontFamily: "'Genty', serif" }} className="text-xl font-black italic tracking-tighter text-neutral-900 dark:text-white flex-1 min-w-0">
            Strawberry<span className="text-strawberry-600">SMP</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-600 dark:text-neutral-400 active:scale-95 transition-transform"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[85%] max-w-xs z-[80] bg-white dark:bg-neutral-900 flex flex-col p-6 shadow-2xl border-r border-neutral-200 dark:border-white/5"
            >
              <div className="flex items-center gap-4 mb-10 pt-4">
                <div className="p-2.5 bg-strawberry-600 rounded-2xl text-white shadow-lg shadow-strawberry-600/30">
                  <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                </div>
                <span style={{ fontFamily: "'Genty', serif" }} className="text-xl font-black italic tracking-tighter text-neutral-900 dark:text-white flex-1 min-w-0">
                  Strawberry<span className="text-strawberry-600">SMP</span>
                </span>              </div>

              <nav className="flex-1 space-y-6 overflow-y-auto hide-scrollbar">
                {menuGroups.map((group) => (
                  <div key={group.title}>
                    <h4 className="px-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">{group.title}</h4>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${location.pathname === item.to
                            ? 'bg-strawberry-600 text-white shadow-lg shadow-strawberry-600/30'
                            : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                            }`}
                        >
                          <item.icon size={22} />
                          <span className="text-sm font-bold tracking-tight uppercase italic">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-white/5 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-white/5 rounded-3xl">
                  <div className="h-12 w-12 rounded-2xl bg-neutral-200 dark:bg-neutral-800 border-2 border-white dark:border-neutral-900 flex items-center justify-center overflow-hidden shadow-md">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User size={24} className="text-neutral-500" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-black italic uppercase tracking-tight truncate dark:text-white">{profile?.username || 'Player'}</span>
                    <span className="text-[10px] font-bold text-strawberry-600 uppercase tracking-widest">{profile?.role || 'Member'}</span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-3 w-full px-4 py-4 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-2xl transition-all font-bold text-sm uppercase tracking-widest italic"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pt-20 lg:pt-0 relative z-10 transition-all duration-300 min-w-0 overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto p-3 sm:p-6 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;