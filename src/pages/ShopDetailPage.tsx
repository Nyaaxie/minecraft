import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { getMinecraftItemImageUrl } from '../utils/minecraftItemApi';
import type { PlayerShop, ShopItem } from '../types/database.types';
import { Loader2, Store, Tag, Plus, Edit, Banknote, Package, ArrowLeft, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

const ShopItemCard = ({ item, canManage, onEdit, onDelete }: { 
  item: ShopItem, 
  canManage: boolean,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void 
}) => {
  const itemImageUrl = getMinecraftItemImageUrl(item.minecraft_item_id, { size: 64 });
  const categoryName = (item.shop_categories as { name: string } | null)?.name || 'Uncategorized';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-lg flex flex-col items-start h-full group hover:border-strawberry-500/30 transition-colors"
    >
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-neutral-800 rounded-xl flex items-center justify-center overflow-hidden border border-neutral-700">
            <img 
              src={itemImageUrl} 
              alt={item.item_name} 
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.src = 'https://api.minecraftitems.xyz/api/item/stone?size=64'; }} // Fallback image
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{item.item_name}</h3>
            <p className="text-sm text-neutral-500 flex items-center gap-1">
              <Package size={14} /> Quantity: {item.quantity}
            </p>
          </div>
        </div>
        {canManage && (
          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onEdit(item.id)}
              className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
              title="Edit Item"
            >
              <Edit size={16} />
            </button>
            <button 
              onClick={() => onDelete(item.id)}
              className="p-2 hover:bg-neutral-800 rounded-lg text-red-400 hover:text-red-500"
              title="Delete Item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
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
  const { user, profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';
  const isOwner = user?.id === shop?.owner_id;
  const canManageShop = isOwner || isAdmin;

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

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await dbService.deleteShopItem(itemId);
      toast.success('Item deleted successfully!');
      fetchShopData();
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete item.');
    }
  };

  const handleDeleteShop = async () => {
    if (!shop) return;
    if (!window.confirm('Are you sure you want to delete this shop? This will also delete all items in the shop. This action cannot be undone.')) return;
    try {
      await dbService.deletePlayerShop(shop.id);
      toast.success('Shop deleted successfully!');
      navigate('/shops');
    } catch (err) {
      console.error('Error deleting shop:', err);
      toast.error('Failed to delete shop.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-12 h-12 text-strawberry-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-8 rounded-3xl text-center">
          <p className="text-xl font-bold mb-4">{error}</p>
          <button onClick={() => navigate('/shops')} className="px-6 py-2 bg-strawberry-600 text-white rounded-xl hover:bg-strawberry-700 transition-colors">
            Back to Shops
          </button>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="bg-neutral-900/50 border border-neutral-800 p-12 rounded-[3rem] text-center text-neutral-500">
          <Store size={64} className="mx-auto mb-6 text-neutral-800" />
          <p className="text-xl font-medium mb-8">Shop details could not be loaded.</p>
          <button onClick={() => navigate('/shops')} className="px-6 py-2 bg-strawberry-600 text-white rounded-xl hover:bg-strawberry-700 transition-colors">
            Back to Shops
          </button>
        </div>
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
        <Link to="/shops" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to all shops
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[2rem] bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-700 shadow-2xl">
              <Store size={48} className="text-strawberry-500" />
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tighter italic uppercase">{shop.name}</h1>
              <div className="flex items-center gap-3 text-lg text-neutral-400 font-medium">
                <img src={shop.profiles?.avatar_url || '/default-avatar.png'} alt={shop.profiles?.username || 'Unknown Player'} className="w-8 h-8 rounded-full border-2 border-neutral-800" />
                <span>{shop.profiles?.username || 'Unknown Player'}'s Shop</span>
              </div>
            </div>
          </div>
          {canManageShop && (
            <div className="flex gap-3 flex-wrap">
              <Link to={`/shops/edit/${shop.id}`} className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl flex items-center gap-2 font-bold transition-all border border-neutral-700 hover:border-neutral-600 shadow-lg">
                <Edit size={18} /> Edit Shop
              </Link>
              <button 
                onClick={handleDeleteShop}
                className="px-5 py-2.5 bg-red-900/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl flex items-center gap-2 font-bold transition-all border border-red-500/20 shadow-lg"
              >
                <Trash2 size={18} /> Delete Shop
              </button>
              <Link to={`/shops/${shop.id}/items/new`} className="px-6 py-2.5 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl flex items-center gap-2 font-bold transition-all shadow-xl shadow-strawberry-600/20 active:scale-95">
                <Plus size={20} /> Add Item
              </Link>
            </div>
          )}
        </div>
        <p className="text-neutral-400 text-lg mt-8 leading-relaxed max-w-3xl">
          {shop.description || 'Welcome to my shop! Browse through my items below.'}
        </p>
      </motion.div>

      <div className="h-px bg-gradient-to-r from-neutral-800 via-transparent to-transparent my-12" />

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
          <Package className="text-strawberry-500" /> Shop Items
        </h2>
        <span className="px-4 py-1.5 bg-neutral-800 rounded-full text-xs font-bold text-neutral-500 uppercase tracking-widest border border-neutral-700">
          {shopItems.length} Products
        </span>
      </div>

      {shopItems.length === 0 && !loading && (
        <div className="bg-neutral-900/50 border border-neutral-800 p-16 rounded-[3rem] text-center text-neutral-500">
          <Package size={48} className="mx-auto mb-6 text-neutral-800" />
          <p className="text-lg font-medium mb-8">No items listed in this shop yet.</p>
          {isOwner && (
            <Link to={`/shops/${shop.id}/items/new`} className="inline-flex items-center gap-2 px-8 py-3 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-strawberry-600/20 active:scale-95">
              <Plus size={20} /> Add Your First Item
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {shopItems.map(item => (
          <ShopItemCard 
            key={item.id} 
            item={item} 
            canManage={canManageShop}
            onEdit={(id) => navigate(`/shops/${shop.id}/items/edit/${id}`)}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>
    </div>
  );
};

export default ShopDetailPage;
