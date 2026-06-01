import { useEffect, useState, useCallback } from 'react';
import { dbService } from '../services/dbService';
import { useNavigate, useParams } from 'react-router-dom';
import type { PlayerShop } from '../types/database.types';
import { Loader2, Store, User, Image as ImageIcon, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

const AdminShopForm = ({ shop, onSubmit, onCancel, isSaving }: { 
  shop?: PlayerShop; 
  onSubmit: (shop: Omit<PlayerShop, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [ownerName, setOwnerName] = useState(shop?.owner_name || '');
  const [description, setDescription] = useState(shop?.description || '');
  const [bannerUrl, setBannerUrl] = useState(shop?.banner_url || '');
  const [isActive, setIsActive] = useState(shop?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName) {
      toast.error('Owner Username is required');
      return;
    }
    onSubmit({ name: ownerName, owner_name: ownerName, description, banner_url: bannerUrl, is_active: isActive });
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-[2.5rem] border border-neutral-200 dark:border-white/5 shadow-2xl space-y-8"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-2">
          <label htmlFor="owner_name" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4 flex items-center gap-2">
            <User size={12} className="text-strawberry-600" /> Owner Username
          </label>
          <input
            type="text"
            id="owner_name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full px-6 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 font-bold transition-all"
            placeholder="Minecraft Username"
            required
          />
        </div>

        <div className="col-span-1 md:col-span-2 space-y-2">
          <label htmlFor="banner_url" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4 flex items-center gap-2">
            <ImageIcon size={12} className="text-strawberry-600" /> Banner URL
          </label>
          <input
            type="text"
            id="banner_url"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            className="w-full px-6 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 font-bold transition-all"
            placeholder="https://..."
          />
        </div>

        <div className="col-span-1 md:col-span-2 space-y-2">
          <label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4 flex items-center gap-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-6 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 font-bold transition-all resize-none"
            placeholder="A brief description of the shop..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-6 w-6 rounded-lg border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-strawberry-600 focus:ring-strawberry-500 accent-strawberry-600"
        />
        <label htmlFor="isActive" className="text-xs font-black italic uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
          {isActive ? 'Shop is currently open' : 'Shop is currently closed'}
        </label>
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
          {shop ? 'Update Shop' : 'Create Shop'}
        </button>
      </div>
    </motion.form>
  );
};

const AdminShopPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<PlayerShop | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [, setError] = useState<string | null>(null);
  const { isAdmin } = useAuthStore();

  const fetchShopData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (id) {
        const fetchedShop = await dbService.getPlayerShopById(id);
        if (fetchedShop) {
          setShop(fetchedShop);
        } else {
          setError('Shop not found.');
          toast.error('Shop not found.');
        }
      }
    } catch (err) {
      console.error('Error fetching shop data:', err);
      setError('Failed to load shop data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Unauthorized access.');
      navigate('/shops');
      return;
    }
    fetchShopData();
  }, [id, isAdmin, fetchShopData, navigate]);

  const handleSubmit = async (formData: Omit<PlayerShop, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
    setIsSaving(true);
    try {
      if (shop) {
        await dbService.updatePlayerShop(shop.id, formData);
        toast.success('Shop updated successfully!');
      } else {
        await dbService.createPlayerShop({ ...formData, owner_id: null });
        toast.success('Shop created successfully!');
      }
      navigate('/shops');
    } catch (err) {
      console.error('Error saving shop:', err);
      toast.error('Failed to save shop');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 text-strawberry-600 animate-spin" />
        <p className="text-neutral-500 font-black uppercase tracking-widest animate-pulse">Loading Shop Configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center gap-6 px-2">
        <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20 text-strawberry-600">
          <Store size={32} />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
            {shop ? 'Edit' : 'Create'}<span className="text-strawberry-600">Shop</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
            Official community market configuration.
          </p>
        </div>
      </div>

      <AdminShopForm 
        shop={shop} 
        onSubmit={handleSubmit} 
        onCancel={() => navigate('/shops')} 
        isSaving={isSaving} 
      />
    </div>
  );
};

export default AdminShopPage;
