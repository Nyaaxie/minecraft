import React, { useEffect, useState, useCallback } from 'react';
import { dbService } from '../services/dbService';
import type { Plugin, PluginCategory } from '../types/database.types';
import { Search, Plus, ListFilter, Eye, EyeOff, Tag, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore'; // For admin check
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';

const PluginCard = React.memo(({ plugin, isAdmin, onDelete }: { plugin: Plugin, isAdmin: boolean, onDelete: (id: string) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-lg flex flex-col h-full group hover:border-strawberry-500/30 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {plugin.icon_url ? (
            <img src={plugin.icon_url} alt={plugin.name} className="w-16 h-16 object-contain rounded-xl" loading="lazy" />
          ) : (
            <div className="w-16 h-16 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400">
              <Tag size={32} />
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{plugin.name}</h3>
            <p className="text-sm text-neutral-500">Version: {plugin.version || 'N/A'}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link 
              to={`/admin/plugins/${plugin.id}`}
              className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
              title="Edit Plugin"
            >
              <Edit size={16} />
            </Link>
            <button 
              onClick={() => onDelete(plugin.id)}
              className="p-2 hover:bg-neutral-800 rounded-lg text-red-400 hover:text-red-500"
              title="Delete Plugin"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      <p className="text-neutral-400 text-sm mb-4 flex-grow">{plugin.description || 'No description provided.'}</p>
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <ListFilter size={14} />
          <span>{plugin.category || 'Uncategorized'}</span>
        </div>
        {plugin.is_visible ? (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
            <Eye size={12} /> Visible
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 rounded-full">
            <EyeOff size={12} /> Hidden
          </span>
        )}
      </div>
    </motion.div>
  );
});

const PluginCardSkeleton = () => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-lg flex flex-col h-full animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-16 h-16 bg-neutral-800 rounded-xl" />
      <div className="space-y-2">
        <div className="h-5 w-32 bg-neutral-800 rounded" />
        <div className="h-4 w-20 bg-neutral-800 rounded" />
      </div>
    </div>
    <div className="h-20 w-full bg-neutral-800 rounded-xl mb-4" />
    <div className="flex items-center justify-between">
      <div className="h-4 w-24 bg-neutral-800 rounded" />
      <div className="h-6 w-16 bg-neutral-800 rounded-full" />
    </div>
  </div>
);

const PluginsPage = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [categories, setCategories] = useState<PluginCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  const fetchPlugins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPlugins = await dbService.getPlugins();
      setPlugins(fetchedPlugins);
    } catch (err) {
      console.error('Error fetching plugins:', err);
      setError('Failed to load plugins. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const fetchedCategories = await dbService.getPluginCategories();
      setCategories(fetchedCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchPlugins();
      await fetchCategories();
    };
    loadData();
  }, [fetchPlugins, fetchCategories]);

  const handleDeletePlugin = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this plugin? This action cannot be undone.')) return;
    try {
      await dbService.deletePlugin(id);
      toast.success('Plugin deleted successfully!');
      fetchPlugins();
    } catch (err) {
      console.error('Error deleting plugin:', err);
      toast.error('Failed to delete plugin.');
    }
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          plugin.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          plugin.category?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
    const isVisible = isAdmin || plugin.is_visible; // Admins see all, players only visible
    return matchesSearch && matchesCategory && isVisible;
  });

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <h1 className="text-4xl font-bold text-white">Plugins Showcase</h1>
        {isAdmin && (
          <Link to="/admin/plugins/new" className="px-4 py-2 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl flex items-center gap-2">
            <Plus size={18} /> Add Plugin
          </Link>
        )}
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search plugins..."
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-2 pl-10 pr-4 text-white placeholder-neutral-500 focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="bg-neutral-800 border border-neutral-700 rounded-xl py-2 px-4 text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.name}>{category.name}</option>
          ))}
        </select>
        <button
          onClick={fetchPlugins}
          className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-400 hover:text-white hover:border-strawberry-600 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <PluginCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-xl text-center">
          <p>{error}</p>
        </div>
      )}

      {!loading && filteredPlugins.length === 0 && (
        <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-3xl text-center text-neutral-500">
          No plugins found matching your criteria.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && filteredPlugins.map(plugin => (
          <PluginCard 
            key={plugin.id} 
            plugin={plugin} 
            isAdmin={isAdmin}
            onDelete={handleDeletePlugin}
          />
        ))}
      </div>
    </div>
  );
};

export default PluginsPage;
