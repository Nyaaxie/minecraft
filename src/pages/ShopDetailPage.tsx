import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { getMinecraftItemImageUrl } from '../utils/minecraftItemApi';
import type { PlayerShop, ShopItem } from '../types/database.types';
import { Loader2, Store, Tag, Edit, Banknote, Package, ArrowLeft, Trash2, User, AlertCircle, Plus } from 'lucide-react';
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2rem] p-6 shadow-xl shadow-neutral-900/5 flex flex-col group hover:border-strawberry-500/30 transition-all relative overflow-hidden h-full"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-strawberry-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between w-full mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white dark:border-neutral-900 shadow-md group-hover:scale-110 transition-transform duration-500">
            <img 
              src={itemImageUrl} 
              alt={item.item_name} 
              className="w-10 h-10 object-contain drop-shadow-lg"
              onError={(e) => { e.currentTarget.src = 'https://api.minecraftitems.xyz/api/item/stone?size=64'; }} 
            />
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none group-hover:text-strawberry-600 transition-colors">{item.item_name}</h3>
            <div className="flex items-center gap-1.5 mt-2">
              <Package size={12} className="text-neutral-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{item.quantity} available</span>
            </div>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0">
            <button 
              onClick={() => onEdit(item.id)}
              className="p-2 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-strawberry-600 transition-all shadow-sm"
              title="Edit Item"
            >
              <Edit size={14} />
            </button>
            <button 
              onClick={() => onDelete(item.id)}
              className="p-2 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-red-600 transition-all shadow-sm"
              title="Delete Item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 italic line-clamp-2 leading-relaxed flex-grow">"{item.description || 'Accessing product specifications...'}"</p>
      
      <div className="flex justify-between items-center w-full pt-6 border-t border-neutral-100 dark:border-white/5 mt-auto relative z-10">
        <div className="flex items-center gap-2 px-4 py-2 bg-strawberry-600 text-white rounded-xl shadow-lg shadow-strawberry-600/20">
          <Banknote size={14} />
          <span className="text-xs font-black italic uppercase tracking-widest">{item.price} {item.currency}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg border border-transparent group-hover:border-neutral-200 dark:group-hover:border-white/5 transition-all">
          <Tag size={10} className="text-neutral-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 truncate max-w-[80px]">{categoryName}</span>
        </div>
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
      setError('Failed to load shop details.');
      toast.error('Failed to load shop details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await dbService.deleteShopItem(itemId);
      toast.success('Item removed from inventory.');
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
      toast.success('Shop decommissioned successfully.');
      navigate('/shops');
    } catch (err) {
      console.error('Error deleting shop:', err);
      toast.error('Failed to delete shop.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <Loader2 className="animate-spin text-strawberry-600" size={64} />
        <p className="text-neutral-500 font-black uppercase tracking-widest animate-pulse">Establishing Connection...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-12 rounded-[2.5rem] text-center space-y-6">
          <AlertCircle className="mx-auto" size={48} />
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">{error || 'Sector Not Found'}</h2>
          <button onClick={() => navigate('/shops')} className="px-8 py-3 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest italic text-xs shadow-lg shadow-red-500/20 active:scale-95 transition-all">Return to Marketplace</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <Link to="/shops" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-strawberry-600 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to marketplace
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="w-32 h-32 rounded-[2.5rem] bg-white dark:bg-neutral-900 flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-white/5 shadow-2xl relative group shrink-0">
              <div className="absolute inset-0 bg-strawberry-600/5 group-hover:bg-strawberry-600/10 transition-colors" />
              <Store size={56} className="text-strawberry-600 relative z-10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tighter italic uppercase leading-none mb-4">{shop.name}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="h-8 w-8 rounded-xl overflow-hidden border-2 border-white dark:border-neutral-800 shadow-md">
                  {shop.profiles?.avatar_url ? (
                    <img src={shop.profiles.avatar_url} alt={shop.profiles.username} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400"><User size={16} /></div>
                  )}
                </div>
                <span className="text-xs font-black italic uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Merchant: <span className="text-neutral-900 dark:text-white">{shop.profiles?.username || 'Unknown'}</span></span>
                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest italic ${shop.is_active ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-red-500 text-white'}`}>
                  {shop.is_active ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          </div>

          {canManageShop && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 p-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-2xl shadow-xl shadow-neutral-900/5">
              <Link to={`/shops/edit/${shop.id}`} className="px-5 py-3 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 rounded-xl flex items-center gap-2 font-black italic uppercase tracking-widest text-[10px] transition-all">
                <Edit size={14} /> Update
              </Link>
              <button 
                onClick={handleDeleteShop}
                className="px-5 py-3 bg-neutral-100 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-600 text-neutral-600 dark:text-neutral-300 rounded-xl flex items-center gap-2 font-black italic uppercase tracking-widest text-[10px] transition-all"
              >
                <Trash2 size={14} /> Close
              </button>
              <Link to={`/shops/${shop.id}/items/new`} className="px-6 py-3 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl flex items-center gap-2 font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-strawberry-600/30 transition-all active:scale-95">
                <Plus size={16} /> Add Inventory
              </Link>
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 p-8 rounded-[2.5rem] shadow-xl shadow-neutral-900/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 bg-strawberry-600 h-full" />
          <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed italic max-w-4xl">
            "{shop.description || 'Welcome to my storefront. Browse through the available inventory below for the best deals in the sector.'}"
          </p>
        </div>
      </motion.div>

      <div className="mt-20 space-y-10">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
            <Package className="text-strawberry-600" /> 
            Live Inventory
          </h2>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-xl shadow-md">
            <span className="text-[10px] font-black uppercase tracking-widest text-strawberry-600">{shopItems.length}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Active Listings</span>
          </div>
        </div>

        {shopItems.length === 0 && !loading ? (
          <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 p-20 rounded-[3rem] text-center space-y-6 backdrop-blur-sm">
            <div className="w-24 h-24 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Package className="text-neutral-300" size={48} />
            </div>
            <div className="space-y-4">
              <p className="text-3xl font-black uppercase italic tracking-tighter">Inventory Depleted</p>
              <p className="text-neutral-500 max-w-xs mx-auto uppercase tracking-tight text-xs font-bold leading-relaxed">This merchant hasn't listed any items for trade yet.</p>
              {isOwner && (
                <Link to={`/shops/${shop.id}/items/new`} className="inline-flex items-center gap-3 px-8 py-4 bg-strawberry-600 text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-strawberry-600/30 hover:bg-strawberry-700 transition-all active:scale-95">
                  <Plus size={20} /> Populate Shop
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
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
        )}
      </div>
    </div>
  );
};

export default ShopDetailPage;
