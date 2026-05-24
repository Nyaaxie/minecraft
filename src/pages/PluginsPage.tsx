import React, { useEffect, useState, useCallback } from 'react';
import { dbService } from '../services/dbService';
import type { Plugin, PluginCategory } from '../types/database.types';
import { Search, ListFilter, EyeOff, RefreshCw, Edit, Trash2, Puzzle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore'; // For admin check
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';

const PluginCard = React.memo(({ plugin, isAdmin, onDelete }: { plugin: Plugin, isAdmin: boolean, onDelete: (id: string) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-neutral-900/5 flex flex-col h-full group hover:border-strawberry-500/30 transition-all relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-strawberry-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-[1.25rem] flex items-center justify-center overflow-hidden border-2 border-white dark:border-neutral-900 shadow-lg group-hover:scale-110 transition-transform duration-500">
            {plugin.icon_url ? (
              <img src={plugin.icon_url} alt={plugin.name} className="w-full h-full object-contain p-2" loading="lazy" />
            ) : (
              <Puzzle size={32} className="text-strawberry-600" />
            )}
          </div>
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white group-hover:text-strawberry-600 transition-colors leading-none">{plugin.name}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-2 italic">v{plugin.version || 'ALPHA'}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0">
            <Link
              to={`/admin/plugins/${plugin.id}`}
              className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-strawberry-600 transition-all shadow-sm"
              title="Edit Plugin"
            >
              <Edit size={16} />
            </Link>
            <button
              onClick={() => onDelete(plugin.id)}
              className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-red-600 transition-all shadow-sm"
              title="Delete Plugin"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 italic line-clamp-3 leading-relaxed flex-grow relative z-10">"{plugin.description || 'Accessing plugin documentation...'}"</p>

      <div className="flex items-center justify-between pt-6 border-t border-neutral-100 dark:border-white/5 mt-auto relative z-10">
        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-white/5 rounded-xl border border-transparent group-hover:border-neutral-200 dark:group-hover:border-white/5 transition-all">
          <ListFilter size={14} className="text-strawberry-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{plugin.category || 'Core'}</span>
        </div>
        {!plugin.is_visible && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black uppercase italic tracking-widest">
            <EyeOff size={12} /> Restricted
          </span>
        )}
      </div>
    </motion.div>
  );
});

const PluginCardSkeleton = () => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-lg flex flex-col h-full animate-pulse">
    <div className="flex items-center gap-5 mb-6">
      <div className="w-16 h-16 rounded-[1.25rem] bg-neutral-100 dark:bg-neutral-800" />
      <div className="space-y-2">
        <div className="h-6 w-32 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
        <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
      </div>
    </div>
    <div className="h-20 w-full bg-neutral-100 dark:bg-neutral-800 rounded-[1.5rem] mb-8" />
    <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-white/5 flex justify-between">
      <div className="h-6 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
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
      setError('Failed to load system modules.');
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
    fetchPlugins();
    fetchCategories();
  }, [fetchPlugins, fetchCategories]);

  const handleDeletePlugin = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) return;
    try {
      await dbService.deletePlugin(id);
      toast.success('Module purged successfully.');
      fetchPlugins();
    } catch (err) {
      console.error('Error deleting plugin:', err);
      toast.error('Failed to purge module.');
    }
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      plugin.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      plugin.category?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
    const isVisible = isAdmin || plugin.is_visible;
    return matchesSearch && matchesCategory && isVisible;
  });

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">
            System<span className="text-strawberry-600">Modules</span>
          </h1>
          <p className="text-neutral-500 max-w-xl font-medium uppercase tracking-tight text-sm italic leading-relaxed">Advanced core extensions and features enhancing the StrawberrySMP experience.</p>
        </div>
        {isAdmin && (
          <Link to="/admin/plugins/new" className="px-8 py-4 bg-strawberry-600 text-white rounded-[1.5rem] font-black italic uppercase tracking-widest text-xs shadow-xl shadow-strawberry-600/30 hover:bg-strawberry-700 transition-all active:scale-95 text-center">
            Register Module
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-6 lg:p-8 shadow-xl shadow-neutral-900/5 backdrop-blur-sm flex flex-col lg:flex-row gap-6">
        <div className="relative flex-grow group">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-strawberry-500 transition-colors" />
          <input
            type="text"
            placeholder="Identify module by name or identifier..."
            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border border-transparent focus:border-strawberry-500/20 rounded-2xl py-4 pl-12 pr-6 text-neutral-900 dark:text-white outline-none transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            className="bg-neutral-100 dark:bg-neutral-800/50 border border-transparent hover:border-strawberry-500/20 rounded-2xl py-4 px-6 text-neutral-900 dark:text-white outline-none transition-all text-xs font-black uppercase italic tracking-widest min-w-[200px]"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Sectors</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
          <button
            onClick={fetchPlugins}
            className="px-6 py-4 bg-neutral-100 dark:bg-white/5 border border-transparent hover:border-strawberry-500/30 rounded-2xl text-neutral-500 dark:text-neutral-400 hover:text-strawberry-600 transition-all flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest italic"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>Re-Sync</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <PluginCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-16 rounded-[3rem] text-center max-w-2xl mx-auto space-y-6">
          <AlertCircle className="mx-auto" size={48} />
          <p className="text-2xl font-black italic uppercase tracking-tighter">{error}</p>
          <button onClick={fetchPlugins} className="px-8 py-3 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest italic text-xs shadow-lg shadow-red-500/20 transition-all active:scale-95">Re-establish Link</button>
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 p-20 rounded-[3rem] text-center space-y-6 backdrop-blur-sm">
          <div className="w-24 h-24 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <Puzzle className="text-neutral-300" size={48} />
          </div>
          <div className="space-y-4">
            <p className="text-3xl font-black uppercase italic tracking-tighter">No modules located</p>
            <p className="text-neutral-500 max-w-xs mx-auto uppercase tracking-tight text-xs font-bold leading-relaxed">Adjust your scanning parameters to find specific system components.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPlugins.map(plugin => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              isAdmin={isAdmin}
              onDelete={handleDeletePlugin}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PluginsPage;
