import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dbService } from '../../../services/dbService';
import { adminService } from '../../../services/adminService';
import AdminApprovalPanel from '../components/AdminApprovalPanel';
import { AnnouncementModal } from '../components/AnnouncementModal';
import AddEditBadgeModal from '../components/AddEditBadgeModal';
import AssignBadgesModal from '../components/AssignBadgesModal';
import { useAuthStore } from '../../../store/useAuthStore';
import type { Profile, Event, Rule, Reminder, Badge, UserRole } from '../../../types/database.types';
import BadgeChip from '../../../components/BadgeChip';
import {
  Loader2, Trash2, Award, Calendar, Megaphone, ShieldCheck,
  Users, CheckSquare, Bell, BookOpen, Puzzle, Terminal,
  Shield, Plus, Edit2, X, Save, Search, RefreshCw,
  Info, MessageSquare, Sparkle, UsersRound, Store, User,
  Tag, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sortBadges, LOYALTY_BADGES } from '../../../utils/badgeUtils';
import { getMinecraftItemImageUrl } from '../../../utils/minecraftItemApi';
import Select from 'react-select';
import { useTheme } from '../../../components/ThemeProvider';

// ─── Types ─────────────────────────────────────────────────────────────────

type TabKey =
  | 'users' | 'approvals' | 'members' | 'shops' | 'categories' | 'subCategories' | 'announcements' | 'events'
  | 'rules' | 'reminders'
  | 'badges' | 'commands' | 'guides' | 'plugins' | 'serverInfo'
  | 'suggestions' | 'helpRequests';

type ModalState =
  | { type: 'none' }
  | { type: 'announcement' }
  | { type: 'edit-announcement'; data: any }
  | { type: 'badge' }
  | { type: 'edit-badge'; data: Badge }
  | { type: 'assign-badges'; data: Profile }
  | { type: 'member'; data?: any }
  | { type: 'assign-member-badges'; data: any }
  | { type: 'shop'; data?: any }
  | { type: 'category'; data?: any }
  | { type: 'subCategory'; data?: any };

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'approvals', label: 'Approvals', icon: CheckSquare },
  { key: 'members', label: 'Members', icon: UsersRound },
  { key: 'shops', label: 'Shops', icon: Store },
  { key: 'categories', label: 'Categories', icon: Tag },
  { key: 'subCategories', label: 'Sub-Categories', icon: Hash },
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'rules', label: 'Rules', icon: ShieldCheck },
  { key: 'reminders', label: 'Reminders', icon: Bell },
  { key: 'badges', label: 'Badges', icon: Award },
  { key: 'commands', label: 'Commands', icon: Terminal },
  { key: 'guides', label: 'Guides', icon: BookOpen },
  { key: 'plugins', label: 'Plugins', icon: Puzzle },
  { key: 'serverInfo', label: 'Server Info', icon: Info },
  { key: 'suggestions', label: 'Suggestions', icon: Sparkle },
  { key: 'helpRequests', label: 'Help Requests', icon: MessageSquare },
];

const cardCls =
  'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-2xl shadow-sm p-4';

const inputCls =
  'w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-sm font-bold placeholder:text-neutral-400 focus:outline-none focus:border-strawberry-500/50 focus:ring-2 focus:ring-strawberry-500/10 transition-all';

const labelCls = 'text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1.5 block';

