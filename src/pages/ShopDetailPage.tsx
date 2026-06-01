import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { getMinecraftItemImageUrl } from '../utils/minecraftItemApi';
import type { PlayerShop, ShopItem } from '../types/database.types';
import { Store, ArrowLeft, Loader2, AlertCircle, Search, Trash2, Plus, Edit } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

const ProductCard: React.FC<{
  item: ShopItem;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}> = ({ item, isAdmin, onDelete }) => {
  const imageUrl = item.custom_image_url || getMinecraftItemImageUrl(item.minecraft_item_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:border-strawberry-500/30 transition-all group relative flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-12 w-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-white/5 shadow-inner">
          <img
            src={imageUrl}
            alt={item.item_name}
            className="w-8 h-8 pixelated"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://minecraft.wiki/images/Invicon_Barrier.png';
            }}
          />
        </div>
      </div>

      <div className="space-y-1 mb-4 flex-grow">
        <h4 className="font-black italic uppercase tracking-tighter text-lg text-neutral-900 dark:text-white leading-tight">
          {item.item_name}
        </h4>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-white/5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 italic">
            {item.unit_display || `${item.unit_size} Unit(s)`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-strawberry-600 italic leading-none">
            {item.price} <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 ml-1">Diamond</span>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            to={`/shops/${item.shop_id}/items/edit/${item.id}`}
            className="p-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/5 text-neutral-400 dark:text-neutral-500 hover:text-strawberry-600 dark:hover:text-strawberry-600 rounded-xl transition-all shadow-lg"
          >
            <Edit size={14} />
          </Link>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/5 text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-500 rounded-xl transition-all shadow-lg"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

const ShopDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<PlayerShop | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin } = useAuthStore();

  const fetchShopData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [shopData, itemsData] = await Promise.all([
        dbService.getPlayerShopById(id),
        dbService.getShopItemsByShop(id)
      ]);
      setShop(shopData);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to fetch shop details:', err);
      setError('Failed to load shop details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await dbService.deleteShopItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const filteredItems = items.filter(item =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-strawberry-600" size={64} />
        <p className="text-neutral-500 font-black uppercase tracking-widest animate-pulse">Browsing Catalog...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto py-40 text-center space-y-6 px-4">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Shop not found</h2>
          <p className="text-neutral-500 text-sm">This shop may have closed its doors or moved location.</p>
        </div>
        <Link to="/shops" className="inline-flex items-center gap-2 text-strawberry-600 font-bold uppercase tracking-widest text-xs italic">
          <ArrowLeft size={16} /> Back to Shops
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 space-y-8 mt-8">
      {/* Shop Header */}
      <div className="relative rounded-[3rem] overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-2xl">
        <div className="aspect-[21/9] w-full relative bg-neutral-100 dark:bg-neutral-800">
          {shop.banner_url ? (
            <img src={shop.banner_url} alt={shop.owner_name || 'Shop'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300 dark:text-neutral-700">
              <Store size={80} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-8 left-8 right-8">
            <Link to="/shops" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4 font-black uppercase tracking-widest text-[10px]">
              <ArrowLeft size={14} /> Back to Directory
            </Link>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none text-white">
                  {shop.owner_name}
                </h1>
                <div className="flex items-center gap-2 text-strawberry-400">
                  <Store size={16} />
                  <span className="text-lg font-bold italic uppercase tracking-tight">Market Stall</span>
                </div>
              </div>
              <div className="flex gap-3">
                {isAdmin && (
                  <Link
                    to={`/admin?tab=shops`}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px] transition-all"
                  >
                    Manage Shop
                  </Link>
                )}
                <div className={`px-4 py-2 rounded-2xl backdrop-blur-md border font-black italic uppercase tracking-widest text-[10px] ${shop.is_active ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                  {shop.is_active ? 'Shop is Open' : 'Shop is Closed'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {shop.description && (
          <div className="p-8 bg-neutral-50 dark:bg-white/5 italic text-neutral-600 dark:text-neutral-400 border-t border-neutral-200 dark:border-white/5">
            "{shop.description}"
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="space-y-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">
              Shop <span className="text-strawberry-600">Items</span>
            </h2>
            {isAdmin && (
              <Link
                to={`/shops/${id}/items/new`}
                className="flex items-center gap-2 px-5 py-2.5 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-strawberry-600/20 active:scale-95 transition-all"
              >
                <Plus size={14} />
                Add Item
              </Link>
            )}
          </div>
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 text-sm font-bold transition-all"
            />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 p-20 rounded-[3rem] text-center space-y-6">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-neutral-300">
              <Store size={32} />
            </div>
            <p className="text-xl font-black italic uppercase tracking-tighter text-neutral-400">No products match your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => (
                <ProductCard
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteItem}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetailPage;
