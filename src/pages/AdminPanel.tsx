import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { dbService } from '../services/dbService';
import { adminService } from '../services/adminService';
import { Modal } from '../components/Modal';
import { AddVersionModal } from '../components/AddVersionModal';
import { AnnouncementModal } from '../components/AnnouncementModal';
import AddEditBadgeModal from '../components/AddEditBadgeModal';
import AssignBadgesModal from '../components/AssignBadgesModal';
import { useMinecraftVersions } from '../hooks/useMinecraftVersions';
import { useAuthStore } from '../store/useAuthStore';
import type { Profile, Event, Rule, Reminder, MinecraftVersion, Badge } from '../types/database.types';
import BadgeChip from '../components/BadgeChip';
import {
  Users,
  Shield,
  Ban,
  Megaphone,
  Loader2,
  Calendar,
  MoreVertical,
  Trash2,
  AlertCircle,
  Tag,
  ListFilter,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Pencil,
  Check,
  X,
  Award, // New icon for badge assignment
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Inline editable number cell for Rule priority
// ---------------------------------------------------------------------------
const PriorityCell = ({
  value,
  onSave,
}: {
  value: number;
  onSave: (v: number) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);

  const commit = async () => {
    const parsed = parseInt(draft, 10);
    if (isNaN(parsed)) { setDraft(String(value)); setEditing(false); return; }
    setSaving(true);
    await onSave(parsed);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); } }}
          className="w-20 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg px-2 py-1 text-sm text-neutral-900 dark:text-white"
        />
        <button onClick={commit} disabled={saving} className="p-1 text-green-500 hover:text-green-400">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        </button>
        <button onClick={() => { setDraft(String(value)); setEditing(false); }} className="p-1 text-red-500 hover:text-red-400">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="flex items-center gap-1 text-neutral-900 dark:text-neutral-100 hover:text-strawberry-600 dark:hover:text-strawberry-400 transition-colors group"
      title="Click to edit priority"
    >
      <span>{value}</span>
      <Pencil size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
};

