export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'player'
export type ProfileStatus = 'online' | 'offline'
export type MinecraftEdition = 'java' | 'bedrock'

export interface Profile {
  id: string
  username: string | null
  minecraft_username: string | null
  avatar_url: string | null
  role: UserRole
  status: ProfileStatus
  bio: string | null
  is_banned: boolean
  approval_status: 'pending' | 'approved' | 'rejected' | 'banned'
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  theme_preference: 'dark' | 'light' | null
  created_at: string
  updated_at: string
  favorite_mob: string | null
  favorite_block: string | null
  favorite_color: string | null
  minecraft_edition: MinecraftEdition | null
  social_links: string | null
  bedrock_username: string | null
  birthmonth: string | null
  join_date: string | null
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
  id: string;
  profile_id: string;
  title: string;
  message: string;
  type: 'event' | 'announcement' | 'message' | 'system';
  is_read: boolean;
  created_at: string;
  link?: string | null;
}

export interface Announcement {
  id: string
  title: string
  content: string
  created_by: string
  created_at: string
}

// Updated Message interface — supports conversation-based messaging
export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  updated_at?: string
  sender?: {
    id: string
    username: string
    avatar_url: string | null
  }
}

// New Conversation interface
export interface Conversation {
  id: string
  name: string | null
  is_group: boolean
  created_at: string
  updated_at: string
  avatar_url?: string | null
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

export interface ShopCategory {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityMember {
  id: string
  username: string
  nickname: string | null
  avatar_url: string | null
  favorite_mob: string | null
  favorite_block: string | null
  favorite_color: string | null
  favorite_biome: string | null
  favorite_role: string | null
  social_links: string | null
  bio: string | null
  birth_month: string | null
  birthday: string | null
  age: number | null
  join_date: string | null
  created_at: string
  updated_at: string
}

export interface CommunityMemberBadge {
  member_id: string
  badge_id: string
  assigned_at: string
}

export interface PlayerShop {
  id: string;
  owner_id: string | null;
  owner_name: string | null;
  name: string;
  description: string | null;
  banner_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
}

export interface ShopItem {
  id: string;
  shop_id: string;
  item_name: string;
  minecraft_item_id: string;
  price: number;
  currency: string;
  quantity: number;
  unit_size: number;
  unit_display: string | null;
  custom_image_url: string | null;
  description: string | null;
  availability_status: 'in_stock' | 'out_of_stock' | 'on_order';
  category_id: string | null;
  sub_category_id: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  shop_categories?: { name: string } | null;
  categories?: Category | null;
  sub_categories?: SubCategory | null;
}

export interface PluginCategory {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopTransaction {
  id: string;
  shop_item_id: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  price: number;
  currency: string;
  quantity: number;
  transaction_time: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  shop_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
}

export interface Badge {
  id: string
  name: string
  description: string | null
  color: string
  icon_url: string | null
  is_visible: boolean
  priority: number
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ServerInfo {
  id: string
  label: string
  value: string
  created_at: string
}

export interface UserBadge {
  user_id: string
  badge_id: string
  assigned_at: string
  assigned_by: string | null
  is_active: boolean
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Profile, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Profile>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'> & Partial<Pick<Event, 'id' | 'created_at'>>
        Update: Partial<Event>
      }
      event_rsvps: {
        Row: EventRSVP
        Insert: Omit<EventRSVP, 'id' | 'created_at'> & Partial<Pick<EventRSVP, 'id' | 'created_at'>>
        Update: Partial<EventRSVP>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'> & Partial<Pick<Notification, 'id' | 'created_at'>>
        Update: Partial<Notification>
      }
      announcements: {
        Row: Announcement
        Insert: Omit<Announcement, 'id' | 'created_at'> & Partial<Pick<Announcement, 'id' | 'created_at'>>
        Update: Partial<Announcement>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'> & Partial<Pick<Message, 'id' | 'created_at'>>
        Update: Partial<Message>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Conversation, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Conversation>
      }
      activity_logs: {
        Row: ActivityLog
        Insert: Omit<ActivityLog, 'id' | 'created_at'> & Partial<Pick<ActivityLog, 'id' | 'created_at'>>
        Update: Partial<ActivityLog>
      }
      rules: {
        Row: Rule
        Insert: Omit<Rule, 'id' | 'updated_at'> & Partial<Pick<Rule, 'id' | 'updated_at'>>
        Update: Partial<Rule>
      }
      reminders: {
        Row: Reminder
        Insert: Omit<Reminder, 'id' | 'created_at'> & Partial<Pick<Reminder, 'id' | 'created_at'>>
        Update: Partial<Reminder>
      }
      minecraft_versions: {
        Row: MinecraftVersion
        Insert: Omit<MinecraftVersion, 'id' | 'updated_at'> & Partial<Pick<MinecraftVersion, 'id' | 'updated_at'>>
        Update: Partial<MinecraftVersion>
      }
      plugins: {
        Row: Plugin
        Insert: Omit<Plugin, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Plugin, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Plugin>
      }
      shop_categories: {
        Row: ShopCategory
        Insert: Omit<ShopCategory, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<ShopCategory, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<ShopCategory>
      }
      player_shops: {
        Row: PlayerShop
        Insert: Omit<PlayerShop, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<PlayerShop, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<PlayerShop>
      }
      shop_items: {
        Row: ShopItem
        Insert: Omit<ShopItem, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<ShopItem, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<ShopItem>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Order, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Order>
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id'> & Partial<Pick<OrderItem, 'id'>>
        Update: Partial<OrderItem>
      }
      plugin_categories: {
        Row: PluginCategory
        Insert: Omit<PluginCategory, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<PluginCategory, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<PluginCategory>
      }
      shop_transactions: {
        Row: ShopTransaction
        Insert: Omit<ShopTransaction, 'id'> & Partial<Pick<ShopTransaction, 'id'>>
        Update: Partial<ShopTransaction>
      }
      reminder_reads: {
        Row: {
          reminder_id: string;
          profile_id: string;
          is_read: boolean;
          read_at: string | null;
        };
        Insert: {
          reminder_id: string;
          profile_id: string;
          is_read?: boolean;
          read_at?: string | null;
        };
        Update: {
          reminder_id?: string;
          profile_id?: string;
          is_read?: boolean;
          read_at?: string | null;
        };
      }
      rule_views: {
        Row: {
          rule_id: string;
          profile_id: string;
          viewed_at: string;
        };
        Insert: {
          rule_id: string;
          profile_id: string;
          viewed_at?: string;
        };
        Update: {
          rule_id?: string;
          profile_id?: string;
          viewed_at?: string;
        };
      }
      badges: {
        Row: Badge
        Insert: Omit<Badge, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Badge, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Badge>
      }
      server_info: {
        Row: ServerInfo
        Insert: Omit<ServerInfo, 'id' | 'created_at'> & Partial<Pick<ServerInfo, 'id' | 'created_at'>>
        Update: Partial<ServerInfo>
      }
      user_badges: {
        Row: UserBadge
        Insert: Omit<UserBadge, 'assigned_at'> & Partial<Pick<UserBadge, 'assigned_at'>>
        Update: Partial<UserBadge>
      }
    }
    Enums: {
      user_role: UserRole
      profile_status: ProfileStatus
      minecraft_edition: MinecraftEdition
    }
    Functions: {}
  }
}