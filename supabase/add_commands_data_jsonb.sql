-- Add commands_data JSONB column to support multiple commands per entry
ALTER TABLE commands 
ADD COLUMN IF NOT EXISTS commands_data JSONB DEFAULT '[]'::jsonb;

-- Migrate existing name and description into commands_data if they exist
UPDATE commands 
SET commands_data = jsonb_build_array(
    jsonb_build_object(
        'command', name,
        'description', description
    )
)
WHERE commands_data = '[]'::jsonb AND name IS NOT NULL;
