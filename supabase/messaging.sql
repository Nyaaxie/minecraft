CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    name TEXT,
    is_group BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Now alter existing messages table safely
DO $$
    BEGIN
        -- Add conversation_id if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='conversation_id') THEN
            ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
       END IF;
        
        -- Add updated_at if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='updated_at') THEN
            ALTER TABLE messages ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
        END IF;
    END $$;

-- 3. Create Conversation Members table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversation_members (
    conversation_id UUID REFERENCES conversations (id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    last_read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (conversation_id, profile_id)
);

-- 4. Create Message Reads table if it doesn't exist
CREATE TABLE IF NOT EXISTS message_reads (
    message_id UUID REFERENCES messages (id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (message_id, profile_id)
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
DROP POLICY IF EXISTS "Users can view conversations they are members of" ON conversations;

CREATE POLICY "Users can view conversations they are members of" ON conversations FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM conversation_members
            WHERE
                conversation_id = conversations.id
                AND profile_id = auth.uid ()
        )
    );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Users can create conversations" ON conversations FOR
INSERT
WITH
    CHECK (true);

-- Policies for conversation_members
DROP POLICY IF EXISTS "Users can view members of conversations they are part of" ON conversation_members;

CREATE POLICY "Users can view members of conversations they are part of" ON conversation_members FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM conversation_members AS cm
            WHERE
                cm.conversation_id = conversation_members.conversation_id
                AND profile_id = auth.uid ()
        )
    );

DROP POLICY IF EXISTS "Users can add themselves to conversations" ON conversation_members;

CREATE POLICY "Users can add themselves to conversations" ON conversation_members FOR
INSERT
WITH
    CHECK (profile_id = auth.uid ());

-- Policies for messages
DROP POLICY IF EXISTS "Users can view messages in conversations they are part of" ON messages;

CREATE POLICY "Users can view messages in conversations they are part of" ON messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM conversation_members
            WHERE
                conversation_id = messages.conversation_id
                AND profile_id = auth.uid ()
        )
    );

DROP POLICY IF EXISTS "Users can send messages in conversations they are part of" ON messages;

CREATE POLICY "Users can send messages in conversations they are part of" ON messages FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM conversation_members
            WHERE
                conversation_id = messages.conversation_id
                AND profile_id = auth.uid ()
        )
    );