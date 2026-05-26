-- ==========================================
-- FULL DATABASE BACKUP — SINGLE RUN SCRIPT
-- Minecraft Server Web App
-- ==========================================

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
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP VIEW IF EXISTS public.user_registrations CASCADE;

DROP FUNCTION IF EXISTS is_conversation_member CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS delete_old_notifications CASCADE;
DROP FUNCTION IF EXISTS delete_old_messages CASCADE;
DROP FUNCTION IF EXISTS delete_old_transactions CASCADE;
DROP FUNCTION IF EXISTS purchase_shop_item CASCADE;
DROP FUNCTION IF EXISTS get_user_email CASCADE;
DROP FUNCTION IF EXISTS is_user_approved CASCADE;


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
    -- Approval workflow columns
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'banned')),
    approved_by UUID REFERENCES auth.users ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
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
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Shop Categories & Shops
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
    unit_size INTEGER DEFAULT 1,
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

-- Orders
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shop_id UUID REFERENCES player_shops(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES shop_items(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- Plugins
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

-- Rules, Versions, Reminders, Activity
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

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conversation membership check (SECURITY DEFINER to break RLS recursion)
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

-- Approval status check (SECURITY DEFINER, admins bypass)
CREATE OR REPLACE FUNCTION is_user_approved()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
        AND (approval_status = 'approved' OR role = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure email lookup (admin-only)
CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RETURN (SELECT email FROM auth.users WHERE id = user_id);
    ELSE
        RETURN NULL;
    END IF;
END;
$$;

-- Cron cleanup: old notifications (30 days)
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Cron cleanup: old messages (1 day)
CREATE OR REPLACE FUNCTION delete_old_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM messages
    WHERE created_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Cron cleanup: old transactions (3 days)
CREATE OR REPLACE FUNCTION delete_old_transactions()
RETURNS void AS $$
BEGIN
    DELETE FROM shop_transactions
    WHERE transaction_time < NOW() - INTERVAL '3 days';
END;
$$ LANGUAGE plpgsql;

-- Secure purchase RPC
CREATE OR REPLACE FUNCTION purchase_shop_item(
    p_item_id UUID,
    p_buyer_id UUID,
    p_quantity INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_transaction_id UUID;
    v_total_price NUMERIC;
BEGIN
    SELECT i.*, s.owner_id INTO v_item
    FROM shop_items i
    JOIN player_shops s ON i.shop_id = s.id
    WHERE i.id = p_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item not found';
    END IF;

    IF v_item.quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock';
    END IF;

    IF v_item.owner_id = p_buyer_id THEN
        RAISE EXCEPTION 'You cannot buy from your own shop';
    END IF;

    v_total_price := v_item.price * p_quantity;

    UPDATE shop_items
    SET quantity = quantity - p_quantity
    WHERE id = p_item_id;

    INSERT INTO shop_transactions (
        shop_item_id, buyer_id, seller_id, price, currency, quantity
    )
    VALUES (
        p_item_id, p_buyer_id, v_item.owner_id, v_total_price, v_item.currency, p_quantity
    )
    RETURNING id INTO v_transaction_id;

    INSERT INTO notifications (profile_id, title, message, type, link)
    VALUES (
        v_item.owner_id,
        'Item Sold!',
        'You sold ' || p_quantity || 'x ' || v_item.item_name || ' for ' || v_total_price || ' ' || v_item.currency || '.',
        'system',
        '/shops/' || v_item.shop_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'new_quantity', v_item.quantity - p_quantity
    );
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER tr_update_profiles
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_convs
    BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_shops
    BEFORE UPDATE ON player_shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_shop_items
    BEFORE UPDATE ON shop_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_orders
    BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 4. VIEWS
-- ==========================================

CREATE OR REPLACE VIEW public.user_registrations AS
SELECT
    p.id,
    p.username,
    p.minecraft_username,
    p.created_at,
    p.approval_status,
    get_user_email(p.id) AS email
FROM public.profiles p;

GRANT SELECT ON public.user_registrations TO authenticated;


-- ==========================================
-- 5. ENABLE RLS
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
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE minecraft_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 6. RLS POLICIES
-- ==========================================

-- Profiles
CREATE POLICY "Profiles are public" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
    USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Messaging (permissive for authenticated users)
CREATE POLICY "permissive_conversations" ON conversations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "permissive_members" ON conversation_members
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "permissive_messages" ON messages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Delete own messages" ON messages
    FOR DELETE USING (
        auth.uid() = sender_id OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Manage own reads" ON message_reads
    FOR ALL USING (profile_id = auth.uid());

-- Events & Social
CREATE POLICY "Public select events" ON events FOR SELECT USING (true);
CREATE POLICY "Admin manage events" ON events FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public select rsvps" ON event_rsvps FOR SELECT USING (true);
CREATE POLICY "Manage own rsvps" ON event_rsvps FOR ALL
    USING (auth.uid() = profile_id);

-- Notifications
CREATE POLICY "View own notifications" ON notifications FOR SELECT
    USING (auth.uid() = profile_id);
CREATE POLICY "Update own notifications" ON notifications FOR UPDATE
    USING (auth.uid() = profile_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT
    WITH CHECK (true);

-- Announcements
CREATE POLICY "Public select announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admin manage announcements" ON announcements FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Badges
CREATE POLICY "Public select badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Admin manage badges" ON badges FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Public select user_badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Admin manage user_badges" ON user_badges FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Shop Categories
CREATE POLICY "Shop categories are viewable by everyone" ON shop_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage shop categories" ON shop_categories FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Player Shops
CREATE POLICY "authenticated_view_shops" ON player_shops FOR SELECT
    USING (is_user_approved());
CREATE POLICY "Manage own shop" ON player_shops FOR ALL
    USING (
        auth.uid() = owner_id OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Shop Items
CREATE POLICY "authenticated_view_items" ON shop_items FOR SELECT
    USING (is_user_approved());
CREATE POLICY "Manage own items" ON shop_items FOR ALL
    USING (
        EXISTS (SELECT 1 FROM player_shops WHERE id = shop_id AND owner_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Shop Transactions
CREATE POLICY "view_own_transactions" ON shop_transactions FOR SELECT
    USING (
        auth.uid() = buyer_id OR
        auth.uid() = seller_id OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Orders
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT
    USING (auth.uid() = buyer_id);
CREATE POLICY "Shop owners can view orders for their shop" ON orders FOR SELECT
    USING (EXISTS (SELECT 1 FROM player_shops WHERE id = shop_id AND owner_id = auth.uid()));
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND buyer_id = auth.uid()));
CREATE POLICY "Shop owners can view order items for their shop" ON order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM orders
        JOIN player_shops ON orders.shop_id = player_shops.id
        WHERE orders.id = order_id AND player_shops.owner_id = auth.uid()
    ));
CREATE POLICY "Admins can manage all order items" ON order_items FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Plugins
CREATE POLICY "Public select plugins" ON plugins FOR SELECT USING (true);
CREATE POLICY "Admin manage plugins" ON plugins FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Plugin Categories
CREATE POLICY "Admins can manage plugin categories" ON plugin_categories FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Rules & Misc
CREATE POLICY "Public select rules" ON rules FOR SELECT USING (true);
CREATE POLICY "Admin manage rules" ON rules FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public select versions" ON minecraft_versions FOR SELECT USING (true);
CREATE POLICY "Admin manage versions" ON minecraft_versions FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Manage own reminder reads" ON reminder_reads FOR ALL
    USING (auth.uid() = profile_id);


-- ==========================================
-- 7. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(profile_id);


-- ==========================================
-- 8. REALTIME
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER TABLE profiles REPLICA IDENTITY FULL;


-- ==========================================
-- 9. CRON JOBS (requires pg_cron extension)
-- ==========================================
SELECT cron.schedule(
    'prune-notifications-monthly',
    '0 0 1 * *',
    'SELECT delete_old_notifications()'
);

SELECT cron.schedule(
    'prune-messages-daily',
    '0 0 * * *',
    'SELECT delete_old_messages()'
);

SELECT cron.schedule(
    'prune-trade-history',
    '0 0 * * *',
    'SELECT delete_old_transactions()'
);


-- ==========================================
-- 10. SEED: INITIAL ADMIN USER
-- ==========================================
DO $$
DECLARE
    target_email TEXT := 'yarngigi45@gmail.com';
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;

    IF user_id IS NULL THEN
        user_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, recovery_sent_at, last_sign_in_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            user_id, 'authenticated', 'authenticated',
            target_email,
            crypt('Ikaypotato22', gen_salt('bf')),
            now(), now(), now(),
            '{"provider":"email","providers":["email"]}', '{}',
            now(), now(), '', '', '', ''
        );
    ELSE
        UPDATE auth.users
        SET
            email_confirmed_at = now(),
            encrypted_password = crypt('Ikaypotato22', gen_salt('bf')),
            updated_at = now()
        WHERE id = user_id;
    END IF;

    INSERT INTO public.profiles (id, username, role, status, approval_status)
    VALUES (user_id, 'Admin', 'admin', 'online', 'approved')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', username = 'Admin', approval_status = 'approved';
END $$;
