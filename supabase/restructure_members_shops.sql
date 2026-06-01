-- Restructure Members and Shops to be Admin-managed community directories

-- 1. Create community_members table
CREATE TABLE IF NOT EXISTS community_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    favorite_mob TEXT,
    favorite_block TEXT,
    favorite_color TEXT,
    bio TEXT,
    birth_month TEXT,
    age INTEGER,
    join_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create community_member_badges table
CREATE TABLE IF NOT EXISTS community_member_badges (
    member_id UUID REFERENCES community_members(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (member_id, badge_id)
);

-- 3. Modify player_shops table
-- First, add the new column
ALTER TABLE player_shops ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE player_shops ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Move existing data if any (optional, but good for continuity)
UPDATE player_shops ps
SET owner_name = p.username
FROM profiles p
WHERE ps.owner_id = p.id AND ps.owner_name IS NULL;

-- Remove the NOT NULL constraint from owner_id to allow admin-created shops without linked profiles
ALTER TABLE player_shops ALTER COLUMN owner_id DROP NOT NULL;
-- Drop the unique constraint that was (owner_id, name)
ALTER TABLE player_shops DROP CONSTRAINT IF EXISTS player_shops_owner_id_name_key;

-- 4. Modify shop_items table
-- Ensure unit_size is TEXT or add unit_display
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS unit_display TEXT;

-- 5. Enable RLS
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_member_badges ENABLE ROW LEVEL SECURITY;

-- 6. Policies for community_members
CREATE POLICY "Community members are viewable by everyone" ON community_members FOR SELECT USING (true);
CREATE POLICY "Admins can manage community members" ON community_members FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. Policies for community_member_badges
CREATE POLICY "Community member badges are viewable by everyone" ON community_member_badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage community member badges" ON community_member_badges FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 8. Update policies for player_shops
DROP POLICY IF EXISTS "Players can create and manage their own shops" ON player_shops;
-- Only admins can manage shops now
CREATE POLICY "Admins can manage player shops" ON player_shops FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 9. Update policies for shop_items
DROP POLICY IF EXISTS "Players can create and manage items in their own shops" ON shop_items;
-- Only admins can manage items now
CREATE POLICY "Admins can manage shop items" ON shop_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 10. Triggers for community_members
CREATE TRIGGER update_community_members_updated_at
BEFORE UPDATE ON community_members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
