import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Loader2, Check, X, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';

interface PendingUser {
  id: string;
  username: string;
  email: string;
  minecraft_username: string;
  created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'banned';
}

const AdminApprovalPanel = () => {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'banned'>('pending');
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; user: PendingUser | null; action: 'approved' | 'rejected' | 'banned' | null }>({ isOpen: false, user: null, action: null });
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load users');
      console.error(error);
    } else {
      setUsers(data as PendingUser[]);
    }
    setLoading(false);
  };

  const confirmAction = async () => {
    if (!actionModal.user || !actionModal.action) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          approval_status: actionModal.action, 
          rejection_reason: reason,
          approved_at: actionModal.action === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', actionModal.user.id);

      if (error) throw error;
      toast.success(`User ${actionModal.user.username} has been ${actionModal.action}`);
      setActionModal({ isOpen: false, user: null, action: null });
      setReason('');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
    }
  };

  const pendingUsers = users.filter(u => u.approval_status === 'pending');
  const approvedUsers = users.filter(u => u.approval_status === 'approved');
  const bannedUsers = users.filter(u => u.approval_status === 'banned');

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  const UserTable = ({ data }: { data: PendingUser[] }) => (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-3xl overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-neutral-50 dark:bg-neutral-800/50">
          <tr>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest">User</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Minecraft</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Joined</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(user => (
            <tr key={user.id} className="border-t border-neutral-200 dark:border-white/5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <td className="p-4">
                <div className="font-bold text-sm">{user.username}</div>
                <div className="text-xs text-neutral-500">{user.email}</div>
              </td>
              <td className="p-4 font-mono text-xs">{user.minecraft_username || 'N/A'}</td>
              <td className="p-4 text-xs text-neutral-500">{new Date(user.created_at).toLocaleDateString()}</td>
              <td className="p-4 flex justify-end gap-2">
                {user.approval_status !== 'approved' && (
                  <button onClick={() => setActionModal({ isOpen: true, user, action: 'approved' })} className="p-2 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500/20" title="Approve">
                    <Check size={16} />
                  </button>
                )}
                {user.approval_status !== 'rejected' && (
                  <button onClick={() => setActionModal({ isOpen: true, user, action: 'rejected' })} className="p-2 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500/20" title="Reject">
                    <X size={16} />
                  </button>
                )}
                {user.approval_status !== 'banned' && (
                  <button onClick={() => setActionModal({ isOpen: true, user, action: 'banned' })} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20" title="Ban">
                    <ShieldAlert size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-strawberry-600 text-white' : 'bg-neutral-100 dark:bg-white/5'}`}>
          Queue ({pendingUsers.length})
        </button>
        <button onClick={() => setActiveTab('approved')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'approved' ? 'bg-strawberry-600 text-white' : 'bg-neutral-100 dark:bg-white/5'}`}>
          Approved ({approvedUsers.length})
        </button>
        <button onClick={() => setActiveTab('banned')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'banned' ? 'bg-strawberry-600 text-white' : 'bg-neutral-100 dark:bg-white/5'}`}>
          Banned ({bannedUsers.length})
        </button>
      </div>

      <UserTable data={activeTab === 'pending' ? pendingUsers : activeTab === 'approved' ? approvedUsers : bannedUsers} />

      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, user: null, action: null })}
        title={`Confirm ${actionModal.action?.toUpperCase()}`}
      >
        <div className="space-y-4">
          <p className="text-sm">Are you sure you want to mark <strong>{actionModal.user?.username}</strong> as <strong>{actionModal.action}</strong>?</p>
          {(actionModal.action === 'rejected' || actionModal.action === 'banned') && (
            <textarea 
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none"
              placeholder="Reason (optional)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
          <button 
            onClick={confirmAction}
            className="w-full py-3 bg-strawberry-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-strawberry-700"
          >
            Confirm Action
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminApprovalPanel;
