// src/utils/minecraftItemApi.ts

/**
 * Constructs a URL for a Minecraft item image using MinecraftItems.xyz API.
 * The API supports various rendering options.
 *
 * @param itemId The Minecraft item ID (e.g., "diamond_sword", "grass_block", "minecraft:iron_ore").
 *               Prefixing with "minecraft:" is optional for vanilla items.
 * @param options Rendering options.
 * @param options.size Size of the image (e.g., 32, 64, 128, 256). Default is 64.
 * @param options.rotation Rotation of the item in degrees (e.g., "0_0_0" for default, "15_neg-20_0"). Default is "0_0_0".
 * @param options.version Minecraft version for item textures (e.g., "1.19.2"). Default uses latest.
 * @returns The full URL to the Minecraft item image.
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
  
  // Extract base item ID and NBT data if present (e.g., "enchanted_book{...}")
  let baseId = itemId.replace(/^minecraft:/, '');
  let nbt = '';
  
  const nbtStartIndex = baseId.indexOf('{');
  if (nbtStartIndex !== -1) {
    nbt = baseId.substring(nbtStartIndex);
    baseId = baseId.substring(0, nbtStartIndex);
  }
  
  const normalizedItemId = baseId.toLowerCase();

  const params = new URLSearchParams();
  if (nbt) {
    params.append('nbt', nbt);
  }
  if (options?.size) {
    params.append('size', options.size.toString());
  }
  if (options?.rotation) {
    params.append('rotation', options.rotation);
  }
  if (options?.version) {
    params.append('v', options.version);
  }

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
