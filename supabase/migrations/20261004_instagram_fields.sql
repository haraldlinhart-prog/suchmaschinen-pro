-- Instagram posting alongside Facebook (04.10.2026, pan21.com → @instapan21com).
-- Uses the same Page Access Token as Facebook (needs instagram_basic +
-- instagram_content_publish). NULL instagram_account_id = no Instagram posting.

ALTER TABLE sq_websites
  ADD COLUMN IF NOT EXISTS instagram_account_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS instagram_username   TEXT DEFAULT NULL;

COMMENT ON COLUMN sq_websites.instagram_account_id IS 'Instagram professional account ID linked to facebook_page_id; posts via the same page token. NULL = no Instagram posting.';
COMMENT ON COLUMN sq_websites.instagram_username   IS 'Display only (@handle), resolved when the token was checked.';
