import { supabase } from './supabase';
import type { Event, EventRSVP, Profile, Announcement, Plugin, ShopCategory, PlayerShop, ShopItem, PluginCategory, ShopTransaction, Reminder, Badge, CommunityMember, Category, SubCategory } from '../types/database.types';

export const dbService = {
  // --- Profiles & Admin ---
  async getAllProfiles(includeBanned: boolean = false) {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        user_badges!user_badges_user_id_fkey (
          badge_id,
          badges (
            id, name, description, color, icon_url, is_visible, priority
          )
        )
      `)
      .order('username', { ascending: true });
    
    if (!includeBanned) {
      query = query.eq('is_banned', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async updateProfile(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteProfile(id: string) {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
    return true;
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

  // --- Community Members ---
  async getCommunityMembers() {
    // We want members with sort_order > 0 to appear first, in order.
    // Members with sort_order = 0 (unranked) should appear last.
    const { data, error } = await supabase
      .from('community_members')
      .select(`
        *,
        community_member_badges (
          badge_id,
          badges (
            id, name, description, color, icon_url, is_visible, priority
          )
        )
      `)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('username', { ascending: true });
    
    if (error) throw error;

    // Further refine sorting in-memory to treat 0 as last
    return (data as any[]).sort((a, b) => {
      const valA = a.sort_order === 0 ? 999999 : a.sort_order;
      const valB = b.sort_order === 0 ? 999999 : b.sort_order;
      if (valA !== valB) return valA - valB;
      return a.username.localeCompare(b.username);
    });
  },

  async createCommunityMember(member: Omit<CommunityMember, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('community_members').insert(member).select().single();
    if (error) throw error;
    return data;
  },

  async updateCommunityMember(id: string, updates: Partial<CommunityMember>) {
    const { data, error } = await supabase.from('community_members').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteCommunityMember(id: string) {
    const { error } = await supabase.from('community_members').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async assignBadgeToCommunityMember(memberId: string, badgeId: string) {
    const { data, error } = await supabase.from('community_member_badges').insert({ member_id: memberId, badge_id: badgeId }).select().single();
    if (error) throw error;
    return data;
  },

  async removeBadgeFromCommunityMember(memberId: string, badgeId: string) {
    const { error } = await supabase.from('community_member_badges').delete().eq('member_id', memberId).eq('badge_id', badgeId);
    if (error) throw error;
    return true;
  },

  async uploadMemberAvatar(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `members/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  },

  // --- Badges ---
  async createBadge(badge: Omit<Badge, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('badges').insert(badge).select().single();
    if (error) throw error;
    return data;
  },

  async getBadges() {
    const { data, error } = await supabase.from('badges').select('*').order('priority', { ascending: false }).order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getBadgeById(id: string) {
    const { data, error } = await supabase.from('badges').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async updateBadge(id: string, updates: Partial<Badge>) {
    const { data, error } = await supabase.from('badges').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteBadge(id: string) {
    const { error } = await supabase.from('badges').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- User Badges ---
  async assignBadgeToUser(userId: string, badgeId: string, assignedBy: string) {
    const { data, error } = await supabase.from('user_badges').insert({ user_id: userId, badge_id: badgeId, assigned_by: assignedBy }).select().single();
    if (error) throw error;
    return data;
  },

  async removeBadgeFromUser(userId: string, badgeId: string) {
    const { error } = await supabase.from('user_badges').delete().eq('user_id', userId).eq('badge_id', badgeId);
    if (error) throw error;
    return true;
  },

  async getUserBadges(userId: string) {
    const { data, error } = await supabase.from('user_badges').select('*, badges(*)').eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async getUsersWithBadge(badgeId: string) {
    const { data, error } = await supabase.from('user_badges').select('*, profiles!user_id(username, avatar_url)').eq('badge_id', badgeId);
    if (error) throw error;
    return data;
  },

  // --- Events ---
  async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*, profiles!created_by(username)')
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createEvent(event: Omit<Event, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('events').insert(event).select().single();
    if (error) throw error;
    await this.notifyAllUsers('New Event Scheduled', `New event: ${event.title}`, 'event', '/events', event.created_by);
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
    const { data, error } = await supabase.from('event_rsvps').select('*, profiles!profile_id(username, avatar_url)').eq('event_id', eventId);
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

  async markAllNotificationsRead(profileId: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('profile_id', profileId);
    if (error) throw error;
  },

  async createNotification(profileId: string, title: string, message: string, type: 'event' | 'announcement' | 'message' | 'system', link?: string) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ profile_id: profileId, title, message, type, link })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async notifyAllUsers(title: string, message: string, type: 'event' | 'announcement' | 'message' | 'system', link?: string, excludeUserId?: string) {
    try {
      let query = supabase.from('profiles').select('id');
      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }
      const { data: profiles, error } = await query;
      if (error) throw error;
      const notifications = profiles.map(p => ({ profile_id: p.id, title, message, type, link }));
      const { error: insertError } = await supabase.from('notifications').insert(notifications);
      if (insertError) throw insertError;
    } catch (err) {
      console.error('dbService: [NOTIFY] Unexpected error:', err);
    }
  },

  // --- Announcements ---
  async getAnnouncements() {
    const { data, error } = await supabase.from('announcements').select('*, profiles!created_by(username)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('announcements').insert(announcement).select().single();
    if (error) throw error;
    await this.notifyAllUsers('New Announcement', announcement.title, 'announcement', '/dashboard', announcement.created_by);
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

  async createReminder(reminder: Omit<Reminder, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('reminders').insert(reminder).select().single();
    if (error) throw error;
    await this.notifyAllUsers('New Reminder', reminder.title, 'system', '/server-info', reminder.created_by || undefined);
    return data;
  },


  // --- Suggestions ---
  async getSuggestions() {
    const { data, error } = await supabase.from('suggestions').select('*, profiles!user_id(username)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async createSuggestion(suggestion: { user_id: string; title: string; description: string }) {
    const { data, error } = await supabase.from('suggestions').insert(suggestion).select().single();
    if (error) throw error;
    return data;
  },
  async deleteSuggestion(id: string) {
    const { error } = await supabase.from('suggestions').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Help Requests ---
  async getHelpRequests() {
    const { data, error } = await supabase.from('help_requests').select('*, profiles!user_id(username)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async createHelpRequest(request: { user_id: string; subject: string; message: string }) {
    const { data, error } = await supabase.from('help_requests').insert(request).select().single();
    if (error) throw error;
    return data;
  },
  async deleteHelpRequest(id: string) {
    const { error } = await supabase.from('help_requests').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Commands ---
  async getCommands() {
    const { data, error } = await supabase.from('commands').select('*').order('name', { ascending: true });
    if (error) throw error;
    return data;
  },
  async createCommand(command: { 
    name: string; 
    description: string; 
    plugin_title?: string; 
    plugin_description?: string; 
    url?: string;
    syntax?: string;
    permission?: string;
    commands_data?: { command: string; description: string }[];
  }) {
    const { data, error } = await supabase.from('commands').insert({
      ...command,
      created_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async updateCommand(id: string, updates: { 
    name?: string; 
    description?: string; 
    plugin_title?: string; 
    plugin_description?: string; 
    url?: string;
    syntax?: string;
    permission?: string;
    commands_data?: { command: string; description: string }[];
  }) {
    const { data, error } = await supabase.from('commands').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteCommand(id: string) {
    const { error } = await supabase.from('commands').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Guides ---
  async getGuides() {
    const { data, error } = await supabase.from('guides').select('*').order('title', { ascending: true });
    if (error) throw error;
    return data;
  },
  async createGuide(guide: any) {
    const { data, error } = await supabase.from('guides').insert({
      ...guide,
      created_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async updateGuide(id: string, updates: any) {
    const { data, error } = await supabase.from('guides').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteGuide(id: string) {
    const { error } = await supabase.from('guides').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async uploadGuideImage(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `guides/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars') // Using existing 'avatars' bucket for simplicity if it's general purpose
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
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
    await this.notifyAllUsers('New Plugin Available', plugin.name, 'system', '/plugins', plugin.created_by || undefined);
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

  // --- Categories ---
  async getCategories() {
    const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true }).order('name', { ascending: true });
    if (error) throw error;
    return data;
  },
  async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('categories').insert(category).select().single();
    if (error) throw error;
    return data;
  },
  async updateCategory(id: string, updates: Partial<Category>) {
    const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Sub-Categories ---
  async getSubCategories(categoryId?: string) {
    let query = supabase.from('sub_categories').select('*, categories(*)').order('display_order', { ascending: true }).order('name', { ascending: true });
    if (categoryId) query = query.eq('category_id', categoryId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async createSubCategory(subCategory: Omit<SubCategory, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('sub_categories').insert(subCategory).select().single();
    if (error) throw error;
    return data;
  },
  async updateSubCategory(id: string, updates: Partial<SubCategory>) {
    const { data, error } = await supabase.from('sub_categories').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteSubCategory(id: string) {
    const { error } = await supabase.from('sub_categories').delete().eq('id', id);
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
    const { data, error } = await supabase
      .from('player_shops')
      .select('id, owner_id, owner_name, nickname, name, description, banner_url, is_active, created_at, updated_at, shop_items(*, categories(name), sub_categories(name))')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getPlayerShopById(id: string) {
    const { data, error } = await supabase.from('player_shops').select('*').eq('id', id).single();
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

  async uploadShopBanner(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `shops/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  },

  // --- Shop Items ---
  async getShopItems() {
    const { data, error } = await supabase.from('shop_items').select('*, player_shops(name), categories(name), sub_categories(name)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getShopItemById(id: string) {
    const { data, error } = await supabase.from('shop_items').select('*, player_shops(name), categories(name), sub_categories(name)').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async getShopItemsByShop(shopId: string) {
    const { data, error } = await supabase.from('shop_items').select('*, player_shops(name), categories(name), sub_categories(name)').eq('shop_id', shopId).order('created_at', { ascending: false });
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
    const { data, error } = await supabase.from('shop_transactions').select(`
      *,
      shop_items(item_name, minecraft_item_id),
      buyer:profiles!buyer_id(username),
      seller:profiles!seller_id(username)
    `).order('transaction_time', { ascending: false });
    if (error) throw error;
    return data;
  },

  async purchaseItem(itemId: string, buyerId: string, quantity: number = 1) {
    const { data, error } = await supabase.rpc('purchase_shop_item', {
      p_item_id: itemId,
      p_buyer_id: buyerId,
      p_quantity: quantity
    });

    if (error) throw error;
    return data;
  },

  async getShopTransactionById(id: string) {
    const { data, error } = await supabase.from('shop_transactions').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async getShopTransactionsByBuyer(buyerId: string) {
    const { data, error } = await supabase
      .from('shop_transactions')
      .select('*, shop_items(item_name, minecraft_item_id, player_shops(name, profiles!owner_id(username)))')
      .eq('buyer_id', buyerId)
      .order('transaction_time', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getShopTransactionsBySeller(sellerId: string) {
    const { data, error } = await supabase
      .from('shop_transactions')
      .select('*, shop_items(item_name, minecraft_item_id, player_shops(name, profiles!owner_id(username)))')
      .eq('seller_id', sellerId)
      .order('transaction_time', { ascending: false });
    if (error) throw error;
    return data;
  },
  async createShopTransaction(transaction: Omit<ShopTransaction, 'id' | 'transaction_time'>) {
    const { data, error } = await supabase.from('shop_transactions').insert(transaction).select().single();
    if (error) throw error;
    return data;
  },
};
