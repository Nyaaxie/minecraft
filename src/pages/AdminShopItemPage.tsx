import { useEffect, useState, useCallback } from 'react';
import { dbService } from '../services/dbService';
import { useNavigate, useParams } from 'react-router-dom';
import type { ShopItem, Category, SubCategory } from '../types/database.types';
import { getMinecraftItemImageUrl } from '../utils/minecraftItemApi';
import { Loader2, ShoppingBag, Tag, Hash, Eye, Save, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import Select from 'react-select';
import { minecraftItems } from '../utils/minecraftItems';
import { useMemo } from 'react';

// Fix: Always flatten the items structure to ensure nested arrays are included
const typedFlatItems = (minecraftItems as any[]).flat() as { label: string; value: string }[];

const AdminShopItemForm = ({ item, categories, subCategories, onSubmit, onCancel, isSaving }: { 
  item?: ShopItem; 
  categories: Category[];
  subCategories: SubCategory[];
  onSubmit: (item: Omit<ShopItem, 'id' | 'created_at' | 'updated_at' | 'shop_id'>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [selectedItem, setSelectedItem] = useState<{ label: string; value: string } | null>(
    item ? typedFlatItems.find(i => i.value === item.minecraft_item_id) || null : null
  );
  const [price, setPrice] = useState(item?.price.toString() || '');
  const [unitDisplay, setUnitDisplay] = useState(item?.unit_display || '');
  const [customImageUrl, setCustomImageUrl] = useState(item?.custom_image_url || '');
  const [isVisible, setIsVisible] = useState(item?.is_visible ?? true);
  const [categoryId, setCategoryId] = useState(item?.category_id || '');
  const [subCategoryId, setSubCategoryId] = useState(item?.sub_category_id || '');

  const filteredSubCategories = useMemo(() => {
    if (!categoryId) return [];
    return subCategories.filter(s => s.category_id === categoryId);
  }, [subCategories, categoryId]);

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
      quantity: 1,
      unit_size: 1,
      unit_display: unitDisplay,
      custom_image_url: customImageUrl || null,
      description: '',
      availability_status: 'in_stock',
      category_id: categoryId || null,
      sub_category_id: subCategoryId || null,
      is_visible: isVisible,
    });
  };

  const itemImageUrl = customImageUrl || (selectedItem ? getMinecraftItemImageUrl(selectedItem.value, { size: 64 }) : '');

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: 'transparent',
      borderColor: '#e5e7eb',
      borderRadius: '1rem',
      padding: '0.5rem',
      '.dark &': { borderColor: '#404040' }
    }),
    singleValue: (base: any) => ({ ...base, color: 'inherit', fontWeight: 'bold' }),
    menu: (base: any) => ({ ...base, backgroundColor: '#ffffff', '.dark &': { backgroundColor: '#171717' }, borderRadius: '1rem', overflow: 'hidden', border: '1px solid #404040' }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#f43f5e1a' : 'transparent',
      color: 'inherit',
      fontWeight: 'bold',
      '.dark &': { backgroundColor: state.isFocused ? '#f43f5e33' : 'transparent' },
      cursor: 'pointer'
    })
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-[2.5rem] border border-neutral-200 dark:border-white/5 shadow-2xl space-y-8"
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4 flex items-center gap-2">
            <ShoppingBag size={12} className="text-strawberry-600" /> Minecraft Item
          </label>
          <div className="flex items-center gap-6">
            <div className="flex-grow">
              <Select 
                options={typedFlatItems} 
                value={selectedItem} 
                onChange={(newValue) => setSelectedItem(newValue as { label: string; value: string } | null)} 
                styles={selectStyles} 
                placeholder="Search for an item..." 
                required 
              />
            </div>
            <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center border border-neutral-200 dark:border-white/5 shrink-0">
              {itemImageUrl ? (
                <img src={itemImageUrl} alt="Preview" className="w-12 h-12 pixelated" onError={(e) => { e.currentTarget.src = 'https://minecraft.wiki/images/Invicon_Barrier.png'; }} />
              ) : (
                <Tag size={24} className="text-neutral-300 dark:text-neutral-700" />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2">
            <label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4 flex items-center gap-2">
              <Hash size={12} className="text-strawberry-600" /> Price (Diamonds)
            </label>
            <input 
              type="number" 
              id="price" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              className="w-full px-6 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 font-bold transition-all" 
              placeholder="0"
              required 
              min="0" 
              step="1" 
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="categoryId" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4 flex items-center gap-2">
              <Tag size={12} className="text-strawberry-600" /> Category
            </label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setSubCategoryId(''); }}
              className="w-full px-6 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 font-bold transition-all"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="subCategoryId" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4 flex items-center gap-2">
              <Hash size={12} className="text-strawberry-600" /> Sub-Category (Optional)
            </label>
            <select
              id="subCategoryId"
              value={subCategoryId}
              onChange={(e) => setSubCategoryId(e.target.value)}
              className="w-full px-6 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 font-bold transition-all"
              disabled={!categoryId}
            >
              <option value="">{categoryId ? (filteredSubCategories.length > 0 ? 'None' : 'No sub-categories found') : 'Select category first'}</option>
              {filteredSubCategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="unitDisplay" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4 flex items-center gap-2">
            <Tag size={12} className="text-strawberry-600" /> Unit Display
          </label>
          <input 
            type="text" 
            id="unitDisplay" 
            value={unitDisplay} 
            onChange={(e) => setUnitDisplay(e.target.value)} 
            className="w-full px-6 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 font-bold transition-all" 
            placeholder="e.g. 1 Stack, 32 Units"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="customImageUrl" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4 flex items-center gap-2">
            <ImageIcon size={12} className="text-strawberry-600" /> Custom Image URL (Optional)
          </label>
          <input 
            type="text" 
            id="customImageUrl" 
            value={customImageUrl} 
            onChange={(e) => setCustomImageUrl(e.target.value)} 
            className="w-full px-6 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 font-bold transition-all" 
            placeholder="https://... (Fallback if item image fails)"
          />
        </div>

        <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl">
          <input 
            type="checkbox" 
            id="isVisible" 
            checked={isVisible} 
            onChange={(e) => setIsVisible(e.target.checked)} 
            className="h-6 w-6 rounded-lg border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-strawberry-600 focus:ring-strawberry-500 accent-strawberry-600" 
          />
          <label htmlFor="isVisible" className="text-xs font-black italic uppercase tracking-widest text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
            <Eye size={14} /> Visible to Players
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-8 py-4 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 rounded-2xl font-black italic uppercase tracking-widest text-xs transition-all" 
          disabled={isSaving}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="px-8 py-4 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-strawberry-600/20 active:scale-95 transition-all flex items-center gap-3" 
          disabled={isSaving}
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {item ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </motion.form>
  );
};

