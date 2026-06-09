ALTER TABLE dormitory_applications DROP COLUMN IF EXISTS room_type;
ALTER TABLE dormitories DROP COLUMN IF EXISTS double_rooms;
ALTER TABLE dormitories DROP COLUMN IF EXISTS single_rooms;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
