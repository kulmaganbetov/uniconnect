-- Add avatar_url to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add room type tracking to dormitories
ALTER TABLE dormitories ADD COLUMN IF NOT EXISTS single_rooms INT NOT NULL DEFAULT 0;
ALTER TABLE dormitories ADD COLUMN IF NOT EXISTS double_rooms INT NOT NULL DEFAULT 0;

-- Add room_type to dormitory_applications
ALTER TABLE dormitory_applications ADD COLUMN IF NOT EXISTS room_type VARCHAR(20) NOT NULL DEFAULT 'any';
