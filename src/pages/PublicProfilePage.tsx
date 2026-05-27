import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { Loader2, User, Shield, Gamepad2, Globe, Calendar, Ghost, Blocks, Palette, MonitorPlay, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Profile, UserBadge, Badge } from '../types/database.types';
import BadgeChip from '../components/BadgeChip';
import { sortBadges } from '../utils/badgeUtils';

interface UserBadgeWithDetails extends UserBadge {
  badges: Badge;
}

const PublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadgeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ label: string, value: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profiles = await dbService.getAllProfiles(true);
        const targetProfile = profiles.find(p => p.id === id);
        if (targetProfile) {
          setProfile(targetProfile as Profile);
          const badges = await dbService.getUserBadges(id);
          setUserBadges(badges as UserBadgeWithDetails[]);
        } else {
          toast.error('User not found.');
          navigate('/members');
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const openFullInfo = (label: string, value: string) => {
    setModalContent({ label, value });
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-strawberry-600" size={64} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 space-y-12 text-neutral-900 dark:text-neutral-100">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-neutral-500 hover:text-strawberry-600 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-neutral-900/5 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <div className="h-40 w-40 rounded-[2.5rem] bg-neutral-100 dark:bg-neutral-800 border-4 border-white dark:border-neutral-950 shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
          {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username || 'User'} className="h-full w-full object-cover" /> : <User size={64} className="text-neutral-300" />}
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">{profile.username}</h1>
          
          {userBadges.length > 0 && (
            <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
              {sortBadges(userBadges.map(ub => ub.badges).filter((b): b is Badge => !!b))
                .map(badge => <BadgeChip key={badge.id} badge={badge} />)}
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-neutral-100 dark:bg-white/5 rounded-full border border-neutral-200 dark:border-white/5">
            <Shield size={12} className="text-strawberry-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">{profile.role || 'Member'}</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 italic max-w-xl">{profile.bio || 'No bio available.'}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Minecraft', value: profile.minecraft_username || '---', icon: Gamepad2 },
          { label: 'Bedrock', value: profile.bedrock_username || '---', icon: Gamepad2 },
          { label: 'Mob', value: profile.favorite_mob || '---', icon: Ghost },
          { label: 'Block', value: profile.favorite_block || '---', icon: Blocks },
        ].map((item, i) => (
          <div key={i} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-3xl shadow-sm hover:border-strawberry-500/30 transition-all flex flex-col items-center text-center">
            <div className="flex flex-col items-center gap-2 mb-2 text-strawberry-600">
              <item.icon size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{item.label}</span>
            </div>
            <p className="text-sm font-bold truncate">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Color', value: profile.favorite_color || '---', icon: Palette, isColor: true },
          { label: 'Edition', value: profile.minecraft_edition || '---', icon: MonitorPlay },
          { label: 'Birthmonth', value: profile.birthmonth || '---', icon: Calendar },
        ].map((item, i) => (
          <div key={i} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-3xl shadow-sm hover:border-strawberry-500/30 transition-all flex flex-col items-center text-center">
            <div className="flex flex-col items-center gap-2 mb-2 text-strawberry-600">
              <item.icon size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{item.label}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              {item.isColor && profile.favorite_color && (
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: profile.favorite_color }} />
              )}
              <p className="text-sm font-bold truncate">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div 
          className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-3xl shadow-sm hover:border-strawberry-500/30 transition-all cursor-pointer"
          onClick={() => openFullInfo('Socials', profile.social_links || '---')}
        >
          <div className="flex items-center gap-2 mb-2 text-strawberry-600">
            <Globe size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Socials</span>
          </div>
          <p className="text-sm font-bold break-all">{profile.social_links || '---'}</p>
        </div>
      </div>      
      {/* Copy Modal */}
      <AnimatePresence>
        {modalOpen && modalContent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-900 p-8 rounded-[2rem] z-50 w-full max-w-sm border border-neutral-200 dark:border-white/10 shadow-2xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-strawberry-600 mb-2">{modalContent.label}</h3>
              <p className="text-sm font-bold break-all mb-8">{modalContent.value}</p>
              <div className="flex gap-3">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl bg-neutral-100 dark:bg-white/5 font-bold uppercase text-xs tracking-widest hover:bg-neutral-200 dark:hover:bg-white/10 transition-all">Close</button>
                <button onClick={() => { copyToClipboard(modalContent.value); setModalOpen(false); }} className="flex-1 py-3 rounded-xl bg-strawberry-600 text-white font-bold uppercase text-xs tracking-widest hover:bg-strawberry-700 transition-all">Copy</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicProfilePage;