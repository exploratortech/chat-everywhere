-- Migration to update user_conversations_owner_policy with plan restrictions
BEGIN;

-- Drop the existing policy
DROP POLICY user_conversations_owner_policy ON user_conversations;

-- Create a new policy with the additional plan condition
CREATE POLICY user_conversations_owner_policy
  ON user_conversations
  FOR ALL
  USING (
    uid = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_conversations.uid
      AND profiles.plan IN ('basic','edu','ultra', 'pro')
    )
  );

COMMIT;