// ---------------------------------------------------------------------------
// AdminPanel
// ---------------------------------------------------------------------------
const AdminPanel = () => {
  const { profile: currentAdminProfile } = useAuthStore(); // Get current admin profile
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]); // New state for badges
  const { versions, loading: versionsLoading, refetch: refetchVersions } = useMinecraftVersions();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'announcements' | 'events' | 'rules' | 'reminders' | 'versions' | 'categories' | 'badges'>('users');
  const [modal, setModal] = useState<{ isOpen: boolean; type: string; data?: any }>({ isOpen: false, type: '' });

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------
  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, e, r, rem, b] = await Promise.all([
        dbService.getAllProfiles(),
        dbService.getEvents(),
        adminService.getRules(),
        adminService.getReminders(),
        dbService.getBadges(), // Fetch badges
      ]);
      setProfiles(p);
      setEvents(e);
      setRules(r);
      setReminders(rem);
      setBadges(b); // Set badges state
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);


  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------
  const handleRoleToggle = async (profile: Profile) => {
    const newRole = profile.role === 'admin' ? 'player' : 'admin';
    try {
      await dbService.updateProfile(profile.id, { role: newRole });
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, role: newRole } : p));
      toast.success('User role updated!');
    } catch (err: any) {
      toast.error(`Failed to update role: ${err.message}`);
    }
  };

  const handleBanToggle = async (profile: Profile) => {
    try {
      await dbService.updateProfile(profile.id, { is_banned: !profile.is_banned });
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_banned: !profile.is_banned } : p));
      toast.success(`User ${profile.is_banned ? 'unbanned' : 'banned'}!`);
    } catch (err: any) {
      toast.error(`Failed to update ban status: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await dbService.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success('Event deleted');
    } catch {
      toast.error('Failed to delete event');
    }
  };

  // -------------------------------------------------------------------------
  // Rules
  // -------------------------------------------------------------------------

  // Used by inline priority cell + visible/pinned toggle buttons in the table
  const handleUpdateRule = async (id: string, updates: Partial<Rule>) => {
    try {
      const updated = await adminService.updateRule(id, updates);
      setRules(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    } catch (err: any) {
      toast.error(`Failed to update rule: ${err.message}`);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      await adminService.deleteRule(id);
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Rule deleted');
    } catch (err: any) {
      toast.error(`Failed to delete rule: ${err.message}`);
    }
  };

  // Used by the create/edit modal form
  const handleCreateOrUpdateRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    const content = fd.get('content') as string;
    const priority = parseInt(fd.get('priority') as string || '0', 10);
    const is_visible = fd.get('is_visible') === 'on';
    const is_pinned = fd.get('is_pinned') === 'on';

    if (!title || !content) { toast.error('Title and content are required.'); return; }

    try {
      if (modal.type === 'edit-rule' && modal.data) {
        const updatedRule = await adminService.updateRule(modal.data.id, { title, content, priority, is_visible, is_pinned });
        setRules(prev => prev.map(r => r.id === modal.data.id ? { ...r, ...updatedRule } : r));
        toast.success('Rule updated');
      } else {
        const newRule = await adminService.createRule({ title, content, priority, is_visible, is_pinned, category: null, created_by: null });
        setRules(prev => [...prev, newRule]);
        toast.success('Rule created');
      }
      setModal({ isOpen: false, type: '' });
    } catch (err: any) {
      toast.error(`Failed to save rule: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Reminders
  // -------------------------------------------------------------------------
  const handleToggleReminderImportant = async (rem: Reminder) => {
    try {
      const updated = await adminService.updateReminder(rem.id, { is_important: !rem.is_important });
      setReminders(prev => prev.map(r => r.id === rem.id ? { ...r, ...updated } : r));
      toast.success(`Marked as ${!rem.is_important ? 'important' : 'not important'}`);
    } catch (err: any) {
      toast.error(`Failed to update reminder: ${err.message}`);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await adminService.deleteReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Reminder deleted');
    } catch (err: any) {
      toast.error(`Failed to delete reminder: ${err.message}`);
    }
  };

  const handleCreateOrUpdateReminder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    const message = fd.get('message') as string;
    const is_important = fd.get('is_important') === 'on';

    if (!title || !message) { toast.error('Title and message are required.'); return; }

    try {
      if (modal.type === 'edit-reminder' && modal.data) {
        const updatedReminder = await adminService.updateReminder(modal.data.id, { title, message, is_important });
        setReminders(prev => prev.map(r => r.id === modal.data.id ? { ...r, ...updatedReminder } : r));
        toast.success('Reminder updated');
      } else {
        const newReminder = await adminService.createReminder({
          title, message, is_important,
          scheduled_at: null, expires_at: null,
          target_role: null, target_user_id: null, created_by: null,
        });
        setReminders(prev => [...prev, newReminder]);
        toast.success('Reminder created');
      }
      setModal({ isOpen: false, type: '' });
    } catch (err: any) {
      toast.error(`Failed to save reminder: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Versions
  // -------------------------------------------------------------------------
  const handleToggleMaintenance = async (version: MinecraftVersion) => {
    try {
      await adminService.updateVersion(version.id, { maintenance_mode: !version.maintenance_mode });
      toast.success('Maintenance mode updated');
      refetchVersions();
    } catch (err: any) {
      toast.error(`Failed to update maintenance mode: ${err.message}`);
    }
  };

  const handleDeleteVersion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this version?')) return;
    try {
      await adminService.deleteVersion(id);
      toast.success('Version deleted');
      refetchVersions();
    } catch (err: any) {
      toast.error(`Failed to delete version: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Badges (New Section)
  // -------------------------------------------------------------------------
  const handleCreateBadge = async (badgeData: Omit<Badge, 'id' | 'created_at' | 'updated_at' | 'created_by'> & { created_by?: string | null }) => {
    if (!currentAdminProfile?.id) {
      toast.error('Admin user not identified. Cannot create badge.');
      return;
    }
    try {
      const newBadge = await dbService.createBadge({ ...badgeData, created_by: currentAdminProfile.id });
      setBadges(prev => [...prev, newBadge]);
      toast.success('Badge created successfully!');
      setModal({ isOpen: false, type: '' });
    } catch (err: any) {
      toast.error(`Failed to create badge: ${err.message}`);
    }
  };

  const handleUpdateBadge = async (id: string, updates: Partial<Badge>) => {
    try {
      const updatedBadge = await dbService.updateBadge(id, updates);
      setBadges(prev => prev.map(b => b.id === id ? { ...b, ...updatedBadge } : b));
      toast.success('Badge updated successfully!');
      setModal({ isOpen: false, type: '' });
    } catch (err: any) {
      toast.error(`Failed to update badge: ${err.message}`);
    }
  };

  const handleDeleteBadge = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this badge? This action cannot be undone.')) return;
    try {
      await dbService.deleteBadge(id);
      setBadges(prev => prev.filter(b => b.id !== id));
      toast.success('Badge deleted successfully!');
    } catch (err: any) {
      toast.error(`Failed to delete badge: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Shared styles
  // -------------------------------------------------------------------------
  const inputCls = 'w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-strawberry-500/40';
  const checkboxRowCls = 'flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer select-none';

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="space-y-8 text-neutral-900 dark:text-neutral-100">

      {/* ── Modals ── */}

      {/* Create / Edit Rule Modal */}
      <Modal
        isOpen={modal.isOpen && (modal.type === 'rule' || modal.type === 'edit-rule')}
        onClose={() => setModal({ isOpen: false, type: '' })}
        title={modal.type === 'edit-rule' ? 'Edit Rule' : 'Create Rule'}
      >
        <form onSubmit={handleCreateOrUpdateRule} className="space-y-4">
          <input name="title" placeholder="Rule Title" defaultValue={modal.data?.title || ''} required className={inputCls} />
          <textarea name="content" placeholder="Rule Content" defaultValue={modal.data?.content || ''} required className={`${inputCls} h-32`} />
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Priority</label>
            <input name="priority" type="number" defaultValue={modal.data?.priority ?? 0} className={inputCls} />
            <p className="text-xs text-neutral-500 mt-1">Higher number = shown first.</p>
          </div>
          <label className={checkboxRowCls}>
            <input name="is_visible" type="checkbox" defaultChecked={modal.data?.is_visible ?? true} className="accent-strawberry-600 w-4 h-4" />
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">Visible to players</p>
              <p className="text-xs text-neutral-500">Show this rule on the rules page.</p>
            </div>
          </label>
          <label className={checkboxRowCls}>
            <input name="is_pinned" type="checkbox" defaultChecked={modal.data?.is_pinned ?? false} className="accent-strawberry-600 w-4 h-4" />
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">Pin rule</p>
              <p className="text-xs text-neutral-500">Pinned rules appear at the top.</p>
            </div>
          </label>
          <button type="submit" className="w-full bg-strawberry-600 p-3 rounded-xl font-bold text-white hover:bg-strawberry-700 transition-colors">
            {modal.type === 'edit-rule' ? 'Save Changes' : 'Create Rule'}
          </button>
        </form>
      </Modal>

      {/* Create / Edit Reminder Modal */}
      <Modal
        isOpen={modal.isOpen && (modal.type === 'reminder' || modal.type === 'edit-reminder')}
        onClose={() => setModal({ isOpen: false, type: '' })}
        title={modal.type === 'edit-reminder' ? 'Edit Reminder' : 'Create Reminder'}
      >
        <form onSubmit={handleCreateOrUpdateReminder} className="space-y-4">
          <input name="title" placeholder="Reminder Title" defaultValue={modal.data?.title || ''} required className={inputCls} />
          <textarea name="message" placeholder="Reminder Message" defaultValue={modal.data?.message || ''} required className={`${inputCls} h-32`} />
          <label className={checkboxRowCls}>
            <input name="is_important" type="checkbox" defaultChecked={modal.data?.is_important ?? false} className="accent-amber-500 w-4 h-4" />
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">Mark as important</p>
              <p className="text-xs text-neutral-500">Highlights this reminder with an amber badge.</p>
            </div>
          </label>
          <button type="submit" className="w-full bg-strawberry-600 p-3 rounded-xl font-bold text-white hover:bg-strawberry-700 transition-colors">
            {modal.type === 'edit-reminder' ? 'Save Changes' : 'Create Reminder'}
          </button>
        </form>
      </Modal>

      <AddVersionModal
        isOpen={modal.isOpen && (modal.type === 'version' || modal.type === 'edit-version')}
        onClose={() => setModal({ isOpen: false, type: '' })}
        onVersionAdded={refetchVersions}
        version={modal.type === 'edit-version' ? modal.data : undefined}
      />
      <AnnouncementModal
        isOpen={modal.isOpen && (modal.type === 'announcement' || modal.type === 'edit-announcement')}
        onClose={() => setModal({ isOpen: false, type: '' })}
        onSaved={() => {
          fetchData();
        }}
        announcement={modal.type === 'edit-announcement' ? modal.data : undefined}
      />

      {/* New Badge Modal */}
      <AddEditBadgeModal
        isOpen={modal.isOpen && (modal.type === 'badge' || modal.type === 'edit-badge')}
        onClose={() => setModal({ isOpen: false, type: '' })}
        onSave={async (badgeData) => {
          if (modal.type === 'edit-badge' && modal.data) {
            await handleUpdateBadge(modal.data.id, badgeData);
          } else {
            // For new badge, created_by should be the current admin's ID
            if (currentAdminProfile?.id) {
              await handleCreateBadge({ ...badgeData, created_by: currentAdminProfile.id });
            } else {
              toast.error('Admin user ID not identified. Cannot create badge.');
            }
          }
        }}
        editingBadge={modal.type === 'edit-badge' ? modal.data : undefined}
      />

      {/* Assign Badges Modal */}
      <AssignBadgesModal
        isOpen={modal.isOpen && modal.type === 'assign-badges'}
        onClose={() => setModal({ isOpen: false, type: '' })}
        userProfile={modal.data}
        // Correctly pass currentAdminProfile.id for assignedBy
        assignedBy={currentAdminProfile?.id || null}
        onBadgesUpdated={fetchData} // Re-fetch all data to update profiles list and badges
      />

      {/* ── Page header ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Admin Control Panel</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage users, broadcast announcements, and oversee events.</p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-fit overflow-x-auto">
        {(['users', 'announcements', 'events', 'rules', 'reminders', 'versions', 'categories', 'badges'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize whitespace-nowrap ${activeTab === tab
              ? 'bg-strawberry-600 text-white shadow-lg shadow-strawberry-600/20'
              : 'text-neutral-600 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading || versionsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-strawberry-600 dark:text-strawberry-500" size={48} />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden"
        >

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-100 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Player</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {profiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-neutral-500">
                        <Users className="mx-auto text-neutral-700 mb-2" size={32} />
                        No profiles found.
                      </td>
                    </tr>
                  ) : profiles.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
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
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${p.is_banned ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                          {p.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${p.role === 'admin' ? 'bg-strawberry-500/10 text-strawberry-500' : 'bg-neutral-800 text-neutral-400'}`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleRoleToggle(p)} className="p-2 text-neutral-500 hover:text-strawberry-500 hover:bg-strawberry-500/5 rounded-lg transition-all" title="Toggle Role">
                            <Shield size={18} />
                          </button>
                          <button onClick={() => handleBanToggle(p)} className={`p-2 rounded-lg transition-all ${p.is_banned ? 'text-green-500 hover:bg-green-500/5' : 'text-red-500 hover:bg-red-500/5'}`} title={p.is_banned ? 'Unban' : 'Ban'}>
                            <Ban size={18} />
                          </button>
                          <button
                            onClick={() => setModal({ isOpen: true, type: 'assign-badges', data: p })} // Open assign badges modal
                            className="p-2 text-neutral-500 hover:text-strawberry-500 hover:bg-strawberry-500/5 rounded-lg transition-all"
                            title="Assign Badges"
                          >
                            <Award size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── ANNOUNCEMENTS ── */}
          {activeTab === 'announcements' && (
            <div className="p-8 text-center space-y-4">
              <Megaphone className="mx-auto text-neutral-400 dark:text-neutral-700" size={48} />
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Broadcast System</h3>
              <p className="text-neutral-600 dark:text-neutral-500 max-w-sm mx-auto">Send announcements to all players.</p>
              <button onClick={() => toast('New announcement feature pending UI integration.')} className="px-6 py-2 bg-strawberry-600 rounded-xl font-bold text-white hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20">
                New Announcement
              </button>
            </div>
          )}

          {/* ── EVENTS ── */}
          {activeTab === 'events' && (
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Manage Events</h3>
                <span className="text-sm text-neutral-500">{events.length} Events Total</span>
              </div>
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-200 dark:border-neutral-800 p-8 rounded-2xl text-center">
                    <Calendar className="mx-auto text-neutral-400 dark:text-neutral-700 mb-2" size={32} />
                    <p className="text-neutral-600 dark:text-neutral-500">No events found.</p>
                  </div>
                ) : events.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-strawberry-600 dark:text-strawberry-500">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white">{ev.title}</p>
                        <p className="text-xs text-neutral-500">{new Date(ev.start_time).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDeleteEvent(ev.id)} className="p-2 text-neutral-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all" title="Delete Event">
                        <Trash2 size={18} />
                      </button>
                      <button className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── RULES ── */}
          {activeTab === 'rules' && (
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Manage Rules</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Click priority numbers to edit inline. Toggle visibility and pin with the badges.</p>
                </div>
                <button onClick={() => setModal({ isOpen: true, type: 'rule', data: undefined })} className="px-6 py-2 bg-strawberry-600 rounded-xl font-bold text-white hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20">
                  Create Rule
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Priority ✎</th>
                      <th className="px-6 py-4">Visible</th>
                      <th className="px-6 py-4">Pinned</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {rules.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-neutral-500">
                          <AlertCircle className="mx-auto text-neutral-400 dark:text-neutral-700 mb-2" size={32} />
                          No rules found. Create one above!
                        </td>
                      </tr>
                    ) : rules.map(rule => (
                      <tr key={rule.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white max-w-xs truncate">{rule.title}</td>

                        {/* Inline-editable priority */}
                        <td className="px-6 py-4">
                          <PriorityCell
                            value={rule.priority ?? 0}
                            onSave={async (v) => handleUpdateRule(rule.id, { priority: v })}
                          />
                        </td>

                        {/* Visibility toggle */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleUpdateRule(rule.id, { is_visible: !rule.is_visible })}
                            title={rule.is_visible ? 'Hide rule' : 'Show rule'}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${rule.is_visible
                              ? 'bg-green-500/10 text-green-600 dark:text-green-500 hover:bg-green-500/20'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                              }`}
                          >
                            {rule.is_visible ? <Eye size={11} /> : <EyeOff size={11} />}
                            {rule.is_visible ? 'Yes' : 'No'}
                          </button>
                        </td>

                        {/* Pin toggle */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleUpdateRule(rule.id, { is_pinned: !rule.is_pinned })}
                            title={rule.is_pinned ? 'Unpin' : 'Pin'}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${rule.is_pinned
                              ? 'bg-strawberry-500/10 text-strawberry-600 dark:text-strawberry-500 hover:bg-strawberry-500/20'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                              }`}
                          >
                            {rule.is_pinned ? <Star size={11} /> : <StarOff size={11} />}
                            {rule.is_pinned ? 'Yes' : 'No'}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setModal({ isOpen: true, type: 'edit-rule', data: rule })}
                              className="p-2 text-neutral-500 hover:text-strawberry-500 hover:bg-strawberry-500/5 rounded-lg transition-all"
                              title="Edit Rule"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="p-2 text-neutral-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                              title="Delete Rule"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REMINDERS ── */}
          {activeTab === 'reminders' && (
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Manage Reminders</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Click the star badge to toggle importance instantly.</p>
                </div>
                <button onClick={() => setModal({ isOpen: true, type: 'reminder', data: undefined })} className="px-6 py-2 bg-strawberry-600 rounded-xl font-bold text-white hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20">
                  Create Reminder
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Message</th>
                      <th className="px-6 py-4">Important</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {reminders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-neutral-500">
                          <AlertCircle className="mx-auto text-neutral-400 dark:text-neutral-700 mb-2" size={32} />
                          No reminders found. Create one above!
                        </td>
                      </tr>
                    ) : reminders.map(rem => (
                      <tr key={rem.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">{rem.title}</td>
                        <td className="px-6 py-4 text-sm text-neutral-500 max-w-xs truncate">{rem.message}</td>

                        {/* Clickable importance badge */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleReminderImportant(rem)}
                            title={rem.is_important ? 'Mark as not important' : 'Mark as important'}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${rem.is_important
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-500/20'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                              }`}
                          >
                            {rem.is_important ? <Star size={11} /> : <StarOff size={11} />}
                            {rem.is_important ? 'Yes' : 'No'}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setModal({ isOpen: true, type: 'edit-reminder', data: rem })}
                              className="p-2 text-neutral-500 hover:text-strawberry-500 hover:bg-strawberry-500/5 rounded-lg transition-all"
                              title="Edit Reminder"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteReminder(rem.id)}
                              className="p-2 text-neutral-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                              title="Delete Reminder"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── VERSIONS ── */}
          {activeTab === 'versions' && (
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Manage Versions</h3>
                <button onClick={() => setModal({ isOpen: true, type: 'version' })} className="px-6 py-2 bg-strawberry-600 rounded-xl font-bold text-white hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20">
                  Add Version
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Version</th>
                      <th className="px-6 py-4">Supported</th>
                      <th className="px-6 py-4 text-right">Maintenance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {versions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-neutral-500">
                          <AlertCircle className="mx-auto text-neutral-400 dark:text-neutral-700 mb-2" size={32} />
                          No Minecraft versions found. Add one above!
                        </td>
                      </tr>
                    ) : versions.map(v => (
                      <tr key={v.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">{v.version_string}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${v.is_supported ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                            {v.is_supported ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => handleToggleMaintenance(v)}
                              className={`px-2 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${v.maintenance_mode
                                ? 'bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500/20'
                                : 'bg-green-500/10 text-green-600 dark:text-green-500 hover:bg-green-500/20'
                                }`}
                            >
                              {v.maintenance_mode ? 'Enabled' : 'Disabled'}
                            </button>
                            <button
                              onClick={() => setModal({ isOpen: true, type: 'edit-version', data: v })}
                              className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteVersion(v.id)}
                              className="p-2 text-neutral-500 hover:text-red-600 dark:hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CATEGORIES ── */}
          {activeTab === 'categories' && (
            <div className="p-8 space-y-4">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Manage Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/admin/categories/plugin" className="bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl text-center hover:border-strawberry-500/30 transition-colors group">
                  <ListFilter size={40} className="mx-auto text-strawberry-600 dark:text-strawberry-500 mb-4 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-neutral-900 dark:text-white text-lg">Plugin Categories</p>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">Organize server plugins</p>
                </Link>
                <Link to="/admin/categories/shop" className="bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl text-center hover:border-strawberry-500/30 transition-colors group">
                  <Tag size={40} className="mx-auto text-strawberry-600 dark:text-strawberry-500 mb-4 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-neutral-900 dark:text-white text-lg">Shop Categories</p>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">Categorize items in player shops</p>
                </Link>
              </div>
            </div>
          )}

          {/* ── BADGES ── */}
          {activeTab === 'badges' && (
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Manage Badges</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Create, edit, and assign custom badges to users.</p>
                </div>
                <button
                  onClick={() => setModal({ isOpen: true, type: 'badge', data: undefined })}
                  className="px-6 py-2 bg-strawberry-600 rounded-xl font-bold text-white hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20"
                >
                  Create Badge
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Badge</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Visible</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {badges.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-neutral-500">
                          <AlertCircle className="mx-auto text-neutral-400 dark:text-neutral-700 mb-2" size={32} />
                          No badges found. Create one above!
                        </td>
                      </tr>
                    ) : badges.map(badge => (
                      <tr key={badge.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <BadgeChip badge={badge} />
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-500 max-w-xs truncate">{badge.description || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleUpdateBadge(badge.id, { is_visible: !badge.is_visible })}
                            title={badge.is_visible ? 'Hide badge' : 'Show badge'}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${badge.is_visible
                              ? 'bg-green-500/10 text-green-600 dark:text-green-500 hover:bg-green-500/20'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                              }`}
                          >
                            {badge.is_visible ? <Eye size={11} /> : <EyeOff size={11} />}
                            {badge.is_visible ? 'Yes' : 'No'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <PriorityCell
                            value={badge.priority ?? 0}
                            onSave={async (v) => handleUpdateBadge(badge.id, { priority: v })}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setModal({ isOpen: true, type: 'edit-badge', data: badge })}
                              className="p-2 text-neutral-500 hover:text-strawberry-500 hover:bg-strawberry-500/5 rounded-lg transition-all"
                              title="Edit Badge"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteBadge(badge.id)}
                              className="p-2 text-neutral-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                              title="Delete Badge"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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