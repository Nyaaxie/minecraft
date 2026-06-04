
import { motion } from 'framer-motion';
import { AlertCircle, XCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const StatusPage = ({ status, reason }: { status: 'pending' | 'rejected' | 'banned', reason?: string | null }) => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const content = {
    pending: {
      title: 'Account Under Verification',
      message: 'Your account is under verification. Please wait for an admin to approve your request.',
      icon: <AlertCircle className="text-amber-500" size={64} />,
      color: 'bg-amber-500/10 border-amber-500/20'
    },
    rejected: {
      title: 'Registration Rejected',
      message: 'Your registration request was not approved by the admins.',
      icon: <XCircle className="text-red-500" size={64} />,
      color: 'bg-red-500/10 border-red-500/20'
    },
    banned: {
      title: 'Account Banned',
      message: 'Your account has been banned due to a violation of community guidelines.',
      icon: <XCircle className="text-red-600" size={64} />,
      color: 'bg-red-600/10 border-red-600/20'
    }
  };

  const { title, message, icon, color } = content[status];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-md w-full ${color} border p-8 rounded-3xl text-center space-y-6 shadow-2xl`}
      >
        <div className="flex justify-center">{icon}</div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">{title}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{message}</p>
        
        {reason && (
          <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-black/5 dark:border-white/5">
            <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-1">Reason for status:</p>
            <p className="text-sm italic text-neutral-800 dark:text-neutral-200">{reason}</p>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-bold uppercase tracking-widest text-sm hover:scale-95 transition-transform"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </motion.div>
    </div>
  );
};

export default StatusPage;
