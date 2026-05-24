import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useEvents } from '../hooks/useEvents';
import { dbService } from '../services/dbService';
import { adminService } from '../services/adminService';
import { useMinecraftVersions } from '../hooks/useMinecraftVersions';
import type { Rule, Reminder } from '../types/database.types';
import { Modal } from '../components/Modal';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  ChevronRight,
  Plus,
  AlertCircle,
  Trash2,
  Loader2,
  Map as MapIcon,
  Box
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, icon: Icon, color = "strawberry" }: { label: string, value: string | number, icon: any, color?: string }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 p-6 rounded-[2rem] shadow-xl shadow-neutral-900/5 transition-all group overflow-hidden relative"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2`} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl bg-neutral-100 dark:bg-white/5 text-${color}-600 group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <span className="text-3xl font-black italic uppercase tracking-tighter">{value}</span>
      </div>
      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{label}</span>
    </div>
  </motion.div>
);

const DashboardPage = () => {
  const { profile } = useAuthStore();
  const { events, refetch } = useEvents();
  const { versions, loading: versionsLoading } = useMinecraftVersions();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPlayers: 0,
    onlinePlayers: 0,
    activeBuffs: 3
  });
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ type: 'rule' | 'reminder', data: Rule | Reminder } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profiles, r, rem] = await Promise.all([
          dbService.getAllProfiles(),
          adminService.getRules(),
          adminService.getReminders(),
        ]);

        if (isMounted) {
          setStats({
            totalPlayers: profiles.length,
            onlinePlayers: profiles.filter(p => p.status === 'online').length,
            activeBuffs: 3
          });
          setRules(r.filter(r => r.is_visible));
          setReminders(rem.filter(rem => !rem.expires_at || new Date(rem.expires_at) > new Date()));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setDeletingId(id);
    try {
      await dbService.deleteEvent(id);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const upcomingEvents = events.filter(e => e.status === 'upcoming').slice(0, 4);

  if (loading || versionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <Loader2 className="animate-spin text-strawberry-600" size={64} />
        <p className="text-neutral-500 font-black uppercase tracking-widest animate-pulse">Syncing with Node...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4 sm:px-6">
      {/* Details Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.data.title || ''}
      >
        <div className="p-6">
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed italic">
            "{selectedItem && (
              selectedItem.type === 'rule'
                ? (selectedItem.data as Rule).content
                : (selectedItem.data as Reminder).message
            )}"
          </p>
        </div>
      </Modal>

      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">
          Overview<span className="text-strawberry-600"></span>
        </h1>
        <p className="text-neutral-500 max-w-2xl font-medium uppercase tracking-tight text-sm">Welcome, <span className="text-strawberry-600 font-bold">{profile?.username || 'Player'}</span>. Oversight and community metrics active.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Database Berries" value={stats.totalPlayers} icon={Users} color="strawberry" />
        <StatCard label="Live Connection" value={stats.onlinePlayers} icon={TrendingUp} color="green" />
        <StatCard label="Pending Events" value={events.filter(e => e.status === 'upcoming').length} icon={Calendar} color="blue" />
        <StatCard label="Node Status" value="Active" icon={Clock} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <Calendar size={24} className="text-strawberry-600" />
              Upcoming Events
            </h2>
            <Link to="/events" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-strawberry-600 transition-colors flex items-center gap-2">
              All Operations <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  whileHover={{ x: 5 }}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 p-6 rounded-[2rem] flex flex-col sm:flex-row sm:items-center gap-6 group transition-all hover:border-strawberry-500/30 shadow-xl shadow-neutral-900/5"
                >
                  <div className="h-16 w-16 rounded-2xl bg-neutral-100 dark:bg-white/5 text-strawberry-600 flex flex-col items-center justify-center border-2 border-white dark:border-neutral-800 shadow-md">
                    <span className="text-[10px] font-black uppercase leading-none mb-1">{new Date(event.start_time).toLocaleString('en-US', { month: 'short' })}</span>
                    <span className="text-2xl font-black italic leading-none">{new Date(event.start_time).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black italic uppercase tracking-tight truncate group-hover:text-strawberry-600 transition-colors">{event.title}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1 italic">"{event.description || 'Accessing mission details...'}"</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-0 border-neutral-100 dark:border-white/5">
                    <div className="text-left sm:text-right">
                      <span className="text-[8px] font-black text-neutral-400 block uppercase tracking-widest mb-1">Launch Time</span>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-tighter">
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {profile?.role === 'admin' && (
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        disabled={deletingId === event.id}
                        className="p-3 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-400 hover:text-red-600 transition-all active:scale-90"
                      >
                        {deletingId === event.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-white/5 p-12 rounded-[2.5rem] text-center space-y-4">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-white/5 rounded-2xl mx-auto flex items-center justify-center">
                  <AlertCircle className="text-neutral-300" size={32} />
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-neutral-400 italic">No missions scheduled.</p>
              </div>
            )}
          </div>
        </div>

        {/* Server Info / Widgets */}
        <div className="space-y-10">
          {/* Reminders Widget */}
          <div className="space-y-4">
            <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 px-2">
              <Clock size={20} className="text-strawberry-600" />
              Active Reminders
            </h2>
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 p-6 rounded-[2rem] shadow-xl shadow-neutral-900/5 space-y-4">
              {reminders.length === 0 ? (
                <div className="text-neutral-400 text-xs font-bold uppercase tracking-widest text-center py-6">Clear Skies</div>
              ) : (
                reminders.slice(0, 3).map(rem => (
                  <button
                    key={rem.id}
                    onClick={() => setSelectedItem({ type: 'reminder', data: rem })}
                    className="w-full text-left group p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-strawberry-500/20 transition-all"
                  >
                    <p className="font-black italic uppercase tracking-tight text-sm group-hover:text-strawberry-600 transition-colors">{rem.title}</p>
                    <p className="text-neutral-500 text-[10px] uppercase font-bold truncate mt-1 tracking-tight">{rem.message}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Version Widget */}
          <div className="space-y-4">
            <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 px-2">
              <Box size={20} className="text-strawberry-600" />
              System Meta
            </h2>
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 p-8 rounded-[2rem] shadow-xl shadow-neutral-900/5 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 blur-2xl rounded-full" />
              {versions.length > 0 ? (
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-1">Recommended</p>
                      <p className="text-2xl font-black italic uppercase tracking-tighter">{versions.find(v => v.is_recommended)?.version_string || 'N/A'}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic ${versions.find(v => v.maintenance_mode) ? 'bg-red-500 text-white' : 'bg-green-500 text-white shadow-lg shadow-green-500/20'}`}>
                      {versions.find(v => v.maintenance_mode) ? 'Offline' : 'Live'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {versions.find(v => v.is_recommended && v.supports_java) && (
                      <span className="bg-neutral-100 dark:bg-white/5 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">Java Core</span>
                    )}
                    {versions.find(v => v.is_recommended && v.supports_bedrock) && (
                      <span className="bg-neutral-100 dark:bg-white/5 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">Bedrock Node</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-neutral-400 text-xs font-bold uppercase tracking-widest text-center">Sync Error</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-black italic uppercase tracking-tighter px-2">Quick Access</h2>
            <div className="grid grid-cols-1 gap-3">
              {profile?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center justify-between p-5 bg-strawberry-600 text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-strawberry-600/30 hover:bg-strawberry-700 transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-4">
                    <Plus size={20} />
                    <span>Control Panel</span>
                  </div>
                  <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              <button
                onClick={() => navigate('/dynamap')}
                className="w-full flex items-center justify-between p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 text-neutral-900 dark:text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-neutral-900/5 hover:border-strawberry-500/30 transition-all active:scale-95 group"
              >
                <div className="flex items-center gap-4">
                  <MapIcon size={20} className="text-strawberry-600" />
                  <span>Tactical Map</span>
                </div>
                <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/members')}
                className="w-full flex items-center justify-between p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 text-neutral-900 dark:text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-neutral-900/5 hover:border-strawberry-500/30 transition-all active:scale-95 group"
              >
                <div className="flex items-center gap-4">
                  <Users size={20} className="text-strawberry-600" />
                  <span>Berry List</span>
                </div>
                <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
