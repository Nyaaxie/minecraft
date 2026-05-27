import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { dbService } from '../services/dbService';
import { adminService } from '../services/adminService';
import AdminApprovalPanel from '../components/AdminApprovalPanel';
import { AddVersionModal } from '../components/AddVersionModal';
import { AnnouncementModal } from '../components/AnnouncementModal';
import AddEditBadgeModal from '../components/AddEditBadgeModal';
import AssignBadgesModal from '../components/AssignBadgesModal';
import { useMinecraftVersions } from '../hooks/useMinecraftVersions';
import { useAuthStore } from '../store/useAuthStore';
import type { Profile, Event, Rule, Reminder, Badge, UserRole } from '../types/database.types';
import BadgeChip from '../components/BadgeChip';
import {
  Loader2, Trash2, Award, Calendar, Megaphone, ShieldCheck,
  Users, CheckSquare, Bell, Tag, BookOpen, Puzzle, Terminal,
  GitBranch, Shield, Plus, Edit2, X, Save, Search, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sortBadges } from '../utils/badgeUtils';

// ─── Types ─────────────────────────────────────────────────────────────────

type TabKey =
  | 'users' | 'approvals' | 'announcements' | 'events'
  | 'rules' | 'reminders' | 'versions' | 'categories'
  | 'badges' | 'commands' | 'guides' | 'plugins';

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'approvals', label: 'Approvals', icon: CheckSquare },
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'rules', label: 'Rules', icon: ShieldCheck },
  { key: 'reminders', label: 'Reminders', icon: Bell },
  { key: 'versions', label: 'Versions', icon: GitBranch },
  { key: 'categories', label: 'Categories', icon: Tag },
  { key: 'badges', label: 'Badges', icon: Award },
  { key: 'commands', label: 'Commands', icon: Terminal },
  { key: 'guides', label: 'Guides', icon: BookOpen },
  { key: 'plugins', label: 'Plugins', icon: Puzzle },
];

// ─── Shared UI ─────────────────────────────────────────────────────────────

const cardCls =
  'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-2xl shadow-sm p-4';

const inputCls =
  'w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-sm font-bold placeholder:text-neutral-400 focus:outline-none focus:border-strawberry-500/50 focus:ring-2 focus:ring-strawberry-500/10 transition-all';

const labelCls = 'text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1.5 block';

/** Animated spring modal */
const CrudModal = ({
  open, onClose, title, icon: Icon, onSubmit, submitting, children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  onSubmit: () => void;
  submitting?: boolean;
  children: React.ReactNode;
}) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-white/10 z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-neutral-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-strawberry-600/10 border border-strawberry-500/20 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-strawberry-600" />
              </div>
              <h2 className="text-lg font-black italic uppercase tracking-tighter">{title}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all">
              <X size={16} />
            </button>
          </div>
          <div className="px-7 py-6 space-y-4 max-h-[60vh] overflow-y-auto">{children}</div>
          <div className="flex items-center justify-end gap-3 px-7 pb-7 pt-4 border-t border-neutral-100 dark:border-white/5">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 font-black italic uppercase tracking-widest text-[10px] hover:bg-neutral-200 dark:hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-strawberry-600 hover:bg-strawberry-700 disabled:opacity-60 text-white font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-strawberry-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

/** Confirm delete dialog */
const ConfirmDelete = ({ open, onClose, onConfirm, label }: {
  open: boolean; onClose: () => void; onConfirm: () => void; label: string;
}) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-white/10 z-50 p-8 text-center space-y-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <div>
            <p className="font-black italic uppercase tracking-tighter text-lg">Delete {label}?</p>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">This cannot be undone.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-neutral-100 dark:bg-white/5 font-black italic uppercase tracking-widest text-[10px] transition-all hover:bg-neutral-200 dark:hover:bg-white/10">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 transition-all active:scale-95">Delete</button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

/** Section header with optional Add button and search */
const SectionHeader = ({ icon: Icon, title, count, onAdd, addLabel = 'Add', search, onSearch }: {
  icon: React.ElementType; title: string; count?: number;
  onAdd?: () => void; addLabel?: string; search?: string; onSearch?: (v: string) => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
    <div className="flex items-center gap-3">
      <Icon size={18} className="text-strawberry-600 shrink-0" />
      <h2 className="text-xl font-black italic uppercase tracking-tighter">{title}</h2>
      {count !== undefined && (
        <span className="text-[10px] font-black uppercase tracking-widest text-strawberry-600 bg-strawberry-500/10 px-2.5 py-1 rounded-lg">{count}</span>
      )}
    </div>
    <div className="flex items-center gap-2">
      {onSearch !== undefined && (
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-2 text-[11px] font-bold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-xl w-40 focus:outline-none focus:border-strawberry-500/50 transition-all" />
        </div>
      )}
      {onAdd && (
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2.5 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-strawberry-600/20 active:scale-95 transition-all">
          <Plus size={12} /> {addLabel}
        </button>
      )}
    </div>
  </div>
);

const RowActions = ({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) => (
  <div className="flex items-center gap-1.5 shrink-0">
    {onEdit && (
      <button onClick={onEdit} className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 text-neutral-400 hover:text-strawberry-600 hover:bg-strawberry-500/10 transition-all">
        <Edit2 size={12} />
      </button>
    )}
    {onDelete && (
      <button onClick={onDelete} className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
        <Trash2 size={12} />
      </button>
    )}
  </div>
);

const EmptyState = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 rounded-3xl p-16 text-center space-y-4">
    <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center mx-auto">
      <Icon className="text-neutral-300 dark:text-neutral-600" size={28} />
    </div>
    <p className="text-xs font-black uppercase tracking-widest text-neutral-400 italic">{label}</p>
  </div>
);

// ─── USERS TAB ─────────────────────────────────────────────────────────────

const UsersTab = ({ profiles, onRefresh, onAssignBadges }: {
  profiles: Profile[]; onRefresh: () => void; onAssignBadges: (p: Profile) => void;
}) => {
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [form, setForm] = useState({ role: '', username: '' });
  const [saving, setSaving] = useState(false);
  const ROLES: UserRole[] = ['player', 'admin'];

  const filtered = profiles.filter(p => p.username?.toLowerCase().includes(search.toLowerCase()));

  const openEdit = (p: Profile) => { setForm({ role: p.role || 'player', username: p.username || '' }); setEditTarget(p); };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await dbService.updateProfile(editTarget.id, { role: form.role as UserRole, username: form.username });
      toast.success('User updated');
      setEditTarget(null);
      onRefresh();
    }
    catch { toast.error('Failed to update user'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dbService.deleteProfile(deleteTarget.id);
      toast.success('User deleted');
      setDeleteTarget(null);
      onRefresh();
    }
    catch { toast.error('Failed to delete user'); }
  };

  return (
    <>
      <SectionHeader icon={Users} title="Users" count={filtered.length} search={search} onSearch={setSearch} />
      {filtered.length === 0 ? <EmptyState icon={Users} label="No users found" /> : filtered.map(p => (
        <div key={p.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
              {/* Fix: convert null to undefined for alt prop */}
              {p.avatar_url ? <img src={p.avatar_url} alt={p.username ?? undefined} className="w-full h-full object-cover" /> : <Users size={16} className="text-neutral-400" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tight truncate">{p.username}</p>
              {/* Fix: cast role to any to allow comparison with string literals beyond the strict UserRole union */}
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${(p.role as string) === 'admin' ? 'bg-strawberry-500/10 text-strawberry-600' : (p.role as string) === 'moderator' ? 'bg-blue-500/10 text-blue-500' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}>
                {p.role || 'player'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => onAssignBadges(p)} className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-white/5 hover:bg-strawberry-500/10 hover:text-strawberry-600 text-neutral-400 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest italic">
              <Award size={11} /> Badges
            </button>
            <RowActions onEdit={() => openEdit(p)} onDelete={() => setDeleteTarget(p)} />
          </div>
        </div>
      ))}
      <CrudModal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit User" icon={Users} onSubmit={handleSave} submitting={saving}>
        <div><label className={labelCls}>Username</label><input className={inputCls} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Username" /></div>
        <div>
          <label className={labelCls}>Role</label>
          <div className="flex gap-2 flex-wrap">
            {ROLES.map(r => (
              <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))} className={`px-4 py-2 rounded-xl text-[10px] font-black italic uppercase tracking-widest transition-all ${form.role === r ? 'bg-strawberry-600 text-white shadow-lg shadow-strawberry-600/20' : 'bg-neutral-100 dark:bg-white/5 text-neutral-500'}`}>{r}</button>
            ))}
          </div>
        </div>
      </CrudModal>
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.username || 'user'} />
    </>
  );
};

