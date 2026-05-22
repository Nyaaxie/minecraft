export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'player'
export type ProfileStatus = 'online' | 'offline'

export interface Profile {
  id: string
  username: string | null
  minecraft_username: string | null
  avatar_url: string | null
  role: UserRole
  status: ProfileStatus
  bio: string | null
  is_banned: boolean
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  location: string | null
  created_by: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  created_at: string
}

export interface EventRSVP {
  id: string
  event_id: string
  profile_id: string
  status: 'joined' | 'maybe' | 'declined'
  created_at: string
}

export interface Notification {
  id: string
  profile_id: string
  title: string
  message: string
  type: 'event' | 'announcement' | 'message' | 'system'
  is_read: boolean
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  created_by: string
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export interface ActivityLog {
  id: string
  profile_id: string
  action: string
  details: Json
  created_at: string
}

export interface Rule {
  id: string
  title: string
  content: string
  is_pinned: boolean
  is_visible: boolean
  priority: number
  category: string | null
  created_by: string | null
  updated_at: string
}

export interface Reminder {
  id: string
  title: string
  message: string
  scheduled_at: string | null
  expires_at: string | null
  is_important: boolean
  target_role: string | null
  target_user_id: string | null
  created_by: string | null
  created_at: string
}

export interface MinecraftVersion {
  id: string
  version_string: string
  is_supported: boolean
  is_recommended: boolean
  maintenance_mode: boolean
  supports_java: boolean
  supports_bedrock: boolean
  changelog: string | null
  updated_at: string
}

// For Plugins Showcase System
export interface Plugin {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  category: string | null;
  version: string | null;
  is_visible: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// For Player Shop Categories
export interface ShopCategory {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
}

// For Player Shops
export interface PlayerShop {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// For Shop Items
export interface ShopItem {
  id: string;
  shop_id: string;
  item_name: string;
  minecraft_item_id: string; // e.g., "minecraft:diamond_sword"
  price: number;
  currency: string; // e.g., "diamond", "emerald", "iron_ingot"
  quantity: number;
  description: string | null;
  availability_status: 'in_stock' | 'out_of_stock' | 'on_order';
  category_id: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  shop_categories?: { name: string } | null; // Joined data
}

