import { useEffect, useState, useCallback } from 'react';
import { dbService } from '../services/dbService';
import { useNavigate, useParams } from 'react-router-dom';
import type { ShopItem } from '../types/database.types';
import { getMinecraftItemImageUrl } from '../utils/minecraftItemApi';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import Select from 'react-select';
import { minecraftItems } from '../utils/minecraftItems';

// Fix: Flatten the nested items structure for React-Select and lookup
const flatItems = Array.isArray(minecraftItems[0]) ? (minecraftItems as any[]).flat() : minecraftItems as any[];
const typedFlatItems = flatItems as { label: string; value: string }[];

const AdminShopItemForm = ({ item, onSubmit, onCancel, isSaving }: { 
  item?: ShopItem; 
  onSubmit: (item: Omit<ShopItem, 'id' | 'created_at' | 'updated_at' | 'shop_id'>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [selectedItem, setSelectedItem] = useState<{ label: string; value: string } | null>(
    item ? typedFlatItems.find(i => i.value === item.minecraft_item_id) || null : null
  );
  const [price, setPrice] = useState(item?.price.toString() || '');
  const [quantity, setQuantity] = useState(item?.quantity.toString() || '1');
  const [isVisible, setIsVisible] = useState(item?.is_visible ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      toast.error("Please select a valid Minecraft item.");
      return;
    }
    onSubmit({
      item_name: selectedItem.label,
      minecraft_item_id: selectedItem.value,
      price: parseFloat(price),
      currency: 'diamond',
      quantity: parseInt(quantity),
      unit_size: parseInt(quantity),
      description: '',
      availability_status: 'in_stock',
      category_id: null,
      is_visible: isVisible,
    });
  };

  const itemImageUrl = selectedItem ? getMinecraftItemImageUrl(selectedItem.value, { size: 64 }) : '';

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#f9fafb',
      borderColor: '#e5e7eb',
      borderRadius: '0.75rem',
      padding: '0.25rem',
      '.dark &': { backgroundColor: '#262626', borderColor: '#404040' }
    }),
    singleValue: (base: any) => ({ ...base, color: '#171717', '.dark &': { color: '#ffffff' } }),
    menu: (base: any) => ({ ...base, backgroundColor: '#ffffff', '.dark &': { backgroundColor: '#262626' } }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#f43f5e1a' : 'transparent',
      color: '#171717',
      '.dark &': { color: '#ffffff', backgroundColor: state.isFocused ? '#f43f5e33' : 'transparent' },
      cursor: 'pointer'
    })
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-lg space-y-6"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Select Minecraft Item</label>
        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <Select options={typedFlatItems} value={selectedItem} onChange={(newValue) => setSelectedItem(newValue as { label: string; value: string } | null)} styles={selectStyles} placeholder="Search for an item..." required />
          </div>
          {itemImageUrl && <img src={itemImageUrl} alt="Item Preview" className="w-12 h-12 object-contain bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1" onError={(e) => { e.currentTarget.src = 'https://minecraftitems.xyz/api/item/stone?size=64'; }} />}
        </div>
      </div>
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Price (Diamonds)</label>
        <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white" required min="0" step="1" />
      </div>
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Quantity / Units per Price</label>
        <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white" required min="1" step="1" />
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="isVisible" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} className="h-5 w-5 rounded border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-strawberry-600 focus:ring-strawberry-600" />
        <label htmlFor="isVisible" className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Visible to Players</label>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" onClick={onCancel} className="px-6 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-white rounded-xl transition-colors" disabled={isSaving}>Cancel</button>
        <button type="submit" className="px-6 py-2 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl transition-colors flex items-center gap-2" disabled={isSaving}>{isSaving && <Loader2 size={18} className="animate-spin" />}{item ? 'Save Changes' : 'Add Item'}</button>
      </div>
    </motion.form>
  );
};

const AdminShopItemPage = () => {
  const { shopId, itemId } = useParams<{ shopId: string; itemId?: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ShopItem | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';
  const [isManageable, setIsManageable] = useState(false);

  const fetchItemData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!shopId) { setError('Shop ID is missing.'); toast.error('Shop ID is missing.'); return; }
      const fetchedShop = await dbService.getPlayerShopById(shopId);
      if (!fetchedShop || (fetchedShop.owner_id !== user?.id && !isAdmin)) {
        setError('You do not have permission to manage items in this shop.');
        toast.error('Unauthorized access to shop.');
        navigate('/shops');
        return;
      }
      setIsManageable(true);
      if (itemId) {
        const fetchedItem = await dbService.getShopItemById(itemId);
        if (fetchedItem && fetchedItem.shop_id === shopId) setItem(fetchedItem);
        else { setError('Item not found or does not belong to this shop.'); toast.error('Item not found or unauthorized.'); }
      }
    } catch (err) { console.error('Error fetching item data:', err); setError('Failed to load item data.'); toast.error('Failed to load item data.'); } finally { setLoading(false); }
  }, [shopId, itemId, user, navigate, isAdmin]);

  useEffect(() => {
    if (user) fetchItemData();
    else { setLoading(false); setError('You must be logged in to manage shop items.'); navigate('/login'); }
  }, [shopId, itemId, user, navigate, fetchItemData]);

  const handleSubmit = async (formData: Omit<ShopItem, 'id' | 'created_at' | 'updated_at' | 'shop_id'>) => {
    setIsSaving(true);
    try {
      if (!isManageable || !shopId) { toast.error('Unauthorized.'); setIsSaving(false); return; }
      if (item) { await dbService.updateShopItem(item.id, formData); toast.success('Shop item updated!'); } 
      else { await dbService.createShopItem({ ...formData, shop_id: shopId }, user?.id); toast.success('Shop item added!'); }
      navigate(`/shops/${shopId}`);
    } catch (err) { toast.error('Failed to save shop item'); } finally { setIsSaving(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-strawberry-600" /></div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-neutral-900 dark:text-white mb-8">{item ? 'Edit Shop Item' : 'Add New Shop Item'}</h1>      <AdminShopItemForm item={item} onSubmit={handleSubmit} onCancel={() => navigate(`/shops/${shopId}`)} isSaving={isSaving} />
    </div>
  );
};

export default AdminShopItemPage;