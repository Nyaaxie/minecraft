import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { dbService } from '../services/dbService';
import { adminService } from '../services/adminService';
import AdminApprovalPanel from '../components/AdminApprovalPanel';
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
  const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'announcements' | 'events' | 'rules' | 'reminders' | 'versions' | 'categories' | 'badges'>('users');
  const [modal, setModal] = useState<{ isOpen: boolean; type: string; data?: any }>({ isOpen: false, type: '' });
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [loadingRsvps, setLoadingRsvps] = useState(false);

  const handleViewRsvps = async (eventId: string) => {
    setModal({ isOpen: true, type: 'view-rsvps', data: { eventId } });
    setLoadingRsvps(true);
    try {
      const data = await dbService.getRSVPs(eventId);
      setRsvps(data.filter(rsvp => rsvp.status === 'joined'));
    } catch (err) {
      toast.error('Failed to load RSVPs');
    } finally {
      setLoadingRsvps(false);
    }
  };

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------
  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, e, r, rem, b] = await Promise.all([
        dbService.getAllProfiles(true) as any, // Include banned users
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
    const newBanStatus = !profile.is_banned;
    try {
      await dbService.updateProfile(profile.id, { 
        is_banned: newBanStatus,
        approval_status: newBanStatus ? 'banned' : 'approved' 
      });
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_banned: newBanStatus, approval_status: newBanStatus ? 'banned' : 'approved' } : p));
      toast.success(`User ${profile.is_banned ? 'unbanned' : 'banned'}!`);
    } catch (err: any) {
      toast.error(`Failed to update ban status: ${err.message}`);
    }
  };

  const handleStatusChange = async (profile: Profile, newStatus: 'pending' | 'approved' | 'rejected' | 'banned') => {
    try {
      await dbService.updateProfile(profile.id, { approval_status: newStatus });
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, approval_status: newStatus } : p));
      toast.success(`User status updated to ${newStatus}!`);
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
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
  // Shared styles — mobile-first compact design
  // -------------------------------------------------------------------------
  const inputCls = 'w-full bg-neutral-100 dark:bg-neutral-800 p-4 rounded-2xl border border-transparent focus:border-strawberry-500/30 text-neutral-900 dark:text-white focus:outline-none transition-all outline-none';
  const checkboxRowCls = 'flex items-center gap-4 p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-white/5 cursor-pointer select-none transition-all';
  const cardCls = 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-2xl shadow-sm';

  // Group profiles by role for the users tab
  const adminProfiles = profiles.filter(p => p.role === 'admin');
  const playerProfiles = profiles.filter(p => p.role !== 'admin');

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20 px-3 sm:px-6 overflow-x-hidden">

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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-2 sm:mt-6">
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

      {/* RSVP Viewer Modal */}
      <Modal
        isOpen={modal.isOpen && modal.type === 'view-rsvps'}
        onClose={() => setModal({ isOpen: false, type: '' })}
        title="Joined Players"
      >
        {loadingRsvps ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {rsvps.length === 0 ? <p className="text-center text-neutral-500">No players joined yet.</p> : (
              rsvps.map((rsvp: any) => (
                <div key={rsvp.id} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    <img src={rsvp.profiles?.avatar_url || '/default-avatar.png'} alt="" className="h-full w-full object-cover" />
                  </div>
                  <p className="font-bold">{rsvp.profiles?.username || 'Unknown'}</p>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={modal.isOpen && modal.type === 'edit-event'}
        onClose={() => setModal({ isOpen: false, type: '' })}
        title="Edit Event"
      >
        <form onSubmit={(e) => { e.preventDefault(); toast('Event update logic pending implementation.'); setModal({ isOpen: false, type: '' }); }} className="space-y-6">
          <input name="title" placeholder="Event Title" defaultValue={modal.data?.title || ''} required className={inputCls} />
          <textarea name="description" placeholder="Description" defaultValue={modal.data?.description || ''} required className={`${inputCls} h-32 resize-none`} />
          <button type="submit" className="w-full bg-strawberry-600 p-4 rounded-2xl font-black uppercase italic tracking-widest text-white hover:bg-strawberry-700 transition-all shadow-xl shadow-strawberry-600/20">
            Save Changes
          </button>
        </form>
      </Modal>

      {/* ── Page Header ── */}
      <div className="pt-2">
        <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white leading-none">
          Admin<span className="text-strawberry-600">Panel</span>
        </h1>
        <p className="text-neutral-500 mt-1 font-bold uppercase tracking-widest text-[10px]">
          System oversight & community moderation.
        </p>
      </div>

      {/* ── Tab bar ── */}
      <div className="w-full">
        <div className="flex gap-1.5 p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-2xl overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {(['users', 'approvals', 'announcements', 'events', 'rules', 'reminders', 'versions', 'categories', 'badges'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-xl text-[9px] font-black italic uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                ? 'bg-strawberry-600 text-white shadow-md shadow-strawberry-600/25'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
            >
              {tab === 'users' ? 'Users' : tab === 'approvals' ? 'Approvals' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading || versionsLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-strawberry-600" size={48} />
          <p className="text-neutral-500 font-black uppercase tracking-widest text-xs animate-pulse">Loading...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >

          {/* ── APPROVALS ── */}
          {activeTab === 'approvals' && <AdminApprovalPanel />}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              {profiles.length === 0 ? (
                <div className={`${cardCls} p-12 text-center`}>
                  <Users className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" size={40} />
                  <p className="font-black uppercase italic tracking-tighter text-neutral-400">No profiles found.</p>
                </div>
              ) : (
                <>
                  {/* Admins group */}
                  {adminProfiles.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-1 pt-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Admins · {adminProfiles.length}</span>
                        <div className="flex-1 h-px bg-neutral-100 dark:bg-white/5" />
                      </div>
                      {adminProfiles.map(p => (
                        <div key={p.id} className={`${cardCls} p-3 transition-all hover:border-strawberry-500/30 overflow-hidden`}>
                          {/* Row 1: avatar + name + status */}
                          <div className="flex items-center gap-2 w-full">
                            <div className="h-9 w-9 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                              {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : <Users size={16} className="text-neutral-400" />}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="font-black italic uppercase tracking-tighter text-sm truncate text-neutral-900 dark:text-white leading-tight">{p.username}</p>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest truncate leading-tight">{p.minecraft_username || 'No MC linked'}</p>
                            </div>
                            <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${p.is_banned ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-green-500/10 text-green-600 dark:text-green-500'}`}>
                              {p.is_banned ? 'Banned' : 'Active'}
                            </span>
                          </div>
                          {/* Row 2: role pill + action buttons */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-white/5">
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-strawberry-600 text-white">
                              {p.role}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <select
                                value={p.approval_status}
                                onChange={(e) => handleStatusChange(p, e.target.value as any)}
                                className="bg-neutral-100 dark:bg-neutral-800 text-[10px] p-1 rounded-lg border-none focus:ring-0"
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="banned">Banned</option>
                              </select>
                              <button onClick={() => handleRoleToggle(p)} className="p-1.5 rounded-lg text-neutral-400 hover:text-strawberry-500 active:scale-95 transition-all" title="Toggle Role">
                                <Shield size={14} />
                              </button>
                              <button onClick={() => handleBanToggle(p)} className={`p-1.5 rounded-lg active:scale-95 transition-all ${p.is_banned ? 'text-green-500' : 'text-red-500'}`} title={p.is_banned ? 'Unban' : 'Ban'}>
                                <Ban size={14} />
                              </button>
                              <button onClick={() => setModal({ isOpen: true, type: 'assign-badges', data: p })} className="p-1.5 rounded-lg text-neutral-400 hover:text-strawberry-500 active:scale-95 transition-all" title="Assign Badges">
                                <Award size={14} />
                              </button>
                            </div>                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Players group */}
                  {playerProfiles.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-1 pt-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Players · {playerProfiles.length}</span>
                        <div className="flex-1 h-px bg-neutral-100 dark:bg-white/5" />
                      </div>
                      {playerProfiles.map(p => (
                        <div key={p.id} className={`${cardCls} p-3 transition-all hover:border-strawberry-500/30 overflow-hidden`}>
                          {/* Row 1: avatar + name + status */}
                          <div className="flex items-center gap-2 w-full">
                            <div className="h-9 w-9 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                              {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : <Users size={16} className="text-neutral-400" />}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="font-black italic uppercase tracking-tighter text-sm truncate text-neutral-900 dark:text-white leading-tight">{p.username}</p>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest truncate leading-tight">{p.minecraft_username || 'No MC linked'}</p>
                            </div>
                            <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${p.is_banned ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-green-500/10 text-green-600 dark:text-green-500'}`}>
                              {p.is_banned ? 'Banned' : 'Active'}
                            </span>
                          </div>
                          {/* Row 2: role pill + action buttons */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-white/5">
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-neutral-100 dark:bg-white/5 text-neutral-400">
                              {p.role}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <select
                                value={p.approval_status}
                                onChange={(e) => handleStatusChange(p, e.target.value as any)}
                                className="bg-neutral-100 dark:bg-neutral-800 text-[10px] p-1 rounded-lg border-none focus:ring-0"
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="banned">Banned</option>
                              </select>
                              <button onClick={() => handleRoleToggle(p)} className="p-1.5 rounded-lg text-neutral-400 hover:text-strawberry-500 active:scale-95 transition-all" title="Toggle Role">
                                <Shield size={14} />
                              </button>
                              <button onClick={() => handleBanToggle(p)} className={`p-1.5 rounded-lg active:scale-95 transition-all ${p.is_banned ? 'text-green-500' : 'text-red-500'}`} title={p.is_banned ? 'Unban' : 'Ban'}>
                                <Ban size={14} />
                              </button>
                              <button onClick={() => setModal({ isOpen: true, type: 'assign-badges', data: p })} className="p-1.5 rounded-lg text-neutral-400 hover:text-strawberry-500 active:scale-95 transition-all" title="Assign Badges">
                                <Award size={14} />
                              </button>
                            </div>                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── ANNOUNCEMENTS ── */}
          {activeTab === 'announcements' && (
            <div className={`${cardCls} p-8 text-center`}>
              <div className="w-14 h-14 rounded-2xl bg-strawberry-500/10 mx-auto mb-5 flex items-center justify-center">
                <Megaphone size={28} className="text-strawberry-600" />
              </div>
              <h3 className="text-lg font-black italic uppercase tracking-tighter mb-2">Broadcast System</h3>
              <p className="text-neutral-500 max-w-xs mx-auto text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6">
                Send announcements to all players on the server.
              </p>
              <button
                onClick={() => setModal({ isOpen: true, type: 'announcement' })}
                className="w-full px-8 py-3 bg-strawberry-600 rounded-2xl font-black uppercase tracking-widest italic text-[10px] text-white hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20"
              >
                New Announcement
              </button>
            </div>
          )}

          {/* ── EVENTS ── */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 px-1">
                <h3 className="text-base font-black italic uppercase tracking-tighter">Manage Events</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 shrink-0">{events.length} Total</span>
              </div>
              {events.length === 0 ? (
                <div className={`${cardCls} p-10 text-center`}>
                  <Calendar className="mx-auto text-neutral-300 dark:text-neutral-700 mb-3" size={36} />
                  <p className="font-black uppercase italic tracking-tighter text-neutral-400 text-sm">No events found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map(ev => (
                    <div key={ev.id} className={`${cardCls} p-3 flex items-center justify-between gap-3 relative`}>
                      <div className="flex items-center gap-3 min-w-0">                        <div className="p-2.5 bg-strawberry-500/10 rounded-xl shrink-0">
                        <Calendar size={16} className="text-strawberry-600" />
                      </div>
                        <div className="min-w-0">
                          <p className="font-black italic uppercase tracking-tighter text-sm truncate">{ev.title}</p>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest truncate">{new Date(ev.start_time).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 relative z-50">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleViewRsvps(ev.id);
                          }}
                          className="px-3 py-1 bg-strawberry-600/10 text-strawberry-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-strawberry-600 hover:text-white transition-all cursor-pointer"
                        >
                          View Joined
                        </button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteEvent(ev.id); }} className="p-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg text-neutral-500 hover:text-red-500 transition-all cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setModal({ isOpen: true, type: 'edit-event', data: ev });
                          }}
                          className="p-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                        >
                          <MoreVertical size={14} />
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <h3 className="text-base font-black italic uppercase tracking-tighter">System Rules</h3>
                <button onClick={() => setModal({ isOpen: true, type: 'rule' })} className="px-4 py-2 bg-strawberry-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[9px] shadow-md shadow-strawberry-600/20 active:scale-95 transition-all whitespace-nowrap">
                  Create Rule
                </button>
              </div>
              {rules.length === 0 ? (
                <div className={`${cardCls} p-10 text-center`}>
                  <AlertCircle className="mx-auto text-neutral-300 dark:text-neutral-700 mb-3" size={36} />
                  <p className="font-black uppercase italic tracking-tighter text-neutral-400 text-sm">No rules yet. Create one above!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rules.map(rule => (
                    <div key={rule.id} className={`${cardCls} p-4 relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-strawberry-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="text-sm font-black italic uppercase tracking-tighter min-w-0 flex-1 break-words">{rule.title}</h4>
                          <div className="flex gap-1.5 shrink-0 pt-0.5">
                            {rule.is_pinned && <Star size={14} className="text-strawberry-600 fill-strawberry-600" />}
                            {!rule.is_visible && <EyeOff size={14} className="text-neutral-400" />}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic mb-4 break-words">"{rule.content}"</p>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-100 dark:border-white/5">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Priority</span>
                              <PriorityCell value={rule.priority ?? 0} onSave={async (v) => handleUpdateRule(rule.id, { priority: v })} />
                            </div>
                            <button
                              onClick={() => handleUpdateRule(rule.id, { is_visible: !rule.is_visible })}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${rule.is_visible ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}
                            >
                              {rule.is_visible ? <Eye size={10} /> : <EyeOff size={10} />}
                              {rule.is_visible ? 'Visible' : 'Hidden'}
                            </button>
                            <button
                              onClick={() => handleUpdateRule(rule.id, { is_pinned: !rule.is_pinned })}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${rule.is_pinned ? 'bg-strawberry-500/10 text-strawberry-600 dark:text-strawberry-500' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}
                            >
                              {rule.is_pinned ? <Star size={10} /> : <StarOff size={10} />}
                              {rule.is_pinned ? 'Pinned' : 'Pin'}
                            </button>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => setModal({ isOpen: true, type: 'edit-rule', data: rule })} className="p-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg text-neutral-500 hover:text-strawberry-600 transition-all">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg text-neutral-500 hover:text-red-600 transition-all">
                              <Trash2 size={14} />
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <h3 className="text-base font-black italic uppercase tracking-tighter">Reminders</h3>
                <button onClick={() => setModal({ isOpen: true, type: 'reminder' })} className="px-4 py-2 bg-strawberry-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[9px] shadow-md shadow-strawberry-600/20 active:scale-95 transition-all whitespace-nowrap">
                  Create Reminder
                </button>
              </div>
              {reminders.length === 0 ? (
                <div className={`${cardCls} p-10 text-center`}>
                  <AlertCircle className="mx-auto text-neutral-300 dark:text-neutral-700 mb-3" size={36} />
                  <p className="font-black uppercase italic tracking-tighter text-neutral-400 text-sm">No reminders yet. Create one above!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reminders.map(rem => (
                    <div key={rem.id} className={`${cardCls} p-4`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-black italic uppercase tracking-tighter text-sm break-all">{rem.title}</p>
                        <button
                          onClick={() => handleToggleReminderImportant(rem)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors shrink-0 ${rem.is_important ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}
                        >
                          {rem.is_important ? <Star size={10} /> : <StarOff size={10} />}
                          {rem.is_important ? 'Important' : 'Normal'}
                        </button>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 break-words">{rem.message}</p>
                      <div className="flex justify-end gap-1.5 pt-3 border-t border-neutral-100 dark:border-white/5">
                        <button onClick={() => setModal({ isOpen: true, type: 'edit-reminder', data: rem })} className="p-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg text-neutral-500 hover:text-strawberry-600 transition-all">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteReminder(rem.id)} className="p-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg text-neutral-500 hover:text-red-600 transition-all">
                          <Trash2 size={14} />
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <h3 className="text-base font-black italic uppercase tracking-tighter">Minecraft Versions</h3>
                <button onClick={() => setModal({ isOpen: true, type: 'version' })} className="px-4 py-2 bg-strawberry-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[9px] shadow-md shadow-strawberry-600/20 active:scale-95 transition-all whitespace-nowrap">
                  Add Version
                </button>
              </div>
              {versions.length === 0 ? (
                <div className={`${cardCls} p-10 text-center`}>
                  <AlertCircle className="mx-auto text-neutral-300 dark:text-neutral-700 mb-3" size={36} />
                  <p className="font-black uppercase italic tracking-tighter text-neutral-400 text-sm">No versions found. Add one above!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map(v => (
                    <div key={v.id} className={`${cardCls} p-4`}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="font-black italic uppercase tracking-tighter text-base truncate">{v.version_string}</p>
                        <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${v.is_supported ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}>
                          {v.is_supported ? 'Supported' : 'Unsupported'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-white/5">
                        <button
                          onClick={() => handleToggleMaintenance(v)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors ${v.maintenance_mode ? 'bg-red-500/10 text-red-600 dark:text-red-500' : 'bg-green-500/10 text-green-600 dark:text-green-500'}`}
                        >
                          {v.maintenance_mode ? 'Maintenance ON' : 'Maintenance OFF'}
                        </button>
                        <div className="flex gap-1.5">
                          <button onClick={() => setModal({ isOpen: true, type: 'edit-version', data: v })} className="p-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg text-neutral-500 hover:text-strawberry-500 transition-all">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteVersion(v.id)} className="p-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg text-neutral-500 hover:text-red-500 transition-all">
                            <Trash2 size={14} />
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
            <div className="space-y-3">
              <h3 className="text-base font-black italic uppercase tracking-tighter px-1">Manage Categories</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/admin/categories/plugin" className={`${cardCls} p-5 text-center hover:border-strawberry-500/30 transition-colors group block`}>
                  <ListFilter size={28} className="mx-auto text-strawberry-600 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-black italic uppercase tracking-tighter text-sm leading-tight">Plugin Categories</p>
                  <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-tight mt-1">Organize server plugins</p>
                </Link>
                <Link to="/admin/categories/shop" className={`${cardCls} p-5 text-center hover:border-strawberry-500/30 transition-colors group block`}>
                  <Tag size={28} className="mx-auto text-strawberry-600 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-black italic uppercase tracking-tighter text-sm leading-tight">Shop Categories</p>
                  <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-tight mt-1">Categorize shop items</p>
                </Link>
              </div>
            </div>
          )}

          {/* ── BADGES ── */}
          {activeTab === 'badges' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <h3 className="text-base font-black italic uppercase tracking-tighter">Manage Badges</h3>
                <button onClick={() => setModal({ isOpen: true, type: 'badge' })} className="px-4 py-2 bg-strawberry-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[9px] shadow-md shadow-strawberry-600/20 active:scale-95 transition-all whitespace-nowrap">
                  Create Badge
                </button>
              </div>
              {badges.length === 0 ? (
                <div className={`${cardCls} p-10 text-center`}>
                  <AlertCircle className="mx-auto text-neutral-300 dark:text-neutral-700 mb-3" size={36} />
                  <p className="font-black uppercase italic tracking-tighter text-neutral-400 text-sm">No badges yet. Create one above!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {badges.map(badge => (
                    <div key={badge.id} className={`${cardCls} p-4`}>
                      <div className="mb-3 overflow-hidden">
                        <BadgeChip badge={badge} />
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 break-words">{badge.description || 'No description.'}</p>
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-white/5">
                        <button
                          onClick={() => handleUpdateBadge(badge.id, { is_visible: !badge.is_visible })}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${badge.is_visible ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}
                        >
                          {badge.is_visible ? <Eye size={10} /> : <EyeOff size={10} />}
                          {badge.is_visible ? 'Visible' : 'Hidden'}
                        </button>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => setModal({ isOpen: true, type: 'edit-badge', data: badge })} className="p-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg text-neutral-500 hover:text-strawberry-500 transition-all">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteBadge(badge.id)} className="p-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg text-neutral-500 hover:text-red-500 transition-all">
                            <Trash2 size={14} />
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