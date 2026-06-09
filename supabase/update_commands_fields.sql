-- Add new fields to commands table
ALTER TABLE commands 
ADD COLUMN IF NOT EXISTS plugin_title TEXT,
ADD COLUMN IF NOT EXISTS plugin_description TEXT,
ADD COLUMN IF NOT EXISTS url TEXT;
