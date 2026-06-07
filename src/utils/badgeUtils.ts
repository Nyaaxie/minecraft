import type { Badge } from '../types/database.types';

export const BADGE_ORDER = [
  'berry owner',
  'unbreaking berry',
  'loyalty iii',
  'loyalty ii',
  'loyalty i',
  'berry',
  'salingkitkit'
];

export const LOYALTY_BADGES: Record<string, Badge> = {
  berry: {
    id: 'auto-berry',
    name: 'Berry',
    color: '#e35a7f',
    icon_url: null,
    is_visible: true,
    priority: 10,
    description: 'Member for less than a year',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  },
  loyalty1: {
    id: 'auto-loyalty-1',
    name: 'Loyalty I',
    color: '#94a3b8',
    icon_url: null,
    is_visible: true,
    priority: 20,
    description: 'Member for 1 year',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  },
  loyalty2: {
    id: 'auto-loyalty-2',
    name: 'Loyalty II',
    color: '#fbbf24',
    icon_url: null,
    is_visible: true,
    priority: 30,
    description: 'Member for 2 years',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  },
  loyalty3: {
    id: 'auto-loyalty-3',
    name: 'Loyalty III',
    color: '#22d3ee',
    icon_url: null,
    is_visible: true,
    priority: 40,
    description: 'Member for 3+ years',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  }
};

export const getAutomaticBadge = (joinDate: string | null, dbBadges: Badge[] = []): Badge => {
  const getTier = () => {
    if (!joinDate) return 'berry';
    const join = new Date(joinDate);
    const today = new Date();
    let years = today.getFullYear() - join.getFullYear();
    const m = today.getMonth() - join.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < join.getDate())) {
      years--;
    }

    if (years < 1) return 'berry';
    if (years === 1) return 'loyalty1';
    if (years === 2) return 'loyalty2';
    return 'loyalty3';
  };

  const tier = getTier();
  const defaultBadge = LOYALTY_BADGES[tier];

  // Look for a badge in the database with the same name to override properties (like color)
  const override = dbBadges.find(b => 
    b.name.toLowerCase().trim() === defaultBadge.name.toLowerCase().trim()
  );

  if (override) {
    return {
      ...defaultBadge,
      ...override,
      id: `auto-${override.id}` // Keep it distinct as an automatic badge
    };
  }

  return defaultBadge;
};
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
