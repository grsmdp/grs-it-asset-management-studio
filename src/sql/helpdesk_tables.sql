-- ============================================================
-- GRS IT Asset Management Studio - Helpdesk / Ticket Module
-- Execute this SQL in Supabase SQL Editor
-- ============================================================

-- 1. Ticket Categories
CREATE TABLE IF NOT EXISTS ticket_categories (
  id BIGSERIAL PRIMARY KEY,
  category_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'Open',
  priority TEXT DEFAULT 'Medium',
  problem_title TEXT NOT NULL,
  problem_description TEXT,
  requested_by TEXT NOT NULL,
  requested_by_email TEXT,
  requested_by_phone TEXT,
  department_id BIGINT REFERENCES departments(id),
  location_id BIGINT REFERENCES locations(id),
  asset_id BIGINT REFERENCES assets(id),
  category_id BIGINT REFERENCES ticket_categories(id),
  assigned_to TEXT,
  assigned_type TEXT,
  cost DECIMAL(12,2),
  spare_parts TEXT,
  sla_deadline TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- 3. Ticket Comments
CREATE TABLE IF NOT EXISTS ticket_comments (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT REFERENCES tickets(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Ticket Photos
CREATE TABLE IF NOT EXISTS ticket_photos (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT REFERENCES tickets(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Ticket History / Timeline
CREATE TABLE IF NOT EXISTS ticket_history (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT REFERENCES tickets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  performed_by TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default ticket categories
INSERT INTO ticket_categories (category_name, description) VALUES
  ('Hardware Issue', 'Problems with physical hardware components'),
  ('Software Issue', 'Software bugs, crashes, or errors'),
  ('Network Issue', 'Connectivity, WiFi, or network problems'),
  ('Email Issue', 'Email client or server problems'),
  ('Printer Issue', 'Printer setup or connectivity problems'),
  ('Security Incident', 'Security breaches or suspicious activity'),
  ('New Setup Request', 'Request for new equipment or setup'),
  ('User Access', 'Account creation, password reset, permissions'),
  ('Data Recovery', 'Data loss or recovery requests'),
  ('General Inquiry', 'General IT questions and support')
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_department ON tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_photos_ticket ON ticket_photos(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON ticket_history(ticket_id);

-- ============================================================
-- RLS Policies (allow authenticated and anon access for dev)
-- ============================================================
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON ticket_categories FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON tickets FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON ticket_comments FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON ticket_photos FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON ticket_history FOR ALL USING (true);
