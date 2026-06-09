package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

// ─── TeamService ──────────────────────────────────────────────────────────────

type TeamService struct {
	teams repository.TeamRepository
	users repository.UserRepository
}

func NewTeamService(teams repository.TeamRepository, users repository.UserRepository) *TeamService {
	return &TeamService{teams: teams, users: users}
}

// GetAll returns every team ordered by XP descending.
func (s *TeamService) GetAll(ctx context.Context) ([]model.TeamSummary, error) {
	teams, err := s.teams.GetAllTeams(ctx)
	if err != nil {
		return nil, ErrInternal
	}
	return teams, nil
}

// GetLeaderboard returns the top-N teams by XP.
func (s *TeamService) GetLeaderboard(ctx context.Context) ([]model.TeamSummary, error) {
	teams, err := s.teams.GetLeaderboard(ctx, 20)
	if err != nil {
		return nil, ErrInternal
	}
	return teams, nil
}

// GetByID returns the full detail of a single team.
func (s *TeamService) GetByID(ctx context.Context, id uuid.UUID) (*model.TeamDetail, error) {
	detail, err := s.teams.GetTeamByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, ErrInternal
	}
	return detail, nil
}

// MyTeam returns the team the authenticated user belongs to.
func (s *TeamService) MyTeam(ctx context.Context, userID uuid.UUID) (*model.TeamSummary, error) {
	ts, err := s.teams.GetUserTeam(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, ErrInternal
	}
	return ts, nil
}

// Create creates a new team for the authenticated user, using their language/level.
func (s *TeamService) Create(ctx context.Context, userID uuid.UUID, req model.CreateTeamRequest) (*model.TeamDetail, error) {
	// Fetch the user to get language/level.
	user, err := s.users.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, ErrInternal
	}

	if user.Language == "" || user.LanguageLevel == "" {
		return nil, errors.New("you must set your language and language level before creating a team")
	}

	// Check if user is already in a team.
	existing, err := s.teams.GetUserTeam(ctx, userID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrInternal
	}
	if existing != nil {
		return nil, errors.New("you are already a member of a team")
	}

	t := &model.Team{
		ID:            uuid.New(),
		Name:          req.Name,
		Language:      user.Language,
		LanguageLevel: user.LanguageLevel,
		Description:   req.Description,
		AvatarURL:     req.AvatarURL,
		CreatedBy:     userID,
	}

	if err := s.teams.CreateTeam(ctx, t); err != nil {
		// Unique constraint on name.
		return nil, errors.New("team name already taken")
	}

	// Add the creator as the leader.
	if err := s.teams.AddTeamMember(ctx, t.ID, userID, "leader"); err != nil {
		// Roll back the team creation on failure.
		_ = s.teams.DeleteTeam(ctx, t.ID)
		return nil, ErrInternal
	}

	detail, err := s.teams.GetTeamByID(ctx, t.ID)
	if err != nil {
		return nil, ErrInternal
	}
	return detail, nil
}

// Join adds the authenticated user to the given team after validating language match.
func (s *TeamService) Join(ctx context.Context, userID, teamID uuid.UUID) (*model.TeamDetail, error) {
	user, err := s.users.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, ErrInternal
	}

	if user.Language == "" || user.LanguageLevel == "" {
		return nil, errors.New("you must set your language and language level before joining a team")
	}

	// Check user not already in a team.
	existing, err := s.teams.GetUserTeam(ctx, userID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrInternal
	}
	if existing != nil {
		return nil, errors.New("you are already a member of a team")
	}

	// Fetch the target team.
	detail, err := s.teams.GetTeamByID(ctx, teamID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, ErrInternal
	}

	// Language/level must match.
	if detail.Language != user.Language || detail.LanguageLevel != user.LanguageLevel {
		return nil, errors.New("your language and level must match the team's")
	}

	// Team must have fewer than 4 members.
	count, err := s.teams.GetTeamMemberCount(ctx, teamID)
	if err != nil {
		return nil, ErrInternal
	}
	if count >= 4 {
		return nil, errors.New("team is full (maximum 4 members)")
	}

	if err := s.teams.AddTeamMember(ctx, teamID, userID, "member"); err != nil {
		return nil, ErrInternal
	}

	updated, err := s.teams.GetTeamByID(ctx, teamID)
	if err != nil {
		return nil, ErrInternal
	}
	return updated, nil
}

// Leave removes the authenticated user from their team.
func (s *TeamService) Leave(ctx context.Context, userID, teamID uuid.UUID) error {
	if err := s.teams.RemoveTeamMember(ctx, teamID, userID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return ErrInternal
	}
	return nil
}

