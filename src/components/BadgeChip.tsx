import React from 'react';
import type { Badge } from '../types/database.types';

interface BadgeChipProps {
  badge: Badge;
}

const BadgeChip: React.FC<BadgeChipProps> = ({ badge }) => {
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest italic text-white shadow-sm transition-transform hover:scale-105"
      style={{ backgroundColor: badge.color || '#6B7280' }}
    >
      {badge.icon_url && (
        <img src={badge.icon_url} alt="" className="h-2.5 w-2.5 object-contain" />
      )}
      {badge.name}
    </span>
  );
};

export default BadgeChip;