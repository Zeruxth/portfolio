-- One table for every form on the site. `type` says which form; whatever is
-- particular to a form lives in `answers` as JSON, so the questionnaire needs
-- no new table and the dashboard reads one place.
CREATE TABLE submissions (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('contact', 'questionnaire')),
  email       TEXT NOT NULL,
  name        TEXT,
  message     TEXT,
  answers     TEXT,
  -- the lead's progress, set from the dashboard
  status      TEXT NOT NULL DEFAULT 'new'
              CHECK (status IN ('new', 'replied', 'in_progress', 'won', 'lost', 'archived')),
  notes       TEXT,
  source      TEXT,
  ip_hash     TEXT,
  user_agent  TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX submissions_created ON submissions (created_at DESC);
CREATE INDEX submissions_type_status ON submissions (type, status);
CREATE INDEX submissions_email ON submissions (email);
CREATE INDEX submissions_ip_recent ON submissions (ip_hash, created_at);
