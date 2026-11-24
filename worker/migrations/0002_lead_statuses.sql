-- The dashboard's follow-up states: new → talking → won, or not relevant.
-- SQLite can't change a CHECK in place, so the table is rebuilt; old states map
-- onto the new ones. Adds the date a lead should next be followed up.
CREATE TABLE submissions_new (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL CHECK (type IN ('contact', 'questionnaire')),
  email         TEXT NOT NULL,
  name          TEXT,
  message       TEXT,
  answers       TEXT,
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'talking', 'won', 'not_relevant')),
  follow_up_on  TEXT,
  notes         TEXT,
  source        TEXT,
  ip_hash       TEXT,
  user_agent    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO submissions_new
  (id, type, email, name, message, answers, status, notes, source, ip_hash, user_agent, created_at, updated_at)
SELECT
  id, type, email, name, message, answers,
  CASE status
    WHEN 'replied' THEN 'talking'
    WHEN 'in_progress' THEN 'talking'
    WHEN 'won' THEN 'won'
    WHEN 'lost' THEN 'not_relevant'
    WHEN 'archived' THEN 'not_relevant'
    ELSE 'new'
  END,
  notes, source, ip_hash, user_agent, created_at, updated_at
FROM submissions;

DROP TABLE submissions;
ALTER TABLE submissions_new RENAME TO submissions;

CREATE INDEX submissions_created ON submissions (created_at DESC);
CREATE INDEX submissions_type_status ON submissions (type, status);
CREATE INDEX submissions_email ON submissions (email);
CREATE INDEX submissions_ip_recent ON submissions (ip_hash, created_at);
CREATE INDEX submissions_follow_up ON submissions (follow_up_on);
