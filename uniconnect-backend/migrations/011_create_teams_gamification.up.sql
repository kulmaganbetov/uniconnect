CREATE TABLE IF NOT EXISTS teams (
    id             UUID PRIMARY KEY,
    name           TEXT UNIQUE NOT NULL,
    language       TEXT NOT NULL,
    language_level VARCHAR(10) NOT NULL,
    description    TEXT DEFAULT '',
    avatar_url     TEXT,
    total_xp       INT DEFAULT 0,
    created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    id         UUID PRIMARY KEY,
    team_id    UUID REFERENCES teams ON DELETE CASCADE,
    user_id    UUID REFERENCES users ON DELETE CASCADE,
    role       VARCHAR(20) DEFAULT 'member',
    joined_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id          UUID PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    xp_reward   INT DEFAULT 10,
    deadline    TIMESTAMP,
    status      VARCHAR(20) DEFAULT 'active',
    created_by  UUID REFERENCES users ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_tasks (
    id           UUID PRIMARY KEY,
    team_id      UUID REFERENCES teams ON DELETE CASCADE,
    task_id      UUID REFERENCES tasks ON DELETE CASCADE,
    status       VARCHAR(20) DEFAULT 'assigned',
    assigned_at  TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    UNIQUE(team_id, task_id)
);

CREATE TABLE IF NOT EXISTS team_activity (
    id          UUID PRIMARY KEY,
    team_id     UUID REFERENCES teams ON DELETE CASCADE,
    user_id     UUID REFERENCES users ON DELETE SET NULL,
    action      TEXT NOT NULL,
    description TEXT DEFAULT '',
    xp_gained   INT DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW()
);
