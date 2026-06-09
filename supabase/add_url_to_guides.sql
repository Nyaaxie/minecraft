-- Add url column to guides table
ALTER TABLE guides 
ADD COLUMN IF NOT EXISTS url TEXT;
