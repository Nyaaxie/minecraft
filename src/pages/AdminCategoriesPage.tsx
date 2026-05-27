import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/dbService';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import type { PluginCategory, ShopCategory } from '../types/database.types';
import { Loader2, Plus, Edit, Trash2, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore'; // For admin check

// Generic Form for Category Management
const CategoryForm = ({ category, onSubmit, onCancel, isSaving, type }: {
  category?: PluginCategory | ShopCategory;
  onSubmit: (data: Omit<PluginCategory | ShopCategory, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  isSaving: boolean;
  type: 'plugin' | 'shop';
}) => {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [iconUrl, setIconUrl] = useState(category?.icon_url || '');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ name, description, icon_url: iconUrl });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-lg space-y-6 text-neutral-900 dark:text-neutral-100"
      onSubmit={handleSubmit}
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Category Name</label>
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
        <label htmlFor="description" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Description (Optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="iconUrl" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Icon URL (Optional)</label>
        <input
          type="url"
          id="iconUrl"
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
        />
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
          {category ? 'Save Changes' : `Add ${type === 'plugin' ? 'Plugin' : 'Shop'} Category`}
        </button>
      </div>
    </motion.form>
  );
};

// Admin Category Management Page
const AdminCategoriesPage = () => {
  const { categoryType, id } = useParams<{ categoryType: 'plugin' | 'shop'; id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<PluginCategory[] | ShopCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<PluginCategory | ShopCategory | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (categoryType === 'plugin') {
        const fetched = await dbService.getPluginCategories();
        setCategories(fetched);
        if (id) setEditingCategory(fetched.find(cat => cat.id === id) as PluginCategory);
      } else if (categoryType === 'shop') {
        const fetched = await dbService.getShopCategories();
        setCategories(fetched);
        if (id) setEditingCategory(fetched.find(cat => cat.id === id) as ShopCategory);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories.');
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, [categoryType, id]);

  useEffect(() => {
    const loadData = async () => {
      if (!isAdmin) {
        navigate('/server-info'); // Redirect if not admin
        toast.error('Unauthorized access.');
        return;
      }
      await fetchCategories();
    };
    loadData();
  }, [isAdmin, fetchCategories, navigate]);

  const handleSubmit = async (formData: Omit<PluginCategory | ShopCategory, 'id' | 'created_at' | 'updated_at'>) => {
    setIsSaving(true);
    try {
      if (categoryType === 'plugin') {
        if (editingCategory) {
          await dbService.updatePluginCategory(editingCategory.id, formData as Partial<PluginCategory>);
          toast.success('Plugin category updated successfully!');
        } else {
          await dbService.createPluginCategory(formData as Omit<PluginCategory, 'id' | 'created_at' | 'updated_at'>);
          toast.success('Plugin category added successfully!');
        }
      } else if (categoryType === 'shop') {
        if (editingCategory) {
          await dbService.updateShopCategory(editingCategory.id, formData as Partial<ShopCategory>);
          toast.success('Shop category updated successfully!');
        } else {
          await dbService.createShopCategory(formData as Omit<ShopCategory, 'id' | 'created_at' | 'updated_at'>);
          toast.success('Shop category added successfully!');
        }
      }
      navigate(`/admin/categories/${categoryType}`); // Redirect to list view
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error(`Failed to save category: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
    try {
      if (categoryType === 'plugin') {
        await dbService.deletePluginCategory(categoryId);
        toast.success('Plugin category deleted successfully!');
      } else if (categoryType === 'shop') {
        await dbService.deleteShopCategory(categoryId);
        toast.success('Shop category deleted successfully!');
      }
      fetchCategories(); // Refresh list
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error(`Failed to delete category: ${err instanceof Error ? err.message : String(err)}`);
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
      <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-8">
        {editingCategory ? 'Edit ' : 'Add New '}
        {categoryType === 'plugin' ? 'Plugin' : 'Shop'} Category
      </h1>

      {/* Form for Add/Edit */}
      {(id || location.pathname.endsWith('/new')) && (
        <CategoryForm
          category={editingCategory}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/admin/categories/${categoryType}`)}
          isSaving={isSaving}
          type={categoryType as 'plugin' | 'shop'}
        />
      )}

      {/* Category List */}
      {!id && !location.pathname.endsWith('/new') && (
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
              {categoryType === 'plugin' ? 'Plugin' : 'Shop'} Categories
            </h2>
            <Link to={`/admin/categories/${categoryType}/new`} className="px-4 py-2 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl flex items-center gap-2">
              <Plus size={18} /> Add New
            </Link>
          </div>

          {categories.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-8 rounded-3xl text-center text-neutral-600 dark:text-neutral-500">
              No {categoryType} categories found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(cat => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {cat.icon_url ? (
                      <img src={cat.icon_url} alt={cat.name} className="w-12 h-12 object-contain rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                        <Tag size={24} />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{cat.name}</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm">{cat.description || 'No description.'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/admin/categories/${categoryType}/edit/${cat.id}`} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                      <Edit size={18} />
                    </Link>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
