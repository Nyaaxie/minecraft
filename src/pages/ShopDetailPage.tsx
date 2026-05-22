import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { getMinecraftItemImageUrl } from '../utils/minecraftItemApi';
import type { PlayerShop, ShopItem } from '../types/database.types';
import { Loader2, Store, Tag, Plus, Edit, Banknote, Package, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

const ShopItemCard = ({ item }: { item: ShopItem }) => {
  const itemImageUrl = getMinecraftItemImageUrl(item.minecraft_item_id, { size: 64 });
  const categoryName = (item.shop_categories as { name: string } | null)?.name || 'Uncategorized';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-lg flex flex-col items-start h-full hover:border-strawberry-500/50 transition-colors"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-neutral-800 rounded-xl flex items-center justify-center overflow-hidden border border-neutral-700">
          <img 
            src={itemImageUrl} 
            alt={item.item_name} 
            className="w-full h-full object-contain"
            onError={(e) => { e.currentTarget.src = 'https://minecraftitems.xyz/api/item/stone?size=64'; }} // Fallback image
          />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{item.item_name}</h3>
          <p className="text-sm text-neutral-500 flex items-center gap-1">
            <Package size={14} /> Quantity: {item.quantity}
          </p>
        </div>
      </div>
      <p className="text-neutral-400 text-sm mb-4 flex-grow">{item.description || 'No description provided.'}</p>
      <div className="flex justify-between items-center w-full text-xs text-neutral-500 mt-auto">
        <span className="flex items-center gap-1 px-2 py-1 bg-strawberry-600/10 text-strawberry-500 rounded-full">
          <Banknote size={12} /> {item.price} {item.currency}
        </span>
        <span className="px-2 py-1 bg-neutral-800 rounded-full">
          <Tag size={12} className="inline-block mr-1" /> {categoryName}
        </span>
      </div>
    </motion.div>
  );
};

const ShopDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<(PlayerShop & { profiles: { username: string; avatar_url: string } | null }) | null>(null);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const isOwner = user?.id === shop?.owner_id;

  const fetchShopData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const fetchedShop = await dbService.getPlayerShopById(id);
      if (fetchedShop) {
        setShop(fetchedShop);
        const fetchedItems = await dbService.getShopItemsByShop(fetchedShop.id);
        setShopItems(fetchedItems);
      } else {
        setError('Shop not found.');
      }
    } catch (err) {
      console.error('Error fetching shop data:', err);
      setError('Failed to load shop details. Please try again later.');
      toast.error('Failed to load shop details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const loadData = async () => {
      await fetchShopData();
    };
    loadData();
  }, [fetchShopData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen-minus-navbar">
        <Loader2 className="w-12 h-12 text-strawberry-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-12 bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-xl text-center">
        <p>{error}</p>
        <button onClick={() => navigate('/shops')} className="mt-4 px-4 py-2 bg-strawberry-600 text-white rounded-xl">
          Back to Shops
        </button>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container mx-auto px-6 py-12 bg-neutral-900/50 border border-neutral-800 p-8 rounded-3xl text-center text-neutral-500">
        <p>Shop details could not be loaded.</p>
        <button onClick={() => navigate('/shops')} className="mt-4 px-4 py-2 bg-strawberry-600 text-white rounded-xl">
          Back to Shops
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link to="/shops" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6">
          <ArrowLeft size={18} /> Back to all shops
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-700">
              <Store size={40} className="text-neutral-500" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white mb-1">{shop.name}</h1>
              <div className="flex items-center gap-2 text-lg text-neutral-400">
                <img src={shop.profiles?.avatar_url || '/default-avatar.png'} alt={shop.profiles?.username || 'Unknown Player'} className="w-7 h-7 rounded-full object-cover" />
                <span>{shop.profiles?.username || 'Unknown Player'}'s Shop</span>
              </div>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-4">
              <Link to={`/shops/edit/${shop.id}`} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl flex items-center gap-2">
                <Edit size={18} /> Edit Shop
              </Link>
              <Link to={`/shops/${shop.id}/items/new`} className="px-4 py-2 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl flex items-center gap-2">
                <Plus size={18} /> Add Item
              </Link>
            </div>
          )}
        </div>
        <p className="text-neutral-400 text-md mt-4 ml-24">{shop.description || 'No description provided for this shop.'}</p>
      </motion.div>

      <h2 className="text-3xl font-bold text-white mb-6 mt-12">Shop Items</h2>

      {shopItems.length === 0 && !loading && (
        <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-3xl text-center text-neutral-500">
          <Package size={40} className="mx-auto mb-4 text-neutral-700" />
          <p>No items listed in this shop yet.</p>
          {isOwner && (
            <Link to={`/shops/${shop.id}/items/new`} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-strawberry-600 text-white rounded-xl">
              <Plus size={18} /> Add Your First Item
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {shopItems.map(item => (
          <ShopItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default ShopDetailPage;
