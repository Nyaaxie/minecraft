import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Gamepad2,
  Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, to, active, onClick }: { icon: any, label: string, to: string, active: boolean, onClick?: () => void }) => (
  <Link 
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-strawberry-600 text-white shadow-lg shadow-strawberry-600/20' 
        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile, signOut } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', to: '/dashboard' },
    { icon: MapIcon, label: 'DynaMap', to: '/dynamap' },
    { icon: Calendar, label: 'Events', to: '/events' },
    { icon: MessageSquare, label: 'Messages', to: '/messages' },
    { icon: Bell, label: 'Notifications', to: '/notifications' },
    { icon: User, label: 'Profile', to: '/profile' },
  ];

  if (profile?.role === 'admin') {
    menuItems.push({ icon: Settings, label: 'Admin Panel', to: '/admin' });
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-neutral-950 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-neutral-800 bg-neutral-900/50 backdrop-blur-xl p-4 fixed h-full">
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="p-2 bg-strawberry-600 rounded-lg text-white">
            <img src="/logo.png" alt="Logo" className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Strawberry<span className="text-strawberry-500">SMP</span></span>
        </div>

        <nav className="flex-1 space-y-2 mt-8">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              {...item} 
              active={location.pathname === item.to} 
            />
          ))}
        </nav>

        <div className="mt-auto border-t border-neutral-800 pt-4">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User size={20} className="text-neutral-500" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{profile?.username || 'Player'}</span>
              <span className="text-xs text-neutral-500 capitalize">{profile?.role || 'Player'}</span>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-neutral-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-strawberry-600 rounded text-white">
            <img src="/logo.png" alt="Logo" className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold">Strawberry<span className="text-strawberry-500">SMP</span></span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-neutral-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="lg:hidden fixed inset-0 z-40 bg-neutral-950 pt-16 p-4"
          >
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Link 
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                    location.pathname === item.to 
                      ? 'bg-strawberry-600 text-white' 
                      : 'text-neutral-400'
                  }`}
                >
                  <item.icon size={24} />
                  <span className="text-lg font-medium">{item.label}</span>
                </Link>
              ))}
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-4 text-neutral-400 hover:text-red-400"
              >
                <LogOut size={24} />
                <span className="text-lg font-medium">Sign Out</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
