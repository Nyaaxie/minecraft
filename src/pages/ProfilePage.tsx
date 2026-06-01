import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { dbService } from '../services/dbService';
import { User, Lock, Save, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, profile, refetchProfile } = useAuthStore();
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Update username in profiles table
      await dbService.updateProfile(user.id, { username });

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        const { error } = await (await import('../services/supabase')).supabase.auth.updateUser({
          password: newPassword
        });
        if (error) throw error;
        setNewPassword('');
        setConfirmPassword('');
      }

      await refetchProfile();
      toast.success('Settings updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 sm:px-6 space-y-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6 px-2">
        <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20 text-strawberry-600">
          <Shield size={32} />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
            Account<span className="text-strawberry-600">Settings</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
            Manage your credentials and security.
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <form onSubmit={handleUpdateProfile} className="p-8 md:p-12 space-y-10">
          {/* Username Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-white/5 pb-4">
              <User size={20} className="text-strawberry-600" />
              <h2 className="text-xl font-black italic uppercase tracking-tighter">Identity</h2>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 font-bold transition-all"
                placeholder="Your username"
              />
            </div>
          </section>

          {/* Password Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-white/5 pb-4">
              <Lock size={20} className="text-strawberry-600" />
              <h2 className="text-xl font-black italic uppercase tracking-tighter">Security</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 font-bold transition-all"
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 font-bold transition-all"
                  placeholder="Repeat new password"
                />
              </div>
            </div>
          </section>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-12 py-4 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-2xl font-black italic uppercase tracking-widest text-sm shadow-xl shadow-strawberry-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
