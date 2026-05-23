import React from 'react';
import type { Badge } from '../types/database.types';

interface BadgeChipProps {
  badge: Badge;
}

const BadgeChip: React.FC<BadgeChipProps> = ({ badge }) => {
  return (
    <span 
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic text-white shadow-sm transition-transform hover:scale-105"
      style={{ backgroundColor: badge.color || '#6B7280' }}
    >
      {badge.icon_url && (
        <img src={badge.icon_url} alt="" className="h-3 w-3 object-contain" />
      )}
      {badge.name}
    </span>
  );
};

export default BadgeChip;