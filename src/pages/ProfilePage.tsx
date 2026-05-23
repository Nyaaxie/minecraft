import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { dbService } from '../services/dbService';
import {
  User,
  Gamepad2,
  Camera,
  Save,
  Loader2,
  LogOut,
  Sparkles, // For favorite color/mob/block
  Palette, // For favorite color
  Blocks, // For favorite block
  Ghost, // For favorite mob
  MonitorPlay // For Minecraft Edition
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Profile, UserBadge } from '../types/database.types'; // Import UserBadge

import BadgeChip from '../components/BadgeChip';


const ProfilePage = () => {
  const { profile, setProfile, signOut } = useAuthStore();
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
  });
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);

  useEffect(() => {
    if (profile?.id) {
      const fetchUserBadges = async () => {
        try {
          const badges = await dbService.getUserBadges(profile.id);
          setUserBadges(badges);
        } catch (error) {
          console.error('Failed to fetch user badges:', error);
          toast.error('Failed to load user badges.');
        }
      };
      fetchUserBadges();
    }
  }, [profile?.id]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !profile) return;

    setUploading(true);
    try {
      const file = e.target.files[0];
      const publicUrl = await dbService.uploadAvatar(profile.id, file);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Avatar uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload avatar.');
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
      setProfile(updated); // Update the global auth store profile
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8 text-neutral-900 dark:text-neutral-100">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage your identity on StrawberrySMP.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 text-center">
            <div className="relative inline-block group">
              <div className="h-32 w-32 rounded-full bg-neutral-100 dark:bg-neutral-800 border-4 border-strawberry-600/20 flex items-center justify-center overflow-hidden mb-4">
                {uploading ? (
                  <Loader2 className="animate-spin text-strawberry-600" size={32} />
                ) : formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User size={48} className="text-neutral-500" />
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
                className="absolute bottom-4 right-0 p-2 bg-strawberry-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera size={16} />
              </button>
            </div>

            <h2 className="text-xl font-bold">{profile?.username || 'Player'}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-500 capitalize mb-2">{profile?.role}</p>

            {/* Display Badges */}
            {userBadges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {userBadges.map(ub => (
                  // Ensure ub.badges exists and is an array/object
                  // Assuming 'badges' property exists due to '*, badges(*)' select
                  // @ts-ignore
                  ub.badges && <BadgeChip key={ub.badge_id} badge={ub.badges} />
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs p-3 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl">
                <span className="text-neutral-500 font-bold uppercase tracking-wider">Rank</span>
                <span className="text-strawberry-600 dark:text-strawberry-500 font-bold">{profile?.role === 'admin' ? 'STAFF' : 'MEMBER'}</span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl">
                <span className="text-neutral-500 font-bold uppercase tracking-wider">Joined</span>
                <span className="text-neutral-900 dark:text-white">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              {formData.favorite_mob && (
                <div className="flex items-center justify-between text-xs p-3 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider">Fav Mob</span>
                  <span className="text-neutral-900 dark:text-white">{formData.favorite_mob}</span>
                </div>
              )}
              {formData.favorite_block && (
                <div className="flex items-center justify-between text-xs p-3 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider">Fav Block</span>
                  <span className="text-neutral-900 dark:text-white">{formData.favorite_block}</span>
                </div>
              )}
              {formData.favorite_color && (
                <div className="flex items-center justify-between text-xs p-3 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider">Fav Color</span>
                  <span className="text-neutral-900 dark:text-white" style={{ color: formData.favorite_color }}>{formData.favorite_color}</span>
                </div>
              )}
              {formData.minecraft_edition && (
                <div className="flex items-center justify-between text-xs p-3 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider">MC Edition</span>
                  <span className="text-neutral-900 dark:text-white capitalize">{formData.minecraft_edition}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-red-600 dark:text-red-500 font-bold hover:bg-red-100 dark:hover:bg-red-500/5 transition-all"
          >
            <LogOut size={20} />
            Sign Out Session
          </button>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdate} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <User size={16} /> Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username || ''}
                  onChange={handleChange}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-neutral-900 dark:text-white focus:border-strawberry-500 transition-colors"
                  placeholder="Your community name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <Gamepad2 size={16} /> Minecraft Username
                </label>
                <input
                  type="text"
                  name="minecraft_username"
                  value={formData.minecraft_username || ''}
                  onChange={handleChange}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-neutral-900 dark:text-white focus:border-strawberry-500 transition-colors"
                  placeholder="IGN (In-Game Name)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Bio / About You</label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-neutral-900 dark:text-white focus:border-strawberry-500 transition-colors h-32"
                placeholder="Tell the community about yourself..."
              />
            </div>

            {/* New Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <Ghost size={16} /> Favorite Mob
                </label>
                <input
                  type="text"
                  name="favorite_mob"
                  value={formData.favorite_mob || ''}
                  onChange={handleChange}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-neutral-900 dark:text-white focus:border-strawberry-500 transition-colors"
                  placeholder="e.g., Creeper, Enderman"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <Blocks size={16} /> Favorite Block
                </label>
                <input
                  type="text"
                  name="favorite_block"
                  value={formData.favorite_block || ''}
                  onChange={handleChange}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-neutral-900 dark:text-white focus:border-strawberry-500 transition-colors"
                  placeholder="e.g., Diamond Block, Obsidian"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <Palette size={16} /> Favorite Color
                </label>
                <input
                  type="color" // Use type color for color picker
                  name="favorite_color"
                  value={formData.favorite_color || '#e35a7f'} // Default to strawberry color
                  onChange={handleChange}
                  className="w-full h-12 p-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl cursor-pointer"
                  title="Choose your favorite color"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <MonitorPlay size={16} /> Minecraft Edition
                </label>
                <select
                  name="minecraft_edition"
                  value={formData.minecraft_edition || ''}
                  onChange={handleChange}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-neutral-900 dark:text-white focus:border-strawberry-500 transition-colors"
                >
                  <option value="">Select Edition</option>
                  <option value="java">Java</option>
                  <option value="bedrock">Bedrock</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                disabled={loading}
                type="submit"
                className="w-full py-4 bg-strawberry-600 rounded-2xl font-bold text-white hover:bg-strawberry-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-strawberry-600/20"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