// ─── EVENTS TAB ────────────────────────────────────────────────────────────

const EventsTab = ({ events, onRefresh }: { events: Event[]; onRefresh: () => void }) => {
  const { profile } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '' });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm({ title: '', description: '', date: '', location: '' }); setEditTarget(null); setModalOpen(true); };
  const openEdit = (e: Event) => { setForm({ title: e.title || '', description: (e as any).description || '', date: (e as any).date || '', location: (e as any).location || '' }); setEditTarget(e); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) { await dbService.updateEvent(editTarget.id, form); toast.success('Event updated'); }
      else {
        // Fix: supply all required fields for Omit<Event, 'id' | 'created_at'>
        await dbService.createEvent({
          title: form.title,
          description: form.description || null,
          location: form.location || null,
          status: 'upcoming',
          start_time: form.date || new Date().toISOString(),
          end_time: null,
          created_by: profile?.id ?? '',
        });
        toast.success('Event created');
      }
      setModalOpen(false); onRefresh();
    } catch { toast.error('Failed to save event'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await dbService.deleteEvent(deleteTarget.id); toast.success('Event deleted'); setDeleteTarget(null); onRefresh(); }
    catch { toast.error('Failed to delete event'); }
  };

  return (
    <>
      <SectionHeader icon={Calendar} title="Events" count={events.length} onAdd={openAdd} addLabel="New Event" />
      {events.length === 0 ? <EmptyState icon={Calendar} label="No events scheduled" /> : events.map(e => (
        <div key={e.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-strawberry-500/10 flex items-center justify-center shrink-0"><Calendar size={13} className="text-strawberry-600" /></div>
            <div className="min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tight truncate">{e.title}</p>
              {(e as any).date && <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{(e as any).date}</p>}
            </div>
          </div>
          <RowActions onEdit={() => openEdit(e)} onDelete={() => setDeleteTarget(e)} />
        </div>
      ))}
      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Event' : 'New Event'} icon={Calendar} onSubmit={handleSave} submitting={saving}>
        <div><label className={labelCls}>Title</label><input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" /></div>
        <div><label className={labelCls}>Date & Time</label><input type="datetime-local" className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
        <div><label className={labelCls}>Location</label><input className={inputCls} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="In-game location or world" /></div>
        <div><label className={labelCls}>Description</label><textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Event details..." /></div>
      </CrudModal>
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.title || 'event'} />
    </>
  );
};

// ─── RULES TAB ─────────────────────────────────────────────────────────────

const RulesTab = ({ rules, onRefresh }: { rules: Rule[]; onRefresh: () => void }) => {
  const { profile } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Rule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Rule | null>(null);
  const [form, setForm] = useState({ title: '', content: '', order: 0 });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm({ title: '', content: '', order: rules.length + 1 }); setEditTarget(null); setModalOpen(true); };
  const openEdit = (r: Rule) => { setForm({ title: r.title || '', content: (r as any).content || '', order: (r as any).order || 0 }); setEditTarget(r); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) { await adminService.updateRule(editTarget.id, form); toast.success('Rule updated'); }
      else {
        // Fix: supply all required fields for Omit<Rule, 'id' | 'updated_at'>
        await adminService.createRule({
          title: form.title,
          content: form.content,
          priority: form.order,
          created_by: profile?.id ?? null,
          is_pinned: false,
          is_visible: true,
          category: null,
        });
        toast.success('Rule created');
      }
      setModalOpen(false); onRefresh();
    } catch { toast.error('Failed to save rule'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await adminService.deleteRule(deleteTarget.id); toast.success('Rule deleted'); setDeleteTarget(null); onRefresh(); }
    catch { toast.error('Failed to delete rule'); }
  };

  return (
    <>
      <SectionHeader icon={ShieldCheck} title="Rules" count={rules.length} onAdd={openAdd} addLabel="New Rule" />
      {rules.length === 0 ? <EmptyState icon={ShieldCheck} label="No rules defined" /> : rules.map((r, i) => (
        <div key={r.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-strawberry-500/10 flex items-center justify-center text-[11px] font-black text-strawberry-600 shrink-0">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tight truncate">{r.title}</p>
              {(r as any).content && <p className="text-[10px] text-neutral-400 font-bold truncate">{(r as any).content}</p>}
            </div>
          </div>
          <RowActions onEdit={() => openEdit(r)} onDelete={() => setDeleteTarget(r)} />
        </div>
      ))}
      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Rule' : 'New Rule'} icon={ShieldCheck} onSubmit={handleSave} submitting={saving}>
        <div><label className={labelCls}>Title</label><input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Rule title" /></div>
        <div><label className={labelCls}>Order</label><input type="number" className={inputCls} value={form.order} onChange={e => setForm(f => ({ ...f, order: +e.target.value }))} /></div>
        <div><label className={labelCls}>Content</label><textarea className={`${inputCls} resize-none`} rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Full rule text..." /></div>
      </CrudModal>
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.title || 'rule'} />
    </>
  );
};

