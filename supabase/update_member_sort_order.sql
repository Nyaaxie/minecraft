-- Update sort_order default and existing records
ALTER TABLE community_members ALTER COLUMN sort_order SET DEFAULT 999;
UPDATE community_members SET sort_order = 999 WHERE sort_order = 0;
