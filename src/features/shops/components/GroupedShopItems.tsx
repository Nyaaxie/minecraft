import { memo, useMemo } from 'react';
import { Tag, Hash, Gem } from 'lucide-react';
import { getMinecraftItemImageUrl } from '../../../utils/minecraftItemApi';

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

const FALLBACK_IMG = 'https://minecraft.wiki/images/Invicon_Barrier.png';

function getItemImg(item: ShopItem, size = 64): string {
  if (item.custom_image_url) return item.custom_image_url;
  if (item.minecraft_item_id) return getMinecraftItemImageUrl(item.minecraft_item_id, { size });
  return FALLBACK_IMG;
}

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

export const GroupedShopItems = memo(({ items }: { items: ShopItem[] }) => {
  const hierarchy = useMemo(() => {
    const map = new Map<string, {
      name: string,
      subCats: Map<string, {
        name: string,
        priceGroups: { price: number; unit: string; items: ShopItem[] }[]
      }>
    }>();

    for (const item of items) {
      const catId = item.category_id || 'uncategorized';
      const catName = item.categories?.name || 'General';
      const subId = item.sub_category_id || 'none';
      const subName = item.sub_categories?.name || 'No sub category';
      const price = item.price;
      const unit = item.unit_display || '';

      if (!map.has(catId)) map.set(catId, { name: catName, subCats: new Map() });
      const cat = map.get(catId)!;

      if (!cat.subCats.has(subId)) cat.subCats.set(subId, { name: subName, priceGroups: [] });
      const sub = cat.subCats.get(subId)!;

      let group = sub.priceGroups.find(g => g.price === price && g.unit === unit);
      if (!group) {
        group = { price, unit, items: [] };
        sub.priceGroups.push(group);
      }
      group.items.push(item);
    }
    return Array.from(map.values());
  }, [items]);

  if (!items.length) return null;

  return (
    <div className="space-y-2.5">
      {hierarchy.map((cat) => (
        <div key={cat.name} className="space-y-2.5">
          <div className="flex items-center gap-2.5 border-b border-neutral-100 dark:border-white/5 pb-1">
            <Tag size={10} className="text-strawberry-600" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-strawberry-600">
              {cat.name}
            </h4>
          </div>

          <div className="space-y-2.5 pl-1">
            {Array.from(cat.subCats.values()).map((sub) => (
              <div key={sub.name} className="space-y-1.5">
                {sub.name !== 'No sub category' && (
                  <div className="flex items-center gap-2.5 opacity-80">
                    <Hash size={10} className="text-neutral-400" />
                    <span className="text-[10px] font-black italic uppercase tracking-wider text-neutral-500">
                      {sub.name}
                    </span>
                  </div>
                )}

                <div className="space-y-2.5">
                  {sub.priceGroups.map((group, gIdx) => (
                    <div
                      key={`${group.price}-${group.unit}-${gIdx}`}
                      className="flex items-center justify-between gap-2.5 p-2 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100/50 dark:border-white/5 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(24px,1fr))] gap-2.5 flex-1 min-w-0">
                        {group.items.map((item) => (
                          <ItemIconSm key={item.id} item={item} />
                        ))}
                      </div>

                      <div className="w-px self-stretch bg-neutral-200 dark:bg-white/10 mx-0" />

                      <div className="flex flex-col items-end shrink-0 pl-1">
                        <div className="flex items-center gap-0.5">
                          <span className="text-sm font-black text-strawberry-600 tabular-nums leading-none tracking-tight">
                            {group.price}
                          </span>
                          <Gem size={10} className="text-strawberry-500 fill-strawberry-500/10 shrink-0" />
                        </div>
                        {group.unit && (
                          <span className="text-[8px] font-black uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500 mt-0.5 leading-none text-right">
                            {group.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
