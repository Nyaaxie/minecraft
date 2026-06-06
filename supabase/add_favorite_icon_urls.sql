-- Add icon URL columns for favorites in community_members
ALTER TABLE community_members 
ADD COLUMN favorite_mob_url TEXT,
ADD COLUMN favorite_block_url TEXT,
ADD COLUMN favorite_biome_url TEXT,
ADD COLUMN favorite_role_url TEXT;
