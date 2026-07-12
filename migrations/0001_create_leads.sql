-- Cumberland Septic Hub — optional D1 lead storage.
-- Apply with: npx wrangler d1 migrations apply cumberland-septic-leads --remote

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,                 -- lead reference, e.g. CSH-A2X9KM
  created_at TEXT NOT NULL,            -- ISO 8601 timestamp
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  property_location TEXT NOT NULL,
  city_or_county TEXT NOT NULL,
  property_type TEXT NOT NULL,
  service_needed TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  active_backup TEXT NOT NULL,
  tank_location_known TEXT NOT NULL,
  last_pumped TEXT NOT NULL,
  preferred_contact_time TEXT NOT NULL,
  additional_details TEXT NOT NULL,
  upload_references TEXT,              -- JSON array of R2 object keys
  source_page TEXT,
  consent_recorded_at TEXT NOT NULL,
  lead_status TEXT NOT NULL DEFAULT 'new'
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (lead_status);
