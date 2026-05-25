-- ==========================================
-- MASTER DATABASE RESET SCRIPT
-- ==========================================

-- 1. ENABLE NECESSARY EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CLEANUP: DROP EVERYTHING (Dependency Order)
DROP VIEW IF EXISTS public.user_registrations CASCADE;
DROP TABLE IF EXISTS shop_transactions CASCADE;
DROP TABLE IF EXISTS shop_items CASCADE;
DROP TABLE IF EXISTS player_shops CASCADE;
DROP TABLE IF EXISTS shop_categories CASCADE;
DROP TABLE IF EXISTS plugins CASCADE;
DROP TABLE IF EXISTS plugin_categories CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS rule_views CASCADE;
DROP TABLE IF EXISTS reminder_reads CASCADE;
DROP TABLE IF EXISTS minecraft_versions CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS rules CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS message_reads CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_members CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS event_rsvps CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP FUNCTION IF EXISTS is_conversation_member CASCADE;
DROP FUNCTION IF EXISTS is_user_approved CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS delete_old_notifications CASCADE;
DROP FUNCTION IF EXISTS delete_old_transactions CASCADE;
DROP FUNCTION IF EXISTS delete_old_messages CASCADE;
DROP FUNCTION IF EXISTS purchase_shop_item CASCADE;

