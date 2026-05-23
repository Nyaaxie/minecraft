import React from 'react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from './Modal';
import { adminService } from '../services/adminService';
import type { MinecraftVersion } from '../types/database.types';

// Zod schema for validation
const addVersionSchema = z.object({
  version_string: z.string().min(1, 'Version string is required.'),
  platform_type: z.enum(['java', 'bedrock']),
  is_recommended: z.boolean(),
  is_supported: z.boolean(),
});

type AddVersionFormData = z.infer<typeof addVersionSchema>;
interface AddVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVersionAdded: (version: MinecraftVersion) => void;
  version?: MinecraftVersion; // Optional version prop for editing
}

export const AddVersionModal: React.FC<AddVersionModalProps> = ({ isOpen, onClose, onVersionAdded, version }) => {
  const isEditing = !!version;
  const { control, handleSubmit, reset, formState: { errors } } = useForm<AddVersionFormData>({
    resolver: zodResolver(addVersionSchema),
    defaultValues: {
      version_string: version?.version_string || '',
      platform_type: version?.supports_java ? 'java' : 'bedrock',
      is_recommended: version?.is_recommended || false,
      is_supported: version?.is_supported || true,
    },
  });

  const onSubmit = async (data: AddVersionFormData) => {
    try {
      const payload = { 
        version_string: data.version_string, 
        is_supported: data.is_supported, 
        is_recommended: data.is_recommended, 
        maintenance_mode: version?.maintenance_mode || false, 
        supports_java: data.platform_type === 'java',
        supports_bedrock: data.platform_type === 'bedrock',
        changelog: version?.changelog || null 
      };

      let savedVersion;
      if (isEditing) {
        savedVersion = await adminService.updateVersion(version!.id, payload);
        toast.success('Version updated');
      } else {
        savedVersion = await adminService.createVersion(payload);
        toast.success('Version added');
      }

      onVersionAdded(savedVersion);
      onClose();
      reset(); 
    } catch (err: any) {
      console.error('Error saving version:', err);
      toast.error(`Failed to save version: ${err.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Version' : 'Add Version'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="version_string" className="block text-sm font-medium text-neutral-900 dark:text-white mb-1">Version String</label>
          <Controller
            name="version_string"
            control={control}
            render={({ field }) => (
              <input 
                {...field}
                id="version_string"
                placeholder="e.g. 1.21.1" 
                className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white" 
              />
            )}
          />
          {errors.version_string && <p className="text-red-500 text-xs mt-1">{errors.version_string.message}</p>}
        </div>
        
        <div className="space-y-2 text-neutral-900 dark:text-neutral-100">
          <p className="text-sm font-medium">Platform Type:</p>
          <Controller
            name="platform_type"
            control={control}
            render={({ field }) => (
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    {...field}
                    value="java" 
                    checked={field.value === 'java'}
                    className="accent-strawberry-600" 
                  />
                  Java Edition
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    {...field}
                    value="bedrock" 
                    checked={field.value === 'bedrock'}
                    className="accent-strawberry-600" 
                  />
                  Bedrock Edition
                </label>
              </div>
            )}
          />
          {errors.platform_type && <p className="text-red-500 text-xs mt-1">{errors.platform_type.message}</p>}
        </div>

        <label className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
          <Controller
            name="is_recommended"
            control={control}
            render={({ field }) => (
              <input 
                type="checkbox" 
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="accent-strawberry-600" 
              />
            )}
          />
          Recommended Version
        </label>

        <label className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
          <Controller
            name="is_supported"
            control={control}
            render={({ field }) => (
              <input 
                type="checkbox" 
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="accent-strawberry-600" 
              />
            )}
          />
          Supported Version (compatibility)
        </label>

        <button type="submit" className="w-full bg-strawberry-600 p-3 rounded-xl font-bold text-white hover:bg-strawberry-700">{isEditing ? 'Save Changes' : 'Add Version'}</button>
      </form>
    </Modal>
  );
};
