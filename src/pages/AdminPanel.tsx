import { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import type { Profile, Event } from '../types/database.types';
import { 
  Users, 
  Shield, 
  Ban, 
  Megaphone,
  Loader2,
  Calendar,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminPanel = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'announcements' | 'events'>('users');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, e] = await Promise.all([
        dbService.getAllProfiles(),
        dbService.getEvents()
      ]);
      setProfiles(p);
      setEvents(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleToggle = async (profile: Profile) => {
    const newRole = profile.role === 'admin' ? 'player' : 'admin';
    try {
      await dbService.updateProfile(profile.id, { role: newRole });
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, role: newRole } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBanToggle = async (profile: Profile) => {
    try {
      await dbService.updateProfile(profile.id, { is_banned: !profile.is_banned });
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_banned: !profile.is_banned } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await dbService.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete event');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
        <p className="text-neutral-400 mt-1">Manage users, broadcast announcements, and oversee events.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl w-fit">
        {(['users', 'announcements', 'events'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
              activeTab === tab ? 'bg-strawberry-600 text-white shadow-lg shadow-strawberry-600/20' : 'text-neutral-500 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-strawberry-500" size={48} />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden"
        >
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-800/50 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Player</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-700">
                            {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : <Users size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{p.username}</p>
                            <p className="text-xs text-neutral-500">{p.minecraft_username || 'No MC linked'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                          p.is_banned ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                        }`}>
                          {p.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                          p.role === 'admin' ? 'bg-strawberry-500/10 text-strawberry-500' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleRoleToggle(p)}
                            className="p-2 text-neutral-500 hover:text-strawberry-500 hover:bg-strawberry-500/5 rounded-lg transition-all"
                            title="Toggle Role"
                          >
                            <Shield size={18} />
                          </button>
                          <button 
                            onClick={() => handleBanToggle(p)}
                            className={`p-2 rounded-lg transition-all ${
                              p.is_banned ? 'text-green-500 hover:bg-green-500/5' : 'text-red-500 hover:bg-red-500/5'
                            }`}
                            title={p.is_banned ? 'Unban' : 'Ban'}
                          >
                            <Ban size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="p-8 text-center space-y-4">
              <Megaphone className="mx-auto text-neutral-700" size={48} />
              <h3 className="text-xl font-bold">Broadcast System</h3>
              <p className="text-neutral-500 max-w-sm mx-auto">Send announcements to all players. They will appear in the notification center.</p>
              <button 
                onClick={() => alert('New announcement feature pending UI integration.')}
                className="px-6 py-2 bg-strawberry-600 rounded-xl font-bold hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20"
              >
                New Announcement
              </button>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Manage Events</h3>
                <span className="text-sm text-neutral-500">{events.length} Events Total</span>
              </div>
              <div className="space-y-3">
                {events.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-2xl border border-neutral-800">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-neutral-800 rounded-xl text-strawberry-500">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="font-bold">{e.title}</p>
                        <p className="text-xs text-neutral-500">{new Date(e.start_time).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDeleteEvent(e.id)}
                        className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                        title="Delete Event"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button className="p-2 text-neutral-500 hover:text-white">
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AdminPanel;
