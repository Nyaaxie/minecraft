-- ==========================================
-- 1. CLEANUP: DROP EVERYTHING
-- ==========================================
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
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS delete_old_notifications CASCADE;

-- ==========================================
-- 2. CORE TABLES
-- ==========================================

-- Profiles
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    minecraft_username TEXT UNIQUE,
    avatar_url TEXT,
    role TEXT DEFAULT 'player' CHECK (role IN ('admin', 'player')),
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
    bio TEXT,
    theme_preference TEXT DEFAULT 'dark' CHECK (theme_preference IN ('dark', 'light')),
    favorite_mob TEXT,
    favorite_block TEXT,
    favorite_color TEXT,
    minecraft_edition TEXT CHECK (minecraft_edition IN ('java', 'bedrock')),
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messaging
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    is_group BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversation_members (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    last_read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (conversation_id, profile_id)
);

CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- For legacy/direct tracking
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE message_reads (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (message_id, profile_id)
);

-- Events & Social
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_rsvps (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('joined', 'maybe', 'declined')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (event_id, profile_id)
);

CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('event', 'announcement', 'message', 'system')),
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Badges
CREATE TABLE badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT NOT NULL,
    icon_url TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE user_badges (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, badge_id)
);

-- Shops & Plugins
CREATE TABLE shop_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE player_shops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(owner_id, name)
);

CREATE TABLE shop_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES player_shops(id) ON DELETE CASCADE NOT NULL,
    item_name TEXT NOT NULL,
    minecraft_item_id TEXT NOT NULL,
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'diamond' NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    description TEXT,
    availability_status TEXT DEFAULT 'in_stock' CHECK (availability_status IN ('in_stock', 'out_of_stock', 'on_order')),
    category_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE shop_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_item_id UUID REFERENCES shop_items(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    price NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    transaction_time TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plugin_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plugins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    category TEXT,
    version TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Misc (Rules, Versions, etc.)
CREATE TABLE rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    category TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rule_views (
    rule_id UUID REFERENCES rules(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (rule_id, profile_id)
);

CREATE TABLE minecraft_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_string TEXT NOT NULL UNIQUE,
    is_supported BOOLEAN DEFAULT true,
    is_recommended BOOLEAN DEFAULT false,
    maintenance_mode BOOLEAN DEFAULT false,
    supports_java BOOLEAN DEFAULT true,
    supports_bedrock BOOLEAN DEFAULT false,
    changelog TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_important BOOLEAN DEFAULT false,
    target_role TEXT,
    target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reminder_reads (
    reminder_id UUID REFERENCES reminders(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    PRIMARY KEY (reminder_id, profile_id)
);

CREATE TABLE activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. FUNCTIONS & TRIGGERS
-- ==========================================

-- Security Definer to BREAK RECURSION
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM conversation_members
        WHERE conversation_id = conv_id
        AND profile_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Cron Clean
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. ENABLE RLS
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE minecraft_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. POLICIES (FIXED & NON-RECURSIVE)
-- ==========================================

-- Profiles
CREATE POLICY "Profiles are public" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- MESSAGING
CREATE POLICY "View own conversations" ON conversations 
FOR SELECT USING (is_conversation_member(id));

CREATE POLICY "Create conversations" ON conversations 
FOR INSERT WITH CHECK (true);

CREATE POLICY "View member list" ON conversation_members 
FOR SELECT USING (is_conversation_member(conversation_id));

CREATE POLICY "Join conversations" ON conversation_members 
FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "View messages" ON messages 
FOR SELECT USING (is_conversation_member(conversation_id));

CREATE POLICY "Send messages" ON messages 
FOR INSERT WITH CHECK (is_conversation_member(conversation_id));

CREATE POLICY "Delete own messages" ON messages
FOR DELETE USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Manage own reads" ON message_reads 
FOR ALL USING (profile_id = auth.uid());

-- Events & Social
CREATE POLICY "Public select events" ON events FOR SELECT USING (true);
CREATE POLICY "Admin manage events" ON events FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public select rsvps" ON event_rsvps FOR SELECT USING (true);
CREATE POLICY "Manage own rsvps" ON event_rsvps FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "View own notifications" ON notifications FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Update own notifications" ON notifications FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Public select announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admin manage announcements" ON announcements FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Badges
CREATE POLICY "Public select badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Admin manage badges" ON badges FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Public select user_badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Admin manage user_badges" ON user_badges FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Shops & Plugins
CREATE POLICY "Public select shops" ON player_shops FOR SELECT USING (true);
CREATE POLICY "Manage own shop" ON player_shops FOR ALL USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public select shop_items" ON shop_items FOR SELECT USING (true);
CREATE POLICY "Manage own items" ON shop_items FOR ALL USING (EXISTS (SELECT 1 FROM player_shops WHERE id = shop_id AND owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "View own transactions" ON shop_transactions FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public select plugins" ON plugins FOR SELECT USING (true);
CREATE POLICY "Admin manage plugins" ON plugins FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Rules & Misc
CREATE POLICY "Public select rules" ON rules FOR SELECT USING (true);
CREATE POLICY "Admin manage rules" ON rules FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public select versions" ON minecraft_versions FOR SELECT USING (true);
CREATE POLICY "Admin manage versions" ON minecraft_versions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Manage own reminder reads" ON reminder_reads FOR ALL USING (auth.uid() = profile_id);

-- ==========================================
-- 6. INDEXES & TRIGGERS
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(profile_id);

CREATE TRIGGER tr_update_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_convs BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_shops BEFORE UPDATE ON player_shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_shop_items BEFORE UPDATE ON shop_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
