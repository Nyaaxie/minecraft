import React, { useEffect, useState, useCallback, memo, useMemo } from 'react';
import { dbService } from '../services/dbService';
import type { PlayerShop } from '../types/database.types';
import { Search, Store, Edit, AlertCircle, Loader2, Tag, Hash, Gem, SortAsc } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { getMinecraftItemImageUrl } from '../utils/minecraftItemApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopItem {
  id: string;
  item_name: string;
  minecraft_item_id?: string;
  custom_image_url?: string;
  price: number;
  unit_display?: string | null;
  category_id?: string | null;
  sub_category_id?: string | null;
  categories?: { name: string } | null;
  sub_categories?: { name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FALLBACK_IMG = 'https://minecraft.wiki/images/Invicon_Barrier.png';

function getItemImg(item: ShopItem, size = 64): string {
  if (item.custom_image_url) return item.custom_image_url;
  if (item.minecraft_item_id) return getMinecraftItemImageUrl(item.minecraft_item_id, { size });
  return FALLBACK_IMG;
}

// ─── Small icon cell ──────────────────────────────────────────────────────────

const ItemIconSm = memo(({ item }: { item: ShopItem }) => (
  <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0" title={item.item_name}>
    <img
      src={getItemImg(item, 32)}
      alt={item.item_name}
      className="w-6 h-6 object-contain pixelated"
      onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
    />
  </div>
));

// ─── Grouped items section (Hierarchy: Category -> Sub -> Items) ─────────────

const GroupedShopItems = memo(({ items }: { items: ShopItem[] }) => {
  const hierarchy = useMemo(() => {
    const map = new Map<string, { name: string, subCats: Map<string, { name: string, items: ShopItem[] }> }>();

    for (const item of items) {
      const catId = item.category_id || 'uncategorized';
      const catName = item.categories?.name || 'General';
      const subId = item.sub_category_id || 'none';
      const subName = item.sub_categories?.name || 'No sub cate';

      if (!map.has(catId)) map.set(catId, { name: catName, subCats: new Map() });
      const cat = map.get(catId)!;

      if (!cat.subCats.has(subId)) cat.subCats.set(subId, { name: subName, items: [] });
      cat.subCats.get(subId)!.items.push(item);
    }
    return Array.from(map.values());
  }, [items]);

  if (!items.length) return null;

  return (
    <div className="space-y-6">
      {hierarchy.map((cat) => (
        <div key={cat.name} className="space-y-4">
          {/* Category Label */}
          <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-white/5 pb-2">
            <Tag size={12} className="text-strawberry-600" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-strawberry-600">
              {cat.name}
            </h4>
          </div>

          <div className="space-y-3 pl-1">
            {Array.from(cat.subCats.values()).map((sub) => {
              const prices = [...new Set(sub.items.map((i) => i.price))].sort((a, b) => a - b);
              const unitLabels = [...new Set(sub.items.map((i) => i.unit_display || ''))];
              
              const isUniform = prices.length === 1 && unitLabels.length === 1;
              const priceLabel = prices.length === 1 ? `${prices[0]}` : `${prices[0]}–${prices[prices.length - 1]}`;
              const unitLabel = unitLabels.length === 1 ? unitLabels[0] : '';

              return (
                <div key={sub.name || 'default'} className="space-y-1">
                  {/* Sub-Category Name */}
                  {sub.name && sub.name !== 'No sub cate' && (
                    <div className="flex items-center gap-1.5 opacity-80">
                      <Hash size={12} className="text-neutral-400" />
                      <span className="text-xs font-black italic uppercase tracking-wider text-neutral-500">
                        {sub.name}
                      </span>
                    </div>
                  )}

                  {sub.name !== 'No sub cate' || isUniform ? (
                    /* Row: Dynamic Grid | Price Badge */
                    <div className="flex items-start justify-between gap-4 p-4 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-2xl border border-neutral-100/50 dark:border-white/5 group hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors">

                      {/* Responsive Grid for Items */}
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(32px,1fr))] gap-1.5 flex-1 min-w-0">
                        {sub.items.map((item) => (
                          <ItemIconSm key={item.id} item={item} />
                        ))}
                      </div>

                      {/* Vertical Divider */}
                      <div className="w-px self-stretch bg-neutral-200 dark:bg-white/10 mx-2" />

                      {/* Price Badge */}
                      <div className="flex flex-col items-end shrink-0 pl-2">
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-black text-strawberry-600 tabular-nums leading-none tracking-tight">
                            {priceLabel}
                          </span>
                          <Gem size={14} className="text-strawberry-500 fill-strawberry-500/10 shrink-0" />
                        </div>
                        {unitLabel && (
                          <span className="text-[9px] font-black uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500 mt-1.5 leading-none">
                            {unitLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Simple List for items with different prices or units in 'No sub cate' */
                    <div className="space-y-1.5">
                      {sub.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100/50 dark:border-white/5 group hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <ItemIconSm item={item} />
                          </div>
                          <div className="flex items-center gap-2">
                             <div className='flex flex-col items-end'>
                                <span className="text-sm font-black text-strawberry-600 tabular-nums">{item.price}</span>
                                {item.unit_display && <span className="text-[9px] font-black uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500 leading-none">{item.unit_display}</span>}
                             </div>
                            <Gem size={10} className="text-strawberry-500 fill-strawberry-500/10" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

// ─── Shop card ────────────────────────────────────────────────────────────────

const ShopCard: React.FC<{ shop: any }> = ({ shop }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-3xl p-6 transition-all shadow-sm dark:shadow-none"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="h-16 w-16 rounded-2xl bg-strawberry-600/10 flex items-center justify-center text-strawberry-600 transition-all overflow-hidden shrink-0">
          {shop.banner_url ? (
            <img src={shop.banner_url} alt={shop.name} className="w-full h-full object-cover" />
          ) : (
            <Store size={32} />
          )}
        </div>
        <div className="flex flex-col overflow-hidden">
          <h3 className="text-lg font-bold truncate transition-colors uppercase tracking-tight italic">
            {shop.name}
          </h3>
          <span className="text-xs font-bold text-neutral-500 truncate italic">
            {shop.owner_name}
          </span>
        </div>
      </div>

      <hr className="border-neutral-100 dark:border-white/5 my-4" />

      {/* Grouped items */}
      {shop.shop_items?.length > 0 ? (
        <GroupedShopItems items={shop.shop_items} />
      ) : (
        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest italic text-center py-4">
          No items listed
        </p>
      )}
    </motion.div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ShopsPage: React.FC = () => {
  const [shops, setShops] = useState<PlayerShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuthStore();

  const fetchShops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dbService.getPlayerShops();
      setShops(data);
    } catch (err) {
      console.error('Failed to fetch shops:', err);
      setError('Failed to load shops. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const filteredShops = useMemo(() => {
    return shops
      .filter(shop => shop.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (a.owner_name || '').localeCompare(b.owner_name || ''));
  }, [shops, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 space-y-12 text-neutral-900 dark:text-neutral-100 mt-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20 text-strawberry-600 shadow-xl shadow-strawberry-600/10">
            <Store size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
              Community<span className="text-strawberry-600">Shops</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
              Browse the official directory of community-run markets.
            </p>
          </div>
        </div>

        {isAdmin && (
          <Link
            to="/admin?tab=shops"
            className="flex items-center gap-3 px-8 py-4 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-[1.5rem] font-black italic uppercase tracking-widest text-xs shadow-xl shadow-strawberry-600/20 active:scale-95 transition-all"
          >
            <Edit size={16} />
            Manage Shops
          </Link>
        )}
      </div>

      {/* Search & Sort */}
      <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-neutral-900/5 backdrop-blur-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by owner name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-strawberry-500/40 transition-all font-bold"
          />
        </div>
        <div className="flex items-center gap-2 px-6 py-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl text-neutral-400">
          <SortAsc size={14} />
          <span className="font-black italic uppercase tracking-widest text-[10px]">A-Z</span>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-strawberry-600" size={64} />
          <p className="text-neutral-500 font-black uppercase tracking-widest animate-pulse">Visiting Markets...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-8 rounded-3xl text-center max-w-md mx-auto">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p className="font-bold text-lg">{error}</p>
        </div>
      )}

      {!loading && !error && filteredShops.length === 0 && (
        <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 p-20 rounded-[3rem] text-center space-y-6 backdrop-blur-sm">
          <div className="w-24 h-24 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <Store className="text-neutral-400" size={48} />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black uppercase italic tracking-tighter">No shops found</p>
            <p className="text-neutral-500">The market seems quiet today.</p>
          </div>
        </div>
      )}

      {!loading && !error && filteredShops.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredShops.map(shop => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ShopsPage;