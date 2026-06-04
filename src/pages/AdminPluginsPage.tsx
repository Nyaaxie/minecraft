import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { useNavigate, useParams } from 'react-router-dom';
import type { Plugin, PluginCategory } from '../types/database.types';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore'; // Import useAuthStore
import Select from 'react-select';
import { useTheme } from '../components/ThemeProvider';
import { useMemo } from 'react';

const AdminPluginForm = ({ plugin, categories, onSubmit, onCancel, isSaving }: { 
  plugin?: Plugin; 
  categories: PluginCategory[];
  onSubmit: (plugin: Omit<Plugin, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void; // This form doesn't handle created_by
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [name, setName] = useState(plugin?.name || '');
  const [description, setDescription] = useState(plugin?.description || '');
  const [iconUrl, setIconUrl] = useState(plugin?.icon_url || '');
  const [category, setCategory] = useState(plugin?.category || '');
  const [version, setVersion] = useState(plugin?.version || '');
  const [isVisible, setIsVisible] = useState(plugin?.is_visible ?? true);

  const categoryOptions = useMemo(() => [
    ...categories.map(cat => ({ value: cat.name, label: cat.name })),
    { value: 'Other', label: 'Other' }
  ], [categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, icon_url: iconUrl, category, version, is_visible: isVisible });
  };

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: isDark ? '#1f2937' : '#f3f4f6', // Match bg-neutral-100/800
      borderColor: isDark ? '#374151' : '#e5e7eb', // Match border-neutral-200/700
      borderRadius: '0.75rem',
      padding: '0.125rem 0.25rem',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#f43f5e'
      },
      transition: 'all 0.2s ease'
    }),
    singleValue: (base: any) => ({ 
      ...base, 
      color: isDark ? '#ffffff' : '#111827', 
      fontWeight: 'bold' 
    }),
    placeholder: (base: any) => ({
      ...base,
      color: isDark ? '#9ca3af' : '#4b5563'
    }),
    input: (base: any) => ({
      ...base,
      color: isDark ? '#ffffff' : '#111827'
    }),
    menu: (base: any) => ({ 
      ...base, 
      backgroundColor: isDark ? '#1f2937' : '#ffffff', 
      borderRadius: '1rem', 
      overflow: 'hidden', 
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      zIndex: 50
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused 
        ? (isDark ? '#f43f5e33' : '#f43f5e1a') 
        : 'transparent',
      color: isDark ? '#ffffff' : '#111827',
      fontWeight: 'bold',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#f43f5e33'
      }
    })
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-lg space-y-6 text-neutral-900 dark:text-neutral-100"
      onSubmit={handleSubmit}
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Plugin Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="iconUrl" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Icon URL</label>
        <input
          type="url"
          id="iconUrl"
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Category</label>
        <Select
          id="category"
          options={categoryOptions}
          value={categoryOptions.find(opt => opt.value === category) || null}
          onChange={(opt) => setCategory(opt?.value || '')}
          styles={selectStyles}
          placeholder="Select Category"
          isClearable
        />
      </div>
      <div>
        <label htmlFor="version" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Version</label>
        <input
          type="text"
          id="version"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isVisible"
          checked={isVisible}
          onChange={(e) => setIsVisible(e.target.checked)}
          className="h-5 w-5 rounded border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-strawberry-600 focus:ring-strawberry-600"
        />
        <label htmlFor="isVisible" className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {isVisible ? 'Visible to Players' : 'Hidden from Players'}
        </label>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white rounded-xl transition-colors"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl transition-colors flex items-center gap-2"
          disabled={isSaving}
        >
          {isSaving && <Loader2 size={18} className="animate-spin" />}
          {plugin ? 'Save Changes' : 'Add Plugin'}
        </button>
      </div>
    </motion.form>
  );
};

const AdminPluginsPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState<Plugin | undefined>(undefined);
  const [categories, setCategories] = useState<PluginCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchPluginData = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedCategories = await dbService.getPluginCategories();
        setCategories(fetchedCategories);

        if (id) {
          const fetchedPlugin = await dbService.getPluginById(id);
          setPlugin(fetchedPlugin);
        }
      } catch (err) {
        console.error('Error fetching plugin data:', err);
        setError('Failed to load plugin data.');
        toast.error('Failed to load plugin data.');
      } finally {
        setLoading(false);
      }
    };
    fetchPluginData();
  }, [id]);

  const handleSubmit = async (formData: Omit<Plugin, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    setIsSaving(true);
    try {
      if (plugin) {
        await dbService.updatePlugin(plugin.id, formData);
        toast.success('Plugin updated successfully!');
      } else {
        if (!user?.id) {
          toast.error('User not logged in. Cannot create plugin.');
          setIsSaving(false);
          return;
        }
        // Add created_by from the current user
        await dbService.createPlugin({ ...formData, created_by: user.id });
        toast.success('Plugin added successfully!');
      }
      navigate('/plugins'); // Redirect to plugins list after save
    } catch (err) {
      console.error('Error saving plugin:', err);
      toast.error(`Failed to save plugin: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 text-strawberry-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-xl text-center">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-neutral-900 dark:text-white mb-8">        {plugin ? 'Edit Plugin' : 'Add New Plugin'}
      </h1>
      <AdminPluginForm 
        plugin={plugin} 
        categories={categories}
        onSubmit={handleSubmit} 
        onCancel={() => navigate('/plugins')} 
        isSaving={isSaving} 
      />
    </div>
  );
};

export default AdminPluginsPage;
