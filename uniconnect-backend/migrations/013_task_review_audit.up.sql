-- Review audit trail on team_tasks.
ALTER TABLE team_tasks ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE team_tasks ADD COLUMN IF NOT EXISTS reviewed_at  TIMESTAMP;
ALTER TABLE team_tasks ADD COLUMN IF NOT EXISTS reviewed_by  UUID REFERENCES users(id) ON DELETE SET NULL;

-- Full history of every submission attempt (the team_tasks.submission_text column
-- only ever holds the latest attempt and is cleared on rejection).
CREATE TABLE IF NOT EXISTS team_task_submissions (
    id              UUID PRIMARY KEY,
    team_task_id    UUID NOT NULL REFERENCES team_tasks(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    submission_text TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_task_submissions_team_task
    ON team_task_submissions(team_task_id);
