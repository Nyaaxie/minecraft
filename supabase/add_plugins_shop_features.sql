-- Add tables for Plugins Showcase System and Player Shop System

-- Table for Plugins Showcase System
CREATE TABLE IF NOT EXISTS plugins (
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

-- Table for Player Shop Categories
CREATE TABLE IF NOT EXISTS shop_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for Player Shops
CREATE TABLE IF NOT EXISTS player_shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, name)
);

-- Table for Shop Items
CREATE TABLE IF NOT EXISTS shop_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES player_shops(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  minecraft_item_id TEXT NOT NULL, -- e.g., "minecraft:diamond_sword"
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'diamond' NOT NULL, -- e.g., "diamond", "emerald", "iron_ingot"
  quantity INTEGER DEFAULT 1 NOT NULL,
  description TEXT,
  availability_status TEXT DEFAULT 'in_stock' CHECK (availability_status IN ('in_stock', 'out_of_stock', 'on_order')),
  category_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- Policies for plugins
CREATE POLICY "Plugins are viewable by everyone" ON plugins FOR SELECT USING (true);
CREATE POLICY "Admins can manage plugins" ON plugins FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for shop_categories
CREATE POLICY "Shop categories are viewable by everyone" ON shop_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage shop categories" ON shop_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for player_shops
CREATE POLICY "Player shops are viewable by everyone" ON player_shops FOR SELECT USING (true);
CREATE POLICY "Players can create and manage their own shops" ON player_shops FOR ALL
  USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all player shops" ON player_shops FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for shop_items
CREATE POLICY "Shop items are viewable by everyone" ON shop_items FOR SELECT USING (true);
CREATE POLICY "Players can create and manage items in their own shops" ON shop_items FOR ALL
  USING (EXISTS (SELECT 1 FROM player_shops WHERE id = shop_id AND owner_id = auth.uid()));
CREATE POLICY "Admins can manage all shop items" ON shop_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for new tables
CREATE TRIGGER update_plugins_updated_at
BEFORE UPDATE ON plugins
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_categories_updated_at
BEFORE UPDATE ON shop_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_shops_updated_at
BEFORE UPDATE ON player_shops
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_items_updated_at
BEFORE UPDATE ON shop_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