const CrudModal = memo(({
  open, onClose, title, icon: Icon, onSubmit, submitting, children,
}: {
  open: boolean; onClose: () => void; title: string; icon: React.ElementType;
  onSubmit: () => void; submitting?: boolean; children: React.ReactNode;
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
));

const ConfirmDelete = memo(({ open, onClose, onConfirm, label }: {
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
));

const SectionHeader = memo(({ icon: Icon, title, count, onAdd, addLabel = 'Add', search, onSearch }: {
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
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-3 py-2 text-[11px] font-bold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-xl w-40 focus:outline-none focus:border-strawberry-500/50 transition-all"
          />
        </div>
      )}
      {onAdd && (
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2.5 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-strawberry-600/20 active:scale-95 transition-all">
          <Plus size={12} /> {addLabel}
        </button>
      )}
    </div>
  </div>
));

const RowActions = memo(({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) => (
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
));

const EmptyState = memo(({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 rounded-3xl p-16 text-center space-y-4">
    <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center mx-auto">
      <Icon className="text-neutral-300 dark:text-neutral-600" size={28} />
    </div>
    <p className="text-xs font-black uppercase tracking-widest text-neutral-400 italic">{label}</p>
  </div>
));

const ServerInfoTab = memo(({ serverInfo, onSave }: { serverInfo: any[]; onSave: (data: any[]) => void }) => {
  const [data, setData] = useState(serverInfo);
  useEffect(() => { setData(serverInfo); }, [serverInfo]);

  const updateItem = useCallback((index: number, key: string, value: string) => {
    setData(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }, []);

  const addItem = useCallback(() => setData(prev => [...prev, { label: '', value: '' }]), []);
  const deleteItem = useCallback((index: number) => setData(prev => prev.filter((_, i) => i !== index)), []);

  return (
    <>
      <SectionHeader icon={Info} title="Server Info Management" onAdd={addItem} addLabel="Add Row" />
      <div className={`${cardCls} space-y-3`}>
        {data.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input className={inputCls} value={item.label} onChange={e => updateItem(i, 'label', e.target.value)} placeholder="Label" />
            <input className={inputCls} value={item.value} onChange={e => updateItem(i, 'value', e.target.value)} placeholder="Value" />
            <button onClick={() => deleteItem(i)} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <button onClick={() => onSave(data)} className="mt-4 px-6 py-2.5 rounded-xl bg-strawberry-600 text-white font-black italic uppercase tracking-widest text-[10px]">
        Save Changes
      </button>
    </>
  );
});

const UsersTab = memo(({ profiles, onRefresh, onAssignBadges }: {
  profiles: Profile[]; onRefresh: () => void; onAssignBadges: (p: Profile) => void;
}) => {
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [form, setForm] = useState({ role: '', username: '', avatar_url: '' });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => profiles.filter(p => p.username?.toLowerCase().includes(search.toLowerCase())),
    [profiles, search]
  );
  const admins = useMemo(() => filtered.filter(p => p.role === 'admin'), [filtered]);
  const players = useMemo(() => filtered.filter(p => p.role !== 'admin'), [filtered]);

  const openEdit = useCallback((p: Profile) => {
    setForm({ 
      role: p.role || 'player', 
      username: p.username || '',
      avatar_url: p.avatar_url || ''
    });
    setEditTarget(p);
  }, []);

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await dbService.updateProfile(editTarget.id, { 
        role: form.role as UserRole, 
        username: form.username,
        avatar_url: form.avatar_url
      });
      toast.success('User updated');
      setEditTarget(null);
      onRefresh();
    } catch { toast.error('Failed to update user'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dbService.deleteProfile(deleteTarget.id);
      toast.success('User deleted');
      setDeleteTarget(null);
      onRefresh();
    } catch { toast.error('Failed to delete user'); }
  };

  const UserRow = useCallback(({ p }: { p: Profile }) => (
    <div className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
          {p.avatar_url
            ? <img src={p.avatar_url} alt={p.username ?? undefined} className="w-full h-full object-cover" />
            : <Users size={16} className="text-neutral-400" />}
          {/* Online Indicator */}
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 ${p.status === 'online' ? 'bg-green-500' : 'bg-neutral-400'}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black italic uppercase tracking-tight truncate">{p.username}</p>
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${p.role === 'admin' ? 'bg-strawberry-500/10 text-strawberry-600' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}>
            {p.role || 'player'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onAssignBadges(p)}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-white/5 hover:bg-strawberry-500/10 hover:text-strawberry-600 text-neutral-400 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest italic"
        >
          <Award size={11} /> Badges
        </button>
        <RowActions onEdit={() => openEdit(p)} onDelete={() => setDeleteTarget(p)} />
      </div>
    </div>
  ), [openEdit, onAssignBadges]);

  return (
    <>
      <SectionHeader icon={Users} title="Users" count={filtered.length} search={search} onSearch={setSearch} />
      {filtered.length === 0 ? <EmptyState icon={Users} label="No users found" /> : (
        <>
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3 px-2">Admins</h3>
            {admins.length === 0
              ? <p className="text-[10px] text-neutral-500 px-4 italic">No admins</p>
              : admins.map(p => <UserRow key={p.id} p={p} />)}
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3 px-2">Players</h3>
            {players.length === 0
              ? <p className="text-[10px] text-neutral-500 px-4 italic">No players</p>
              : players.map(p => <UserRow key={p.id} p={p} />)}
          </div>
        </>
      )}
      <CrudModal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit User" icon={Users} onSubmit={handleSave} submitting={saving}>
        <div><label className={labelCls}>Username</label><input className={inputCls} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Username" /></div>
        <div><label className={labelCls}>Avatar URL</label><input className={inputCls} value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="https://..." /></div>
        <div>
          <label className={labelCls}>Role</label>
          <div className="flex gap-2 flex-wrap">
            {['player', 'admin'].map(r => (
              <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))}
                className={`px-4 py-2 rounded-xl text-[10px] font-black italic uppercase tracking-widest transition-all ${form.role === r ? 'bg-strawberry-600 text-white shadow-lg shadow-strawberry-600/20' : 'bg-neutral-100 dark:bg-white/5 text-neutral-500'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </CrudModal>
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.username || 'user'} />
    </>
  );
});

const EventsTab = memo(({ events, onRefresh }: { events: Event[]; onRefresh: () => void }) => {
  const { profile } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '' });
  const [saving, setSaving] = useState(false);

  const openAdd = useCallback(() => { setForm({ title: '', description: '', date: '', location: '' }); setEditTarget(null); setModalOpen(true); }, []);
  const openEdit = useCallback((e: Event) => {
    setForm({ title: e.title || '', description: (e as any).description || '', date: (e as any).date || '', location: (e as any).location || '' });
    setEditTarget(e); setModalOpen(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) {
        await dbService.updateEvent(editTarget.id, form);
        toast.success('Event updated');
      } else {
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
});

const RulesTab = memo(({ rules, onRefresh }: { rules: Rule[]; onRefresh: () => void }) => {
  const { profile } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Rule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Rule | null>(null);
  const [form, setForm] = useState({ title: '', content: '', priority: 0 });
  const [saving, setSaving] = useState(false);

  const openAdd = useCallback(() => { setForm({ title: '', content: '', priority: rules.length + 1 }); setEditTarget(null); setModalOpen(true); }, [rules.length]);
  const openEdit = useCallback((r: Rule) => { setForm({ title: r.title || '', content: (r as any).content || '', priority: (r as any).priority || 0 }); setEditTarget(r); setModalOpen(true); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) { await adminService.updateRule(editTarget.id, form); toast.success('Rule updated'); }
      else {
        await adminService.createRule({ title: form.title, content: form.content, priority: form.priority, created_by: profile?.id ?? null, is_pinned: false, is_visible: true, category: null });
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
        <div><label className={labelCls}>Order</label><input type="number" className={inputCls} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))} /></div>
        <div><label className={labelCls}>Content</label><textarea className={`${inputCls} resize-none`} rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Full rule text..." /></div>
      </CrudModal>
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.title || 'rule'} />
    </>
  );
});

const RemindersTab = memo(({ reminders, onRefresh }: { reminders: Reminder[]; onRefresh: () => void }) => {
  const { profile } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Reminder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reminder | null>(null);
  const [form, setForm] = useState({ title: '', message: '', interval_minutes: 60 });
  const [saving, setSaving] = useState(false);

  const openAdd = useCallback(() => { setForm({ title: '', message: '', interval_minutes: 60 }); setEditTarget(null); setModalOpen(true); }, []);
  const openEdit = useCallback((r: Reminder) => { setForm({ title: r.title || '', message: (r as any).message || '', interval_minutes: (r as any).interval_minutes || 60 }); setEditTarget(r); setModalOpen(true); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) { await adminService.updateReminder(editTarget.id, form); toast.success('Reminder updated'); }
      else {
        await adminService.createReminder({ title: form.title, message: form.message, scheduled_at: null, expires_at: null, is_important: false, target_role: null, target_user_id: null, created_by: profile?.id ?? null });
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
});

const CommandsTab = memo(({ commands, onRefresh }: { commands: any[]; onRefresh: () => void }) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', syntax: '', permission: '' });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => commands.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())),
    [commands, search]
  );

  const openAdd = useCallback(() => { setForm({ name: '', description: '', syntax: '', permission: '' }); setEditTarget(null); setModalOpen(true); }, []);
  const openEdit = useCallback((c: any) => { setForm({ name: c.name || '', description: c.description || '', syntax: c.syntax || '', permission: c.permission || '' }); setEditTarget(c); setModalOpen(true); }, []);

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
});

const GuidesTab = memo(({ guides, onRefresh }: { guides: any[]; onRefresh: () => void }) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ title: '', content: '', category: '' });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => guides.filter(g => g.title?.toLowerCase().includes(search.toLowerCase())), [guides, search]);

  const openAdd = useCallback(() => { setForm({ title: '', content: '', category: '' }); setEditTarget(null); setModalOpen(true); }, []);
  const openEdit = useCallback((g: any) => { setForm({ title: g.title || '', content: g.content || '', category: g.category || '' }); setEditTarget(g); setModalOpen(true); }, []);

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
});

const MembersTab = memo(({ onRefresh, onAssignBadges }: {
  onRefresh: () => void; onAssignBadges: (m: any) => void;
}) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: '', nickname: '', bio: '', avatar_url: '',
    favorite_mob: '', favorite_block: '', favorite_color: '#e35a7f',
    favorite_biome: '', favorite_role: '', social_links: '',
    favorite_mob_url: '', favorite_block_url: '', favorite_biome_url: '', favorite_role_url: '',
    birth_month: '', birthday: '', relationship: '', join_date: '',
    sort_order: 0
  });

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getCommunityMembers();
      setMembers(data);
    } catch { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filtered = useMemo(
    () => members.filter(m =>
      m.username?.toLowerCase().includes(search.toLowerCase()) ||
      m.nickname?.toLowerCase().includes(search.toLowerCase())
    ),
    [members, search]
  );

  const openAdd = useCallback(() => {
    setForm({
      username: '', nickname: '', bio: '', avatar_url: '',
      favorite_mob: '', favorite_block: '', favorite_color: '#e35a7f',
      favorite_biome: '', favorite_role: '', social_links: '',
      favorite_mob_url: '', favorite_block_url: '', favorite_biome_url: '', favorite_role_url: '',
      birth_month: '', birthday: '', relationship: '', join_date: new Date().toISOString().split('T')[0],
      sort_order: members.length
    });
    setEditTarget(null);
    setIsAdding(true);
  }, [members.length]);

  const openEdit = useCallback((m: any) => {
    setForm({
      username: m.username || '',
      nickname: m.nickname || '',
      bio: m.bio || '',
      avatar_url: m.avatar_url || '',
      favorite_mob: m.favorite_mob || '',
      favorite_block: m.favorite_block || '',
      favorite_color: m.favorite_color || '#e35a7f',
      favorite_biome: m.favorite_biome || '',
      favorite_role: m.favorite_role || '',
      favorite_mob_url: m.favorite_mob_url || '',
      favorite_block_url: m.favorite_block_url || '',
      favorite_biome_url: m.favorite_biome_url || '',
      favorite_role_url: m.favorite_role_url || '',
      social_links: m.social_links || '',
      birth_month: m.birth_month || '',
      birthday: m.birthday || '',
      relationship: m.relationship || '',
      join_date: m.join_date || '',
      sort_order: m.sort_order || 0
    });
    setEditTarget(m);
    setIsAdding(false);
  }, []);

  const handleSave = async () => {
    if (!form.username) { toast.error('Username is required'); return; }
    setSaving(true);
    try {
      // Calculate age from birthday if provided
      let calculatedAge = null;
      if (form.birthday) {
        const birthDate = new Date(form.birthday);
        const today = new Date();
        calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
      }

      // Create a clean payload based on database schema
      const payload = {
        username: form.username,
        nickname: form.nickname,
        avatar_url: form.avatar_url,
        bio: form.bio,
        favorite_mob: form.favorite_mob,
        favorite_block: form.favorite_block,
        favorite_color: form.favorite_color,
        favorite_biome: form.favorite_biome,
        favorite_role: form.favorite_role,
        favorite_mob_url: form.favorite_mob_url,
        favorite_block_url: form.favorite_block_url,
        favorite_biome_url: form.favorite_biome_url,
        favorite_role_url: form.favorite_role_url,
        social_links: form.social_links,
        birth_month: form.birth_month,
        relationship: form.relationship,
        age: calculatedAge,
        birthday: form.birthday,
        join_date: form.join_date,
        sort_order: form.sort_order
      };

      if (editTarget) {
        await dbService.updateCommunityMember(editTarget.id, payload);
        toast.success('Member updated');
      } else {
        await dbService.createCommunityMember(payload);
        toast.success('Member created');
      }
      setEditTarget(null);
      setIsAdding(false);
      fetchMembers();
      onRefresh();
    } catch { toast.error('Failed to save member'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dbService.deleteCommunityMember(deleteTarget.id);
      toast.success('Member removed');
      setDeleteTarget(null);
      fetchMembers();
      onRefresh();
    } catch { toast.error('Failed to delete member'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-strawberry-600" size={28} /></div>;

  return (
    <>
      <SectionHeader icon={UsersRound} title="Community Members" count={filtered.length} onAdd={openAdd} addLabel="Add Member" search={search} onSearch={setSearch} />
      {filtered.length === 0 ? <EmptyState icon={UsersRound} label="No members found" /> : filtered.map(m => (
        <div key={m.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
              {m.avatar_url
                ? <img src={m.avatar_url} alt={m.username} className="w-full h-full object-cover" />
                : <User size={16} className="text-neutral-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black italic uppercase tracking-tight truncate">{m.username}</p>
              {m.nickname && <p className="text-[10px] text-strawberry-600 font-bold uppercase tracking-widest truncate">aka {m.nickname}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onAssignBadges(m)}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-white/5 hover:bg-strawberry-500/10 hover:text-strawberry-600 text-neutral-400 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest italic"
            >
              <Award size={11} /> Badges
            </button>
            <RowActions onEdit={() => openEdit(m)} onDelete={() => setDeleteTarget(m)} />
          </div>
        </div>
      ))}

      <CrudModal open={!!editTarget || isAdding} onClose={() => { setEditTarget(null); setIsAdding(false); }} title={editTarget ? 'Edit Member' : 'Add Member'} icon={UsersRound} onSubmit={handleSave} submitting={saving}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Username (Required)</label>
            <input className={inputCls} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Minecraft Username" />
          </div>
          <div>
            <label className={labelCls}>Nickname</label>
            <input className={inputCls} value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} placeholder="Display Nickname" />
          </div>
          <div>
            <label className={labelCls}>Display Order</label>
            <input type="number" className={inputCls} value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} placeholder="Order (e.g. 1)" />
          </div>
          <div>
            <label className={labelCls}>Birthday</label>
            <input type="date" className={inputCls} value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Relationship (Optional)</label>
            <input className={inputCls} value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} placeholder="Relationship" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Avatar URL (Optional)</label>
            <input className={inputCls} value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="https://..." />
          </div>
          <div>
            <label className={labelCls}>Birth Month</label>
            <input className={inputCls} value={form.birth_month} onChange={e => setForm(f => ({ ...f, birth_month: e.target.value }))} placeholder="e.g. July" />
          </div>
          <div>
            <label className={labelCls}>Join Date</label>
            <input type="date" className={inputCls} value={form.join_date} onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Social Link</label>
            <input className={inputCls} value={form.social_links} onChange={e => setForm(f => ({ ...f, social_links: e.target.value }))} placeholder="Paste social link here..." />
          </div>

          {/* Role */}
          <div className="col-span-2">
            <label className={labelCls}>Role</label>
            <input className={inputCls} value={form.favorite_role} onChange={e => setForm(f => ({ ...f, favorite_role: e.target.value }))} placeholder="e.g. Adventure" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Role Icon URL</label>
            <input className={inputCls} value={form.favorite_role_url} onChange={e => setForm(f => ({ ...f, favorite_role_url: e.target.value }))} placeholder="https://..." />
          </div>

          {/* Biome */}
          <div className="col-span-2">
            <label className={labelCls}>Biome</label>
            <input className={inputCls} value={form.favorite_biome} onChange={e => setForm(f => ({ ...f, favorite_biome: e.target.value }))} placeholder="e.g. Plains" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Biome Icon URL</label>
            <input className={inputCls} value={form.favorite_biome_url} onChange={e => setForm(f => ({ ...f, favorite_biome_url: e.target.value }))} placeholder="https://..." />
          </div>

          {/* Mob */}
          <div className="col-span-2">
            <label className={labelCls}>Mob</label>
            <input className={inputCls} value={form.favorite_mob} onChange={e => setForm(f => ({ ...f, favorite_mob: e.target.value }))} placeholder="e.g. Creeper" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Mobs Icon URL</label>
            <input className={inputCls} value={form.favorite_mob_url} onChange={e => setForm(f => ({ ...f, favorite_mob_url: e.target.value }))} placeholder="https://..." />
          </div>

          {/* Block */}
          <div className="col-span-2">
            <label className={labelCls}>Block</label>
            <input className={inputCls} value={form.favorite_block} onChange={e => setForm(f => ({ ...f, favorite_block: e.target.value }))} placeholder="e.g. Dirt" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Block Icon URL</label>
            <input className={inputCls} value={form.favorite_block_url} onChange={e => setForm(f => ({ ...f, favorite_block_url: e.target.value }))} placeholder="https://..." />
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Bio</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Member biography..." />
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Fav Color</label>
            <div className="flex gap-3">
              <input type="color" className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none cursor-pointer" value={form.favorite_color} onChange={e => setForm(f => ({ ...f, favorite_color: e.target.value }))} />
              <input className={inputCls} value={form.favorite_color} onChange={e => setForm(f => ({ ...f, favorite_color: e.target.value }))} placeholder="#HEX" />
            </div>
          </div>
        </div>
      </CrudModal>

      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.username || 'member'} />
    </>
  );
});

const ShopsTab = memo(({ onRefresh }: { onRefresh: () => void }) => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', nickname: '', owner_name: '', description: '', avatar_url: '', is_active: true });

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getPlayerShops();
      setShops(data);
    } catch { toast.error('Failed to load shops'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const filtered = useMemo(
    () => shops.filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.nickname?.toLowerCase().includes(search.toLowerCase())
    ),
    [shops, search]
  );

  const openAdd = useCallback(() => {
    setForm({ name: '', nickname: '', owner_name: '', description: '', avatar_url: '', is_active: true });
    setEditTarget(null);
    setIsAdding(true);
  }, []);

  const openEdit = useCallback((s: any) => {
    setForm({
      name: s.name || '',
      nickname: s.nickname || '',
      owner_name: s.owner_name || '',
      description: s.description || '',
      avatar_url: s.banner_url || '',
      is_active: s.is_active ?? true
    });
    setEditTarget(s);
    setIsAdding(false);
  }, []);

  const handleSave = async () => {
    if (!form.owner_name) { toast.error('Owner Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.owner_name,
        owner_name: form.owner_name, // Store username for display
        nickname: form.nickname,
        banner_url: form.avatar_url,
        description: form.description,
        is_active: form.is_active,
        owner_id: null // Explicitly force null for admin-managed shops
      };
      if (editTarget) {
        await dbService.updatePlayerShop(editTarget.id, payload);
        toast.success('Shop updated');
      } else {
        await dbService.createPlayerShop(payload);
        toast.success('Shop created');
      }
      setEditTarget(null);
      setIsAdding(false);
      fetchShops();
      onRefresh();
    } catch { toast.error('Failed to save shop'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dbService.deletePlayerShop(deleteTarget.id);
      toast.success('Shop removed');
      setDeleteTarget(null);
      fetchShops();
      onRefresh();
    } catch { toast.error('Failed to delete shop'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-strawberry-600" size={28} /></div>;

  return (
    <>
      <SectionHeader icon={Store} title="Player Shops" count={filtered.length} onAdd={openAdd} addLabel="New Shop" search={search} onSearch={setSearch} />
      {filtered.length === 0 ? <EmptyState icon={Store} label="No shops found" /> : filtered.map(s => (
        <div key={s.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0 flex-grow group">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
              {s.banner_url
                ? <img src={s.banner_url} alt={s.owner_name} className="w-full h-full object-cover" />
                : <Store size={16} className="text-neutral-400" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tight truncate group-hover:text-strawberry-600 transition-colors">{s.owner_name}</p>
              <p className="text-[10px] text-strawberry-600 font-bold uppercase tracking-widest truncate italic">
                {s.nickname ? `aka ${s.nickname} • Market Stall` : 'Market Stall'}
              </p>
            </div>
          </div>
          <RowActions onEdit={() => openEdit(s)} onDelete={() => setDeleteTarget(s)} />
        </div>
      ))}

      <CrudModal
        open={!!editTarget || isAdding}
        onClose={() => { setEditTarget(null); setIsAdding(false); }}
        title={editTarget ? 'Edit Shop' : 'New Shop'}
        icon={Store}
        onSubmit={handleSave}
        submitting={saving}
      >
        <div className="space-y-4">
          <div><label className={labelCls}>Owner Username</label><input className={inputCls} value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} placeholder="Player Username" /></div>
          <div><label className={labelCls}>Shop Nickname</label><input className={inputCls} value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} placeholder="Nickname (optional)" /></div>
          <div><label className={labelCls}>Avatar URL</label><input className={inputCls} value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="https://..." /></div>
          <div><label className={labelCls}>Description</label><textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Shop tagline..." /></div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-strawberry-600" />
              <label className="text-xs font-bold uppercase tracking-widest italic">Shop is Active</label>
            </div>
            {editTarget && (
              <Link to={`/shops/${editTarget.id}/items/new`} className="text-xs font-black uppercase tracking-widest text-strawberry-600 hover:text-strawberry-700">
                Manage Items
              </Link>
            )}
          </div>
          {editTarget && editTarget.shop_items && editTarget.shop_items.length > 0 && (
            <div className="mt-6 border-t border-neutral-100 dark:border-white/5 pt-4">
              <label className={labelCls}>Current Shop Items</label>
              <div className="space-y-2 mt-2">
                {editTarget.shop_items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={item.custom_image_url || getMinecraftItemImageUrl(item.minecraft_item_id, { size: 64 })}
                          alt={item.item_name}
                          className="w-6 h-6 object-contain pixelated"
                          onError={(e) => { e.currentTarget.src = 'https://minecraft.wiki/images/Invicon_Barrier.png'; }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{item.item_name}</span>
                        <div className="flex items-center gap-1 text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                          <span>{item.categories?.name || 'No Category'}</span>
                          {item.sub_categories?.name && (
                            <>
                              <span className="text-neutral-300">/</span>
                              <span className="text-strawberry-600/70">{item.sub_categories.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-strawberry-600">{item.price} DIAMONDS</span>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/shops/${editTarget.id}/items/${item.id}/edit`}
                          className="p-1.5 text-neutral-400 hover:text-strawberry-600 rounded-lg hover:bg-strawberry-500/10"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button onClick={async () => {
                          if (window.confirm('Remove this item?')) {
                            await dbService.deleteShopItem(item.id);
                            toast.success('Item removed');
                            fetchShops();
                            onRefresh();
                          }
                        }} className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-500/10">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CrudModal>

      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.name || 'shop'} />
    </>
  );
});

const CategoriesTab = memo(({ categories, onRefresh }: { categories: any[]; onRefresh: () => void }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', description: '', display_order: 0 });
  const [saving, setSaving] = useState(false);

  const openAdd = useCallback(() => { setForm({ name: '', description: '', display_order: categories.length }); setEditTarget(null); setModalOpen(true); }, [categories.length]);
  const openEdit = useCallback((c: any) => { setForm({ name: c.name || '', description: c.description || '', display_order: c.display_order || 0 }); setEditTarget(c); setModalOpen(true); }, []);

  const handleSave = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editTarget) { await dbService.updateCategory(editTarget.id, form); toast.success('Category updated'); }
      else { await dbService.createCategory(form); toast.success('Category created'); }
      setModalOpen(false); onRefresh();
    } catch { toast.error('Failed to save category'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await dbService.deleteCategory(deleteTarget.id); toast.success('Category deleted'); setDeleteTarget(null); onRefresh(); }
    catch { toast.error('Failed to delete category'); }
  };

  return (
    <>
      <SectionHeader icon={Tag} title="Categories" count={categories.length} onAdd={openAdd} addLabel="New Category" />
      {categories.length === 0 ? <EmptyState icon={Tag} label="No categories defined" /> : categories.map(c => (
        <div key={c.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-strawberry-500/10 flex items-center justify-center shrink-0"><Tag size={13} className="text-strawberry-600" /></div>
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
        <div><label className={labelCls}>Order</label><input type="number" className={inputCls} value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: +e.target.value }))} /></div>
        <div><label className={labelCls}>Description</label><textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Category description..." /></div>
      </CrudModal>
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.name || 'category'} />
    </>
  );
});

