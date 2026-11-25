-- The basic steps of working with a lead, ticked off in the dashboard:
-- a JSON array of step keys (replied, questionnaire_sent, call, quote_sent,
-- quote_approved, invoice_sent). NULL until the first one is ticked.
ALTER TABLE submissions ADD COLUMN tasks TEXT;
