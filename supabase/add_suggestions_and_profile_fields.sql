-- Add suggestions table
CREATE TABLE suggestions (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'rejected')
    ),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create suggestions" ON suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own suggestions" ON suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view and manage all suggestions" ON suggestions FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Update profiles table with new fields
ALTER TABLE profiles
ADD COLUMN social_links TEXT,
ADD COLUMN bedrock_username TEXT,
ADD COLUMN birthmonth TEXT,
ADD COLUMN join_date DATE;
