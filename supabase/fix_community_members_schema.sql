-- Add missing columns to community_members table
ALTER TABLE community_members 
ADD COLUMN IF NOT EXISTS favorite_biome TEXT,
ADD COLUMN IF NOT EXISTS favorite_role TEXT,
ADD COLUMN IF NOT EXISTS social_links TEXT,
ADD COLUMN IF NOT EXISTS birthday DATE;
