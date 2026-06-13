package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
)

// ErrStateConflict is returned when a status transition cannot be applied
// because the row is not in the expected state (e.g. a concurrent update
// already moved it, or the task was not in the required status). It lets the
// service layer distinguish a lost race from a genuine internal error.
var ErrStateConflict = errors.New("team task is not in the required state")

// ─── TeamRepository ───────────────────────────────────────────────────────────

func (db *DB) CreateTeam(ctx context.Context, t *model.Team) error {
	query := `
		INSERT INTO teams (id, name, language, language_level, description, avatar_url, total_xp, created_by, created_at)
		VALUES ($1, $2, $3, $4, $5, NULLIF($6,''), 0, $7, NOW())
		RETURNING created_at`
	return db.Pool.QueryRow(ctx, query,
		t.ID, t.Name, t.Language, t.LanguageLevel, t.Description, t.AvatarURL, t.CreatedBy,
	).Scan(&t.CreatedAt)
}

func (db *DB) GetAllTeams(ctx context.Context) ([]model.TeamSummary, error) {
	query := `
		SELECT t.id, t.name, t.language, t.language_level, COALESCE(t.description,''),
		       COALESCE(t.avatar_url,''), t.total_xp,
		       COUNT(tm.id) AS member_count,
		       ROW_NUMBER() OVER (ORDER BY t.total_xp DESC, t.created_at ASC) AS rank,
		       t.created_at
		FROM teams t
		LEFT JOIN team_members tm ON tm.team_id = t.id
		GROUP BY t.id
		ORDER BY t.total_xp DESC, t.created_at ASC`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teams []model.TeamSummary
	for rows.Next() {
		var ts model.TeamSummary
		if err := rows.Scan(
			&ts.ID, &ts.Name, &ts.Language, &ts.LanguageLevel, &ts.Description,
			&ts.AvatarURL, &ts.TotalXP, &ts.MemberCount, &ts.Rank, &ts.CreatedAt,
		); err != nil {
			return nil, err
		}
		teams = append(teams, ts)
	}
	if teams == nil {
		teams = []model.TeamSummary{}
	}
	return teams, nil
}

func (db *DB) GetLeaderboard(ctx context.Context, limit int) ([]model.TeamSummary, error) {
	query := `
		SELECT t.id, t.name, t.language, t.language_level, COALESCE(t.description,''),
		       COALESCE(t.avatar_url,''), t.total_xp,
		       COUNT(tm.id) AS member_count,
		       ROW_NUMBER() OVER (ORDER BY t.total_xp DESC, t.created_at ASC) AS rank,
		       t.created_at
		FROM teams t
		LEFT JOIN team_members tm ON tm.team_id = t.id
		GROUP BY t.id
		ORDER BY t.total_xp DESC, t.created_at ASC
		LIMIT $1`
	rows, err := db.Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teams []model.TeamSummary
	for rows.Next() {
		var ts model.TeamSummary
		if err := rows.Scan(
			&ts.ID, &ts.Name, &ts.Language, &ts.LanguageLevel, &ts.Description,
			&ts.AvatarURL, &ts.TotalXP, &ts.MemberCount, &ts.Rank, &ts.CreatedAt,
		); err != nil {
			return nil, err
		}
		teams = append(teams, ts)
	}
	if teams == nil {
		teams = []model.TeamSummary{}
	}
	return teams, nil
}

