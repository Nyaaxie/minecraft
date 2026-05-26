import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Palette, // For favorite color
  Blocks, // For favorite block
  Ghost, // For favorite mob
  MonitorPlay, // For Minecraft Edition
  Globe,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Profile, UserBadge, Badge } from '../types/database.types'; // Import Badge type

import BadgeChip from '../components/BadgeChip';
import { sortBadges } from '../utils/badgeUtils';

interface UserBadgeWithDetails extends UserBadge {
  badges: Badge;
}

const ProfilePage = () => {
  const { profile, setProfile, signOut, loading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Profile>>({
    username: profile?.username || '',
    minecraft_username: profile?.minecraft_username || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    favorite_mob: profile?.favorite_mob || '',
    favorite_block: profile?.favorite_block || '',
    favorite_color: profile?.favorite_color || '',
    minecraft_edition: profile?.minecraft_edition || null,
    // @ts-ignore - Assuming these fields exist in Profile type or will be added
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

  // Guard AFTER all hooks — React requires hooks to always run in same order
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-strawberry-600" size={64} />
      </div>
    );
  }

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
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4 sm:px-6">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">
          Identity<span className="text-strawberry-600">Core</span>
        </h1>
        <p className="text-neutral-500 max-w-2xl font-medium uppercase tracking-tight text-sm leading-relaxed"> Personalize your settings and how you look to the community.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Visualization */}
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
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
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

            {/* Badges System */}
            {userBadges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2.5 mb-10">
                {sortBadges(userBadges.map(ub => ub.badges).filter((b): b is Badge => !!b))
                  .map(badge => <BadgeChip key={badge.id} badge={badge} />)}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-neutral-200 dark:hover:border-white/10 transition-all group/stat">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover/stat:text-strawberry-600 transition-colors">Rank Designation</span>
                <span className="text-xs font-black italic uppercase text-neutral-900 dark:text-white">{profile?.role === 'admin' ? 'ADMIN' : 'BERRY'}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-neutral-200 dark:hover:border-white/10 transition-all group/stat">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover/stat:text-strawberry-600 transition-colors">DATE</span>
                <span className="text-xs font-black italic uppercase text-neutral-900 dark:text-white">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span>
              </div>
              {formData.minecraft_edition && (
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-neutral-200 dark:hover:border-white/10 transition-all group/stat">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover/stat:text-strawberry-600 transition-colors">Client Edition</span>
                  <span className="text-xs font-black italic uppercase text-neutral-900 dark:text-white">{formData.minecraft_edition}</span>
                </div>
              )}
            </div>
          </motion.div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-4 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2rem] text-red-500 font-black italic uppercase tracking-widest text-xs shadow-xl shadow-neutral-900/5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95 group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>

        {/* Configuration Interface */}
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
                <label className={labelCls}>
                  <User size={14} className="text-strawberry-500" /> Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username || ''}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="System identification..."
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>
                  <Gamepad2 size={14} className="text-strawberry-500" /> Minecraft Identity
                </label>
                <input
                  type="text"
                  name="minecraft_username"
                  value={formData.minecraft_username || ''}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="In-game handle..."
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>
                  <Gamepad2 size={14} className="text-strawberry-500" /> Bedrock Username
                </label>
                <input
                  type="text"
                  name="bedrock_username"
                  value={formData.bedrock_username || ''}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Bedrock handle..."
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>
                  <Globe size={14} className="text-strawberry-500" /> Social Links
                </label>
                <input
                  type="text"
                  name="social_links"
                  value={formData.social_links || ''}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Links..."
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>
                  <Calendar size={14} className="text-strawberry-500" /> Birthmonth
                </label>
                <input
                  type="text"
                  name="birthmonth"
                  value={formData.birthmonth || ''}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g. January..."
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>
                  <Calendar size={14} className="text-strawberry-500" /> Join Date
                </label>
                <input
                  type="date"
                  name="join_date"
                  value={formData.join_date || ''}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Personal Information</label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                className={`${inputCls} h-40 resize-none italic`}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelCls}>
                  <Ghost size={14} className="text-strawberry-500" /> Favorite Mob
                </label>
                <input
                  type="text"
                  name="favorite_mob"
                  value={formData.favorite_mob || ''}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g. Warden, Fox..."
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>
                  <Blocks size={14} className="text-strawberry-500" /> Favorite Block
                </label>
                <input
                  type="text"
                  name="favorite_block"
                  value={formData.favorite_block || ''}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g. Moss, Deepslate..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelCls}>
                  <Palette size={14} className="text-strawberry-500" /> Favorite Color
                </label>
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl border-4 border-white dark:border-neutral-800 shadow-lg shrink-0" style={{ backgroundColor: formData.favorite_color || '#e35a7f' }} />
                  <input
                    type="color"
                    name="favorite_color"
                    value={formData.favorite_color || '#e35a7f'}
                    onChange={handleChange}
                    className="flex-grow h-14 bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl cursor-pointer p-1"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>
                  <MonitorPlay size={14} className="text-strawberry-500" /> Minecraft Edition
                </label>
                <select
                  name="minecraft_edition"
                  value={formData.minecraft_edition || ''}
                  onChange={handleChange}
                  className={`${inputCls} appearance-none font-bold uppercase italic`}
                >
                  <option value="">Select Protocol</option>
                  <option value="java">Java Edition</option>
                  <option value="bedrock">Bedrock Engine</option>
                </select>
              </div>
            </div>

            <div className="pt-6">
              <button
                disabled={loading}
                type="submit"
                className="w-full py-6 bg-strawberry-600 rounded-[2rem] font-black italic uppercase tracking-[0.2em] text-white hover:bg-strawberry-700 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-strawberry-600/40 active:scale-95 disabled:opacity-50"
              >
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