import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { dbService } from '../services/dbService';
import { adminService } from '../services/adminService';
import { Modal } from '../components/Modal';
import { AddVersionModal } from '../components/AddVersionModal';
import { useMinecraftVersions } from '../hooks/useMinecraftVersions';
import type { Profile, Event, Rule, Reminder, MinecraftVersion } from '../types/database.types';
import {
  Users,
  Shield,
  Ban,
  Megaphone,
  Loader2,
  Calendar,
  MoreVertical,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminPanel = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const { versions, loading: versionsLoading, refetch: refetchVersions } = useMinecraftVersions();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'announcements' | 'events' | 'rules' | 'reminders' | 'versions'>('users');

  const [modal, setModal] = useState<{ isOpen: boolean, type: string, data?: any }>({ isOpen: false, type: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, e, r, rem] = await Promise.all([
        dbService.getAllProfiles(),
        dbService.getEvents(),
        adminService.getRules(),
        adminService.getReminders(),
      ]);
      setProfiles(p);
      setEvents(e);
      setRules(r);
      setReminders(rem);
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
      toast.success('User role updated!');
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to update role: ${err.message}`);
    }
  };

  const handleBanToggle = async (profile: Profile) => {
    try {
      await dbService.updateProfile(profile.id, { is_banned: !profile.is_banned });
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_banned: !profile.is_banned } : p));
      toast.success(`User ${profile.is_banned ? 'unbanned' : 'banned'}!`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to update ban status: ${err.message}`);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await dbService.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success('Event deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete event');
    }
  };

  const handleCreateRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    if (!title || !content) {
      toast.error('Title and content are required for a rule.');
      return;
    }

    try {
      const newRule = await adminService.createRule({ title, content, is_pinned: false, is_visible: true, priority: 0, category: null, created_by: null });
      setRules(prev => [...prev, newRule]);
      setModal({ isOpen: false, type: '' });
      toast.success('Rule created');
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to create rule: ${err.message}`);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      await adminService.deleteRule(id);
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Rule deleted');
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to delete rule: ${err.message}`);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const message = formData.get('message') as string;

    if (!title || !message) {
      toast.error('Title and message are required for a reminder.');
      return;
    }

    try {
      const newReminder = await adminService.createReminder({ title, message, scheduled_at: null, expires_at: null, is_important: false, target_role: null, target_user_id: null, created_by: null });
      setReminders(prev => [...prev, newReminder]);
      setModal({ isOpen: false, type: '' });
      toast.success('Reminder created');
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to create reminder: ${err.message}`);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await adminService.deleteReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Reminder deleted');
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to delete reminder: ${err.message}`);
    }
  };

  const handleToggleMaintenance = async (version: MinecraftVersion) => {
    try {
      await adminService.updateVersion(version.id, { maintenance_mode: !version.maintenance_mode });
      toast.success('Maintenance mode updated');
      refetchVersions();
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to update maintenance mode: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Modals */}
      <Modal isOpen={modal.isOpen && modal.type === 'rule'} onClose={() => setModal({ isOpen: false, type: '' })} title="Create Rule">
        <form onSubmit={handleCreateRule} className="space-y-4">
          <input name="title" placeholder="Rule Title" required className="w-full bg-neutral-800 p-3 rounded-xl border border-neutral-700 text-white" />
          <textarea name="content" placeholder="Rule Content" required className="w-full bg-neutral-800 p-3 rounded-xl border border-neutral-700 h-32 text-white" />
          <button type="submit" className="w-full bg-strawberry-600 p-3 rounded-xl font-bold hover:bg-strawberry-700">Create Rule</button>
        </form>
      </Modal>

      <Modal isOpen={modal.isOpen && modal.type === 'reminder'} onClose={() => setModal({ isOpen: false, type: '' })} title="Create Reminder">
        <form onSubmit={handleCreateReminder} className="space-y-4">
          <input name="title" placeholder="Reminder Title" required className="w-full bg-neutral-800 p-3 rounded-xl border border-neutral-700 text-white" />
          <textarea name="message" placeholder="Reminder Message" required className="w-full bg-neutral-800 p-3 rounded-xl border border-neutral-700 h-32 text-white" />
          <button type="submit" className="w-full bg-strawberry-600 p-3 rounded-xl font-bold hover:bg-strawberry-700">Create Reminder</button>
        </form>
      </Modal>

      <AddVersionModal
        isOpen={modal.isOpen && modal.type === 'version'}
        onClose={() => setModal({ isOpen: false, type: '' })}
        onVersionAdded={refetchVersions}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
        <p className="text-neutral-400 mt-1">Manage users, broadcast announcements, and oversee events.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl w-fit overflow-x-auto">
        {(['users', 'announcements', 'events', 'rules', 'reminders', 'versions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize whitespace-nowrap ${activeTab === tab ? 'bg-strawberry-600 text-white shadow-lg shadow-strawberry-600/20' : 'text-neutral-500 hover:text-white'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading || versionsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-strawberry-500" size={48} />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden"
        >
          {/* USERS TAB */}
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
                  {profiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-neutral-500">
                        <Users className="mx-auto text-neutral-700 mb-2" size={32} />
                        No profiles found.
                      </td>
                    </tr>
                  ) : (
                    <>
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
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${p.is_banned ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                              }`}>
                              {p.is_banned ? 'Banned' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${p.role === 'admin' ? 'bg-strawberry-500/10 text-strawberry-500' : 'bg-neutral-800 text-neutral-400'
                              }`}>
                              {p.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <button
                                onClick={() => handleRoleToggle(p)}
                                className="p-2 text-neutral-500 hover:text-strawberry-500 hover:bg-strawberry-500/5 rounded-lg transition-all"
                                title="Toggle Role"
                              >
                                <Shield size={18} />
                              </button>
                              <button
                                onClick={() => handleBanToggle(p)}
                                className={`p-2 rounded-lg transition-all ${p.is_banned ? 'text-green-500 hover:bg-green-500/5' : 'text-red-500 hover:bg-red-500/5'
                                  }`}
                                title={p.is_banned ? 'Unban' : 'Ban'}
                              >
                                <Ban size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div className="p-8 text-center space-y-4">
              <Megaphone className="mx-auto text-neutral-700" size={48} />
              <h3 className="text-xl font-bold">Broadcast System</h3>
              <p className="text-neutral-500 max-w-sm mx-auto">Send announcements to all players. They will appear in the notification center.</p>
              <button
                onClick={() => toast('New announcement feature pending UI integration.')}
                className="px-6 py-2 bg-strawberry-600 rounded-xl font-bold hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20"
              >
                New Announcement
              </button>
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Manage Events</h3>
                <span className="text-sm text-neutral-500">{events.length} Events Total</span>
              </div>
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="bg-neutral-900/50 border border-dashed border-neutral-800 p-8 rounded-2xl text-center">
                    <Calendar className="mx-auto text-neutral-700 mb-2" size={32} />
                    <p className="text-neutral-500">No events found.</p>
                  </div>
                ) : (
                  <>
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
                        <div className="flex items-center gap-2 flex-wrap">
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
                  </>
                )}
              </div>
            </div>
          )}

          {/* RULES TAB */}
          {activeTab === 'rules' && (
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Manage Rules</h3>
                <button
                  onClick={() => setModal({ isOpen: true, type: 'rule' })}
                  className="px-6 py-2 bg-strawberry-600 rounded-xl font-bold hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20"
                >
                  Create Rule
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-800/50 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Visible</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {rules.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-neutral-500">
                          <AlertCircle className="mx-auto text-neutral-700 mb-2" size={32} />
                          No rules found. Create one above!
                        </td>
                      </tr>
                    ) : (
                      <>
                        {rules.map(rule => (
                          <tr key={rule.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-bold">{rule.title}</td>
                            <td className="px-6 py-4">{rule.priority}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${rule.is_visible ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {rule.is_visible ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                                title="Delete Rule"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REMINDERS TAB */}
          {activeTab === 'reminders' && (
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Manage Reminders</h3>
                <button
                  onClick={() => setModal({ isOpen: true, type: 'reminder' })}
                  className="px-6 py-2 bg-strawberry-600 rounded-xl font-bold hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20"
                >
                  Create Reminder
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-800/50 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Important</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {reminders.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-neutral-500">
                          <AlertCircle className="mx-auto text-neutral-700 mb-2" size={32} />
                          No reminders found. Create one above!
                        </td>
                      </tr>
                    ) : (
                      <>
                        {reminders.map(rem => (
                          <tr key={rem.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-bold">{rem.title}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${rem.is_important ? 'bg-amber-500/10 text-amber-500' : 'bg-neutral-800 text-neutral-400'}`}>
                                {rem.is_important ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDeleteReminder(rem.id)}
                                className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                                title="Delete Reminder"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VERSIONS TAB */}
          {activeTab === 'versions' && (
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Manage Versions</h3>
                <button
                  onClick={() => setModal({ isOpen: true, type: 'version' })}
                  className="px-6 py-2 bg-strawberry-600 rounded-xl font-bold hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20"
                >
                  Add Version
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-800/50 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Version</th>
                      <th className="px-6 py-4">Supported</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {versions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-neutral-500">
                          <AlertCircle className="mx-auto text-neutral-700 mb-2" size={32} />
                          No Minecraft versions found. Add one above!
                        </td>
                      </tr>
                    ) : (
                      <>
                        {versions.map(v => (
                          <tr key={v.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-bold">{v.version_string}</td>
                            <td className="px-6 py-4">{v.is_supported ? 'Yes' : 'No'}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <button
                                  onClick={() => handleToggleMaintenance(v)}
                                  className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${v.maintenance_mode ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}
                                >
                                  {v.maintenance_mode ? 'Enabled' : 'Disabled'}
                                </button>
                                <button className="p-2 text-neutral-500 hover:text-white" title="Edit">
                                  <MoreVertical size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AdminPanel;