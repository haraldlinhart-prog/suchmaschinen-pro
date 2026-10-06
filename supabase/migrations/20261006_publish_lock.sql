-- Per-site lock for the auto-publish cron (06.10.2026).
-- Two overlapping cron runs (scheduled + manual "Run" in Vercel) both processed the same
-- sites and published duplicate articles + duplicate Facebook posts. A worker now claims
-- the site atomically by setting publish_lock_until; a second worker finds the lock held
-- and skips. The lock expires on its own, so a crashed worker can't block a site forever.
alter table sq_websites add column if not exists publish_lock_until timestamptz;