// ─── TaskService ──────────────────────────────────────────────────────────────

type TaskService struct {
	tasks repository.TaskRepository
	teams repository.TeamRepository
}

func NewTaskService(tasks repository.TaskRepository, teams repository.TeamRepository) *TaskService {
	return &TaskService{tasks: tasks, teams: teams}
}

func (s *TaskService) GetAll(ctx context.Context) ([]model.Task, error) {
	tasks, err := s.tasks.GetAllTasks(ctx)
	if err != nil {
		return nil, ErrInternal
	}
	return tasks, nil
}

func (s *TaskService) Create(ctx context.Context, adminID uuid.UUID, req model.TaskUpsertRequest) (*model.Task, error) {
	xp := req.XPReward
	if xp <= 0 {
		xp = 10
	}
	t := &model.Task{
		ID:          uuid.New(),
		Title:       req.Title,
		Description: req.Description,
		XPReward:    xp,
		Deadline:    req.Deadline,
		Status:      "active",
		CreatedBy:   adminID,
	}
	if err := s.tasks.CreateTask(ctx, t); err != nil {
		return nil, ErrInternal
	}
	return t, nil
}

func (s *TaskService) Update(ctx context.Context, id uuid.UUID, req model.TaskUpsertRequest) (*model.Task, error) {
	t := &model.Task{
		Title:       req.Title,
		Description: req.Description,
		XPReward:    req.XPReward,
		Deadline:    req.Deadline,
	}
	updated, err := s.tasks.UpdateTask(ctx, id, t)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, ErrInternal
	}
	return updated, nil
}

func (s *TaskService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.tasks.DeleteTask(ctx, id); err != nil {
		return ErrInternal
	}
	return nil
}

func (s *TaskService) AssignToTeam(ctx context.Context, taskID, teamID uuid.UUID) (*model.TeamTask, error) {
	tt, err := s.tasks.AssignTaskToTeam(ctx, teamID, taskID)
	if err != nil {
		return nil, ErrInternal
	}
	return tt, nil
}

// SubmitTeamTask allows a team member to submit a task for admin review.
func (s *TaskService) SubmitTeamTask(ctx context.Context, userID, teamTaskID uuid.UUID, submissionText string) error {
	tt, err := s.tasks.GetTeamTaskByID(ctx, teamTaskID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return ErrInternal
	}

	// Verify the user is a member of the team that owns this task.
	memberTeam, err := s.teams.GetMemberTeam(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errors.New("you are not a member of any team")
		}
		return ErrInternal
	}
	if memberTeam.ID != tt.TeamID {
		return errors.New("you are not a member of this team's task")
	}

	switch tt.Status {
	case "completed":
		return errors.New("this task is already completed")
	case "submitted":
		return errors.New("task already submitted, awaiting admin review")
	}

	return s.tasks.SubmitTeamTask(ctx, teamTaskID, submissionText)
}

// CompleteTeamTask approves a submitted task and awards XP (admin only).
func (s *TaskService) CompleteTeamTask(ctx context.Context, teamTaskID uuid.UUID) error {
	tt, err := s.tasks.GetTeamTaskByID(ctx, teamTaskID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return ErrInternal
	}

	if tt.Status == "completed" {
		return errors.New("task is already completed")
	}
	if tt.Status != "submitted" {
		return errors.New("task must be submitted by the team before it can be approved")
	}

	if err := s.tasks.CompleteTeamTask(ctx, teamTaskID); err != nil {
		return ErrInternal
	}

	task, err := s.tasks.GetTaskByID(ctx, tt.TaskID)
	if err != nil {
		return nil // activity log is best-effort
	}

	entry := &model.TeamActivityEntry{
		ID:          uuid.New(),
		TeamID:      tt.TeamID,
		Action:      "task_completed",
		Description: "Completed task: " + task.Title,
		XPGained:    task.XPReward,
	}
	_ = s.tasks.LogTeamActivity(ctx, entry)
	return nil
}

// RejectTeamTask returns a submitted task to assigned status (admin only).
func (s *TaskService) RejectTeamTask(ctx context.Context, teamTaskID uuid.UUID) error {
	tt, err := s.tasks.GetTeamTaskByID(ctx, teamTaskID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return ErrInternal
	}
	if tt.Status != "submitted" {
		return errors.New("can only reject tasks that have been submitted")
	}
	return s.tasks.RejectTeamTask(ctx, teamTaskID)
}

func (s *TaskService) GetAllTeamTasks(ctx context.Context) ([]model.TeamTaskDetail, error) {
	details, err := s.tasks.GetAllTeamTasks(ctx)
	if err != nil {
		return nil, ErrInternal
	}
	return details, nil
}
