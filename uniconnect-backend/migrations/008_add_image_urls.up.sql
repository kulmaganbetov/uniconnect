-- Add image_url columns so admins can attach a hero photo to each
-- dormitory, medical service, guide, and piece of page content.
ALTER TABLE dormitories      ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE guides           ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE page_contents    ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
