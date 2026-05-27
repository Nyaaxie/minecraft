-- Add commands table
CREATE TABLE commands (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add guides table
CREATE TABLE guides (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE commands ENABLE ROW LEVEL SECURITY;

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commands are viewable by everyone" ON commands FOR
SELECT USING (true);

CREATE POLICY "Admins can manage commands" ON commands FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

CREATE POLICY "Guides are viewable by everyone" ON guides FOR
SELECT USING (true);

CREATE POLICY "Admins can manage guides" ON guides FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);