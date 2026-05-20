import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useEvents } from '../hooks/useEvents';
import { dbService } from '../services/dbService';
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
  Map as MapIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon }: { label: string, value: string | number, icon: any }) => (
  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-xl bg-strawberry-500/10 text-strawberry-500">
        <Icon size={24} />
      </div>
      <span className="text-2xl font-bold">{value}</span>
    </div>
    <span className="text-sm text-neutral-400 font-medium">{label}</span>
  </div>
);

const DashboardPage = () => {
  const { profile } = useAuthStore();
  const { events, loading, refetch } = useEvents();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPlayers: 0,
    onlinePlayers: 0,
    activeBuffs: 0
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const profiles = await dbService.getAllProfiles();
        setStats({
          totalPlayers: profiles.length,
          onlinePlayers: profiles.filter(p => p.status === 'online').length,
          activeBuffs: 3 
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setDeletingId(id);
    try {
      await dbService.deleteEvent(id);
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const upcomingEvents = events.filter(e => e.status === 'upcoming').slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-neutral-400 mt-1">Welcome back, {profile?.username || 'Player'}. Here's what's happening on the server.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Players" value={stats.totalPlayers} icon={Users} />
        <StatCard label="Online Now" value={stats.onlinePlayers} icon={TrendingUp} />
        <StatCard label="Upcoming Events" value={events.filter(e => e.status === 'upcoming').length} icon={Calendar} />
        <StatCard label="Server Status" value="Online" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar size={20} className="text-strawberry-500" />
              Upcoming Events
            </h2>
            <Link to="/events" className="text-sm text-strawberry-500 hover:text-strawberry-400 font-medium flex items-center gap-1">
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2].map(i => (
                <div key={i} className="h-24 bg-neutral-900 rounded-2xl animate-pulse" />
              ))
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <motion.div 
                  key={event.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex items-center gap-4 group transition-colors hover:border-strawberry-500/30"
                >
                  <div className="h-12 w-12 rounded-xl bg-strawberry-600/10 text-strawberry-500 flex flex-col items-center justify-center font-bold">
                    <span className="text-xs uppercase leading-none">{new Date(event.start_time).toLocaleString('en-US', { month: 'short' })}</span>
                    <span className="text-lg leading-none">{new Date(event.start_time).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate group-hover:text-strawberry-500 transition-colors">{event.title}</h3>
                    <p className="text-sm text-neutral-400 truncate">{event.description || 'No description provided.'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-semibold text-neutral-500 block uppercase mb-1">Starts at</span>
                      <span className="text-sm font-medium">
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {profile?.role === 'admin' && (
                      <button 
                        onClick={() => handleDeleteEvent(event.id)}
                        disabled={deletingId === event.id}
                        className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        {deletingId === event.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-neutral-900/50 border border-dashed border-neutral-800 p-8 rounded-2xl text-center">
                <AlertCircle className="mx-auto text-neutral-600 mb-2" size={32} />
                <p className="text-neutral-500">No upcoming events found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Announcements */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <div className="space-y-3">
            {profile?.role === 'admin' && (
              <button 
                onClick={() => navigate('/events')}
                className="w-full flex items-center gap-3 p-4 bg-strawberry-600 rounded-xl font-bold hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20"
              >
                <Plus size={20} />
                Manage Events
              </button>
            )}
            <button 
              onClick={() => navigate('/dynamap')}
              className="w-full flex items-center gap-3 p-4 bg-neutral-800 rounded-xl font-bold hover:bg-neutral-700 transition-all"
            >
              <MapIcon size={20} className="text-strawberry-500" />
              View DynaMap
            </button>
            <button 
              onClick={() => navigate('/messages')}
              className="w-full flex items-center gap-3 p-4 bg-neutral-800 rounded-xl font-bold hover:bg-neutral-700 transition-all"
            >
              <Users size={20} className="text-strawberry-500" />
              Find Players
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
