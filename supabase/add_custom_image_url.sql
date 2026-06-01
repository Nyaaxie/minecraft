-- Add custom_image_url to shop_items table
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS custom_image_url TEXT;
