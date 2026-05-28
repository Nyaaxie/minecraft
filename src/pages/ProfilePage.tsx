import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { dbService } from '../services/dbService';
import {
  User,
  Shield,
  Gamepad2,
  Camera,
  Save,
  Loader2,
  LogOut,
  Palette,
  Blocks,
  Ghost,
  MonitorPlay,
  Globe,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Profile, UserBadge, Badge } from '../types/database.types';

import BadgeChip from '../components/BadgeChip';
import { sortBadges } from '../utils/badgeUtils';

interface UserBadgeWithDetails extends UserBadge {
  badges: Badge;
}

const StatCard = ({ onClick, label, value, icon: Icon, isEdition }: { onClick: () => void, label: string, value: string, icon: any, isEdition?: boolean }) => (
  <div
    onClick={onClick}
    className="relative z-20 flex flex-col items-center justify-center p-6 bg-neutral-50 dark:bg-white/5 rounded-3xl border border-transparent hover:border-strawberry-500/30 transition-all group/stat cursor-pointer text-center"
  >
    <div className="flex flex-col items-center gap-2 mb-3">
      <Icon size={16} className="text-strawberry-600" />
      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover/stat:text-strawberry-600 transition-colors">{label}</span>
    </div>
    <span className={`font-black italic uppercase text-neutral-900 dark:text-white break-words w-full ${isEdition ? 'text-lg' : 'text-xs'}`}>{value}</span>
  </div>
);

