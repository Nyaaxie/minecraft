import React from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../../components/Modal';
import { adminService } from '../../../services/adminService';
import type { Announcement } from '../../../types/database.types';
import { useAuthStore } from '../../../store/useAuthStore';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Content is required.'),
});

type FormData = z.infer<typeof announcementSchema>;

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (announcement: Announcement) => void;
  announcement?: Announcement;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose, onSaved, announcement }) => {
  const { user } = useAuthStore();
  const isEditing = !!announcement;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement?.title || '',
      content: announcement?.content || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    try {
      let saved;
      if (isEditing) {
        saved = await adminService.updateAnnouncement(announcement!.id, data);
        toast.success('Announcement updated');
      } else {
        saved = await adminService.createAnnouncement({ ...data, created_by: user.id });
        toast.success('Announcement created');
      }
      onSaved(saved);
      onClose();
      reset();
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Announcement' : 'New Announcement'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-1">Title</label>
          <input {...register('title')} className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-1">Content</label>
          <textarea {...register('content')} className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white h-32" />
          {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-strawberry-600 p-3 rounded-xl font-bold text-white hover:bg-strawberry-700 transition-colors">
          {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Post Announcement'}
        </button>
      </form>
    </Modal>
  );
};
