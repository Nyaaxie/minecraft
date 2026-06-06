import React, { useState, useEffect } from 'react';
import { dbService } from '../../../services/dbService';
import type { CommunityMember, Badge } from '../../../types/database.types';
import { Loader2, Palette, Blocks, Ghost, Trees, Cake, Sword, Calendar, Timer, ExternalLink, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import BadgeChip from '../../../components/BadgeChip';

interface MemberWithBadges extends CommunityMember {
  community_member_badges: {
    badge_id: string;
    badges: Badge;
  }[];
}

const getAvatarUrl = (username: string, avatar_url: string | null) => {
  return avatar_url || `https://mc-heads.net/avatar/${username}`;
};

const getSocialIcon = (platform: string) => {
  if (platform.toLowerCase() === 'discord') return <MessageSquare size={14} />;
  return <ExternalLink size={14} />;
};

const MemberCard: React.FC<{ member: MemberWithBadges }> = ({ member }) => {
  const socials = React.useMemo(() => {
    try { return member.social_links ? JSON.parse(member.social_links) : {}; }
    catch { return {}; }
  }, [member.social_links]);

  const calculatedAge = React.useMemo(() => {
    if (member.birthday) {
      const birthDate = new Date(member.birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return member.age;
  }, [member.birthday, member.age]);

  return (
    <motion.div
      id={`member-${member.id}`}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-strawberry-500/10 transition-all duration-300 flex flex-col gap-2"
    >
      <div className="grid grid-cols-2 gap-5  ">
        {/* Left Column: Avatar + Name */}
        <div className="flex flex-col items-start gap-5">
          <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-xl ring-4 ring-white dark:ring-neutral-800">
            <img src={getAvatarUrl(member.username, member.avatar_url)} alt={member.username} className="w-full h-full object-cover" />
          </div>
          <div className="text-left min-w-0 w-full">
            <h2 className="text-base font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white truncate block w-full">{member.nickname || member.username}</h2>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-bold text-strawberry-600 italic truncate block w-full">{member.username}</p>
            </div>
            <div className="flex flex-nowrap justify-start gap-1.5 mt-2  overflow-x-auto w-full" style={{ scrollbarWidth: 'none' }}>
              {member.community_member_badges.map((b) => (
                <BadgeChip key={b.badge_id} badge={b.badges} />
              ))}
            </div>
            {member.relationship && (
              <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest truncate block w-full mt-2">{member.relationship}</p>
            )}
          </div>
        </div>

        {/* Right Column: Large Favorites Icons */}
        <div className="flex flex-col gap-2 min-w-0">
          {[
            { label: 'Role', url: member.favorite_role_url, icon: Sword },
            { label: 'Biome', url: member.favorite_biome_url, icon: Trees },
            { label: 'Mob', url: member.favorite_mob_url, icon: Ghost },
            { label: 'Block', url: member.favorite_block_url, icon: Blocks },
          ].map((item) => (
            <div key={item.label} className="bg-neutral-50 dark:bg-neutral-800 p-2.5 rounded-2xl flex items-center gap-3 min-w-0 h-[52px] group/fav relative">
              <div className="bg-white dark:bg-neutral-700 p-2 rounded-xl shrink-0 shadow-sm">
                <item.icon size={14} className="text-strawberry-500" />
              </div>
              <div className='flex flex-col min-w-0 flex-1'>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 leading-none mb-1">{item.label}</p>
                <div className="flex items-center">
                  {item.url ? (
                    <img src={item.url} alt={item.label} className="h-5 w-5 object-contain pixelated" />
                  ) : (
                    <div className="w-5 h-5 rounded-lg bg-neutral-100 dark:bg-neutral-700/50" />
                  )}
                </div>
              </div>
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-[8px] font-black uppercase tracking-widest rounded-md opacity-0 group-hover/fav:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl">
                {item.label}
              </div>
            </div>
          ))}
          {/* Large Color pill */}
          <div className="bg-neutral-50 dark:bg-neutral-800 p-2.5 rounded-2xl flex items-center gap-3 min-w-0 h-[52px] group/fav relative">
            <div className="bg-white dark:bg-neutral-700 p-2 rounded-xl shrink-0 shadow-sm">
              <Palette size={14} className="text-strawberry-500" />
            </div>
            <div className='flex flex-col min-w-0 flex-1'>
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 leading-none mb-1">Color</p>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full border-2 border-white dark:border-neutral-700 shadow-sm" style={{ background: member.favorite_color || '#e35a7f' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section: Above Bio */}
      <div className="grid grid-cols-3 gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl mb-1">
        <div className="flex flex-col items-center gap-1 text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-strawberry-400" />
            <span className="font-bold text-white text-[10px] uppercase tracking-widest whitespace-nowrap">
              {member.join_date ? new Date(member.join_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '---'}
            </span>
          </div>
          <span className="text-[8px] uppercase tracking-widest text-neutral-400">Joined</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-1">
            <Timer size={14} className="text-strawberry-400" />
            <span className="font-black text-neutral-900 dark:text-white text-xs">{calculatedAge || '---'}</span>
          </div>
          <span className="text-[8px] uppercase tracking-widest text-neutral-400">Age</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-1">
            <Cake size={14} className="text-strawberry-400" />
            <span className="font-black text-neutral-900 dark:text-white text-xs">{member.birth_month || '---'}</span>
          </div>
          <span className="text-[8px] uppercase tracking-widest text-neutral-400">B-Day</span>
        </div>
      </div>

      {/* Bottom: Bio + Socials */}
      <div className="border-t border-neutral-100 dark:border-white/5 pt-2 space-y-6 mt-1">
        <div className="text-sm text-neutral-600 dark:text-neutral-300 italic leading-relaxed text-center flex flex-col items-center min-w-0">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1 mt-3  ">About Me</h3>
          <p className="break-words w-full">"{member.bio || 'This member hasn\'t written a bio yet.'}"</p>
        </div>

        {Object.keys(socials).length > 0 && (
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(socials).map(([platform, handle]) => (
              <a key={platform} href={handle as string} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-[10px] font-black italic uppercase tracking-widest hover:bg-strawberry-500 hover:text-white transition-all flex items-center gap-2 shadow-sm">
                {getSocialIcon(platform)} {platform}
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<MemberWithBadges[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const data = await dbService.getCommunityMembers();
        setMembers(data as MemberWithBadges[]);
      } catch (err) { console.error('Failed to fetch members:', err); }
      finally { setLoading(false); }
    };
    fetchMembers();
  }, []);

  const sortedMembers = [...members].sort((a, b) => {
    // Treat 0 or null as 999 (last)
    const orderA = (a.sort_order === 0 || a.sort_order === null) ? 999 : a.sort_order;
    const orderB = (b.sort_order === 0 || b.sort_order === null) ? 999 : b.sort_order;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.username.localeCompare(b.username);
  });

  const scrollToMember = (id: string) => {
    const element = document.getElementById(`member-${id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">Berry<span className='text-strawberry-600'>List</span></h1>
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Our little strawberry garden.</p>
      </div>

      {/* Browse Grid */}
      <div className="sticky top-20 z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-100 dark:border-white/10 rounded-[2.5rem] p-6 shadow-lg shadow-neutral-200/20 dark:shadow-none">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
          {sortedMembers.map(member => (
            <button
              key={member.id}
              onClick={() => scrollToMember(member.id)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent group-hover:border-strawberry-500 shadow-md transition-all">
                <img src={getAvatarUrl(member.username, member.avatar_url)} alt={member.username} className="w-full h-full object-cover" />
              </div>
              <p className="text-[10px] font-black truncate w-full group-hover:text-strawberry-600 transition-colors text-center">
                {member.username}
              </p>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-32"><Loader2 className="animate-spin text-strawberry-600" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {sortedMembers.map(member => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MembersPage;