const SubCategoriesTab = memo(({ subCategories, categories, onRefresh }: { subCategories: any[]; categories: any[]; onRefresh: () => void }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const selectStyles = useMemo(() => ({
    control: (base: any) => ({
      ...base,
      backgroundColor: 'transparent',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
      borderRadius: '0.75rem',
      padding: '0.125rem 0.25rem',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#f43f5e'
      },
      transition: 'all 0.2s ease'
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDark ? '#ffffff' : '#171717',
      fontWeight: 'bold',
      fontSize: '0.875rem'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: isDark ? '#737373' : '#a3a3a3',
      fontSize: '0.875rem'
    }),
    input: (base: any) => ({
      ...base,
      color: isDark ? '#ffffff' : '#171717',
      fontSize: '0.875rem'
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: isDark ? '#171717' : '#ffffff',
      borderRadius: '1rem',
      overflow: 'hidden',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      zIndex: 100
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused
        ? (isDark ? '#f43f5e33' : '#f43f5e1a')
        : 'transparent',
      color: isDark ? '#ffffff' : '#171717',
      fontWeight: 'bold',
      fontSize: '0.875rem',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#f43f5e33'
      }
    })
  }), [isDark]);

  const categoryOptions = useMemo(() =>
    categories.map(c => ({ value: c.id, label: c.name })),
    [categories]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', description: '', display_order: 0, category_id: '' });
  const [saving, setSaving] = useState(false);

  const openAdd = useCallback(() => { setForm({ name: '', description: '', display_order: subCategories.length, category_id: categories[0]?.id || '' }); setEditTarget(null); setModalOpen(true); }, [subCategories.length, categories]);
  const openEdit = useCallback((s: any) => { setForm({ name: s.name || '', description: s.description || '', display_order: s.display_order || 0, category_id: s.category_id || '' }); setEditTarget(s); setModalOpen(true); }, []);

  const handleSave = async () => {
    if (!form.name || !form.category_id) { toast.error('Name and Category are required'); return; }
    setSaving(true);
    try {
      if (editTarget) { await dbService.updateSubCategory(editTarget.id, form); toast.success('Sub-Category updated'); }
      else { await dbService.createSubCategory(form); toast.success('Sub-Category created'); }
      setModalOpen(false); onRefresh();
    } catch { toast.error('Failed to save sub-category'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await dbService.deleteSubCategory(deleteTarget.id); toast.success('Sub-Category deleted'); setDeleteTarget(null); onRefresh(); }
    catch { toast.error('Failed to delete sub-category'); }
  };

  return (
    <>
      <SectionHeader icon={Hash} title="Sub-Categories" count={subCategories.length} onAdd={openAdd} addLabel="New Sub-Category" />
      {subCategories.length === 0 ? <EmptyState icon={Hash} label="No sub-categories defined" /> : subCategories.map(s => (
        <div key={s.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-strawberry-500/10 flex items-center justify-center shrink-0"><Hash size={13} className="text-strawberry-600" /></div>
            <div className="min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tight truncate">{s.name}</p>
              <p className="text-[10px] text-strawberry-600 font-bold uppercase tracking-widest">{s.categories?.name || 'Unknown Category'}</p>
            </div>
          </div>
          <RowActions onEdit={() => openEdit(s)} onDelete={() => setDeleteTarget(s)} />
        </div>
      ))}
      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Sub-Category' : 'New Sub-Category'} icon={Hash} onSubmit={handleSave} submitting={saving}>
        <div><label className={labelCls}>Name</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sub-category name" /></div>
        <div>
          <label className={labelCls}>Parent Category</label>
          <Select
            options={categoryOptions}
            value={categoryOptions.find(opt => opt.value === form.category_id) || null}
            onChange={(opt) => setForm(f => ({ ...f, category_id: opt?.value || '' }))}
            styles={selectStyles}
            placeholder="Select Category"
            isClearable
          />
        </div>
        <div><label className={labelCls}>Order</label><input type="number" className={inputCls} value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: +e.target.value }))} /></div>
        <div><label className={labelCls}>Description</label><textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Sub-category description..." /></div>
      </CrudModal>
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.name || 'sub-category'} />
    </>
  );
});