const ProfilePage = () => {
  const { profile, setProfile, signOut, loading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);

  const [formData, setFormData] = useState<Partial<Profile>>({
    username: profile?.username || '',
    minecraft_username: profile?.minecraft_username || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    favorite_mob: profile?.favorite_mob || '',
    favorite_block: profile?.favorite_block || '',
    favorite_color: profile?.favorite_color || '',
    minecraft_edition: profile?.minecraft_edition || null,
    social_links: profile?.social_links || '',
    bedrock_username: profile?.bedrock_username || '',
    birthmonth: profile?.birthmonth || '',
    join_date: profile?.join_date || '',
  });
  const [userBadges, setUserBadges] = useState<UserBadgeWithDetails[]>([]);

  useEffect(() => {
    if (profile?.id) {
      const fetchUserBadges = async () => {
        try {
          const badges = await dbService.getUserBadges(profile.id);
          setUserBadges(badges as UserBadgeWithDetails[]);
        } catch (error) {
          console.error('Failed to fetch user badges:', error);
          toast.error('Failed to load user badges.');
        }
      };
      fetchUserBadges();
    }
  }, [profile?.id]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-strawberry-600" size={64} />
      </div>
    );
  }

  const openFullInfo = (label: string, value: string) => {
    setModalContent({ label, value });
    setModalOpen(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !profile) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const publicUrl = await dbService.uploadAvatar(profile.id, file);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Identity visual updated.');
    } catch (err) {
      console.error(err);
      toast.error('Identity visual sync failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      const updated = await dbService.updateProfile(profile.id, formData);
      setProfile(updated);
      toast.success('Core profile parameters synced.');
    } catch (err) {
      console.error(err);
      toast.error('Profile synchronization error.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputCls = "w-full bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-strawberry-500/30 rounded-2xl p-4 text-neutral-900 dark:text-white transition-all outline-none text-sm font-medium";
  const labelCls = "text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 px-1 flex items-center gap-2";

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20 text-strawberry-600">
            <User size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
              Profile
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
              Personalize your identity and server settings.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-8 text-center shadow-xl shadow-neutral-900/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-strawberry-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="relative inline-block mb-8 group/avatar">
              <div className="h-40 w-40 rounded-[2.5rem] bg-neutral-100 dark:bg-neutral-800 border-4 border-white dark:border-neutral-950 shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover/avatar:scale-105">
                {uploading ? (
                  <Loader2 className="animate-spin text-strawberry-600" size={48} />
                ) : formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User size={64} className="text-neutral-300" />
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 p-4 bg-strawberry-600 text-white rounded-2xl shadow-xl shadow-strawberry-600/30 active:scale-90 transition-all opacity-0 group-hover/avatar:opacity-100"
              >
                <Camera size={20} />
              </button>
            </div>

            <div className="space-y-2 mb-8">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">{profile?.username || 'Berry'}</h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-neutral-100 dark:bg-white/5 rounded-full border border-neutral-200 dark:border-white/5">
                <Shield size={12} className="text-strawberry-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">{profile?.role || 'Member'}</span>
              </div>
            </div>

            {userBadges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2.5 mb-10">
                {sortBadges(userBadges.map(ub => ub.badges).filter((b): b is Badge => !!b))
                  .map(badge => <BadgeChip key={badge.id} badge={badge} />)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <StatCard onClick={() => openFullInfo('Rank Designation', profile?.role === 'admin' ? 'ADMIN' : 'BERRY')} label="Rank" value={profile?.role === 'admin' ? 'ADMIN' : 'BERRY'} icon={Shield} />
              <StatCard onClick={() => openFullInfo('Date Joined', profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A')} label="Joined" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'} icon={Calendar} />
              {formData.minecraft_edition && <StatCard isEdition={true} onClick={() => openFullInfo('Client Edition', formData.minecraft_edition || '')} label="Edition" value={formData.minecraft_edition} icon={MonitorPlay} />}
              {formData.bedrock_username && <StatCard onClick={() => openFullInfo('Bedrock Username', formData.bedrock_username || '')} label="Bedrock ID" value={formData.bedrock_username} icon={Gamepad2} />}
              {formData.social_links && <StatCard onClick={() => openFullInfo('Social Links', formData.social_links || '')} label="Socials" value={formData.social_links} icon={Globe} />}
              {formData.birthmonth && <StatCard onClick={() => openFullInfo('Birthmonth', formData.birthmonth || '')} label="Birthmonth" value={formData.birthmonth} icon={Calendar} />}
              {formData.favorite_mob && <StatCard onClick={() => openFullInfo('Favorite Mob', formData.favorite_mob || '')} label="Mob" value={formData.favorite_mob} icon={Ghost} />}
              {formData.favorite_block && <StatCard onClick={() => openFullInfo('Favorite Block', formData.favorite_block || '')} label="Block" value={formData.favorite_block} icon={Blocks} />}
            </div>
          </motion.div>
          <AnimatePresence>
            {modalOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setModalOpen(false)} />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-900 p-8 rounded-[2rem] z-50 w-full max-w-sm border border-neutral-200 dark:border-white/10 shadow-2xl">
                  <h3 className="text-sm font-black uppercase tracking-widest text-strawberry-600 mb-2">{modalContent?.label}</h3>
                  <p className="text-2xl font-black italic uppercase tracking-tighter">{modalContent?.value}</p>
                  <button onClick={() => setModalOpen(false)} className="mt-8 w-full py-3 rounded-xl bg-neutral-100 dark:bg-white/5 font-bold uppercase text-xs tracking-widest hover:bg-neutral-200 dark:hover:bg-white/10 transition-all">Close</button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-4 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2rem] text-red-500 font-black italic uppercase tracking-widest text-xs shadow-xl shadow-neutral-900/5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95 group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>

        <div className="lg:col-span-2">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleUpdate}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[3rem] p-8 lg:p-12 shadow-2xl shadow-neutral-900/5 space-y-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 bg-strawberry-600 h-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelCls}><User size={14} className="text-strawberry-500" /> Username</label>
                <input type="text" name="username" value={formData.username || ''} onChange={handleChange} className={inputCls} placeholder="System identification..." />
              </div>
              <div className="space-y-1">
                <label className={labelCls}><Gamepad2 size={14} className="text-strawberry-500" /> Java Username</label>
                <input type="text" name="minecraft_username" value={formData.minecraft_username || ''} onChange={handleChange} className={inputCls} placeholder="In-game handle..." />
              </div>
              <div className="space-y-1">
                <label className={labelCls}><Gamepad2 size={14} className="text-strawberry-500" /> Bedrock Username</label>
                <input type="text" name="bedrock_username" value={formData.bedrock_username || ''} onChange={handleChange} className={inputCls} placeholder="Bedrock handle..." />
              </div>
              <div className="space-y-1">
                <label className={labelCls}><Globe size={14} className="text-strawberry-500" /> Social Links</label>
                <input type="text" name="social_links" value={formData.social_links || ''} onChange={handleChange} className={inputCls} placeholder="Links..." />
              </div>
              <div className="space-y-1">
                <label className={labelCls}><Calendar size={14} className="text-strawberry-500" /> Birthmonth</label>
                <input type="text" name="birthmonth" value={formData.birthmonth || ''} onChange={handleChange} className={inputCls} placeholder="e.g. January..." />
              </div>
              <div className="space-y-1">
                <label className={labelCls}><Calendar size={14} className="text-strawberry-500" /> Join Date</label>
                <input type="date" name="join_date" value={formData.join_date || ''} onChange={handleChange} className={inputCls} />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Personal Information</label>
              <textarea name="bio" value={formData.bio || ''} onChange={handleChange} className={`${inputCls} h-40 resize-none italic`} placeholder="Tell us about yourself..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelCls}><Ghost size={14} className="text-strawberry-500" /> Favorite Mob</label>
                <input type="text" name="favorite_mob" value={formData.favorite_mob || ''} onChange={handleChange} className={inputCls} placeholder="e.g. Warden, Fox..." />
              </div>
              <div className="space-y-1">
                <label className={labelCls}><Blocks size={14} className="text-strawberry-500" /> Favorite Block</label>
                <input type="text" name="favorite_block" value={formData.favorite_block || ''} onChange={handleChange} className={inputCls} placeholder="e.g. Moss, Deepslate..." />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelCls}><Palette size={14} className="text-strawberry-500" /> Favorite Color</label>
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl border-4 border-white dark:border-neutral-800 shadow-lg shrink-0" style={{ backgroundColor: formData.favorite_color || '#e35a7f' }} />
                  <input type="color" name="favorite_color" value={formData.favorite_color || '#e35a7f'} onChange={handleChange} className="flex-grow h-14 bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl cursor-pointer p-1" />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}><MonitorPlay size={14} className="text-strawberry-500" /> Minecraft Edition</label>
                <select name="minecraft_edition" value={formData.minecraft_edition || ''} onChange={handleChange} className={`${inputCls} appearance-none font-bold uppercase italic`}>
                  <option value="">Select Protocol</option>
                  <option value="java">Java Edition</option>
                  <option value="bedrock">Bedrock Engine</option>
                </select>
              </div>
            </div>
            <div className="pt-6">
              <button disabled={loading} type="submit" className="w-full py-6 bg-strawberry-600 rounded-[2rem] font-black italic uppercase tracking-[0.2em] text-white hover:bg-strawberry-700 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-strawberry-600/40 active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24} />Update</>}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;