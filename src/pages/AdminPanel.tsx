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
  Award,
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
  const { profile: currentAdminProfile } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
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
        dbService.getBadges(),
      ]);
      setProfiles(p);
      setEvents(e);
      setRules(r);
      setReminders(rem);
      setBadges(b);
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
  // Badges
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
  const inputCls = 'w-full bg-neutral-100 dark:bg-neutral-800 p-4 rounded-2xl border border-transparent focus:border-strawberry-500/30 text-neutral-900 dark:text-white focus:outline-none transition-all outline-none';
  const checkboxRowCls = 'flex items-center gap-4 p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-white/5 cursor-pointer select-none transition-all';
  const cardCls = 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] shadow-xl shadow-neutral-900/5';

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">

      {/* ── Modals ── */}

      {/* Create / Edit Rule Modal */}
      <Modal
        isOpen={modal.isOpen && (modal.type === 'rule' || modal.type === 'edit-rule')}
        onClose={() => setModal({ isOpen: false, type: '' })}
        title={modal.type === 'edit-rule' ? 'Edit Rule' : 'Create Rule'}
      >
        <form onSubmit={handleCreateOrUpdateRule} className="space-y-6">
          <input name="title" placeholder="Rule Title" defaultValue={modal.data?.title || ''} required className={inputCls} />
          <textarea name="content" placeholder="Rule Content" defaultValue={modal.data?.content || ''} required className={`${inputCls} h-40 resize-none`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 px-1">Priority</label>
              <input name="priority" type="number" defaultValue={modal.data?.priority ?? 0} className={inputCls} />
            </div>
            <div className="flex items-center gap-4 mt-6">
              <label className={checkboxRowCls + ' flex-1'}>
                <input name="is_visible" type="checkbox" defaultChecked={modal.data?.is_visible ?? true} className="accent-strawberry-600 w-5 h-5" />
                <span className="text-sm font-bold uppercase italic">Visible</span>
              </label>
              <label className={checkboxRowCls + ' flex-1'}>
                <input name="is_pinned" type="checkbox" defaultChecked={modal.data?.is_pinned ?? false} className="accent-strawberry-600 w-5 h-5" />
                <span className="text-sm font-bold uppercase italic">Pinned</span>
              </label>
            </div>
          </div>
          <button type="submit" className="w-full bg-strawberry-600 p-4 rounded-2xl font-black uppercase italic tracking-widest text-white hover:bg-strawberry-700 transition-all shadow-xl shadow-strawberry-600/20">
            {modal.type === 'edit-rule' ? 'Save Changes' : 'Publish Rule'}
          </button>
        </form>
      </Modal>

      {/* Create / Edit Reminder Modal */}
      <Modal
        isOpen={modal.isOpen && (modal.type === 'reminder' || modal.type === 'edit-reminder')}
        onClose={() => setModal({ isOpen: false, type: '' })}
        title={modal.type === 'edit-reminder' ? 'Edit Reminder' : 'Create Reminder'}
      >
        <form onSubmit={handleCreateOrUpdateReminder} className="space-y-6">
          <input name="title" placeholder="Reminder Title" defaultValue={modal.data?.title || ''} required className={inputCls} />
          <textarea name="message" placeholder="Reminder Message" defaultValue={modal.data?.message || ''} required className={`${inputCls} h-40 resize-none`} />
          <label className={checkboxRowCls}>
            <input name="is_important" type="checkbox" defaultChecked={modal.data?.is_important ?? false} className="accent-amber-500 w-5 h-5" />
            <div>
              <p className="text-sm font-bold uppercase italic">Mark as Important</p>
              <p className="text-xs text-neutral-500">Highlights this reminder with an amber badge.</p>
            </div>
          </label>
          <button type="submit" className="w-full bg-strawberry-600 p-4 rounded-2xl font-black uppercase italic tracking-widest text-white hover:bg-strawberry-700 transition-all shadow-xl shadow-strawberry-600/20">
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
        onSaved={() => { fetchData(); }}
        announcement={modal.type === 'edit-announcement' ? modal.data : undefined}
      />

      <AddEditBadgeModal
        isOpen={modal.isOpen && (modal.type === 'badge' || modal.type === 'edit-badge')}
        onClose={() => setModal({ isOpen: false, type: '' })}
        onSave={async (badgeData) => {
          if (modal.type === 'edit-badge' && modal.data) {
            await handleUpdateBadge(modal.data.id, badgeData);
          } else {
            if (currentAdminProfile?.id) {
              await handleCreateBadge({ ...badgeData, created_by: currentAdminProfile.id });
            } else {
              toast.error('Admin user ID not identified. Cannot create badge.');
            }
          }
        }}
        editingBadge={modal.type === 'edit-badge' ? modal.data : undefined}
      />

      <AssignBadgesModal
        isOpen={modal.isOpen && modal.type === 'assign-badges'}
        onClose={() => setModal({ isOpen: false, type: '' })}
        userProfile={modal.data}
        assignedBy={currentAdminProfile?.id || null}
        onBadgesUpdated={fetchData}
      />

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">
            Admin<span className="text-strawberry-600">Panel</span>
          </h1>
          <p className="text-neutral-500 mt-2 font-medium uppercase tracking-tight text-sm">
            System oversight, user management, and community moderation.
          </p>
        </div>
        <div className="flex gap-2 p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-2xl w-full md:w-fit overflow-x-auto">
          {(['users', 'announcements', 'events', 'rules', 'reminders', 'versions', 'categories', 'badges'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                ? 'bg-strawberry-600 text-white shadow-lg shadow-strawberry-600/20'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading || versionsLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-strawberry-600" size={64} />
          <p className="text-neutral-500 font-black uppercase tracking-widest animate-pulse">Loading...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4"
        >

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.length === 0 ? (
                <div className={`${cardCls} p-12 text-center col-span-full`}>
                  <Users className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" size={48} />
                  <p className="font-black uppercase italic tracking-tighter text-neutral-400">No profiles found.</p>
                </div>
              ) : profiles.map(p => (
                <div key={p.id} className={`${cardCls} p-6 transition-all hover:border-strawberry-500/30 group`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-white dark:border-neutral-900 shadow-md overflow-hidden group-hover:scale-105 transition-transform">
                        {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : <Users size={24} className="m-auto mt-3 text-neutral-400" />}
                      </div>
                      <div>
                        <p className="font-black italic uppercase tracking-tighter text-lg">{p.username}</p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{p.minecraft_username || 'No MC linked'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic ${p.is_banned ? 'bg-red-500 text-white' : 'bg-green-500/10 text-green-500'}`}>
                      {p.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-neutral-100 dark:border-white/5">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic ${p.role === 'admin' ? 'bg-strawberry-600 text-white' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}>
                      {p.role}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleRoleToggle(p)} className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-strawberry-500 transition-all" title="Toggle Role">
                        <Shield size={18} />
                      </button>
                      <button onClick={() => handleBanToggle(p)} className={`p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl transition-all ${p.is_banned ? 'text-green-500' : 'text-red-500'}`} title={p.is_banned ? 'Unban' : 'Ban'}>
                        <Ban size={18} />
                      </button>
                      <button onClick={() => setModal({ isOpen: true, type: 'assign-badges', data: p })} className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-strawberry-500 transition-all" title="Assign Badges">
                        <Award size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ANNOUNCEMENTS ── */}
          {activeTab === 'announcements' && (
            <div className={`${cardCls} p-12 text-center`}>
              <div className="w-20 h-20 rounded-[2rem] bg-strawberry-500/10 mx-auto mb-8 flex items-center justify-center">
                <Megaphone size={40} className="text-strawberry-600" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Broadcast System</h3>
              <p className="text-neutral-500 max-w-sm mx-auto text-xs font-bold uppercase tracking-tight leading-relaxed mb-8">
                Send announcements to all players on the server.
              </p>
              <button
                onClick={() => setModal({ isOpen: true, type: 'announcement' })}
                className="px-8 py-3 bg-strawberry-600 rounded-2xl font-black uppercase tracking-widest italic text-[10px] text-white hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20"
              >
                New Announcement
              </button>
            </div>
          )}

          {/* ── EVENTS ── */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Manage Events</h3>
                <span className="text-xs font-black uppercase tracking-widest text-neutral-400">{events.length} Total</span>
              </div>
              {events.length === 0 ? (
                <div className={`${cardCls} p-12 text-center`}>
                  <Calendar className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" size={48} />
                  <p className="font-black uppercase italic tracking-tighter text-neutral-400">No events found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map(ev => (
                    <div key={ev.id} className={`${cardCls} p-6 flex items-center justify-between`}>
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-strawberry-500/10 rounded-2xl">
                          <Calendar size={22} className="text-strawberry-600" />
                        </div>
                        <div>
                          <p className="font-black italic uppercase tracking-tighter">{ev.title}</p>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{new Date(ev.start_time).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleDeleteEvent(ev.id)} className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-red-500 transition-all">
                          <Trash2 size={16} />
                        </button>
                        <button className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── RULES ── */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">System Rules</h3>
                <button onClick={() => setModal({ isOpen: true, type: 'rule' })} className="px-6 py-2.5 bg-strawberry-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-strawberry-600/20 active:scale-95 transition-all">
                  Create Rule
                </button>
              </div>
              {rules.length === 0 ? (
                <div className={`${cardCls} p-12 text-center`}>
                  <AlertCircle className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" size={48} />
                  <p className="font-black uppercase italic tracking-tighter text-neutral-400">No rules yet. Create one above!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {rules.map(rule => (
                    <div key={rule.id} className={`${cardCls} p-8 group relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-strawberry-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-xl font-black italic uppercase tracking-tighter max-w-xs">{rule.title}</h4>
                          <div className="flex gap-2 shrink-0">
                            {rule.is_pinned && <Star size={16} className="text-strawberry-600 fill-strawberry-600" />}
                            {!rule.is_visible && <EyeOff size={16} className="text-neutral-400" />}
                          </div>
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 italic mb-8">"{rule.content}"</p>
                        <div className="flex items-center justify-between pt-6 border-t border-neutral-100 dark:border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-1">Priority</span>
                              <PriorityCell value={rule.priority ?? 0} onSave={async (v) => handleUpdateRule(rule.id, { priority: v })} />
                            </div>
                            <button
                              onClick={() => handleUpdateRule(rule.id, { is_visible: !rule.is_visible })}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${rule.is_visible ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}
                            >
                              {rule.is_visible ? <Eye size={10} /> : <EyeOff size={10} />}
                              {rule.is_visible ? 'Visible' : 'Hidden'}
                            </button>
                            <button
                              onClick={() => handleUpdateRule(rule.id, { is_pinned: !rule.is_pinned })}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${rule.is_pinned ? 'bg-strawberry-500/10 text-strawberry-600 dark:text-strawberry-500' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}
                            >
                              {rule.is_pinned ? <Star size={10} /> : <StarOff size={10} />}
                              {rule.is_pinned ? 'Pinned' : 'Pin'}
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setModal({ isOpen: true, type: 'edit-rule', data: rule })} className="p-3 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-strawberry-600 transition-all">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDeleteRule(rule.id)} className="p-3 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-red-600 transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── REMINDERS ── */}
          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Reminders</h3>
                <button onClick={() => setModal({ isOpen: true, type: 'reminder' })} className="px-6 py-2.5 bg-strawberry-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-strawberry-600/20 active:scale-95 transition-all">
                  Create Reminder
                </button>
              </div>
              {reminders.length === 0 ? (
                <div className={`${cardCls} p-12 text-center`}>
                  <AlertCircle className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" size={48} />
                  <p className="font-black uppercase italic tracking-tighter text-neutral-400">No reminders yet. Create one above!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {reminders.map(rem => (
                    <div key={rem.id} className={`${cardCls} p-6`}>
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-black italic uppercase tracking-tighter text-lg">{rem.title}</p>
                        <button
                          onClick={() => handleToggleReminderImportant(rem)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors shrink-0 ${rem.is_important ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}
                        >
                          {rem.is_important ? <Star size={10} /> : <StarOff size={10} />}
                          {rem.is_important ? 'Important' : 'Normal'}
                        </button>
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-6">{rem.message}</p>
                      <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-white/5">
                        <button onClick={() => setModal({ isOpen: true, type: 'edit-reminder', data: rem })} className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-strawberry-600 transition-all">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteReminder(rem.id)} className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-red-600 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── VERSIONS ── */}
          {activeTab === 'versions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Minecraft Versions</h3>
                <button onClick={() => setModal({ isOpen: true, type: 'version' })} className="px-6 py-2.5 bg-strawberry-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-strawberry-600/20 active:scale-95 transition-all">
                  Add Version
                </button>
              </div>
              {versions.length === 0 ? (
                <div className={`${cardCls} p-12 text-center`}>
                  <AlertCircle className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" size={48} />
                  <p className="font-black uppercase italic tracking-tighter text-neutral-400">No versions found. Add one above!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {versions.map(v => (
                    <div key={v.id} className={`${cardCls} p-6`}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-black italic uppercase tracking-tighter text-xl">{v.version_string}</p>
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${v.is_supported ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}>
                          {v.is_supported ? 'Supported' : 'Unsupported'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-white/5">
                        <button
                          onClick={() => handleToggleMaintenance(v)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors ${v.maintenance_mode ? 'bg-red-500/10 text-red-600 dark:text-red-500' : 'bg-green-500/10 text-green-600 dark:text-green-500'}`}
                        >
                          {v.maintenance_mode ? 'Maintenance ON' : 'Maintenance OFF'}
                        </button>
                        <div className="flex gap-2">
                          <button onClick={() => setModal({ isOpen: true, type: 'edit-version', data: v })} className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-strawberry-500 transition-all">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDeleteVersion(v.id)} className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-red-500 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CATEGORIES ── */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Manage Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/admin/categories/plugin" className={`${cardCls} p-10 text-center hover:border-strawberry-500/30 transition-colors group`}>
                  <ListFilter size={40} className="mx-auto text-strawberry-600 mb-4 group-hover:scale-110 transition-transform" />
                  <p className="font-black italic uppercase tracking-tighter text-lg">Plugin Categories</p>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-tight mt-1">Organize server plugins</p>
                </Link>
                <Link to="/admin/categories/shop" className={`${cardCls} p-10 text-center hover:border-strawberry-500/30 transition-colors group`}>
                  <Tag size={40} className="mx-auto text-strawberry-600 mb-4 group-hover:scale-110 transition-transform" />
                  <p className="font-black italic uppercase tracking-tighter text-lg">Shop Categories</p>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-tight mt-1">Categorize items in player shops</p>
                </Link>
              </div>
            </div>
          )}

          {/* ── BADGES ── */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Manage Badges</h3>
                <button onClick={() => setModal({ isOpen: true, type: 'badge' })} className="px-6 py-2.5 bg-strawberry-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-strawberry-600/20 active:scale-95 transition-all">
                  Create Badge
                </button>
              </div>
              {badges.length === 0 ? (
                <div className={`${cardCls} p-12 text-center`}>
                  <AlertCircle className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" size={48} />
                  <p className="font-black uppercase italic tracking-tighter text-neutral-400">No badges yet. Create one above!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {badges.map(badge => (
                    <div key={badge.id} className={`${cardCls} p-6`}>
                      <div className="mb-4">
                        <BadgeChip badge={badge} />
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-6">{badge.description || 'No description.'}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-white/5">
                        <button
                          onClick={() => handleUpdateBadge(badge.id, { is_visible: !badge.is_visible })}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${badge.is_visible ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}
                        >
                          {badge.is_visible ? <Eye size={10} /> : <EyeOff size={10} />}
                          {badge.is_visible ? 'Visible' : 'Hidden'}
                        </button>
                        <div className="flex gap-2">
                          <button onClick={() => setModal({ isOpen: true, type: 'edit-badge', data: badge })} className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-strawberry-500 transition-all">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDeleteBadge(badge.id)} className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-red-500 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>
      )}
    </div>
  );
};

export default AdminPanel;