// ─── REMINDERS TAB ─────────────────────────────────────────────────────────

const RemindersTab = ({ reminders, onRefresh }: { reminders: Reminder[]; onRefresh: () => void }) => {
  const { profile } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Reminder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reminder | null>(null);
  const [form, setForm] = useState({ title: '', message: '', interval_minutes: 60 });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm({ title: '', message: '', interval_minutes: 60 }); setEditTarget(null); setModalOpen(true); };
  const openEdit = (r: Reminder) => { setForm({ title: r.title || '', message: (r as any).message || '', interval_minutes: (r as any).interval_minutes || 60 }); setEditTarget(r); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) { await adminService.updateReminder(editTarget.id, form); toast.success('Reminder updated'); }
      else {
        // Fix: supply all required fields for Omit<Reminder, 'id' | 'created_at'>
        await adminService.createReminder({
          title: form.title,
          message: form.message,
          scheduled_at: null,
          expires_at: null,
          is_important: false,
          target_role: null,
          target_user_id: null,
          created_by: profile?.id ?? null,
        });
        toast.success('Reminder created');
      }
      setModalOpen(false); onRefresh();
    } catch { toast.error('Failed to save reminder'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await adminService.deleteReminder(deleteTarget.id); toast.success('Reminder deleted'); setDeleteTarget(null); onRefresh(); }
    catch { toast.error('Failed to delete reminder'); }
  };

  return (
    <>
      <SectionHeader icon={Bell} title="Reminders" count={reminders.length} onAdd={openAdd} addLabel="New Reminder" />
      {reminders.length === 0 ? <EmptyState icon={Bell} label="No reminders set" /> : reminders.map(r => (
        <div key={r.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-strawberry-500/10 flex items-center justify-center shrink-0"><Bell size={13} className="text-strawberry-600" /></div>
            <div className="min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tight truncate">{r.title}</p>
              {(r as any).interval_minutes && <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Every {(r as any).interval_minutes} min</p>}
            </div>
          </div>
          <RowActions onEdit={() => openEdit(r)} onDelete={() => setDeleteTarget(r)} />
        </div>
      ))}
      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Reminder' : 'New Reminder'} icon={Bell} onSubmit={handleSave} submitting={saving}>
        <div><label className={labelCls}>Title</label><input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Reminder title" /></div>
        <div><label className={labelCls}>Interval (minutes)</label><input type="number" className={inputCls} value={form.interval_minutes} onChange={e => setForm(f => ({ ...f, interval_minutes: +e.target.value }))} /></div>
        <div><label className={labelCls}>Message</label><textarea className={`${inputCls} resize-none`} rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Broadcast message text..." /></div>
      </CrudModal>
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.title || 'reminder'} />
    </>
  );
};

// ─── COMMANDS TAB ──────────────────────────────────────────────────────────