func (db *DB) GetTeamByID(ctx context.Context, id uuid.UUID) (*model.TeamDetail, error) {
	// Fetch the team summary first.
	summaryQuery := `
		SELECT t.id, t.name, t.language, t.language_level, COALESCE(t.description,''),
		       COALESCE(t.avatar_url,''), t.total_xp,
		       COUNT(tm.id) AS member_count,
		       ROW_NUMBER() OVER (ORDER BY t.total_xp DESC, t.created_at ASC) AS rank,
		       t.created_at
		FROM teams t
		LEFT JOIN team_members tm ON tm.team_id = t.id
		WHERE t.id = $1
		GROUP BY t.id`

	detail := &model.TeamDetail{}
	if err := db.Pool.QueryRow(ctx, summaryQuery, id).Scan(
		&detail.ID, &detail.Name, &detail.Language, &detail.LanguageLevel, &detail.Description,
		&detail.AvatarURL, &detail.TotalXP, &detail.MemberCount, &detail.Rank, &detail.CreatedAt,
	); err != nil {
		return nil, err
	}

	// Fetch members.
	memberQuery := `
		SELECT tm.user_id, COALESCE(u.name,''), COALESCE(u.avatar_url,''),
		       tm.role, COALESCE(u.language,''), COALESCE(u.language_level,''), tm.joined_at
		FROM team_members tm
		JOIN users u ON u.id = tm.user_id
		WHERE tm.team_id = $1
		ORDER BY tm.joined_at ASC`
	mrows, err := db.Pool.Query(ctx, memberQuery, id)
	if err != nil {
		return nil, err
	}
	defer mrows.Close()

	detail.Members = []model.TeamMemberDetail{}
	for mrows.Next() {
		var m model.TeamMemberDetail
		if err := mrows.Scan(&m.UserID, &m.Name, &m.AvatarURL, &m.Role, &m.Language, &m.LanguageLevel, &m.JoinedAt); err != nil {
			return nil, err
		}
		detail.Members = append(detail.Members, m)
	}
	mrows.Close()

	// Fetch tasks.
	taskQuery := `
		SELECT tt.id, tt.team_id, tt.task_id, tt.status, tt.assigned_at,
		       COALESCE(TO_CHAR(tt.completed_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(ta.title,''), COALESCE(ta.description,''), COALESCE(ta.xp_reward,0),
		       COALESCE(tt.submission_text,'')
		FROM team_tasks tt
		JOIN tasks ta ON ta.id = tt.task_id
		WHERE tt.team_id = $1
		ORDER BY tt.assigned_at DESC`
	trows, err := db.Pool.Query(ctx, taskQuery, id)
	if err != nil {
		return nil, err
	}
	defer trows.Close()

	detail.Tasks = []model.TeamTaskDetail{}
	for trows.Next() {
		var t model.TeamTaskDetail
		if err := trows.Scan(
			&t.ID, &t.TeamID, &t.TaskID, &t.Status, &t.AssignedAt, &t.CompletedAt,
			&t.Title, &t.Description, &t.XPReward, &t.SubmissionText,
		); err != nil {
			return nil, err
		}
		detail.Tasks = append(detail.Tasks, t)
	}
	trows.Close()

	// Fetch activities.
	actQuery := `
		SELECT ta.id, ta.team_id, ta.action, COALESCE(ta.description,''), ta.xp_gained, ta.created_at,
		       COALESCE(u.name,'')
		FROM team_activity ta
		LEFT JOIN users u ON u.id = ta.user_id
		WHERE ta.team_id = $1
		ORDER BY ta.created_at DESC
		LIMIT 50`
	arows, err := db.Pool.Query(ctx, actQuery, id)
	if err != nil {
		return nil, err
	}
	defer arows.Close()

	detail.Activities = []model.TeamActivityEntry{}
	for arows.Next() {
		var a model.TeamActivityEntry
		if err := arows.Scan(&a.ID, &a.TeamID, &a.Action, &a.Description, &a.XPGained, &a.CreatedAt, &a.UserName); err != nil {
			return nil, err
		}
		detail.Activities = append(detail.Activities, a)
	}

	return detail, nil
}

func (db *DB) GetUserTeam(ctx context.Context, userID uuid.UUID) (*model.TeamSummary, error) {
	return db.GetMemberTeam(ctx, userID)
}

