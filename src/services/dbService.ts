import { supabase } from './supabase';
import type { Event, EventRSVP, Profile, Announcement, Plugin, ShopCategory, PlayerShop, ShopItem, PluginCategory, ShopTransaction } from '../types/database.types';

export const dbService = {
  // --- Profiles & Admin ---
  async getAllProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').order('username', { ascending: true });
    if (error) throw error;
    return data;
  },

  async updateProfile(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  },

  // --- Events ---
  async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*, profiles(username)')
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createEvent(event: Omit<Event, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('events').insert(event).select().single();
    if (error) throw error;
    return data;
  },

  async updateEvent(id: string, updates: Partial<Event>) {
    const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteEvent(id: string) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  },

  // --- RSVPs ---
  async getRSVPs(eventId: string) {
    const { data, error } = await supabase.from('event_rsvps').select('*, profiles(username, avatar_url)').eq('event_id', eventId);
    if (error) throw error;
    return data;
  },

  async upsertRSVP(eventId: string, profileId: string, status: EventRSVP['status']) {
    const { data, error } = await supabase
      .from('event_rsvps')
      .upsert({ event_id: eventId, profile_id: profileId, status })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Messages ---
  async getMessages(userId: string, otherUserId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async sendMessage(senderId: string, receiverId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: senderId, receiver_id: receiverId, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Notifications ---
  async getNotifications(profileId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async markNotificationRead(id: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },

  // --- Announcements ---
  async getAnnouncements() {
    const { data, error } = await supabase.from('announcements').select('*, profiles(username)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('announcements').insert(announcement).select().single();
    if (error) throw error;
    return data;
  },

  // --- Rules ---
  async getRules() {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('is_visible', true)
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // --- Reminders ---
  async getReminders() {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // --- Minecraft Versions ---
  async getMinecraftVersions() {
    const { data, error } = await supabase
      .from('minecraft_versions')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // --- Plugins ---
  async getPlugins() {
    const { data, error } = await supabase.from('plugins').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getPluginById(id: string) {
    const { data, error } = await supabase.from('plugins').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async createPlugin(plugin: Omit<Plugin, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('plugins').insert(plugin).select().single();
    if (error) throw error;
    return data;
  },
  async updatePlugin(id: string, updates: Partial<Plugin>) {
    const { data, error } = await supabase.from('plugins').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deletePlugin(id: string) {
    const { error } = await supabase.from('plugins').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Plugin Categories ---
  async getPluginCategories() {
    const { data, error } = await supabase.from('plugin_categories').select('*').order('name', { ascending: true });
    if (error) throw error;
    return data;
  },
  async createPluginCategory(category: Omit<PluginCategory, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('plugin_categories').insert(category).select().single();
    if (error) throw error;
    return data;
  },
  async updatePluginCategory(id: string, updates: Partial<PluginCategory>) {
    const { data, error } = await supabase.from('plugin_categories').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deletePluginCategory(id: string) {
    const { error } = await supabase.from('plugin_categories').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Shop Categories ---
  async getShopCategories() {
    const { data, error } = await supabase.from('shop_categories').select('*').order('name', { ascending: true });
    if (error) throw error;
    return data;
  },
  async createShopCategory(category: Omit<ShopCategory, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('shop_categories').insert(category).select().single();
    if (error) throw error;
    return data;
  },
  async updateShopCategory(id: string, updates: Partial<ShopCategory>) {
    const { data, error } = await supabase.from('shop_categories').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteShopCategory(id: string) {
    const { error } = await supabase.from('shop_categories').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Player Shops ---
  async getPlayerShops() {
    const { data, error } = await supabase.from('player_shops').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getPlayerShopById(id: string) {
    const { data, error } = await supabase.from('player_shops').select('*, profiles(username, avatar_url)').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async getPlayerShopsByOwner(ownerId: string) {
    const { data, error } = await supabase.from('player_shops').select('*, profiles(username, avatar_url)').eq('owner_id', ownerId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async createPlayerShop(shop: Omit<PlayerShop, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('player_shops').insert(shop).select().single();
    if (error) throw error;
    return data;
  },
  async updatePlayerShop(id: string, updates: Partial<PlayerShop>) {
    const { data, error } = await supabase.from('player_shops').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deletePlayerShop(id: string) {
    const { error } = await supabase.from('player_shops').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Shop Items ---
  async getShopItems() {
    const { data, error } = await supabase.from('shop_items').select('*, player_shops(name), shop_categories(name)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getShopItemById(id: string) {
    const { data, error } = await supabase.from('shop_items').select('*, player_shops(name), shop_categories(name)').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async getShopItemsByShop(shopId: string) {
    const { data, error } = await supabase.from('shop_items').select('*, player_shops(name), shop_categories(name)').eq('shop_id', shopId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async createShopItem(item: Omit<ShopItem, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('shop_items').insert(item).select().single();
    if (error) throw error;
    return data;
  },
  async updateShopItem(id: string, updates: Partial<ShopItem>) {
    const { data, error } = await supabase.from('shop_items').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteShopItem(id: string) {
    const { error } = await supabase.from('shop_items').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Shop Transactions ---
  async getShopTransactions() {
    const { data, error } = await supabase.from('shop_transactions').select('*').order('transaction_time', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getShopTransactionById(id: string) {
    const { data, error } = await supabase.from('shop_transactions').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async getShopTransactionsByBuyer(buyerId: string) {
    const { data, error } = await supabase.from('shop_transactions').select('*').eq('buyer_id', buyerId).order('transaction_time', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getShopTransactionsBySeller(sellerId: string) {
    const { data, error } = await supabase.from('shop_transactions').select('*').eq('seller_id', sellerId).order('transaction_time', { ascending: false });
    if (error) throw error;
    return data;
  },
  async createShopTransaction(transaction: Omit<ShopTransaction, 'id' | 'transaction_time'>) {
    const { data, error } = await supabase.from('shop_transactions').insert(transaction).select().single();
    if (error) throw error;
    return data;
  },
};
