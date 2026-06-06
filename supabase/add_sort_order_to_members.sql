-- Add sort_order column to community_members table
ALTER TABLE community_members ADD COLUMN sort_order INTEGER DEFAULT 0;
