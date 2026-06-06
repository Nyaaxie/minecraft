import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { dbService } from '../../../services/dbService';
import type { PlayerShop } from '../../../types/database.types';
import { Search, Store, Edit, AlertCircle, Loader2, SortAsc } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { AnimatePresence } from 'framer-motion';
import { ShopCard } from '../components/ShopCard';

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

  const filteredShops = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return shops
      .filter(shop => {
        const matchesOwner = shop.owner_name?.toLowerCase().includes(lowerSearch);
        const matchesItem = (shop as any).shop_items?.some((item: any) =>
          item.item_name?.toLowerCase().includes(lowerSearch)
        );
        return matchesOwner || matchesItem;
      })
      .sort((a, b) => (a.owner_name || '').localeCompare(b.owner_name || ''));
  }, [shops, searchTerm]);

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
              Wander through our cozy market.
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

      {/* Search & Sort */}
      <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-neutral-900/5 backdrop-blur-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by owner or item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 transition-all font-bold"
          />
        </div>
        <div className="flex items-center gap-2 px-6 py-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl text-neutral-400">
          <SortAsc size={14} />
          <span className="font-black italic uppercase tracking-widest text-[10px]">A-Z</span>
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
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ShopsPage;