const CommandsTab = ({ commands, onRefresh }: { commands: any[]; onRefresh: () => void }) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', syntax: '', permission: '' });
  const [saving, setSaving] = useState(false);

  const filtered = commands.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({ name: '', description: '', syntax: '', permission: '' }); setEditTarget(null); setModalOpen(true); };
  const openEdit = (c: any) => { setForm({ name: c.name || '', description: c.description || '', syntax: c.syntax || '', permission: c.permission || '' }); setEditTarget(c); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) { await dbService.updateCommand(editTarget.id, form); toast.success('Command updated'); }
      else { await dbService.createCommand(form); toast.success('Command created'); }
      setModalOpen(false); onRefresh();
    } catch { toast.error('Failed to save command'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await dbService.deleteCommand(deleteTarget.id); toast.success('Command deleted'); setDeleteTarget(null); onRefresh(); }
    catch { toast.error('Failed to delete command'); }
  };

  return (
    <>
      <SectionHeader icon={Terminal} title="Commands" count={filtered.length} onAdd={openAdd} addLabel="New Command" search={search} onSearch={setSearch} />
      {filtered.length === 0 ? <EmptyState icon={Terminal} label="No commands registered" /> : filtered.map(cmd => (
        <div key={cmd.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 font-black text-sm text-strawberry-600">/</div>
            <div className="min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tight truncate">{cmd.name}</p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest truncate">{cmd.description}</p>
            </div>
          </div>
          <RowActions onEdit={() => openEdit(cmd)} onDelete={() => setDeleteTarget(cmd)} />
        </div>
      ))}
      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Command' : 'New Command'} icon={Terminal} onSubmit={handleSave} submitting={saving}>
        <div><label className={labelCls}>Command Name</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="/command" /></div>
        <div><label className={labelCls}>Syntax</label><input className={inputCls} value={form.syntax} onChange={e => setForm(f => ({ ...f, syntax: e.target.value }))} placeholder="/command [args]" /></div>
        <div><label className={labelCls}>Permission</label><input className={inputCls} value={form.permission} onChange={e => setForm(f => ({ ...f, permission: e.target.value }))} placeholder="plugin.command.use" /></div>
        <div><label className={labelCls}>Description</label><textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What this command does..." /></div>
      </CrudModal>
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.name || 'command'} />
    </>
  );
};

// ─── GUIDES TAB ────────────────────────────────────────────────────────────

const GuidesTab = ({ guides, onRefresh }: { guides: any[]; onRefresh: () => void }) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ title: '', content: '', category: '' });
  const [saving, setSaving] = useState(false);

  const filtered = guides.filter(g => g.title?.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({ title: '', content: '', category: '' }); setEditTarget(null); setModalOpen(true); };
  const openEdit = (g: any) => { setForm({ title: g.title || '', content: g.content || '', category: g.category || '' }); setEditTarget(g); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) { await dbService.updateGuide(editTarget.id, form); toast.success('Guide updated'); }
      else { await dbService.createGuide(form); toast.success('Guide created'); }
      setModalOpen(false); onRefresh();
    } catch { toast.error('Failed to save guide'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await dbService.deleteGuide(deleteTarget.id); toast.success('Guide deleted'); setDeleteTarget(null); onRefresh(); }
    catch { toast.error('Failed to delete guide'); }
  };

  return (
    <>
      <SectionHeader icon={BookOpen} title="Guides" count={filtered.length} onAdd={openAdd} addLabel="New Guide" search={search} onSearch={setSearch} />
      {filtered.length === 0 ? <EmptyState icon={BookOpen} label="No guides published" /> : filtered.map(g => (
        <div key={g.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-strawberry-500/10 flex items-center justify-center shrink-0"><BookOpen size={13} className="text-strawberry-600" /></div>
            <div className="min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tight truncate">{g.title}</p>
              {g.category && <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{g.category}</p>}
            </div>
          </div>
          <RowActions onEdit={() => openEdit(g)} onDelete={() => setDeleteTarget(g)} />
        </div>
      ))}
      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Guide' : 'New Guide'} icon={BookOpen} onSubmit={handleSave} submitting={saving}>
        <div><label className={labelCls}>Title</label><input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Guide title" /></div>
        <div><label className={labelCls}>Category</label><input className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Survival, Redstone, Economy" /></div>
        <div><label className={labelCls}>Content</label><textarea className={`${inputCls} resize-none`} rows={6} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Guide content (Markdown supported)..." /></div>
      </CrudModal>
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.title || 'guide'} />
    </>
  );
};

// ─── PLUGINS TAB ───────────────────────────────────────────────────────────

