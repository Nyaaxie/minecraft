import React from 'react';
import type { Badge } from '../types/database.types';

interface BadgeChipProps {
  badge: Badge;
}

const BadgeChip: React.FC<BadgeChipProps> = ({ badge }) => {
  // Basic styling based on the provided badge color
  // In a real application, you might want to map colors to Tailwind classes
  // or use a more sophisticated approach for icon display.
  const badgeStyle = {
    backgroundColor: badge.color || '#6B7280', // Default grey if no color
    color: '#ffffff', // White text for contrast
    padding: '0.25rem 0.75rem', // px-3 py-0.5
    borderRadius: '9999px', // rounded-full
    fontSize: '0.75rem', // text-xs
    fontWeight: '500', // font-medium
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem', // gap-1
  };

  return (
    <span style={badgeStyle}>
      {/* Optionally display an icon if available */}
      {badge.icon_url && (
        <img src={badge.icon_url} alt={badge.name} className="h-3 w-3 inline-block" />
      )}
      {badge.name}
    </span>
  );
};

export default BadgeChip;