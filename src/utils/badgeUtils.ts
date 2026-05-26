import type { Badge } from '../types/database.types';

export const BADGE_ORDER = [
  'berry owner',
  'unbreaking loyalty',
  'berry',
  'salingkitkit'
];

export const sortBadges = (badges: Badge[]) => {
  return [...badges].sort((a, b) => {
    const nameA = a.name.toLowerCase().trim();
    const nameB = b.name.toLowerCase().trim();
    
    // Find index in BADGE_ORDER using partial matching (includes)
    // to handle names like "🍓 Berry Owner" or "Berry (Beta)"
    const indexA = BADGE_ORDER.findIndex(orderedName => nameA.includes(orderedName));
    const indexB = BADGE_ORDER.findIndex(orderedName => nameB.includes(orderedName));
    
    // If both are in our predefined list, sort by list order
    if (indexA !== -1 && indexB !== -1) {
      if (indexA !== indexB) return indexA - indexB;
    }
    
    // If only one is in the list, that one comes first
    if (indexA !== -1 && indexB === -1) return -1;
    if (indexB !== -1 && indexA === -1) return 1;
    
    // If neither are in the list (or they matched the same index), 
    // fall back to priority if it exists, then alphabetically
    if ((b.priority ?? 0) !== (a.priority ?? 0)) {
      return (b.priority ?? 0) - (a.priority ?? 0);
    }
    
    return nameA.localeCompare(nameB);
  });
};
