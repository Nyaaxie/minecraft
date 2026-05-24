-- Add DELETE policy for messages
DROP POLICY IF EXISTS "Users can delete their own messages or admins can delete any" ON messages;
CREATE POLICY "Users can delete their own messages or admins can delete any" ON messages
FOR DELETE USING (
    auth.uid() = sender_id OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
