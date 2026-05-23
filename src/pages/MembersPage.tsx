import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import type { Profile, Badge } from '../types/database.types'; // Import Badge type
import { User, Search, Ghost, Blocks, Palette, MonitorPlay, UsersRound, Loader2, Users, AlertCircle } from 'lucide-react'; // Removed unused icons
import { motion } from 'framer-motion';
import BadgeChip from '../components/BadgeChip';

// Define an extended Profile type that includes the joined user_badges
interface ProfileWithBadges extends Profile {
  user_badges: {
    badge_id: string;
    badges: Badge; // It's a single object from Supabase join
  }[];
}

const MembersPage: React.FC = () => {
  const [profiles, setProfiles] = useState<ProfileWithBadges[]>([]); // Use ProfileWithBadges
  const [allBadges, setAllBadges] = useState<Badge[]>([]); // State to hold all available badges
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEdition, setFilterEdition] = useState<'all' | 'java' | 'bedrock'>('all');
  const [filterBadge, setFilterBadge] = useState<string>('all'); // Filter by badge ID
  const [filterMob, setFilterMob] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [sortBy, setSortBy] = useState<'username' | 'recent' | 'badges' | 'newest'>('username');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [fetchedProfiles, fetchedBadges] = await Promise.all([
          dbService.getAllProfiles(),
          dbService.getBadges(), // Fetch all available badges
        ]);

        // Cast fetchedProfiles to ProfileWithBadges[]
        setProfiles(fetchedProfiles as unknown as ProfileWithBadges[]);
        setAllBadges(fetchedBadges);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load members or badges. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const filteredAndSortedProfiles = profiles
    .filter(profile => {
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch =
        (profile.username?.toLowerCase().includes(lowerSearch) ?? false) ||
        (profile.minecraft_username?.toLowerCase().includes(lowerSearch) ?? false) ||
        (profile.bio?.toLowerCase().includes(lowerSearch) ?? false);

      const matchesEdition = filterEdition === 'all' || profile.minecraft_edition === filterEdition;

      const matchesBadge = filterBadge === 'all' ||
        profile.user_badges?.some(ub => ub.badges && ub.badges.id === filterBadge);

      const lowerMob = filterMob.toLowerCase();
      const matchesMob = filterMob === '' || (profile.favorite_mob?.toLowerCase().includes(lowerMob) ?? false);
      
      const lowerBlock = filterBlock.toLowerCase();
      const matchesBlock = filterBlock === '' || (profile.favorite_block?.toLowerCase().includes(lowerBlock) ?? false);
      
      const lowerColor = filterColor.toLowerCase();
      const matchesColor = filterColor === '' || (profile.favorite_color?.toLowerCase().includes(lowerColor) ?? false);

      return matchesSearch && matchesEdition && matchesBadge && matchesMob && matchesBlock && matchesColor;
    })
    .sort((a, b) => {
      if (sortBy === 'username') {
        return (a.username || '').localeCompare(b.username || '');
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'recent') {
        // Assuming 'updated_at' can represent 'recently active'
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortBy === 'badges') {
        const aBadgeCount = a.user_badges?.length || 0;
        const bBadgeCount = b.user_badges?.length || 0;
        return bBadgeCount - aBadgeCount; // More badges first
      }
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto space-y-12 text-neutral-900 dark:text-neutral-100 pb-20">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter italic uppercase text-neutral-900 dark:text-white">
          Community <span className="text-strawberry-600">Members</span>
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto text-lg">
          Meet the amazing berries of StrawberrySMP. Explore, connect, and grow together in our peaceful community.
        </p>
      </div>

      {/* Search and Filter/Sort Controls */}
      <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-neutral-900/5 backdrop-blur-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by username, bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 transition-all"
            />
          </div>
          
          <div className="flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'username' | 'recent' | 'badges' | 'newest')}
              className="bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 font-bold text-sm uppercase tracking-widest italic"
            >
              <option value="username">Sort: A-Z</option>
              <option value="newest">Sort: Newest</option>
              <option value="recent">Sort: Activity</option>
              <option value="badges">Sort: Badges</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-neutral-100 dark:border-white/5">
          <div className="relative">
            <MonitorPlay size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <select
              value={filterEdition}
              onChange={(e) => setFilterEdition(e.target.value as 'all' | 'java' | 'bedrock')}
              className="w-full pl-10 pr-4 py-3 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none text-sm font-bold uppercase italic"
            >
              <option value="all">All Editions</option>
              <option value="java">Java Edition</option>
              <option value="bedrock">Bedrock</option>
            </select>
          </div>

          <div className="relative">
            <UsersRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <select
              value={filterBadge}
              onChange={(e) => setFilterBadge(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none text-sm font-bold uppercase italic"
            >
              <option value="all">All Badges</option>
              {allBadges.map(badge => (
                <option key={badge.id} value={badge.id}>{badge.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Ghost size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Fav Mob"
              value={filterMob}
              onChange={(e) => setFilterMob(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none text-sm"
            />
          </div>

          <div className="relative">
            <Blocks size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Fav Block"
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none text-sm"
            />
          </div>

          <div className="relative">
            <Palette size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Fav Color"
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-strawberry-600" size={64} />
          <p className="text-neutral-500 font-black uppercase tracking-widest animate-pulse">Growing the Garden...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-8 rounded-3xl text-center max-w-md mx-auto">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p className="font-bold text-lg">{error}</p>
        </div>
      )}

      {!loading && !error && filteredAndSortedProfiles.length === 0 && (
        <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 p-20 rounded-[3rem] text-center space-y-6 backdrop-blur-sm">
          <div className="w-24 h-24 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <Users className="text-neutral-400" size={48} />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black uppercase italic tracking-tighter">No berries found</p>
            <p className="text-neutral-500">Try adjusting your filters to find who you're looking for.</p>
          </div>
        </div>
      )}

      {!loading && !error && filteredAndSortedProfiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedProfiles.map(profile => (
            <motion.div 
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-8 transition-all hover:border-strawberry-500/30 overflow-hidden shadow-sm dark:shadow-none"
            >
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-strawberry-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-3xl bg-neutral-100 dark:bg-neutral-800 border-4 border-white dark:border-neutral-900 shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-neutral-400 bg-neutral-50 dark:bg-neutral-800">
                          <User size={48} />
                        </div>
                      )}
                    </div>
                    <div className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-4 border-white dark:border-neutral-900 flex items-center justify-center shadow-lg ${profile.status === 'online' ? 'bg-green-500' : 'bg-neutral-400'}`}>
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    </div>
                  </div>
                  
                  {/* Join Date / Role Badge */}
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Joined</span>
                    <span className="text-xs font-black italic text-neutral-600 dark:text-neutral-300">
                      {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest italic ${profile.role === 'admin' ? 'bg-strawberry-600 text-white' : 'bg-neutral-100 dark:bg-white/5 text-neutral-500'}`}>
                        {profile.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6 text-left">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white group-hover:text-strawberry-600 transition-colors">
                    {profile.username || 'Berry Player'}
                  </h2>
                  {profile.minecraft_username && (
                    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                      <MonitorPlay size={14} className="text-strawberry-500" />
                      <span className="text-sm font-bold tracking-tight">{profile.minecraft_username}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3 mb-8 min-h-[4.5rem] italic">
                  "{profile.bio || 'No bio provided.'}"
                </p>

                {/* Badges Row */}
                {profile.user_badges && profile.user_badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {[...profile.user_badges]
                      .sort((a, b) => (b.badges?.priority ?? 0) - (a.badges?.priority ?? 0))
                      .map(ub => ub.badges && <BadgeChip key={ub.badge_id} badge={ub.badges} />)}
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-neutral-100 dark:border-white/5">
                  <div className="bg-neutral-50 dark:bg-white/5 p-3 rounded-2xl group/stat">
                    <div className="flex items-center gap-2 mb-1">
                      <Ghost size={14} className="text-strawberry-500 group-hover/stat:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Fav Mob</span>
                    </div>
                    <span className="text-xs font-black italic truncate block">{profile.favorite_mob || '---'}</span>
                  </div>
                  <div className="bg-neutral-50 dark:bg-white/5 p-3 rounded-2xl group/stat">
                    <div className="flex items-center gap-2 mb-1">
                      <Blocks size={14} className="text-strawberry-500 group-hover/stat:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Fav Block</span>
                    </div>
                    <span className="text-xs font-black italic truncate block">{profile.favorite_block || '---'}</span>
                  </div>
                  <div className="bg-neutral-50 dark:bg-white/5 p-3 rounded-2xl group/stat">
                    <div className="flex items-center gap-2 mb-1">
                      <Palette size={14} className="text-strawberry-500 group-hover/stat:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Fav Color</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: profile.favorite_color || '#e35a7f' }} />
                      <span className="text-xs font-black italic truncate block uppercase">{profile.favorite_color || '---'}</span>
                    </div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-white/5 p-3 rounded-2xl group/stat">
                    <div className="flex items-center gap-2 mb-1">
                      <MonitorPlay size={14} className="text-strawberry-500 group-hover/stat:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Edition</span>
                    </div>
                    <span className="text-xs font-black italic truncate block capitalize">{profile.minecraft_edition || '---'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MembersPage;
