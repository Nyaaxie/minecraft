-- Add unit_size column to shop_items
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS unit_size INTEGER DEFAULT 1;
