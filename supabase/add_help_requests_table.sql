-- Add help_requests table
CREATE TABLE help_requests (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (
        status IN ('open', 'in_progress', 'resolved')
    ),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create help requests" ON help_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own help requests" ON help_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view and manage all help requests" ON help_requests FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