func (db *DB) GetMemberTeam(ctx context.Context, userID uuid.UUID) (*model.TeamSummary, error) {
	query := `
		SELECT t.id, t.name, t.language, t.language_level, COALESCE(t.description,''),
		       COALESCE(t.avatar_url,''), t.total_xp,
		       COUNT(tm2.id) AS member_count,
		       ROW_NUMBER() OVER (ORDER BY t.total_xp DESC, t.created_at ASC) AS rank,
		       t.created_at
		FROM team_members tm
		JOIN teams t ON t.id = tm.team_id
		LEFT JOIN team_members tm2 ON tm2.team_id = t.id
		WHERE tm.user_id = $1
		GROUP BY t.id`
	ts := &model.TeamSummary{}
	err := db.Pool.QueryRow(ctx, query, userID).Scan(
		&ts.ID, &ts.Name, &ts.Language, &ts.LanguageLevel, &ts.Description,
		&ts.AvatarURL, &ts.TotalXP, &ts.MemberCount, &ts.Rank, &ts.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return ts, nil
}

func (db *DB) AddTeamMember(ctx context.Context, teamID, userID uuid.UUID, role string) error {
	_, err := db.Pool.Exec(ctx,
		`INSERT INTO team_members (id, team_id, user_id, role, joined_at) VALUES ($1, $2, $3, $4, NOW())`,
		uuid.New(), teamID, userID, role,
	)
	return err
}

func (db *DB) RemoveTeamMember(ctx context.Context, teamID, userID uuid.UUID) error {
	// Check what role this member has.
	var role string
	err := db.Pool.QueryRow(ctx,
		`SELECT role FROM team_members WHERE team_id=$1 AND user_id=$2`,
		teamID, userID,
	).Scan(&role)
	if err != nil {
		return err
	}

	// Remove the member.
	_, err = db.Pool.Exec(ctx,
		`DELETE FROM team_members WHERE team_id=$1 AND user_id=$2`,
		teamID, userID,
	)
	if err != nil {
		return err
	}

	// Count remaining members.
	var remaining int
	err = db.Pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM team_members WHERE team_id=$1`,
		teamID,
	).Scan(&remaining)
	if err != nil {
		return err
	}

	if remaining == 0 {
		// Delete the team entirely.
		_, err = db.Pool.Exec(ctx, `DELETE FROM teams WHERE id=$1`, teamID)
		return err
	}

	// If removed member was leader, promote the earliest-joining member.
	if role == "leader" {
		var newLeaderID uuid.UUID
		err = db.Pool.QueryRow(ctx,
			`SELECT user_id FROM team_members WHERE team_id=$1 ORDER BY joined_at ASC LIMIT 1`,
			teamID,
		).Scan(&newLeaderID)
		if err != nil {
			return err
		}
		_, err = db.Pool.Exec(ctx,
			`UPDATE team_members SET role='leader' WHERE team_id=$1 AND user_id=$2`,
			teamID, newLeaderID,
		)
		return err
	}

	return nil
}

func (db *DB) GetTeamMemberCount(ctx context.Context, teamID uuid.UUID) (int, error) {
	var count int
	err := db.Pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM team_members WHERE team_id=$1`,
		teamID,
	).Scan(&count)
	return count, err
}

