import React from 'react';
import { motion } from 'framer-motion';
import { Store } from 'lucide-react';
import { GroupedShopItems } from './GroupedShopItems';

export const ShopCard: React.FC<{ shop: any }> = ({ shop }) => {
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
            {shop.owner_name}
          </h3>
          <div className="flex flex-col">
            {shop.nickname && (
              <span className="text-[10px] font-black text-strawberry-600 truncate italic">
                {shop.nickname}
              </span>
            )}
          </div>
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
