import React, { useEffect, useState, useCallback } from 'react';
import { dbService } from '../services/dbService';
import type { PlayerShop } from '../types/database.types';
import { Search, Store, RefreshCw, Edit, User, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

const ShopCard: React.FC<{
  shop: PlayerShop;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}> = ({ shop, isAdmin, onDelete }) => {
  return (
    <Link to={`/shops/${shop.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -5 }}
        className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-3xl p-6 transition-all hover:border-strawberry-500/30 shadow-sm dark:shadow-none"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="h-16 w-16 rounded-2xl bg-strawberry-600/10 flex items-center justify-center text-strawberry-600 group-hover:bg-strawberry-600 group-hover:text-white transition-all">
            <Store size={32} />
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(shop.id);
                }}
                className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold mb-2 group-hover:text-strawberry-600 transition-colors uppercase tracking-tight italic">
          {shop.owner_name}
        </h3>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-6 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            <User size={14} className="m-auto text-neutral-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 italic">
            Market Stall
          </span>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 italic mb-4">
          "{shop.description || 'No description provided.'}"
        </p>

        <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-neutral-400 pt-4 border-t border-neutral-100 dark:border-white/5">
          <span>Catalog</span>
          <Edit size={14} />
        </div>
      </motion.div>
    </Link>
  );
};

const ShopsPage: React.FC = () => {
  const [shops, setShops] = useState<PlayerShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuthStore();

  const fetchShops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dbService.getPlayerShops();
      setShops(data);
    } catch (err) {
      console.error('Failed to fetch shops:', err);
      setError('Failed to load shops. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleDeleteShop = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shop?')) return;
    try {
      await dbService.deletePlayerShop(id);
      setShops(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete shop:', err);
      alert('Failed to delete shop');
    }
  };

  const filteredShops = shops.filter(shop =>
    shop.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 space-y-12 text-neutral-900 dark:text-neutral-100 mt-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20 text-strawberry-600 shadow-xl shadow-strawberry-600/10">
            <Store size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
              Community<span className="text-strawberry-600">Shops</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
              Browse the official directory of community-run markets.
            </p>
          </div>
        </div>

        {isAdmin && (
          <Link
            to="/admin?tab=shops"
            className="flex items-center gap-3 px-8 py-4 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-[1.5rem] font-black italic uppercase tracking-widest text-xs shadow-xl shadow-strawberry-600/20 active:scale-95 transition-all"
          >
            <Edit size={16} />
            Manage Shops
          </Link>
        )}
      </div>

      {/* Search Controls */}
      <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-neutral-900/5 backdrop-blur-sm">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by owner name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 transition-all font-bold"
          />
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-strawberry-600" size={64} />
          <p className="text-neutral-500 font-black uppercase tracking-widest animate-pulse">Visiting Markets...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-8 rounded-3xl text-center max-w-md mx-auto">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p className="font-bold text-lg">{error}</p>
        </div>
      )}

      {!loading && !error && filteredShops.length === 0 && (
        <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 p-20 rounded-[3rem] text-center space-y-6 backdrop-blur-sm">
          <div className="w-24 h-24 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <Store className="text-neutral-400" size={48} />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black uppercase italic tracking-tighter">No shops found</p>
            <p className="text-neutral-500">The market seems quiet today.</p>
          </div>
        </div>
      )}

      {!loading && !error && filteredShops.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredShops.map(shop => (
              <ShopCard
                key={shop.id}
                shop={shop}
                isAdmin={isAdmin}
                onDelete={handleDeleteShop}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ShopsPage;
