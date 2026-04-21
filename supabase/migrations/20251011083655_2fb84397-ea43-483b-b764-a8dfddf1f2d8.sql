-- Phase 1: Chat Bot Monitor - RLS Policies and Indexes

-- เปิด RLS สำหรับ chat_state (ถ้ายังไม่เปิด)
ALTER TABLE chat_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies สำหรับ chat_state
DROP POLICY IF EXISTS "Authenticated users can view chat state" ON chat_state;
CREATE POLICY "Authenticated users can view chat state"
ON chat_state FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can update chat state" ON chat_state;
CREATE POLICY "Authenticated users can update chat state"
ON chat_state FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert chat state" ON chat_state;
CREATE POLICY "Authenticated users can insert chat state"
ON chat_state FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies สำหรับ conversations (ถ้ายังไม่มี)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversations' 
    AND policyname = 'Authenticated users can view conversations'
  ) THEN
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Authenticated users can view conversations"
    ON conversations FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversations' 
    AND policyname = 'Authenticated users can insert conversations'
  ) THEN
    CREATE POLICY "Authenticated users can insert conversations"
    ON conversations FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- เพิ่ม Indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_leads_user_id_platform 
ON leads(user_id_platform) 
WHERE user_id_platform IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_state_sender_id 
ON chat_state(sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_state_auto_reply_mode 
ON chat_state(auto_reply_mode);

CREATE INDEX IF NOT EXISTS idx_conversations_lead_id 
ON conversations(lead_id);

CREATE INDEX IF NOT EXISTS idx_conversations_created_at 
ON conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_lead_created 
ON conversations(lead_id, created_at DESC);

-- Comment
COMMENT ON POLICY "Authenticated users can view chat state" ON chat_state IS 
'Allows authenticated users to view chat bot state for monitoring';

COMMENT ON POLICY "Authenticated users can update chat state" ON chat_state IS 
'Allows authenticated users to toggle chat bot auto_reply_mode';

COMMENT ON INDEX idx_chat_state_sender_id IS 
'Index for quick lookup of chat state by sender_id when joining with leads';

COMMENT ON INDEX idx_conversations_lead_created IS 
'Composite index for efficiently fetching latest messages per lead';