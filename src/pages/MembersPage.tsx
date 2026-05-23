import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import type { Profile, Badge } from '../types/database.types'; // Import Badge type
import { User, Search, Ghost, Blocks, Palette, MonitorPlay, UsersRound, Loader2, Users } from 'lucide-react'; // Removed unused icons
import BadgeChip from '../components/BadgeChip';

// Define an extended Profile type that includes the joined user_badges
// Updated to reflect that 'badges' is returned as an array (due to Supabase relationship inference)
interface ProfileWithBadges extends Profile {
  user_badges: {
    badge_id: string;
    badges: Badge[]; // Changed from Badge to Badge[]
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
      const matchesSearch =
        (profile.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.minecraft_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.bio?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesEdition = filterEdition === 'all' || profile.minecraft_edition === filterEdition;

      const matchesBadge = filterBadge === 'all' ||
        profile.user_badges?.some(ub => ub.badges && ub.badges.length > 0 && ub.badges[0].id === filterBadge);

      const matchesMob = filterMob === '' || profile.favorite_mob?.toLowerCase().includes(filterMob.toLowerCase());
      const matchesBlock = filterBlock === '' || profile.favorite_block?.toLowerCase().includes(filterBlock.toLowerCase());
      const matchesColor = filterColor === '' || profile.favorite_color?.toLowerCase().includes(filterColor.toLowerCase());

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
    <div className="max-w-6xl mx-auto space-y-8 text-neutral-900 dark:text-neutral-100">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Members</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">Explore and connect with other members of StrawberrySMP.</p>
      </div>

      {/* Search and Filter/Sort Controls */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 flex flex-col gap-4">
        {/* Search */}
        <div className="relative w-full">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by username, bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-strawberry-500/40"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"> {/* Adjusted grid for more filters */}
          {/* Edition Filter */}
          <div className="relative">
            <MonitorPlay size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <select
              value={filterEdition}
              onChange={(e) => setFilterEdition(e.target.value as 'all' | 'java' | 'bedrock')}
              className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-strawberry-500/40"
            >
              <option value="all">All Editions</option>
              <option value="java">Java Edition</option>
              <option value="bedrock">Bedrock Edition</option>
            </select>
          </div>

          {/* Badge Filter */}
          <div className="relative">
            <UsersRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <select
              value={filterBadge}
              onChange={(e) => setFilterBadge(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-strawberry-500/40"
            >
              <option value="all">All Badges</option>
              {allBadges.map(badge => (
                <option key={badge.id} value={badge.id}>{badge.name}</option>
              ))}
            </select>
          </div>

          {/* Favorite Mob Filter */}
          <div className="relative">
            <Ghost size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Favorite Mob"
              value={filterMob}
              onChange={(e) => setFilterMob(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-strawberry-500/40"
            />
          </div>

          {/* Favorite Block Filter */}
          <div className="relative">
            <Blocks size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Favorite Block"
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-strawberry-500/40"
            />
          </div>

          {/* Favorite Color Filter (text input for now, could be color picker) */}
          <div className="relative">
            <Palette size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text" // Using text for now for simplicity, can be changed to type="color" with more complex handling
              placeholder="Favorite Color (e.g., #FF0000)"
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-strawberry-500/40"
            />
          </div>
        </div>

        {/* Sorting */}
        <div className="w-full flex justify-end">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'username' | 'recent' | 'badges' | 'newest')}
            className="w-full sm:w-auto bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-strawberry-500/40"
          >
            <option value="username">Sort by Username (A-Z)</option>
            <option value="newest">Newest Members</option>
            <option value="recent">Recently Active</option>
            <option value="badges">Most Badges</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-strawberry-600 dark:text-strawberry-500" size={48} />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-center">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filteredAndSortedProfiles.length === 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-3xl text-center space-y-4">
          <Users className="mx-auto text-neutral-400 dark:text-neutral-700" size={48} />
          <p className="text-xl font-bold">No members found</p>
          <p className="text-neutral-500">Try adjusting your search or filters.</p>
        </div>
      )}

      {!loading && !error && filteredAndSortedProfiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProfiles.map(profile => (
            <div key={profile.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-all">
              <div className="h-24 w-24 rounded-full bg-neutral-100 dark:bg-neutral-800 border-4 border-strawberry-600/20 flex items-center justify-center overflow-hidden mx-auto mb-4">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User size={36} className="text-neutral-500" />
                )}
              </div>
              <h2 className="text-xl font-bold">{profile.username || 'Player'}</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-500 capitalize">{profile.minecraft_username || 'No MC linked'}</p>
              <p className="text-xs text-neutral-500 mb-4">{profile.bio || 'No bio provided.'}</p>

              {/* Badges */}
              {profile.user_badges && profile.user_badges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {profile.user_badges.map(ub => ub.badges && ub.badges.length > 0 && <BadgeChip key={ub.badge_id} badge={ub.badges[0]} />)}
                </div>
              )}

              <div className="text-xs text-neutral-500 space-y-1">
                {profile.favorite_mob && <p>Fav Mob: <span className="font-bold text-neutral-700 dark:text-neutral-300">{profile.favorite_mob}</span></p>}
                {profile.favorite_block && <p>Fav Block: <span className="font-bold text-neutral-700 dark:text-neutral-300">{profile.favorite_block}</span></p>}
                {profile.favorite_color && <p>Fav Color: <span className="font-bold text-neutral-700 dark:text-neutral-300" style={{ color: profile.favorite_color }}>{profile.favorite_color}</span></p>}
                {profile.minecraft_edition && <p>Edition: <span className="font-bold text-neutral-700 dark:text-neutral-300 capitalize">{profile.minecraft_edition}</span></p>}
                <p>Status: <span className={`font-bold capitalize ${profile.status === 'online' ? 'text-green-500' : 'text-neutral-500'}`}>{profile.status}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MembersPage;