const BadgesTab = memo(({ badges, onRefresh, onAdd, onEdit }: {
  badges: Badge[]; onRefresh: () => void; onAdd: () => void; onEdit: (b: Badge) => void;
}) => {
  const [deleteTarget, setDeleteTarget] = useState<Badge | null>(null);
  const sorted = useMemo(() => sortBadges(badges), [badges]);
  
  const autoBadges = useMemo(() => Object.values(LOYALTY_BADGES), []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await dbService.deleteBadge(deleteTarget.id); toast.success('Badge deleted'); setDeleteTarget(null); onRefresh(); }
    catch { toast.error('Failed to delete badge'); }
  };

  const filteredManualBadges = useMemo(() => {
    return sorted.filter(b => {
      const name = b.name.toLowerCase();
      // Keep special ones
      if (name.includes('owner') || name.includes('unbreaking') || name.includes('salingkikit')) return true;
      // Filter out loyalty/berry ones
      if (name.includes('berry') || name.includes('loyalty')) return false;
      return true;
    });
  }, [sorted]);

  return (
    <div className="space-y-8">
      {/* Manual Badges */}
      <section>
        <SectionHeader icon={Award} title="Manual Badges" count={filteredManualBadges.length} onAdd={onAdd} addLabel="New Badge" />
        {filteredManualBadges.length === 0 ? <EmptyState icon={Award} label="No manual badges found" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredManualBadges.map(b => (
              <div key={b.id} className={`${cardCls} flex items-center justify-between gap-3`}>
                <BadgeChip badge={b} />
                <RowActions onEdit={() => onEdit(b)} onDelete={() => setDeleteTarget(b)} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Automatic Loyalty Badges */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Sparkle size={18} className="text-strawberry-600 shrink-0" />
          <h2 className="text-xl font-black italic uppercase tracking-tighter">Automatic Loyalty Badges</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-strawberry-600 bg-strawberry-500/10 px-2.5 py-1 rounded-lg">4</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-80">
          {autoBadges.map(b => {
            // Find if this automatic badge already has a DB entry
            const dbEntry = badges.find(db => db.name.toLowerCase().trim() === b.name.toLowerCase().trim());
            return (
              <div key={b.id} className={`${cardCls} flex items-center justify-between gap-3 border-dashed`}>
                <BadgeChip badge={dbEntry || b} />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 italic">Automatic</span>
                  <button 
                    onClick={() => onEdit(dbEntry || { ...b, id: undefined as any })} 
                    className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-400 hover:text-strawberry-600 hover:bg-strawberry-500/10 transition-all"
                  >
                    <Edit2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[10px] text-neutral-400 font-bold uppercase tracking-widest italic">
          * These badges are assigned automatically based on join date. Editing their color here will create/update a theme override in the database.
        </p>
      </section>

      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={(deleteTarget as any)?.name || 'badge'} />
    </div>
  );
});

const PluginsTab = memo(({ plugins, onRefresh }: { plugins: any[]; onRefresh: () => void }) => {
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dbService.deletePlugin(deleteTarget.id);
      toast.success('Plugin deleted');
      setDeleteTarget(null);
      onRefresh();
    } catch {
      toast.error('Failed to delete plugin');
    }
  };

  return (
    <>
      <SectionHeader
        icon={Puzzle}
        title="Plugins"
        count={plugins.length}
        onAdd={() => window.location.href = '/admin/plugins/new'}
        addLabel="New Plugin"
      />
      {plugins.length === 0 ? <EmptyState icon={Puzzle} label="No plugins listed yet" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plugins.map(p => (
            <div key={p.id} className={`${cardCls} flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-3 min-w-0">
                <img src={p.icon_url || 'https://via.placeholder.com/40'} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{p.name}</h4>
                  <p className="text-[10px] text-neutral-500 truncate">{p.category} • v{p.version}</p>
                </div>
              </div>
              <RowActions
                onEdit={() => window.location.href = `/admin/plugins/${p.id}`}
                onDelete={() => setDeleteTarget(p)}
              />
            </div>
          ))}
        </div>
      )}
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label={deleteTarget?.name || 'plugin'} />
    </>
  );
});

const SuggestionsTab = memo(({ suggestions, onRefresh }: { suggestions: any[]; onRefresh: () => void }) => {
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await dbService.deleteSuggestion(deleteTarget.id); toast.success('Suggestion deleted'); setDeleteTarget(null); onRefresh(); }
    catch { toast.error('Failed to delete suggestion'); }
  };

  return (
    <>
      <SectionHeader icon={Sparkle} title="Suggestions" count={suggestions.length} />
      {suggestions.length === 0 ? <EmptyState icon={Sparkle} label="No suggestions yet" /> : suggestions.map(s => (
        <div key={s.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <p className="font-bold text-sm">{s.title}</p>
              <span className="text-[10px] font-black uppercase text-neutral-400">{s.profiles?.username}</span>
            </div>
            <p className="text-xs text-neutral-500">{s.description}</p>
          </div>
          <RowActions onDelete={() => setDeleteTarget(s)} />
        </div>
      ))}
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label="suggestion" />
    </>
  );
});

const HelpRequestsTab = memo(({ helpRequests, onRefresh }: { helpRequests: any[]; onRefresh: () => void }) => {
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await dbService.deleteHelpRequest(deleteTarget.id); toast.success('Help request deleted'); setDeleteTarget(null); onRefresh(); }
    catch { toast.error('Failed to delete help request'); }
  };

  return (
    <>
      <SectionHeader icon={MessageSquare} title="Help Requests" count={helpRequests.length} />
      {helpRequests.length === 0 ? <EmptyState icon={MessageSquare} label="No help requests" /> : helpRequests.map(h => (
        <div key={h.id} className={`${cardCls} flex items-center justify-between gap-4 mb-3`}>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <p className="font-bold text-sm">{h.subject}</p>
              <span className="text-[10px] font-black uppercase text-neutral-400">{h.profiles?.username}</span>
            </div>
            <p className="text-xs text-neutral-500">{h.message}</p>
          </div>
          <RowActions onDelete={() => setDeleteTarget(h)} />
        </div>
      ))}
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} label="help request" />
    </>
  );
});

// ─── ROOT PANEL ────────────────────────────────────────────────────────────

const AdminPanel = () => {
  const { profile: currentAdminProfile } = useAuthStore();

  // Data state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [commands, setCommands] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [plugins, setPlugins] = useState<any[]>([]);
  const [serverInfo, setServerInfo] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [helpRequests, setHelpRequests] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('users');

  // Sync activeTab with URL 'tab' param on load
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabKey;
    if (tabParam && TAB_CONFIG.some(t => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Typed modal state — avoids unnecessary re-renders from a single object
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const closeModal = useCallback(() => setModal({ type: 'none' }), []);

  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);

  // Stable fetchData with useCallback so it can safely be in useEffect deps
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, e, r, rem, b, c, g, pl, s, h, info, cats, subCats] = await Promise.all([
        dbService.getAllProfiles(true) as any,
        dbService.getEvents(),
        adminService.getRules(),
        adminService.getReminders(),
        dbService.getBadges(),
        dbService.getCommands(),
        dbService.getGuides(),
        dbService.getPlugins(),
        dbService.getSuggestions(),
        dbService.getHelpRequests(),
        adminService.getServerInfo(),
        dbService.getCategories(),
        dbService.getSubCategories(),
      ]);
      setProfiles(p); setEvents(e); setRules(r);
      setReminders(rem); setBadges(b); setCommands(c);
      setGuides(g); setPlugins(pl); setSuggestions(s);
      setHelpRequests(h); setServerInfo(info);
      setCategories(cats); setSubCategories(subCats);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Stable modal openers
  const openEditBadge = useCallback((b: Badge) => setModal({ type: 'edit-badge', data: b }), []);
  const openBadge = useCallback(() => setModal({ type: 'badge' }), []);
  const openAnnouncement = useCallback(() => setModal({ type: 'announcement' }), []);

  const handleSaveServerInfo = useCallback(async (data: any[]) => {
    await adminService.upsertServerInfo(data);
    toast.success('Saved');
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-3 sm:px-6">

      {/* Modals */}
      <AnnouncementModal
        isOpen={modal.type === 'announcement' || modal.type === 'edit-announcement'}
        onClose={closeModal}
        onSaved={fetchData}
        announcement={modal.type === 'edit-announcement' ? modal.data : undefined}
      />
      <AddEditBadgeModal
        isOpen={modal.type === 'badge' || modal.type === 'edit-badge'}
        onClose={closeModal}
        onSave={async (badge) => {
          if ('id' in badge) {
            await dbService.updateBadge(badge.id, badge);
            toast.success('Badge updated');
          } else {
            await dbService.createBadge(badge);
            toast.success('Badge created');
          }
          fetchData();
        }}
        editingBadge={modal.type === 'edit-badge' ? modal.data : undefined}
      />
      <AssignBadgesModal
        isOpen={modal.type === 'assign-badges' || modal.type === 'assign-member-badges'}
        onClose={closeModal}
        userProfile={(modal.type === 'assign-badges' || modal.type === 'assign-member-badges') ? modal.data : null}
        assignedBy={currentAdminProfile?.id || null}
        onBadgesUpdated={fetchData}
        isCommunityMember={modal.type === 'assign-member-badges'}
      />

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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic whitespace-nowrap shrink-0 transition-all duration-200 ${active
                  ? 'bg-strawberry-600 text-white shadow-lg shadow-strawberry-600/30'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 text-neutral-500 dark:text-neutral-400 hover:text-strawberry-600 hover:border-strawberry-500/30'
                  }`}
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
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'users' && <UsersTab profiles={profiles} onRefresh={fetchData} onAssignBadges={(p) => setModal({ type: 'assign-badges', data: p })} />}
            {activeTab === 'approvals' && <AdminApprovalPanel />}
            {activeTab === 'members' && <MembersTab onRefresh={fetchData} onAssignBadges={(m) => setModal({ type: 'assign-member-badges', data: m })} />}
            {activeTab === 'shops' && <ShopsTab onRefresh={fetchData} />}
            {activeTab === 'categories' && <CategoriesTab categories={categories} onRefresh={fetchData} />}
            {activeTab === 'subCategories' && <SubCategoriesTab subCategories={subCategories} categories={categories} onRefresh={fetchData} />}
            {activeTab === 'announcements' && (
              <>
                <SectionHeader icon={Megaphone} title="Announcements" onAdd={openAnnouncement} addLabel="New Announcement" />
                <div className={cardCls}>
                  <div className="flex items-center gap-3 text-neutral-400">
                    <Megaphone size={16} className="text-strawberry-600" />
                    <span className="text-xs font-black uppercase tracking-widest italic">Manage server announcements</span>
                  </div>
                </div>
              </>
            )}
            {activeTab === 'events' && <EventsTab events={events} onRefresh={fetchData} />}
            {activeTab === 'rules' && <RulesTab rules={rules} onRefresh={fetchData} />}
            {activeTab === 'reminders' && <RemindersTab reminders={reminders} onRefresh={fetchData} />}
            {activeTab === 'badges' && <BadgesTab badges={badges} onRefresh={fetchData} onAdd={openBadge} onEdit={openEditBadge} />}
            {activeTab === 'commands' && <CommandsTab commands={commands} onRefresh={fetchData} />}
            {activeTab === 'guides' && <GuidesTab guides={guides} onRefresh={fetchData} />}
            {activeTab === 'plugins' && <PluginsTab plugins={plugins} onRefresh={fetchData} />}
            {activeTab === 'serverInfo' && <ServerInfoTab serverInfo={serverInfo} onSave={handleSaveServerInfo} />}
            {activeTab === 'suggestions' && <SuggestionsTab suggestions={suggestions} onRefresh={fetchData} />}
            {activeTab === 'helpRequests' && <HelpRequestsTab helpRequests={helpRequests} onRefresh={fetchData} />}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default AdminPanel;  