-- Widen the role column to fit the new role names and seed the
-- catalogue of allowed roles.
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(40);

-- Free-form key/value store used by the admin "page content" editor.
-- Each row holds a single piece of editable copy displayed somewhere
-- on the public site (hero text, banner, etc.).
CREATE TABLE IF NOT EXISTS page_contents (
    key VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Default copy used by the landing page hero, dashboard banner and
-- the support strip. Admins can edit these from the admin panel.
INSERT INTO page_contents (key, title, body) VALUES
    ('landing_hero', 'Your gateway to studying in Kazakhstan',
     'UniConnect helps international students find dormitories, jobs, healthcare and a friendly community — all in one place.'),
    ('dashboard_banner', 'Welcome back',
     'Pick up where you left off. Manage your applications, browse new opportunities and reach out for support.'),
    ('support_strip', 'Need help? We are here.',
     'Our multilingual team supports thousands of students across Kazakhstan every year.')
ON CONFLICT (key) DO NOTHING;
