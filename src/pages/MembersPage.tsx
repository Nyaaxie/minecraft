import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import type { CommunityMember, Badge } from '../types/database.types';
import { Loader2, Palette, Blocks, Ghost, Trees, Cake, Sword, Calendar, Timer, ExternalLink, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import BadgeChip from '../components/BadgeChip';

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
              {member.relationship && (
                <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest truncate block w-full">{member.relationship}</p>
              )}
            </div>
            <div className="flex flex-nowrap justify-start gap-1.5 mt-2  overflow-x-auto w-full" style={{ scrollbarWidth: 'none' }}>
              {member.community_member_badges.map((b) => (
                <BadgeChip key={b.badge_id} badge={b.badges} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Favorites */}
        <div className="flex flex-col gap-1.5 min-w-0">
          {[
            { label: 'Color', value: member.favorite_color, icon: Palette },
            { label: 'Block', value: member.favorite_block, icon: Blocks },
            { label: 'Mob', value: member.favorite_mob, icon: Ghost },
            { label: 'Biome', value: member.favorite_biome, icon: Trees },
            { label: 'Role', value: member.favorite_role, icon: Sword },
          ].map((item) => (
            <div key={item.label} className="bg-neutral-50 dark:bg-neutral-800 p-2 rounded-xl flex items-center gap-2 min-w-0">
              <div className="bg-white dark:bg-neutral-700 p-1 rounded-lg shrink-0">
                <item.icon size={12} className="text-strawberry-500" />
              </div>
              <div className='flex flex-col min-w-0 flex-1'>
                <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400">{item.label}</p>
                {item.label === 'Color' && item.value ? (
                  <p className="text-[10px] font-bold text-neutral-900 dark:text-white truncate flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border border-neutral-300 shrink-0" style={{ background: item.value }} />
                    <span className="truncate">{item.value}</span>
                  </p>
                ) : (
                  <p className="text-[10px] font-bold text-neutral-900 dark:text-white break-words whitespace-normal">
                    {item.value || '---'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section: Above Bio */}
      <div className="grid grid-cols-3 gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl mb-1">
        <div className="flex flex-col items-center gap-1 text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-strawberry-400" />
            <span className="font-black text-neutral-900 dark:text-white text-xs">{member.join_date ? new Date(member.join_date).getFullYear() : '---'}</span>
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
    const dateA = a.join_date ? new Date(a.join_date).getTime() : Infinity;
    const dateB = b.join_date ? new Date(b.join_date).getTime() : Infinity;

    if (dateA !== dateB) {
      return dateA - dateB;
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
        <h1 className="text-6xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">Community<span className='text-strawberry-600'>Members</span></h1>
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Meet the berries of StrawberrySMP</p>
      </div>

      {/* Browse Row */}
      <div className="sticky top-20 z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-100 dark:border-white/10 rounded-[2.5rem] p-5 shadow-lg shadow-neutral-200/20 dark:shadow-none">
        <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {sortedMembers.map(member => (
            <button
              key={member.id}
              onClick={() => scrollToMember(member.id)}
              className="flex flex-col items-center gap-2 min-w-[5.5rem] group"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent group-hover:border-strawberry-500 shadow-md transition-all">
                <img src={getAvatarUrl(member.username, member.avatar_url)} alt={member.username} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-black truncate w-full group-hover:text-strawberry-600 transition-colors">
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