const PluginsTab = ({ plugins, onRefresh }: { plugins: any[]; onRefresh: () => void }) => {
  const { profile } = useAuthStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', version: '', url: '' });
  const [saving, setSaving] = useState(false);

  const filtered = plugins.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({ name: '', description: '', version: '', url: '' }); setEditTarget(null); setModalOpen(true); };
  const openEdit = (p: any) => { setForm({ name: p.name || '', description: p.description || '', version: p.version || '', url: p.url || '' }); setEditTarget(p); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) { await dbService.updatePlugin(editTarget.id, form); toast.success('Plugin updated'); }
      else {
        // Fix: supply all required fields for Omit<Plugin, 'id' | 'created_at' | 'updated_at'>
        await dbService.createPlugin({
          name: form.name,
          description: form.description || null,
          version: form.version || null,
          icon_url: null,
          category: null,
          is_visible: true,
          created_by: profile?.id ?? null,
        });
        toast.success('Plugin created');
      }
      setModalOpen(false); onRefresh();
    } catch { toast.error('Failed to save plugin'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await dbService.deletePlugin(deleteTarget.id); toast.success('Plugin deleted'); setDeleteTarget(null); onRefresh(); }
    catch { toast.error('Failed to delete plugin'); }
  };

  return (
    <>
      <SectionHeader icon={Puzzle} title="Plugins" count={filtered.length} onAdd={openAdd} addLabel="New Plugin" search={search} onSearch={setSearch} />
      {filtered.length === 0 ? <EmptyState icon={Puzzle} label="No plugins installed" /> : filtered.map(p => (
        <div key={p.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0"><Puzzle size={13} className="text-strawberry-600" /></div>
            <div className="min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tight truncate">{p.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest truncate">{p.description}</p>
                {p.version && <span className="text-[9px] font-black bg-neutral-100 dark:bg-white/5 text-neutral-400 px-1.5 py-0.5 rounded-md shrink-0">v{p.version}</span>}
              </div>
            </div>
          </div>
          <RowActions onEdit={() => openEdit(p)} onDelete={() => setDeleteTarget(p)} />
        </div>
      ))}
      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Plugin' : 'New Plugin'} icon={Puzzle} onSubmit={handleSave} submitting={saving}>
        <div><label className={labelCls}>Plugin Name</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Plugin name" /></div>
        <div><label className={labelCls}>Version</label><input className={inputCls} value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0.0" /></div>
        <div><label className={labelCls}>URL / Source</label><input className={inputCls} value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." /></div>
        <div><label className={labelCls}>Description</label><textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What this plugin does..." /></div>
      </CrudModal>
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.name || 'plugin'} />
    </>
  );
};

// ─── BADGES TAB ────────────────────────────────────────────────────────────

const BadgesTab = ({ badges, onRefresh, onAdd, onEdit }: {
  badges: Badge[]; onRefresh: () => void; onAdd: () => void; onEdit: (b: Badge) => void;
}) => {
  const [deleteTarget, setDeleteTarget] = useState<Badge | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await dbService.deleteBadge(deleteTarget.id); toast.success('Badge deleted'); setDeleteTarget(null); onRefresh(); }
    catch { toast.error('Failed to delete badge'); }
  };

  return (
    <>
      <SectionHeader icon={Award} title="Badges" count={badges.length} onAdd={onAdd} addLabel="New Badge" />
      {badges.length === 0 ? <EmptyState icon={Award} label="No badges created" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortBadges(badges).map(b => (
            <div key={b.id} className={`${cardCls} flex items-center justify-between gap-3`}>
              <BadgeChip badge={b} />
              <RowActions onEdit={() => onEdit(b)} onDelete={() => setDeleteTarget(b)} />
            </div>
          ))}
        </div>
      )}
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={(deleteTarget as any)?.name || 'badge'} />
    </>
  );
};

// ─── CATEGORIES TAB ────────────────────────────────────────────────────────

