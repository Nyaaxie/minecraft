-- Add tables for new Shop Categories and Shop Transactions

-- Table for Plugin Categories
CREATE TABLE IF NOT EXISTS plugin_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for Shop Transactions
CREATE TABLE IF NOT EXISTS shop_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_item_id UUID REFERENCES shop_items(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  transaction_time TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE plugin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for plugin_categories
CREATE POLICY "Plugin categories are viewable by everyone" ON plugin_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage plugin categories" ON plugin_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for shop_transactions
-- Buyers and sellers can view their own transactions
CREATE POLICY "Buyers can view their own transactions" ON shop_transactions FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view their own transactions" ON shop_transactions FOR SELECT USING (auth.uid() = seller_id);
-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions" ON shop_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
-- Transactions are created by the system/seller, not direct user input
-- No direct INSERT/UPDATE/DELETE policies for general users, only for specific functions (e.g. via a stored procedure on successful purchase)

-- Function to update updated_at column for plugin_categories
CREATE TRIGGER update_plugin_categories_updated_at
BEFORE UPDATE ON plugin_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();