-- Create orders and order_items tables
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES player_shops(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES shop_items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Shop owners can view orders for their shop" ON orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM player_shops WHERE id = shop_id AND owner_id = auth.uid()));
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND buyer_id = auth.uid()));
CREATE POLICY "Shop owners can view order items for their shop" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders JOIN player_shops ON orders.shop_id = player_shops.id WHERE order_id = orders.id AND player_shops.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all order items" ON order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
