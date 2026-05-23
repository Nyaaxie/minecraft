import { useEffect, useState, useCallback } from 'react';
import { dbService } from '../services/dbService';
import { useNavigate, useParams } from 'react-router-dom';
import type { ShopItem, ShopCategory } from '../types/database.types';
import { getMinecraftItemImageUrl } from '../utils/minecraftItemApi';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore'; // For owner_id check

const currencyOptions = [
  { value: 'diamond', label: 'Diamond' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'gold_ingot', label: 'Gold Ingot' },
  { value: 'iron_ingot', label: 'Iron Ingot' },
  { value: 'cookie', label: 'Cookie' }, // Example custom currency
];

const availabilityOptions = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'on_order', label: 'On Order' },
];

const AdminShopItemForm = ({ item, shopCategories, onSubmit, onCancel, isSaving }: { 
  item?: ShopItem; 
  shopCategories: ShopCategory[];
  onSubmit: (item: Omit<ShopItem, 'id' | 'created_at' | 'updated_at' | 'shop_id'>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [itemName, setItemName] = useState(item?.item_name || '');
  const [minecraftItemId, setMinecraftItemId] = useState(item?.minecraft_item_id || '');
  const [price, setPrice] = useState(item?.price.toString() || '');
  const [currency, setCurrency] = useState(item?.currency || 'diamond');
  const [quantity, setQuantity] = useState(item?.quantity.toString() || '1');
  const [description, setDescription] = useState(item?.description || '');
  const [availabilityStatus, setAvailabilityStatus] = useState(item?.availability_status || 'in_stock');
  const [categoryId, setCategoryId] = useState(item?.category_id || '');
  const [isVisible, setIsVisible] = useState(item?.is_visible ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!minecraftItemId) {
      toast.error("Minecraft Item ID is required.");
      return;
    }
    onSubmit({
      item_name: itemName,
      minecraft_item_id: minecraftItemId,
      price: parseFloat(price),
      currency,
      quantity: parseInt(quantity),
      description,
      availability_status: availabilityStatus as ShopItem['availability_status'],
      category_id: categoryId || null,
      is_visible: isVisible,
    });
  };

  const itemImageUrl = minecraftItemId ? getMinecraftItemImageUrl(minecraftItemId, { size: 64 }) : '';

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-lg space-y-6"
      onSubmit={handleSubmit}
    >
      <div>
        <label htmlFor="itemName" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Item Name</label>
        <input
          type="text"
          id="itemName"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
          required
        />
      </div>
      <div>
        <label htmlFor="minecraftItemId" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Minecraft Item ID (e.g., diamond_sword, minecraft:grass_block)</label>
        <div className="flex items-center gap-4">
          <input
            type="text"
            id="minecraftItemId"
            value={minecraftItemId}
            onChange={(e) => setMinecraftItemId(e.target.value)}
            className="flex-grow px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
            required
            placeholder="minecraft:diamond_sword"
          />
          {itemImageUrl && (
            <img 
              src={itemImageUrl} 
              alt="Item Preview" 
              className="w-10 h-10 object-contain" 
              onError={(e) => { e.currentTarget.src = 'https://minecraftitems.xyz/api/item/stone?size=64'; }} 
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Price</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
            required
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Currency</label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
          >
            {currencyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Quantity</label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
          required
          min="1"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="availabilityStatus" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Availability Status</label>
          <select
            id="availabilityStatus"
            value={availabilityStatus}
            onChange={(e) => setAvailabilityStatus(e.target.value as ShopItem['availability_status'])}
            className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
          >
            {availabilityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Category</label>
          <select
            id="categoryId"
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
          >
            <option value="">No Category</option>
            {shopCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isVisible"
          checked={isVisible}
          onChange={(e) => setIsVisible(e.target.checked)}
          className="h-5 w-5 rounded border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-strawberry-600 focus:ring-strawberry-600"
        />
        <label htmlFor="isVisible" className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {isVisible ? 'Visible to Players' : 'Hidden from Players'}
        </label>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-white rounded-xl transition-colors"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl transition-colors flex items-center gap-2"
          disabled={isSaving}
        >
          {isSaving && <Loader2 size={18} className="animate-spin" />}
          {item ? 'Save Changes' : 'Add Item'}
        </button>
      </div>
    </motion.form>
  );
};

const AdminShopItemPage = () => {
  const { shopId, itemId } = useParams<{ shopId: string; itemId?: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ShopItem | undefined>(undefined);
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>([]);
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

      if (!shopId) {
        setError('Shop ID is missing.');
        toast.error('Shop ID is missing.');
        // setLoading(false); // Controlled by useEffect wrapper
        return;
      }

      const fetchedShop = await dbService.getPlayerShopById(shopId);
      if (!fetchedShop || (fetchedShop.owner_id !== user?.id && !isAdmin)) { // owner or admin
        setError('You do not have permission to manage items in this shop.');
        toast.error('Unauthorized access to shop.');
        navigate('/shops');
        // setLoading(false); // Controlled by useEffect wrapper
        return;
      }
      setIsManageable(true);

      const fetchedCategories = await dbService.getShopCategories();
      setShopCategories(fetchedCategories);

      if (itemId) {
        const fetchedItem = await dbService.getShopItemById(itemId);
        // Ensure item belongs to the current shop
        if (fetchedItem && fetchedItem.shop_id === shopId) {
          setItem(fetchedItem);
        } else {
          setError('Item not found or does not belong to this shop.');
          toast.error('Item not found or unauthorized.');
        }
      }
    } catch (err) {
      console.error('Error fetching item data:', err);
      setError('Failed to load item data.');
      toast.error('Failed to load item data.');
    } finally {
      setLoading(false);
    }
  }, [shopId, itemId, user, navigate, isAdmin]); // Dependencies for useCallback

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await fetchItemData();
      } else {
        setLoading(false);
        setError('You must be logged in to manage shop items.');
        navigate('/login');
      }
    };
    loadData();
  }, [shopId, itemId, user, navigate, fetchItemData]);

  const handleSubmit = async (formData: Omit<ShopItem, 'id' | 'created_at' | 'updated_at' | 'shop_id'>) => {
    setIsSaving(true);
    try {
      if (!isManageable || !shopId) {
        toast.error('Unauthorized to perform this action.');
        setIsSaving(false);
        return;
      }
      if (item) {
        await dbService.updateShopItem(item.id, formData);
        toast.success('Shop item updated successfully!');
      } else {
        await dbService.createShopItem({ ...formData, shop_id: shopId });
        toast.success('Shop item added successfully!');
      }
      navigate(`/shops/${shopId}`); // Redirect to shop detail after save
    } catch (err) {
      console.error('Error saving shop item:', err);
      toast.error(`Failed to save shop item: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 text-strawberry-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 p-4 rounded-xl text-center">
        <p>{error}</p>
        <button onClick={() => navigate(`/shops/${shopId}`)} className="mt-4 px-4 py-2 bg-strawberry-600 text-white rounded-xl">
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-8">
        {item ? 'Edit Shop Item' : 'Add New Shop Item'}
      </h1>
      <AdminShopItemForm 
        item={item} 
        shopCategories={shopCategories}
        onSubmit={handleSubmit} 
        onCancel={() => navigate(`/shops/${shopId}`)} 
        isSaving={isSaving} 
      />
    </div>
  );
};

export default AdminShopItemPage;
