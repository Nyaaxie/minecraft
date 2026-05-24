import React, { useEffect, useState, useCallback } from 'react';
import { dbService } from '../services/dbService';
import type { PlayerShop } from '../types/database.types';
import { Search, Store, RefreshCw, Edit, Trash2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';

const ShopCard = React.memo(({ shop, currentUserId, isAdmin, onDelete }: { 
  shop: PlayerShop & { profiles: { username: string; avatar_url: string } | null },
  currentUserId?: string,
  isAdmin: boolean,
  onDelete: (id: string) => void
}) => {
  const ownerUsername = shop.profiles?.username || 'Unknown Player';
  const ownerAvatar = shop.profiles?.avatar_url || '';
  const isOwner = currentUserId === shop.owner_id;
  const canManage = isOwner || isAdmin;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-neutral-900/5 flex flex-col h-full hover:border-strawberry-500/30 transition-all group overflow-hidden relative"
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-strawberry-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <Link to={`/shops/${shop.id}`} className="group/title">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-[1.5rem] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-neutral-900 shadow-lg group-hover:scale-110 transition-transform duration-500">
                <Store size={32} className="text-strawberry-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white group-hover/title:text-strawberry-600 transition-colors">{shop.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-5 w-5 rounded-full overflow-hidden border border-white dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                    {ownerAvatar ? (
                      <img src={ownerAvatar} alt={ownerUsername} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <User size={12} className="m-auto text-neutral-400" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{ownerUsername}</span>
                </div>
              </div>
            </div>
          </Link>

          {canManage && (
            <div className="flex gap-2">
              <Link 
                to={`/shops/edit/${shop.id}`}
                className="p-2.5 bg-neutral-100 dark:bg-white/5 hover:bg-strawberry-500/10 hover:text-strawberry-600 rounded-xl transition-all"
                title="Edit Shop"
              >
                <Edit size={16} />
              </Link>
              <button 
                onClick={() => onDelete(shop.id)}
                className="p-2.5 bg-neutral-100 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-600 rounded-xl transition-all"
                title="Delete Shop"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <Link to={`/shops/${shop.id}`} className="flex-grow flex flex-col">
          <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-8 italic line-clamp-3">
            "{shop.description || 'No description provided.'}"
          </p>
          
          <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-white/5 flex justify-between items-center">
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest italic ${shop.is_active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
              {shop.is_active ? 'Open' : 'Closed'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Est. {new Date(shop.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
});

const ShopCardSkeleton = () => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-lg flex flex-col h-full animate-pulse">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-16 h-16 rounded-[1.5rem] bg-neutral-100 dark:bg-neutral-800" />
      <div className="space-y-2">
        <div className="h-6 w-32 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
        <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
      </div>
    </div>
    <div className="space-y-2 mb-8">
      <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
      <div className="h-4 w-2/3 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
    </div>
    <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-white/5 flex justify-between">
      <div className="h-6 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
      <div className="h-4 w-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
    </div>
  </div>
);

const ShopsPage = () => {
  const [shops, setShops] = useState<(PlayerShop & { profiles: { username: string; avatar_url: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { user, profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedShops = await dbService.getPlayerShops();
      setShops(fetchedShops);
    } catch (err) {
      console.error('Error fetching shops:', err);
      setError('Failed to load shops. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleDeleteShop = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shop? All items will be removed permanently.')) return;
    try {
      await dbService.deletePlayerShop(id);
      toast.success('Shop closed successfully.');
      fetchShops();
    } catch (err) {
      console.error('Error deleting shop:', err);
      toast.error('Failed to delete shop.');
    }
  };

  const filteredShops = shops.filter(shop => {
    const ownerUsername = shop.profiles?.username || '';
    return shop.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           shop.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           ownerUsername.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">
            Market<span className="text-strawberry-600">place</span>
          </h1>
          <p className="text-neutral-500 max-w-md font-medium uppercase tracking-tight text-sm">Discover unique player-owned shops and find the best deals in the SMP.</p>
        </div>
        <Link 
          to="/shops/new" 
          className="px-8 py-4 bg-strawberry-600 text-white rounded-[1.5rem] font-black italic uppercase tracking-widest text-sm shadow-xl shadow-strawberry-600/30 hover:bg-strawberry-700 transition-all active:scale-95 text-center"
        >
          Open Your Shop
        </Link>
      </div>

      <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-6 lg:p-8 shadow-xl shadow-neutral-900/5 backdrop-blur-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow group">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-strawberry-500 transition-colors" />
          <input
            type="text"
            placeholder="Search shops, owners, or descriptions..."
            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border border-transparent focus:border-strawberry-500/20 rounded-2xl py-4 pl-12 pr-6 text-neutral-900 dark:text-white outline-none transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={fetchShops}
          className="px-6 py-4 bg-neutral-100 dark:bg-white/5 border border-transparent hover:border-strawberry-500/30 rounded-2xl text-neutral-600 dark:text-neutral-400 hover:text-strawberry-600 transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span>Sync Marketplace</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-12 rounded-[2.5rem] text-center max-w-2xl mx-auto space-y-4">
          <RefreshCw className="mx-auto" size={48} />
          <p className="text-xl font-black italic uppercase tracking-tighter">{error}</p>
          <button onClick={fetchShops} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest">Retry Connection</button>
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 p-20 rounded-[3rem] text-center space-y-6 backdrop-blur-sm">
          <div className="w-24 h-24 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <Store className="text-neutral-300" size={48} />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black uppercase italic tracking-tighter">No shops found</p>
            <p className="text-neutral-500 max-w-xs mx-auto uppercase tracking-tight text-xs font-bold leading-relaxed">Adjust your search or be the first to establish a storefront!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredShops.map(shop => (
            <ShopCard 
              key={shop.id} 
              shop={shop} 
              currentUserId={user?.id}
              isAdmin={isAdmin}
              onDelete={handleDeleteShop}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopsPage;
