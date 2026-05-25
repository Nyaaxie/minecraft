-- 1. Update the security function to allow Admins to bypass approval
CREATE OR REPLACE FUNCTION is_user_approved()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
        AND (approval_status = 'approved' OR role = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply approval check to key tables

-- Conversations
DROP POLICY IF EXISTS "View own conversations" ON conversations;
CREATE POLICY "view_own_conversations" ON conversations 
FOR SELECT USING (is_user_approved() AND is_conversation_member(id));

-- Messages
DROP POLICY IF EXISTS "View messages" ON messages;
CREATE POLICY "view_messages_in_own_chats" ON messages 
FOR SELECT USING (is_user_approved() AND is_conversation_member(conversation_id));

-- Player Shops
DROP POLICY IF EXISTS "Player shops are viewable by everyone" ON player_shops;
CREATE POLICY "authenticated_view_shops" ON player_shops 
FOR SELECT USING (is_user_approved());

-- Shop Items
DROP POLICY IF EXISTS "Shop items are viewable by everyone" ON shop_items;
CREATE POLICY "authenticated_view_items" ON shop_items 
FOR SELECT USING (is_user_approved());