const AdminShopItemPage = () => {
  const { shopId, itemId } = useParams<{ shopId: string; itemId?: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ShopItem | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [, setError] = useState<string | null>(null);
  const { isAdmin } = useAuthStore();

  const fetchItemData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!shopId) { navigate('/shops'); return; }
      
      const [cats, subCats] = await Promise.all([
        dbService.getCategories(),
        dbService.getSubCategories()
      ]);
      setCategories(cats);
      setSubCategories(subCats);

      if (itemId) {
        const fetchedItem = await dbService.getShopItemById(itemId);
        if (fetchedItem && fetchedItem.shop_id === shopId) {
          setItem(fetchedItem);
        } else {
          setError('Item not found.');
        }
      }
    } catch (err) {
      console.error('Error fetching item data:', err);
      setError('Failed to load item data.');
    } finally {
      setLoading(false);
    }
  }, [shopId, itemId, navigate]);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Unauthorized access.');
      navigate('/shops');
      return;
    }
    fetchItemData();
  }, [isAdmin, fetchItemData, navigate]);

  const handleSubmit = async (formData: Omit<ShopItem, 'id' | 'created_at' | 'updated_at' | 'shop_id'>) => {
    setIsSaving(true);
    try {
      if (!shopId) return;
      if (item) {
        await dbService.updateShopItem(item.id, formData);
        toast.success('Item updated successfully!');
      } else {
        await dbService.createShopItem({ ...formData, shop_id: shopId });
        toast.success('Item added successfully!');
      }
      navigate(`/admin?tab=shops`);
    } catch (err) {
      console.error('Error saving item:', err);
      toast.error('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 text-strawberry-600 animate-spin" />
        <p className="text-neutral-500 font-black uppercase tracking-widest animate-pulse">Loading Item Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center gap-6 px-2">
        <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20 text-strawberry-600">
          <Tag size={32} />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
            {item ? 'Edit' : 'Add'}<span className="text-strawberry-600">Item</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
            Configure shop item details.
          </p>
        </div>
      </div>

      <AdminShopItemForm 
        item={item}
        categories={categories}
        subCategories={subCategories}
        onSubmit={handleSubmit} 
        onCancel={() => navigate(`/admin?tab=shops`)} 
        isSaving={isSaving} 
      />
    </div>
  );
};

export default AdminShopItemPage;
