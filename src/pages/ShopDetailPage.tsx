import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { getMinecraftItemImageUrl } from '../utils/minecraftItemApi';
import type { PlayerShop, ShopItem } from '../types/database.types';
import { Loader2, Store, Tag, Edit, Banknote, Package, ArrowLeft, Trash2, User, AlertCircle, Plus, Minus, X, ShoppingCart, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { orderService } from '../services/orderService';

const PurchaseModal = ({
  item,
  isOpen,
  onClose,
  onConfirm,
  isProcessing
}: {
  item: ShopItem | null,
  isOpen: boolean,
  onClose: () => void,
  onConfirm: (quantity: number) => void,
  isProcessing: boolean
}) => {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen]);

  if (!item) return null;

  const totalPrice = item.price * quantity;
  const itemImageUrl = getMinecraftItemImageUrl(item.minecraft_item_id, { size: 64 });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl border border-neutral-200 dark:border-white/5 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-strawberry-600" />

            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Confirm Purchase</h3>
                <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-6 p-5 bg-neutral-50 dark:bg-white/5 rounded-3xl border border-neutral-100 dark:border-white/5">
                <div className="w-20 h-20 bg-white dark:bg-neutral-800 rounded-2xl flex items-center justify-center border border-neutral-200 dark:border-white/5 shadow-sm shrink-0">
                  <img src={itemImageUrl} alt={item.item_name} className="w-12 h-12 object-contain drop-shadow-lg" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-lg font-black italic uppercase tracking-tight truncate">{item.item_name}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">{item.price} {item.currency} per unit</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Quantity to Purchase</label>
                  <span className="text-[10px] font-black uppercase tracking-widest text-strawberry-600 px-1">{item.quantity} in stock</span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center font-black hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all active:scale-95 border border-neutral-200 dark:border-white/10"
                  >
                    <Minus size={24} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(item.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="flex-1 h-16 bg-white dark:bg-neutral-950 rounded-2xl text-center font-black outline-none border border-neutral-200 dark:border-white/10 focus:border-strawberry-500/50 transition-all text-xl"
                  />
                  <button
                    onClick={() => setQuantity(q => Math.min(item.quantity, q + 1))}
                    className="w-16 h-16 bg-strawberry-600 text-white rounded-2xl flex items-center justify-center font-black hover:bg-strawberry-700 transition-all active:scale-95 shadow-lg shadow-strawberry-600/20"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-white/5 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">Total Items</span>
                    <span className="text-sm font-bold">{quantity * item.unit_size} items ({quantity} units x {item.unit_size})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">Total Price</span>
                    <div className="flex items-center justify-end gap-2">
                      <Banknote size={16} className="text-strawberry-600" />
                      <span className="text-2xl font-black italic uppercase tracking-tighter">{totalPrice} {item.currency}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onConfirm(quantity)}
                  disabled={isProcessing}
                  className="w-full py-5 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-strawberry-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ShopItemCard = ({ item, canManage, isOwner, onEdit, onDelete, onPurchase, addToCart, isBuying }: {
  item: ShopItem,
  canManage: boolean,
  isOwner: boolean,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onPurchase: (item: ShopItem) => void,
  addToCart: (item: ShopItem) => void,
  isBuying: boolean
}) => {
  const itemImageUrl = getMinecraftItemImageUrl(item.minecraft_item_id, { size: 64 });
  const categoryName = (item.shop_categories as { name: string } | null)?.name || 'Uncategorized';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl shadow-neutral-900/5 flex flex-col group hover:border-strawberry-500/30 hover:shadow-strawberry-500/10 transition-all duration-300 relative h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-strawberry-500/0 via-transparent to-strawberry-500/0 group-hover:from-strawberry-500/5 transition-all duration-500 pointer-events-none rounded-3xl" />

      <div className="relative p-5 pb-4">
        {canManage && (
          <div className="absolute top-4 right-4 flex gap-1.5 z-10">
            <button
              onClick={() => onEdit(item.id)}
              className="p-2 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-400 hover:text-strawberry-600 hover:bg-strawberry-50 dark:hover:bg-strawberry-500/10 transition-all"
              title="Edit Item"
            >
              <Edit size={13} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              title="Delete Item"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="w-[4.5rem] h-[4.5rem] bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-white/5 shadow-inner group-hover:scale-105 transition-transform duration-500 shrink-0">
            <img
              src={itemImageUrl}
              alt={item.item_name}
              className="w-11 h-11 object-contain drop-shadow-lg"
              onError={(e) => { e.currentTarget.src = 'https://api.minecraftitems.xyz/api/item/stone?size=64'; }}
            />
          </div>

          <div className={`flex-1 min-w-0 ${canManage ? 'pr-20' : ''}`}>
            <h3 className="text-sm font-black italic uppercase tracking-tight leading-tight group-hover:text-strawberry-600 transition-colors truncate">
              {item.item_name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Package size={11} className="text-neutral-400 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                {item.quantity} Quantity
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-neutral-100 dark:bg-white/5 mx-5" />

      <div className="px-5 py-4 flex-grow">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic leading-relaxed line-clamp-2">
          "{item.description || 'No description provided.'}"
        </p>
      </div>

      <div className="px-5 pb-5 flex flex-col gap-3 mt-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-strawberry-600 text-white rounded-xl shadow-lg shadow-strawberry-600/25 shrink-0">
            <Banknote size={13} />
            <span className="text-[11px] font-black italic uppercase tracking-widest">
              {item.price} {item.currency}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-white/5 rounded-xl border border-neutral-200/50 dark:border-white/5 min-w-0">
            <Tag size={10} className="text-neutral-400 shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 truncate">
              {categoryName}
            </span>
          </div>
        </div>

        {!isOwner && (
          <button
            onClick={() => addToCart(item)}
            disabled={item.quantity <= 0}
            className="w-full py-2.5 bg-strawberry-600 text-white rounded-xl font-black italic uppercase tracking-widest text-[10px] hover:bg-strawberry-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            <ShoppingCart size={13} /> {item.quantity <= 0 ? 'Out of Stock' : 'Order'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const CartSidebar = () => {
  const { items, removeFromCart, increaseQuantity, decreaseQuantity, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    if (!user || items.length === 0) return;
    setIsProcessing(true);
    try {
      // Assuming all items are from the same shop for this implementation
      const shopId = items[0].shop_id;
      const orderItems = items.map(item => ({ itemId: item.id, quantity: item.cartQuantity }));
      await orderService.createOrder(user.id, shopId, orderItems);
      toast.success('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error(err);
      toast.error('Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      className="fixed right-6 bottom-6 w-96 bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-white/10 p-6 z-50 max-h-[80vh] flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black italic uppercase tracking-tighter text-xl">Your Order</h3>
        <button onClick={clearCart} className="text-xs text-red-500 font-bold uppercase tracking-widest">Clear</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl">
            <div className="flex flex-col gap-1 items-center">
               <button onClick={() => increaseQuantity(item.id)} className="text-strawberry-600"><Plus size={12}/></button>
               <span className="text-xs font-bold">{item.cartQuantity}</span>
               <button onClick={() => decreaseQuantity(item.id)} className="text-strawberry-600"><Minus size={12}/></button>
            </div>
            <span className="flex-1 text-sm truncate">{item.item_name}</span>
            <span className="text-xs font-black italic">{item.price * item.cartQuantity} {item.currency}</span>
            <button onClick={() => removeFromCart(item.id)} className="text-neutral-400 hover:text-red-500"><X size={14}/></button>
          </div>
        ))}
      </div>
      <button 
        onClick={handlePlaceOrder}
        disabled={isProcessing}
        className="w-full py-4 bg-strawberry-600 text-white rounded-xl font-black italic uppercase tracking-widest text-sm shadow-lg shadow-strawberry-600/30"
      >
        {isProcessing ? 'Processing...' : 'Order'}
      </button>
    </motion.div>
  );
};

// ... (rest of the ShopDetailPage component stays mostly same, just add CartSidebar)

const ShopDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<(PlayerShop & { profiles: { username: string; avatar_url: string } | null }) | null>(null);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<ShopItem | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
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

  const initiatePurchase = (item: ShopItem) => {
    if (!user) {
      toast.error('You must be logged in to make a purchase.');
      return;
    }
    setSelectedItemForPurchase(item);
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseConfirm = async (quantity: number) => {
    if (!selectedItemForPurchase || !user) return;

    try {
      setBuyingId(selectedItemForPurchase.id);
      await dbService.purchaseItem(selectedItemForPurchase.id, user.id, quantity);
      toast.success(`Purchase successful! ${quantity}x ${selectedItemForPurchase.item_name} secured.`);
      setIsPurchaseModalOpen(false);
      fetchShopData();
    } catch (err: any) {
      console.error('Error purchasing item:', err);
      toast.error(err.message || 'Failed to process purchase.');
    } finally {
      setBuyingId(null);
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
              {isOwner && (
                <Link to={`/shops/${shop.id}/orders`} className="px-5 py-3 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 rounded-xl flex items-center gap-2 font-black italic uppercase tracking-widest text-[10px] transition-all">
                  <Package size={14} /> Manage Orders
                </Link>
              )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
            {shopItems.map(item => (
              <ShopItemCard
                key={item.id}
                item={item}
                canManage={canManageShop}
                isOwner={isOwner}
                onEdit={(id) => navigate(`/shops/${shop.id}/items/edit/${id}`)}
                onDelete={handleDeleteItem}
                onPurchase={initiatePurchase}
                addToCart={() => useCartStore.getState().addToCart(item)}
                isBuying={buyingId === item.id}
              />
            ))}
          </div>
        )}
      </div>

      <PurchaseModal
        item={selectedItemForPurchase}
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onConfirm={handlePurchaseConfirm}
        isProcessing={!!buyingId}
      />
      <CartSidebar />
    </div>
  );
};

export default ShopDetailPage;