-- Add Facebook Page integration fields to sq_websites.
-- Both are optional (NULL = no Facebook posting for this site).
-- facebook_page_token should be treated as a secret — do NOT expose it
-- in client-side queries; always read it server-side only.

ALTER TABLE sq_websites
  ADD COLUMN IF NOT EXISTS facebook_page_id    TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS facebook_page_token TEXT DEFAULT NULL;

COMMENT ON COLUMN sq_websites.facebook_page_id    IS 'Facebook Page ID for automatic post-on-publish. NULL = disabled.';
COMMENT ON COLUMN sq_websites.facebook_page_token IS 'Long-lived Facebook Page Access Token (pages_manage_posts scope). Treat as secret.';
