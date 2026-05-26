import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { dbService } from '../services/dbService';
import toast from 'react-hot-toast';
import type { Profile, Badge } from '../types/database.types';
import { Loader2, Check } from 'lucide-react';

import { sortBadges } from '../utils/badgeUtils';

interface AssignBadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: Profile | null;
  assignedBy: string | null; // New prop for the admin's ID
  onBadgesUpdated: () => void; // Callback to refresh profile list or just badges
}

const AssignBadgesModal: React.FC<AssignBadgesModalProps> = ({ isOpen, onClose, userProfile, assignedBy, onBadgesUpdated }) => {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [assignedBadgeIds, setAssignedBadgeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !userProfile?.id) {
      setLoading(false); // Ensure loading is false if modal is closed or no user
      return;
    }

    const fetchBadgesData = async () => {
      setLoading(true);
      try {
        const [fetchedAllBadges, fetchedUserBadges] = await Promise.all([
          dbService.getBadges(),
          dbService.getUserBadges(userProfile.id),
        ]);

        setAllBadges(fetchedAllBadges);
        setAssignedBadgeIds(new Set(fetchedUserBadges.map(ub => ub.badge_id)));
      } catch (error) {
        console.error('Failed to fetch badges data:', error);
        toast.error('Failed to load badges data.');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchBadgesData();
  }, [isOpen, userProfile?.id, onClose]);

  const handleToggleBadge = async (badgeId: string) => {
    if (!userProfile?.id || !assignedBy) { // Check if assignedBy is available
      toast.error('Admin user not identified. Cannot assign/unassign badges.');
      return;
    }

    setSaving(true);
    const wasAssigned = assignedBadgeIds.has(badgeId);
    const updatedAssignedBadges = new Set(assignedBadgeIds);

    try {
      if (wasAssigned) {
        await dbService.removeBadgeFromUser(userProfile.id, badgeId);
        updatedAssignedBadges.delete(badgeId);
        toast.success('Badge unassigned.');
      } else {
        await dbService.assignBadgeToUser(userProfile.id, badgeId, assignedBy); // Use assignedBy prop
        updatedAssignedBadges.add(badgeId);
        toast.success('Badge assigned.');
      }
      setAssignedBadgeIds(updatedAssignedBadges);
      onBadgesUpdated(); // Notify parent to refresh if needed
    } catch (error) {
      console.error('Failed to update badge assignment:', error);
      toast.error('Failed to update badge assignment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Badges to ${userProfile?.username || 'User'}`}>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="animate-spin text-strawberry-600" size={24} />
        </div>
      ) : (
        <div className="space-y-4">
          {allBadges.length === 0 ? (
            <p className="text-center text-neutral-500">No badges available to assign.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sortBadges(allBadges).map(badge => (
                <div
                  key={badge.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer
                    ${assignedBadgeIds.has(badge.id)
                      ? 'bg-green-500/10 border-green-500/50'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-strawberry-500/50'
                    }`}
                  onClick={() => handleToggleBadge(badge.id)}
                >
                  <div className="flex items-center gap-3">
                    {badge.icon_url && <img src={badge.icon_url} alt={badge.name} className="w-5 h-5" />}
                    <span className="font-medium">{badge.name}</span>
                  </div>
                  {assignedBadgeIds.has(badge.id) && (
                    <Check size={20} className="text-green-600" />
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={onClose}
            disabled={saving}
            className="w-full py-3 bg-neutral-200 dark:bg-neutral-700 rounded-xl font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
};

export default AssignBadgesModal;
