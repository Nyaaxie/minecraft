-- Database Schema for StrawberrySMP

-- 1. Profiles table (linked to Auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    minecraft_username TEXT UNIQUE,
    avatar_url TEXT,
    role TEXT DEFAULT 'player' CHECK (role IN ('admin', 'player')),
    status TEXT DEFAULT 'offline' CHECK (
        status IN ('online', 'offline')
    ),
    bio TEXT,
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Events table
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location TEXT,
    created_by UUID REFERENCES profiles (id) ON DELETE SET NULL,
    status TEXT DEFAULT 'upcoming' CHECK (
        status IN (
            'upcoming',
            'ongoing',
            'completed',
            'cancelled'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Event RSVPs
CREATE TABLE event_rsvps (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    event_id UUID REFERENCES events (id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    status TEXT CHECK (
        status IN ('joined', 'maybe', 'declined')
    ),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (event_id, profile_id)
);

-- 4. Notifications
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    profile_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (
        type IN (
            'event',
            'announcement',
            'message',
            'system'
        )
    ),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Announcements
CREATE TABLE announcements (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Messages
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    sender_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Activity Logs
CREATE TABLE activity_logs (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    profile_id UUID REFERENCES profiles (id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies
-- Profiles: Everyone can read public info, only owner can update
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR
SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid () = id);

-- Events: Everyone can read, only admins can manage
CREATE POLICY "Events are viewable by everyone" ON events FOR
SELECT USING (true);

CREATE POLICY "Admins can manage events" ON events FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

-- 8. Rules table
CREATE TABLE rules (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    category TEXT,
    created_by UUID REFERENCES profiles (id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Reminders table
CREATE TABLE reminders (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_important BOOLEAN DEFAULT false,
    target_role TEXT,
    target_user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Minecraft Versions table
CREATE TABLE minecraft_versions (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    version_string TEXT NOT NULL UNIQUE,
    is_supported BOOLEAN DEFAULT true,
    is_recommended BOOLEAN DEFAULT false,
    maintenance_mode BOOLEAN DEFAULT false,
    supports_java BOOLEAN DEFAULT true,
    supports_bedrock BOOLEAN DEFAULT false,
    changelog TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Reminder Reads
CREATE TABLE reminder_reads (
    reminder_id UUID REFERENCES reminders (id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    PRIMARY KEY (reminder_id, profile_id)
);

-- 12. Rule Views
CREATE TABLE rule_views (
    rule_id UUID REFERENCES rules (id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (rule_id, profile_id)
);

-- Enable RLS
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

ALTER TABLE minecraft_versions ENABLE ROW LEVEL SECURITY;

ALTER TABLE reminder_reads ENABLE ROW LEVEL SECURITY;

ALTER TABLE rule_views ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Rules are viewable by everyone" ON rules FOR
SELECT USING (true);

CREATE POLICY "Admins can manage rules" ON rules FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

CREATE POLICY "Reminders are viewable by everyone" ON reminders FOR
SELECT USING (true);

CREATE POLICY "Admins can manage reminders" ON reminders FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

CREATE POLICY "Versions are viewable by everyone" ON minecraft_versions FOR
SELECT USING (true);

CREATE POLICY "Admins can manage versions" ON minecraft_versions FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

CREATE POLICY "Users can manage their reminder reads" ON reminder_reads FOR ALL USING (auth.uid () = profile_id);

CREATE POLICY "Users can manage their rule views" ON rule_views FOR ALL USING (auth.uid () = profile_id);

-- Modify profiles table
ALTER TABLE profiles
ADD COLUMN favorite_mob TEXT,
ADD COLUMN favorite_block TEXT,
ADD COLUMN favorite_color TEXT,
ADD COLUMN minecraft_edition TEXT CHECK (
    minecraft_edition IN ('java', 'bedrock')
);

-- 13. Badges table
CREATE TABLE badges (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT NOT NULL,
    icon_url TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES profiles (id) ON DELETE SET NULL
);

-- 14. User Badges table (join table)
CREATE TABLE user_badges (
    user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges (id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    assigned_by UUID REFERENCES profiles (id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, badge_id)
);

-- Enable RLS for new tables
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for badges
CREATE POLICY "Badges are viewable by everyone" ON badges FOR
SELECT USING (true);

CREATE POLICY "Admins can manage badges" ON badges FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

-- Policies for user_badges
CREATE POLICY "User badges are viewable by everyone" ON user_badges FOR
SELECT USING (true);

coCREATE POLICY "Admins can assign and revoke user badges" ON user_badges FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);