const CategoriesTab = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#ef4444' });
  const [saving, setSaving] = useState(false);

  const fetchCats = async () => {
    setLoading(true);
    // Fix: use correct method name getShopCategories
    try { setCategories(await dbService.getShopCategories()); }
    catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCats(); }, []);

  const openAdd = () => { setForm({ name: '', description: '', color: '#ef4444' }); setEditTarget(null); setModalOpen(true); };
  const openEdit = (c: any) => { setForm({ name: c.name || '', description: c.description || '', color: c.color || '#ef4444' }); setEditTarget(c); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fix: use correct method names updateShopCategory / createShopCategory
      if (editTarget) { await dbService.updateShopCategory(editTarget.id, form); toast.success('Category updated'); }
      else { await dbService.createShopCategory({ ...form, icon_url: null }); toast.success('Category created'); }
      setModalOpen(false); fetchCats();
    } catch { toast.error('Failed to save category'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Fix: use correct method name deleteShopCategory
    try { await dbService.deleteShopCategory(deleteTarget.id); toast.success('Category deleted'); setDeleteTarget(null); fetchCats(); }
    catch { toast.error('Failed to delete category'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-strawberry-600" size={28} /></div>;

  return (
    <>
      <SectionHeader icon={Tag} title="Categories" count={categories.length} onAdd={openAdd} addLabel="New Category" />
      {categories.length === 0 ? <EmptyState icon={Tag} label="No categories found" /> : categories.map(c => (
        <div key={c.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: (c.color || '#ef4444') + '20', border: `1px solid ${c.color || '#ef4444'}30` }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || '#ef4444' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tight truncate">{c.name}</p>
              {c.description && <p className="text-[10px] text-neutral-400 font-bold truncate">{c.description}</p>}
            </div>
          </div>
          <RowActions onEdit={() => openEdit(c)} onDelete={() => setDeleteTarget(c)} />
        </div>
      ))}
      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Category' : 'New Category'} icon={Tag} onSubmit={handleSave} submitting={saving}>
        <div><label className={labelCls}>Name</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" /></div>
        <div>
          <label className={labelCls}>Color</label>
          <div className="flex items-center gap-3">
            <input type="color" className="w-12 h-10 rounded-xl border border-neutral-200 dark:border-white/10 cursor-pointer" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            <input className={`${inputCls} flex-1`} value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="#ef4444" />
          </div>
        </div>
        <div><label className={labelCls}>Description</label><textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Category description..." /></div>
      </CrudModal>
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.name || 'category'} />
    </>
  );
};

// ─── VERSIONS TAB ──────────────────────────────────────────────────────────

const VersionsTab = ({ onAdd, onEdit }: { onAdd: () => void; onEdit: (v: any) => void }) => {
  const { versions, loading, refetch } = useMinecraftVersions();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await (await import('../services/supabase')).supabase
        .from('minecraft_versions')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Version deleted');
      setDeleteTarget(null);
      refetch();
    } catch { toast.error('Failed to delete version'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-strawberry-600" size={28} /></div>;

  return (
    <>
      <SectionHeader icon={GitBranch} title="Versions" count={versions?.length} onAdd={onAdd} addLabel="Add Version" />
      {!versions?.length ? <EmptyState icon={GitBranch} label="No versions added" /> : versions.map((v: any) => (
        <div key={v.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-strawberry-500/10 flex items-center justify-center shrink-0">
              <GitBranch size={13} className="text-strawberry-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tight truncate">{v.version_string}</p>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {v.is_recommended && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-500">Recommended</span>}
                {v.is_supported && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500">Supported</span>}
                {v.maintenance_mode && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600">Maintenance</span>}
                {v.supports_java && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 text-neutral-400">Java</span>}
                {v.supports_bedrock && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 text-neutral-400">Bedrock</span>}
              </div>
            </div>
          </div>
          <RowActions onEdit={() => onEdit(v)} onDelete={() => setDeleteTarget(v)} />
        </div>
      ))}
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.version_string || 'version'} />
    </>
  );
};

// ─── ROOT PANEL ────────────────────────────────────────────────────────────

const AdminPanel = () => {
  const { profile: currentAdminProfile } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [commands, setCommands] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [plugins, setPlugins] = useState<any[]>([]);
  const { refetch: refetchVersions } = useMinecraftVersions();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('users');
  const [modal, setModal] = useState<{ isOpen: boolean; type: string; data?: any }>({ isOpen: false, type: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, e, r, rem, b, c, g, pl] = await Promise.all([
        dbService.getAllProfiles(true) as any,
        dbService.getEvents(),
        adminService.getRules(),
        adminService.getReminders(),
        dbService.getBadges(),
        dbService.getCommands(),
        dbService.getGuides(),
        dbService.getPlugins(),
      ]);
      setProfiles(p); setEvents(e); setRules(r); setReminders(rem);
      setBadges(b); setCommands(c); setGuides(g); setPlugins(pl);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-3 sm:px-6">

      {/* Legacy modals for badges, assign, versions, announcements */}
      <AddVersionModal isOpen={modal.isOpen && (modal.type === 'version' || modal.type === 'edit-version')} onClose={() => setModal({ isOpen: false, type: '' })} onVersionAdded={refetchVersions} version={modal.type === 'edit-version' ? modal.data : undefined} />
      <AnnouncementModal isOpen={modal.isOpen && (modal.type === 'announcement' || modal.type === 'edit-announcement')} onClose={() => setModal({ isOpen: false, type: '' })} onSaved={() => fetchData()} announcement={modal.type === 'edit-announcement' ? modal.data : undefined} />
      <AddEditBadgeModal isOpen={modal.isOpen && (modal.type === 'badge' || modal.type === 'edit-badge')} onClose={() => setModal({ isOpen: false, type: '' })} onSave={fetchData} editingBadge={modal.type === 'edit-badge' ? modal.data : undefined} />
      <AssignBadgesModal isOpen={modal.isOpen && modal.type === 'assign-badges'} onClose={() => setModal({ isOpen: false, type: '' })} userProfile={modal.data} assignedBy={currentAdminProfile?.id || null} onBadgesUpdated={fetchData} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="pt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-strawberry-600/10 border border-strawberry-500/20 flex items-center justify-center shrink-0">
            <Shield className="text-strawberry-600" size={22} />
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
              Admin<span className="text-strawberry-600">Panel</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-0.5">Server Management Console</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 text-neutral-400 hover:text-strawberry-600 hover:border-strawberry-500/30 transition-all" title="Refresh">
          <RefreshCw size={15} />
        </button>
      </motion.div>

      {/* Tab bar */}
      <div className="w-full">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic whitespace-nowrap shrink-0 transition-all duration-200 ${active ? 'bg-strawberry-600 text-white shadow-lg shadow-strawberry-600/30' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 text-neutral-500 dark:text-neutral-400 hover:text-strawberry-600 hover:border-strawberry-500/30'}`}
              >
                <Icon size={12} />
                {label}
              </button>
            );
          })}
        </div>
        <div className="h-px bg-neutral-200 dark:bg-white/5 mt-1" />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-strawberry-600" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 animate-pulse">Loading Data...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            {activeTab === 'users' && <UsersTab profiles={profiles} onRefresh={fetchData} onAssignBadges={p => setModal({ isOpen: true, type: 'assign-badges', data: p })} />}
            {activeTab === 'approvals' && <AdminApprovalPanel />}
            {activeTab === 'announcements' && (
              <>
                <SectionHeader icon={Megaphone} title="Announcements" onAdd={() => setModal({ isOpen: true, type: 'announcement' })} addLabel="New Announcement" />
                <div className={cardCls}><div className="flex items-center gap-3 text-neutral-400"><Megaphone size={16} className="text-strawberry-600" /><span className="text-xs font-black uppercase tracking-widest italic">Manage server announcements</span></div></div>
              </>
            )}
            {activeTab === 'events' && <EventsTab events={events} onRefresh={fetchData} />}
            {activeTab === 'rules' && <RulesTab rules={rules} onRefresh={fetchData} />}
            {activeTab === 'reminders' && <RemindersTab reminders={reminders} onRefresh={fetchData} />}
            {activeTab === 'versions' && <VersionsTab onAdd={() => setModal({ isOpen: true, type: 'version' })} onEdit={v => setModal({ isOpen: true, type: 'edit-version', data: v })} />}
            {activeTab === 'categories' && <CategoriesTab />}
            {activeTab === 'badges' && <BadgesTab badges={badges} onRefresh={fetchData} onAdd={() => setModal({ isOpen: true, type: 'badge' })} onEdit={b => setModal({ isOpen: true, type: 'edit-badge', data: b })} />}
            {activeTab === 'commands' && <CommandsTab commands={commands} onRefresh={fetchData} />}
            {activeTab === 'guides' && <GuidesTab guides={guides} onRefresh={fetchData} />}
            {activeTab === 'plugins' && <PluginsTab plugins={plugins} onRefresh={fetchData} />}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default AdminPanel;