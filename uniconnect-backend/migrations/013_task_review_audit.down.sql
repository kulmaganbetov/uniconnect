DROP TABLE IF EXISTS team_task_submissions;

ALTER TABLE team_tasks DROP COLUMN IF EXISTS reviewed_by;
ALTER TABLE team_tasks DROP COLUMN IF EXISTS reviewed_at;
ALTER TABLE team_tasks DROP COLUMN IF EXISTS submitted_at;