-- 3. CORE TABLES
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    minecraft_username TEXT UNIQUE,
    avatar_url TEXT,
    role TEXT DEFAULT 'player' CHECK (role IN ('admin', 'player')),
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'banned')),
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    bio TEXT,
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messaging
CREATE TABLE conversations (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT, is_group BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE conversation_members (conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE, profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE, joined_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (conversation_id, profile_id));
CREATE TABLE messages (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE, sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE message_reads (message_id UUID REFERENCES messages(id) ON DELETE CASCADE, profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE, read_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (message_id, profile_id));

-- Events & Social
CREATE TABLE events (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, title TEXT NOT NULL, description TEXT, start_time TIMESTAMPTZ NOT NULL, end_time TIMESTAMPTZ, location TEXT, created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE event_rsvps (event_id UUID REFERENCES events(id) ON DELETE CASCADE, profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE, status TEXT CHECK (status IN ('joined', 'maybe', 'declined')), created_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (event_id, profile_id));
CREATE TABLE notifications (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE, title TEXT NOT NULL, message TEXT NOT NULL, type TEXT CHECK (type IN ('event', 'announcement', 'message', 'system')), link TEXT, is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE announcements (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now());

-- Badges
CREATE TABLE badges (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, color TEXT NOT NULL, icon_url TEXT, is_visible BOOLEAN DEFAULT TRUE, priority INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), created_by UUID REFERENCES profiles(id) ON DELETE SET NULL);
CREATE TABLE user_badges (user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, badge_id UUID REFERENCES badges(id) ON DELETE CASCADE, assigned_at TIMESTAMPTZ DEFAULT now(), assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL, is_active BOOLEAN DEFAULT TRUE, PRIMARY KEY (user_id, badge_id));

-- Shops & Plugins
CREATE TABLE shop_categories (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, icon_url TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE player_shops (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, name TEXT NOT NULL, description TEXT, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), UNIQUE(owner_id, name));
CREATE TABLE shop_items (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, shop_id UUID REFERENCES player_shops(id) ON DELETE CASCADE NOT NULL, item_name TEXT NOT NULL, minecraft_item_id TEXT NOT NULL, price NUMERIC NOT NULL, currency TEXT DEFAULT 'diamond' NOT NULL, quantity INTEGER DEFAULT 1 NOT NULL, description TEXT, availability_status TEXT DEFAULT 'in_stock' CHECK (availability_status IN ('in_stock', 'out_of_stock', 'on_order')), category_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL, is_visible BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE shop_transactions (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, shop_item_id UUID REFERENCES shop_items(id) ON DELETE SET NULL, buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL, price NUMERIC NOT NULL, currency TEXT NOT NULL, quantity INTEGER NOT NULL, transaction_time TIMESTAMPTZ DEFAULT now());
CREATE TABLE plugin_categories (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, icon_url TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE plugins (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, icon_url TEXT, category TEXT, version TEXT, is_visible BOOLEAN DEFAULT TRUE, created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());

-- Misc
CREATE TABLE rules (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, is_pinned BOOLEAN DEFAULT false, is_visible BOOLEAN DEFAULT true, priority INTEGER DEFAULT 0, category TEXT, created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE rule_views (rule_id UUID REFERENCES rules(id) ON DELETE CASCADE, profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE, viewed_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (rule_id, profile_id));
CREATE TABLE minecraft_versions (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, version_string TEXT NOT NULL UNIQUE, is_supported BOOLEAN DEFAULT true, is_recommended BOOLEAN DEFAULT false, maintenance_mode BOOLEAN DEFAULT false, supports_java BOOLEAN DEFAULT true, supports_bedrock BOOLEAN DEFAULT false, changelog TEXT, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE reminders (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, title TEXT NOT NULL, message TEXT NOT NULL, scheduled_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, is_important BOOLEAN DEFAULT false, target_role TEXT, target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE reminder_reads (reminder_id UUID REFERENCES reminders(id) ON DELETE CASCADE, profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE, is_read BOOLEAN DEFAULT false, read_at TIMESTAMPTZ, PRIMARY KEY (reminder_id, profile_id));
CREATE TABLE activity_logs (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, action TEXT NOT NULL, details JSONB, created_at TIMESTAMPTZ DEFAULT now());

-- 4. FUNCTIONS
CREATE OR REPLACE FUNCTION is_user_approved() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (approval_status = 'approved' OR role = 'admin'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_conversation_member(conv_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conv_id AND profile_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION purchase_shop_item(p_item_id UUID, p_buyer_id UUID, p_quantity INTEGER) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_item RECORD; v_transaction_id UUID; v_total_price NUMERIC;
BEGIN
    SELECT i.*, s.owner_id INTO v_item FROM shop_items i JOIN player_shops s ON i.shop_id = s.id WHERE i.id = p_item_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;
    IF v_item.quantity < p_quantity THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
    IF v_item.owner_id = p_buyer_id THEN RAISE EXCEPTION 'You cannot buy from your own shop'; END IF;
    v_total_price := v_item.price * p_quantity;
    UPDATE shop_items SET quantity = quantity - p_quantity WHERE id = p_item_id;
    INSERT INTO shop_transactions (shop_item_id, buyer_id, seller_id, price, currency, quantity) VALUES (p_item_id, p_buyer_id, v_item.owner_id, v_total_price, v_item.currency, p_quantity) RETURNING id INTO v_transaction_id;
    INSERT INTO notifications (profile_id, title, message, type, link) VALUES (v_item.owner_id, 'Item Sold!', 'You sold ' || p_quantity || 'x ' || v_item.item_name || ' for ' || v_total_price || ' ' || v_item.currency || '.', 'system', '/shops/' || v_item.shop_id);
    RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$$;

-- 5. VIEWS
CREATE OR REPLACE VIEW public.user_registrations AS
SELECT p.id, p.username, p.minecraft_username, p.created_at, p.approval_status, u.email
FROM public.profiles p JOIN auth.users u ON p.id = u.id;
GRANT SELECT ON public.user_registrations TO authenticated;

-- 6. ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_transactions ENABLE ROW LEVEL SECURITY;

-- 7. POLICIES
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Admin update profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "View own conversations" ON conversations FOR SELECT USING (is_user_approved() AND is_conversation_member(id));
CREATE POLICY "View messages" ON messages FOR SELECT USING (is_user_approved() AND is_conversation_member(conversation_id));
CREATE POLICY "View own transactions" ON shop_transactions FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
