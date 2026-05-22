import { useEffect, useState, useCallback } from 'react';
import { dbService } from '../services/dbService';
import type { PlayerShop } from '../types/database.types';
import { Search, Store, RefreshCw, Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ShopCard = ({ shop }: { shop: PlayerShop & { profiles: { username: string; avatar_url: string } | null } }) => {
  const ownerUsername = shop.profiles?.username || 'Unknown Player';
  const ownerAvatar = shop.profiles?.avatar_url || '/default-avatar.png'; // Placeholder for default avatar

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-lg flex flex-col h-full hover:border-strawberry-500/50 transition-colors"
    >
      <Link to={`/shops/${shop.id}`} className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-700">
            {/* Placeholder for shop icon, or a default store icon */}
            <Store size={32} className="text-neutral-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{shop.name}</h3>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <img src={ownerAvatar} alt={ownerUsername} className="w-5 h-5 rounded-full object-cover" />
              <span>{ownerUsername}'s Shop</span>
            </div>
          </div>
        </div>
        <p className="text-neutral-400 text-sm mb-4 flex-grow">{shop.description || 'No description provided.'}</p>
        <div className="flex justify-between items-center text-xs text-neutral-500">
          <span className={`px-2 py-1 rounded-full ${shop.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {shop.is_active ? 'Active' : 'Inactive'}
          </span>
          <span className="text-neutral-600">Opened: {new Date(shop.created_at).toLocaleDateString()}</span>
        </div>
      </Link>
    </motion.div>
  );
};

const ShopsPage = () => {
  const [shops, setShops] = useState<(PlayerShop & { profiles: { username: string; avatar_url: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    const loadData = async () => {
      await fetchShops();
    };
    loadData();
  }, [fetchShops]);

  const filteredShops = shops.filter(shop => {
    const ownerUsername = shop.profiles?.username || '';
    return shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           shop.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ownerUsername.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <h1 className="text-4xl font-bold text-white">Player Shops</h1>
        <Link to="/shops/new" className="px-4 py-2 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl flex items-center gap-2">
          <Plus size={18} /> Open New Shop
        </Link>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search shops or owners..."
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-2 pl-10 pr-4 text-white placeholder-neutral-500 focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={fetchShops}
          className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-400 hover:text-white hover:border-strawberry-600 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-lg flex flex-col items-center justify-center h-56"
            >
              <Loader2 className="w-10 h-10 text-strawberry-600 animate-spin" />
              <p className="text-neutral-500 mt-2">Loading shops...</p>
            </motion.div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-xl text-center">
          <p>{error}</p>
        </div>
      )}

      {!loading && filteredShops.length === 0 && (
        <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-3xl text-center text-neutral-500">
          No player shops found. Be the first to open one!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && filteredShops.map(shop => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>
    </div>
  );
};

export default ShopsPage;