func (db *DB) DeleteTeam(ctx context.Context, id uuid.UUID) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM teams WHERE id=$1`, id)
	return err
}

func (db *DB) PromoteToLeader(ctx context.Context, teamID, userID uuid.UUID) error {
	// Demote existing leader(s) to member first.
	_, err := db.Pool.Exec(ctx,
		`UPDATE team_members SET role='member' WHERE team_id=$1 AND role='leader'`,
		teamID,
	)
	if err != nil {
		return err
	}
	_, err = db.Pool.Exec(ctx,
		`UPDATE team_members SET role='leader' WHERE team_id=$1 AND user_id=$2`,
		teamID, userID,
	)
	return err
}

// ─── TaskRepository ───────────────────────────────────────────────────────────

func (db *DB) CreateTask(ctx context.Context, t *model.Task) error {
	var deadlineParam interface{}
	if t.Deadline != "" {
		deadlineParam = t.Deadline
	}
	query := `
		INSERT INTO tasks (id, title, description, xp_reward, deadline, status, created_by, created_at)
		VALUES ($1, $2, $3, $4, $5::TIMESTAMP, $6, $7, NOW())
		RETURNING created_at`
	return db.Pool.QueryRow(ctx, query,
		t.ID, t.Title, t.Description, t.XPReward, deadlineParam, t.Status, t.CreatedBy,
	).Scan(&t.CreatedAt)
}

func (db *DB) GetAllTasks(ctx context.Context) ([]model.Task, error) {
	query := `
		SELECT id, title, COALESCE(description,''), xp_reward,
		       COALESCE(TO_CHAR(deadline, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       status, created_by, created_at
		FROM tasks
		ORDER BY created_at DESC`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []model.Task
	for rows.Next() {
		var t model.Task
		if err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.XPReward, &t.Deadline, &t.Status, &t.CreatedBy, &t.CreatedAt); err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	if tasks == nil {
		tasks = []model.Task{}
	}
	return tasks, nil
}

func (db *DB) GetTaskByID(ctx context.Context, id uuid.UUID) (*model.Task, error) {
	t := &model.Task{}
	err := db.Pool.QueryRow(ctx, `
		SELECT id, title, COALESCE(description,''), xp_reward,
		       COALESCE(TO_CHAR(deadline, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       status, created_by, created_at
		FROM tasks WHERE id=$1`, id,
	).Scan(&t.ID, &t.Title, &t.Description, &t.XPReward, &t.Deadline, &t.Status, &t.CreatedBy, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return t, nil
}

func (db *DB) UpdateTask(ctx context.Context, id uuid.UUID, t *model.Task) (*model.Task, error) {
	var deadlineParam interface{}
	if t.Deadline != "" {
		deadlineParam = t.Deadline
	}
	out := &model.Task{}
	// status is only changed when a non-empty value is provided.
	err := db.Pool.QueryRow(ctx, `
		UPDATE tasks
		   SET title=$2, description=$3, xp_reward=$4, deadline=$5::TIMESTAMP,
		       status=COALESCE(NULLIF($6,''), status)
		 WHERE id=$1
		RETURNING id, title, COALESCE(description,''), xp_reward,
		          COALESCE(TO_CHAR(deadline, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		          status, created_by, created_at`,
		id, t.Title, t.Description, t.XPReward, deadlineParam, t.Status,
	).Scan(&out.ID, &out.Title, &out.Description, &out.XPReward, &out.Deadline, &out.Status, &out.CreatedBy, &out.CreatedAt)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (db *DB) DeleteTask(ctx context.Context, id uuid.UUID) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM tasks WHERE id=$1`, id)
	return err
}

func (db *DB) AssignTaskToTeam(ctx context.Context, teamID, taskID uuid.UUID) (*model.TeamTask, error) {
	tt := &model.TeamTask{}
	err := db.Pool.QueryRow(ctx, `
		INSERT INTO team_tasks (id, team_id, task_id, status, assigned_at)
		VALUES ($1, $2, $3, 'assigned', NOW())
		ON CONFLICT (team_id, task_id) DO UPDATE SET status='assigned'
		RETURNING id, team_id, task_id, status, assigned_at,
		          COALESCE(TO_CHAR(completed_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '')`,
		uuid.New(), teamID, taskID,
	).Scan(&tt.ID, &tt.TeamID, &tt.TaskID, &tt.Status, &tt.AssignedAt, &tt.CompletedAt)
	if err != nil {
		return nil, err
	}
	return tt, nil
}

func (db *DB) GetTeamTaskByID(ctx context.Context, teamTaskID uuid.UUID) (*model.TeamTask, error) {
	tt := &model.TeamTask{}
	err := db.Pool.QueryRow(ctx, `
		SELECT id, team_id, task_id, status, assigned_at,
		       COALESCE(TO_CHAR(completed_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(TO_CHAR(submitted_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(TO_CHAR(reviewed_at,  'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(reviewed_by::text, ''),
		       COALESCE(submission_text,'')
		FROM team_tasks WHERE id=$1`, teamTaskID,
	).Scan(&tt.ID, &tt.TeamID, &tt.TaskID, &tt.Status, &tt.AssignedAt,
		&tt.CompletedAt, &tt.SubmittedAt, &tt.ReviewedAt, &tt.ReviewedBy, &tt.SubmissionText)
	if err != nil {
		return nil, err
	}
	return tt, nil
}

// SubmitTeamTask records a submission. The transition is guarded so only a task
// in 'assigned' status can be submitted; it also appends to the submission
// history and logs a team activity entry — all atomically. Returns
// ErrStateConflict if the task was not in 'assigned' status.
func (db *DB) SubmitTeamTask(ctx context.Context, teamTaskID, userID uuid.UUID, submissionText string) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	ct, err := tx.Exec(ctx,
		`UPDATE team_tasks
		    SET status='submitted', submission_text=$2, submitted_at=NOW()
		  WHERE id=$1 AND status='assigned'`,
		teamTaskID, submissionText,
	)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return ErrStateConflict
	}

	var userIDParam interface{}
	if userID != (uuid.UUID{}) {
		userIDParam = userID
	}
	if _, err := tx.Exec(ctx,
		`INSERT INTO team_task_submissions (id, team_task_id, user_id, submission_text, created_at)
		 VALUES ($1, $2, $3, $4, NOW())`,
		uuid.New(), teamTaskID, userIDParam, submissionText,
	); err != nil {
		return err
	}

	if err := logActivityTx(ctx, tx, teamTaskID, userIDParam, "task_submitted", "Submitted a task for review", 0); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// RejectTeamTask returns a submitted task to 'assigned' status, clears the
// latest submission text, records the reviewer, and logs an activity entry.
// Returns ErrStateConflict if the task was not in 'submitted' status.
func (db *DB) RejectTeamTask(ctx context.Context, teamTaskID, reviewerID uuid.UUID) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var reviewerParam interface{}
	if reviewerID != (uuid.UUID{}) {
		reviewerParam = reviewerID
	}
	ct, err := tx.Exec(ctx,
		`UPDATE team_tasks
		    SET status='assigned', submission_text=NULL, reviewed_at=NOW(), reviewed_by=$2
		  WHERE id=$1 AND status='submitted'`,
		teamTaskID, reviewerParam,
	)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return ErrStateConflict
	}

	if err := logActivityTx(ctx, tx, teamTaskID, nil, "task_rejected", "Task submission was rejected", 0); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// CompleteTeamTask approves a submitted task, awards XP to the team, records the
// reviewer, and logs the activity — all in a single transaction. The status
// transition is guarded (WHERE status='submitted') so concurrent approvals can
// never double-award XP. Returns the XP awarded, or ErrStateConflict if the
// task was not in 'submitted' status.
func (db *DB) CompleteTeamTask(ctx context.Context, teamTaskID, reviewerID uuid.UUID) (int, error) {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	var reviewerParam interface{}
	if reviewerID != (uuid.UUID{}) {
		reviewerParam = reviewerID
	}
	ct, err := tx.Exec(ctx, `
		UPDATE team_tasks
		   SET status='completed', completed_at=NOW(), reviewed_at=NOW(), reviewed_by=$2
		 WHERE id=$1 AND status='submitted'`,
		teamTaskID, reviewerParam,
	)
	if err != nil {
		return 0, err
	}
	if ct.RowsAffected() == 0 {
		return 0, ErrStateConflict
	}

	// Resolve the team and the task's reward/title in one shot.
	var teamID uuid.UUID
	var xpReward int
	var title string
	if err := tx.QueryRow(ctx, `
		SELECT tt.team_id, ta.xp_reward, ta.title
		  FROM team_tasks tt
		  JOIN tasks ta ON ta.id = tt.task_id
		 WHERE tt.id = $1`, teamTaskID,
	).Scan(&teamID, &xpReward, &title); err != nil {
		return 0, err
	}

	if _, err := tx.Exec(ctx,
		`UPDATE teams SET total_xp = total_xp + $2 WHERE id=$1`, teamID, xpReward,
	); err != nil {
		return 0, err
	}

	if err := logActivityTx(ctx, tx, teamTaskID, nil, "task_completed", "Completed task: "+title, xpReward); err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return xpReward, nil
}

// logActivityTx inserts a team_activity row inside an existing transaction,
// resolving the team_id from the given team task.
func logActivityTx(ctx context.Context, tx pgx.Tx, teamTaskID uuid.UUID, userIDParam interface{}, action, description string, xp int) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO team_activity (id, team_id, user_id, action, description, xp_gained, created_at)
		SELECT $1, tt.team_id, $2, $3, $4, $5, NOW()
		  FROM team_tasks tt WHERE tt.id = $6`,
		uuid.New(), userIDParam, action, description, xp, teamTaskID,
	)
	return err
}

// GetTeamTaskSubmissions returns the full submission history for a team task,
// newest first.
func (db *DB) GetTeamTaskSubmissions(ctx context.Context, teamTaskID uuid.UUID) ([]model.TeamTaskSubmission, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, team_task_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
		       submission_text, created_at
		  FROM team_task_submissions
		 WHERE team_task_id=$1
		 ORDER BY created_at DESC`, teamTaskID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	subs := []model.TeamTaskSubmission{}
	for rows.Next() {
		var s model.TeamTaskSubmission
		if err := rows.Scan(&s.ID, &s.TeamTaskID, &s.UserID, &s.SubmissionText, &s.CreatedAt); err != nil {
			return nil, err
		}
		subs = append(subs, s)
	}
	return subs, nil
}

func (db *DB) GetTeamTasks(ctx context.Context, teamID uuid.UUID) ([]model.TeamTaskDetail, error) {
	query := `
		SELECT tt.id, tt.team_id, tt.task_id, tt.status, tt.assigned_at,
		       COALESCE(TO_CHAR(tt.completed_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(TO_CHAR(tt.submitted_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(TO_CHAR(tt.reviewed_at,  'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(ta.title,''), COALESCE(ta.description,''), COALESCE(ta.xp_reward,0),
		       COALESCE(TO_CHAR(ta.deadline, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(tt.submission_text,'')
		FROM team_tasks tt
		JOIN tasks ta ON ta.id = tt.task_id
		WHERE tt.team_id=$1
		ORDER BY tt.assigned_at DESC`
	rows, err := db.Pool.Query(ctx, query, teamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var details []model.TeamTaskDetail
	for rows.Next() {
		var d model.TeamTaskDetail
		if err := rows.Scan(
			&d.ID, &d.TeamID, &d.TaskID, &d.Status, &d.AssignedAt, &d.CompletedAt,
			&d.SubmittedAt, &d.ReviewedAt,
			&d.Title, &d.Description, &d.XPReward, &d.Deadline, &d.SubmissionText,
		); err != nil {
			return nil, err
		}
		details = append(details, d)
	}
	if details == nil {
		details = []model.TeamTaskDetail{}
	}
	return details, nil
}

func (db *DB) GetAllTeamTasks(ctx context.Context) ([]model.TeamTaskDetail, error) {
	query := `
		SELECT tt.id, tt.team_id, tt.task_id, tt.status, tt.assigned_at,
		       COALESCE(TO_CHAR(tt.completed_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(TO_CHAR(tt.submitted_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(TO_CHAR(tt.reviewed_at,  'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(ta.title,''), COALESCE(ta.description,''), COALESCE(ta.xp_reward,0),
		       COALESCE(TO_CHAR(ta.deadline, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(t.name,''), COALESCE(tt.submission_text,'')
		FROM team_tasks tt
		JOIN tasks ta ON ta.id = tt.task_id
		JOIN teams t ON t.id = tt.team_id
		ORDER BY tt.assigned_at DESC`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var details []model.TeamTaskDetail
	for rows.Next() {
		var d model.TeamTaskDetail
		if err := rows.Scan(
			&d.ID, &d.TeamID, &d.TaskID, &d.Status, &d.AssignedAt, &d.CompletedAt,
			&d.SubmittedAt, &d.ReviewedAt,
			&d.Title, &d.Description, &d.XPReward, &d.Deadline, &d.TeamName, &d.SubmissionText,
		); err != nil {
			return nil, err
		}
		details = append(details, d)
	}
	if details == nil {
		details = []model.TeamTaskDetail{}
	}
	return details, nil
}

func (db *DB) AddTeamXP(ctx context.Context, teamID uuid.UUID, xp int) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE teams SET total_xp = total_xp + $2 WHERE id=$1`,
		teamID, xp,
	)
	return err
}

func (db *DB) LogTeamActivity(ctx context.Context, entry *model.TeamActivityEntry) error {
	// user_id is nullable in the database. Use nil if the UUID is zero value.
	var userIDParam interface{}
	empty := uuid.UUID{}
	if entry.UserID != empty {
		userIDParam = entry.UserID
	}

	query := `
		INSERT INTO team_activity (id, team_id, user_id, action, description, xp_gained, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING id, created_at`
	return db.Pool.QueryRow(ctx, query,
		entry.ID, entry.TeamID, userIDParam, entry.Action, entry.Description, entry.XPGained,
	).Scan(&entry.ID, &entry.CreatedAt)
}

// Ensure time import is used.
var _ = time.Now
