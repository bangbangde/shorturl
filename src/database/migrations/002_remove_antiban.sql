-- Migration 002: Remove anti-ban strategy columns from links table

ALTER TABLE links DROP COLUMN enable_intermediate;
ALTER TABLE links DROP COLUMN intermediate_type;
ALTER TABLE links DROP COLUMN intermediate_content;
ALTER TABLE links DROP COLUMN enable_ua_detection;
ALTER TABLE links DROP COLUMN ua_rules;
