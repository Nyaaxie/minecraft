// src/utils/minecraftItemApi.ts

const MOB_MAP: Record<string, string> = {
  'creeper': 'creeper_spawn_egg',
  'zombie': 'zombie_spawn_egg',
  'skeleton': 'skeleton_spawn_egg',
  'enderman': 'enderman_spawn_egg',
  'spider': 'spider_spawn_egg',
  'pig': 'pig_spawn_egg',
  'cow': 'cow_spawn_egg',
  'sheep': 'sheep_spawn_egg',
  'chicken': 'chicken_spawn_egg',
  'villager': 'villager_spawn_egg',
  'iron_golem': 'iron_golem_spawn_egg',
  'blaze': 'blaze_spawn_egg',
  'ghast': 'ghast_spawn_egg',
  'slime': 'slime_spawn_egg',
  'magma_cube': 'magma_cube_spawn_egg',
  'bee': 'bee_spawn_egg',
  'axolotl': 'axolotl_spawn_egg',
  'warden': 'warden_spawn_egg',
  'phantom': 'phantom_spawn_egg',
  'shulker': 'shulker_spawn_egg',
  'wolf': 'wolf_spawn_egg',
  'cat': 'cat_spawn_egg',
  'fox': 'fox_spawn_egg',
  'panda': 'panda_spawn_egg',
  'horse': 'horse_spawn_egg',
  'donkey': 'donkey_spawn_egg',
  'mule': 'mule_spawn_egg',
  'llama': 'llama_spawn_egg',
  'polar_bear': 'polar_bear_spawn_egg',
  'parrot': 'parrot_spawn_egg',
  'turtle': 'turtle_spawn_egg',
  'dolphin': 'dolphin_spawn_egg',
  'squid': 'squid_spawn_egg',
  'glow_squid': 'glow_squid_spawn_egg',
  'strider': 'strider_spawn_egg',
  'piglin': 'piglin_spawn_egg',
  'hoglin': 'hoglin_spawn_egg',
  'ravager': 'ravager_spawn_egg',
  'evoker': 'evoker_spawn_egg',
  'vindicator': 'vindicator_spawn_egg',
  'witch': 'witch_spawn_egg',
  'bat': 'bat_spawn_egg',
  'silverfish': 'silverfish_spawn_egg',
  'endermite': 'endermite_spawn_egg',
  'guardian': 'guardian_spawn_egg',
  'elder_guardian': 'elder_guardian_spawn_egg',
  'wither_skeleton': 'wither_skeleton_spawn_egg',
  'stray': 'stray_spawn_egg',
  'husk': 'husk_spawn_egg',
  'drowned': 'drowned_spawn_egg',
};

/**
 * Constructs a URL for a Minecraft item or mob image.
 * If a mob name is provided, it attempts to map it to a spawn egg.
 */
export const getMinecraftItemImageUrl = (
  itemId: string,
  options?: {
    size?: number;
    rotation?: string;
    version?: string;
  }
): string => {
  const base = "https://api.minecraftitems.xyz/api/item";
  
  // Extract base item ID and NBT data
  let baseId = itemId.replace(/^minecraft:/, '');
  let nbt = '';
  
  const nbtStartIndex = baseId.indexOf('{');
  if (nbtStartIndex !== -1) {
    nbt = baseId.substring(nbtStartIndex);
    baseId = baseId.substring(0, nbtStartIndex);
  }
  
  let normalizedItemId = baseId.toLowerCase().replace(/\s+/g, '_');

  // Check if it's a known mob and map to spawn egg
  if (MOB_MAP[normalizedItemId]) {
    normalizedItemId = MOB_MAP[normalizedItemId];
  }

  const params = new URLSearchParams();
  if (nbt) params.append('nbt', nbt);
  if (options?.size) params.append('size', options.size.toString());
  if (options?.rotation) params.append('rotation', options.rotation);
  if (options?.version) params.append('v', options.version);

  const queryString = params.toString();
  return `${base}/${normalizedItemId}${queryString ? '?' + queryString : ''}`;
};

/**
 * Example usage:
 * getMinecraftItemImageUrl("diamond_sword");
 * // -> https://minecraftitems.xyz/api/item/diamond_sword
 *
 * getMinecraftItemImageUrl("minecraft:iron_pickaxe", { size: 128, rotation: "30_45_0" });
 * // -> https://minecraftitems.xyz/api/item/iron_pickaxe?size=128&rotation=30_45_0
 *
 * getMinecraftItemImageUrl("grass_block", { size: 64, version: "1.18" });
 * // -> https://minecraftitems.xyz/api/item/grass_block?size=64&v=1.18
 */
