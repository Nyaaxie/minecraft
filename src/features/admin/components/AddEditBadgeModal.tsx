import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal'; // Assuming Modal component is in the same directory
import toast from 'react-hot-toast';
import type { Badge } from '../../../types/database.types';
import { Loader2 } from 'lucide-react';

interface AddEditBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (badge: Omit<Badge, 'id' | 'created_at' | 'updated_at'> | Badge) => Promise<void>;
  editingBadge?: Badge | null; // Null for new badge, Badge object for editing
}

const AddEditBadgeModal: React.FC<AddEditBadgeModalProps> = ({ isOpen, onClose, onSave, editingBadge }) => {
  const [formData, setFormData] = useState<Omit<Badge, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    description: null,
    color: '#E35A7F', // Default strawberry color
    icon_url: null,
    is_visible: true,
    priority: 0,
    created_by: null, // This will be set by the calling function (AdminPanel)
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingBadge) {
      // Populate form for editing
      setFormData({
        name: editingBadge.name,
        description: editingBadge.description,
        color: editingBadge.color,
        icon_url: editingBadge.icon_url,
        is_visible: editingBadge.is_visible,
        priority: editingBadge.priority,
        created_by: editingBadge.created_by,
      });
    } else {
      // Reset form for new badge
      setFormData({
        name: '',
        description: null,
        color: '#E35A7F',
        icon_url: null,
        is_visible: true,
        priority: 0,
        created_by: null,
      });
    }
  }, [editingBadge, isOpen]); // Reset when modal opens or editingBadge changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // For checkbox, use checked property
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingBadge) {
        // Pass the full badge object for update, including the ID
        await onSave({ ...formData, id: editingBadge.id });
      } else {
        await onSave(formData);
      }
      onClose(); // Close modal on successful save
    } catch (error) {
      console.error('Error saving badge:', error);
      toast.error('Failed to save badge.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-strawberry-500/40';
  const checkboxRowCls = 'flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer select-none';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBadge ? 'Edit Badge' : 'Create New Badge'}
      size="md"
    >
      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Badge Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Owner, Java Player"
              required
              className={inputCls}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="A short description..."
              className={`${inputCls} h-20 py-2.5`}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Badge Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
                className="w-10 h-10 p-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl cursor-pointer shrink-0"
              />
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className={`${inputCls} text-[10px] uppercase`}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Priority</label>
            <input
              type="number"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={inputCls}
              min="0"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Icon URL (Optional)</label>
            <input
              type="text"
              name="icon_url"
              value={formData.icon_url || ''}
              onChange={handleChange}
              placeholder="https://..."
              className={inputCls}
            />
          </div>
        </div>

        <label className={`${checkboxRowCls} py-2`}>
          <input
            type="checkbox"
            name="is_visible"
            checked={formData.is_visible}
            onChange={handleChange}
            className="accent-strawberry-600 w-4 h-4"
          />
          <div>
            <p className="text-[11px] font-black uppercase tracking-tight text-neutral-900 dark:text-white leading-none">Visible to users</p>
          </div>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-strawberry-600 rounded-xl font-bold text-white hover:bg-strawberry-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-strawberry-600/20"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : (editingBadge ? 'Save Changes' : 'Create Badge')}
        </button>
      </form>
    </Modal>
  );
};

export default AddEditBadgeModal;
