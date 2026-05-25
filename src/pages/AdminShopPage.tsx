import { useEffect, useState, useCallback } from 'react';
import { dbService } from '../services/dbService';
import { useNavigate, useParams } from 'react-router-dom';
import type { PlayerShop } from '../types/database.types';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore'; // For owner_id

const AdminShopForm = ({ shop, onSubmit, onCancel, isSaving }: { 
  shop?: PlayerShop; 
  onSubmit: (shop: Omit<PlayerShop, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [name, setName] = useState(shop?.name || '');
  const [description, setDescription] = useState(shop?.description || '');
  const [isActive, setIsActive] = useState(shop?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, is_active: isActive });
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-lg space-y-6"
      onSubmit={handleSubmit}
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Shop Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 focus:border-transparent"
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-5 w-5 rounded border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-strawberry-600 focus:ring-strawberry-600"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {isActive ? 'Shop is Active (Visible)' : 'Shop is Inactive (Hidden)'}
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
          {shop ? 'Save Changes' : 'Create Shop'}
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
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  const fetchShopData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (id) {
        const fetchedShop = await dbService.getPlayerShopById(id);
        if (fetchedShop && (fetchedShop.owner_id === user?.id || isAdmin)) { // Ensure owner or admin
          setShop(fetchedShop);
        } else {
          setError('Shop not found or you do not have permission to edit this shop.');
          toast.error('Shop not found or unauthorized.');
        }
      }
    } catch (err) {
      console.error('Error fetching shop data:', err);
      setError('Failed to load shop data.');
      toast.error('Failed to load shop data.');
    } finally {
      setLoading(false);
    }
  }, [id, user, isAdmin]); // Dependencies for useCallback

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        // Check for existing shops if creating new
        if (!id) {
          const userShops = await dbService.getPlayerShopsByOwner(user.id);
          if (userShops.length > 0 && !isAdmin) {
            toast.error('You already own a shop.');
            navigate(`/shops/${userShops[0].id}`);
            return;
          }
        }
        await fetchShopData();
      } else {
        setLoading(false);
        setError('You must be logged in to manage shops.');
      }
    };
    loadData();
  }, [id, user, fetchShopData, isAdmin, navigate]);

  const handleSubmit = async (formData: Omit<PlayerShop, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
    setIsSaving(true);
    try {
      if (shop) {
        await dbService.updatePlayerShop(shop.id, formData);
        toast.success('Shop updated successfully!');
      } else {
        if (!user?.id) {
          toast.error('User not logged in. Cannot create shop.');
          setIsSaving(false);
          return;
        }
        await dbService.createPlayerShop({ ...formData, owner_id: user.id });
        toast.success('Shop created successfully!');
      }
      navigate('/shops'); // Redirect to shops list after save
    } catch (err) {
      console.error('Error saving shop:', err);
      toast.error(`Failed to save shop: ${err instanceof Error ? err.message : String(err)}`);
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-8">
        {shop ? 'Edit Your Shop' : 'Open a New Shop'}
      </h1>
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
