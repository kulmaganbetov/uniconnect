package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *model.User) error
	GetUserByEmail(ctx context.Context, email string) (*model.User, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error)
	UpdateUser(ctx context.Context, id uuid.UUID, name, country, university, avatarURL, language, languageLevel string) (*model.User, error)
	UpdateUserPassword(ctx context.Context, id uuid.UUID, newPasswordHash string) error
	VerifyUserPassword(ctx context.Context, id uuid.UUID, password string) error
	GetAllUsers(ctx context.Context) ([]model.User, error)
	UpdateUserRole(ctx context.Context, id uuid.UUID, role string) (*model.User, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error
}

type DormitoryRepository interface {
	GetAllDormitories(ctx context.Context) ([]model.Dormitory, error)
	GetDormitoryByID(ctx context.Context, id uuid.UUID) (*model.Dormitory, error)
	CreateDormitory(ctx context.Context, d *model.Dormitory) error
	UpdateDormitory(ctx context.Context, id uuid.UUID, d *model.Dormitory) (*model.Dormitory, error)
	DeleteDormitory(ctx context.Context, id uuid.UUID) error
	CreateDormitoryApplication(ctx context.Context, app *model.DormitoryApplication) error
	GetUserDormitoryApplications(ctx context.Context, userID uuid.UUID) ([]model.DormApplicationDetail, error)
	GetAllDormitoryApplications(ctx context.Context) ([]model.DormApplicationDetail, error)
	UpdateDormitoryApplicationStatus(ctx context.Context, id uuid.UUID, status string) (*model.DormitoryApplication, error)
}

type MedicalRepository interface {
	GetAllMedicalServices(ctx context.Context) ([]model.MedicalService, error)
	GetMedicalServiceByID(ctx context.Context, id uuid.UUID) (*model.MedicalService, error)
	CreateMedicalService(ctx context.Context, s *model.MedicalService) error
	UpdateMedicalService(ctx context.Context, id uuid.UUID, s *model.MedicalService) (*model.MedicalService, error)
	DeleteMedicalService(ctx context.Context, id uuid.UUID) error
	CreateMedicalAppointment(ctx context.Context, app *model.MedicalAppointment) error
	GetUserMedicalAppointments(ctx context.Context, userID uuid.UUID) ([]model.MedicalAppointment, error)
	GetAllMedicalAppointments(ctx context.Context) ([]model.MedicalAppointmentDetail, error)
	UpdateMedicalAppointmentStatus(ctx context.Context, id uuid.UUID, status string) (*model.MedicalAppointmentDetail, error)
}

type JobRepository interface {
	GetAllJobs(ctx context.Context) ([]model.Job, error)
	GetJobByID(ctx context.Context, id uuid.UUID) (*model.Job, error)
	CreateJob(ctx context.Context, j *model.Job) error
	UpdateJob(ctx context.Context, id uuid.UUID, j *model.Job) (*model.Job, error)
	DeleteJob(ctx context.Context, id uuid.UUID) error
	CreateJobApplication(ctx context.Context, app *model.JobApplication) error
	GetUserJobApplications(ctx context.Context, userID uuid.UUID) ([]model.JobApplication, error)
	GetAllJobApplications(ctx context.Context) ([]model.JobApplicationDetail, error)
	UpdateJobApplicationStatus(ctx context.Context, id uuid.UUID, status string) (*model.JobApplicationDetail, error)
}

type PsychologyRepository interface {
	CreatePsychologyRequest(ctx context.Context, req *model.PsychologyRequest) error
	GetUserPsychologyRequests(ctx context.Context, userID uuid.UUID) ([]model.PsychologyRequest, error)
	GetAllPsychologyRequests(ctx context.Context) ([]model.PsychologyRequest, error)
	UpdatePsychologyRequestStatus(ctx context.Context, id uuid.UUID, status string) (*model.PsychologyRequest, error)
}

type GuideRepository interface {
	GetAllGuides(ctx context.Context, category string) ([]model.Guide, error)
	GetGuideByID(ctx context.Context, id uuid.UUID) (*model.Guide, error)
	CreateGuide(ctx context.Context, g *model.Guide) error
	UpdateGuide(ctx context.Context, id uuid.UUID, g *model.Guide) (*model.Guide, error)
	DeleteGuide(ctx context.Context, id uuid.UUID) error
}

type PageContentRepository interface {
	GetAllPageContents(ctx context.Context) ([]model.PageContent, error)
	GetPageContent(ctx context.Context, key string) (*model.PageContent, error)
	UpsertPageContent(ctx context.Context, key, title, body, imageURL string) (*model.PageContent, error)
}

type TeamRepository interface {
	CreateTeam(ctx context.Context, t *model.Team) error
	GetAllTeams(ctx context.Context) ([]model.TeamSummary, error)
	GetLeaderboard(ctx context.Context, limit int) ([]model.TeamSummary, error)
	GetTeamByID(ctx context.Context, id uuid.UUID) (*model.TeamDetail, error)
	GetUserTeam(ctx context.Context, userID uuid.UUID) (*model.TeamSummary, error)
	AddTeamMember(ctx context.Context, teamID, userID uuid.UUID, role string) error
	RemoveTeamMember(ctx context.Context, teamID, userID uuid.UUID) error
	GetTeamMemberCount(ctx context.Context, teamID uuid.UUID) (int, error)
	DeleteTeam(ctx context.Context, id uuid.UUID) error
	PromoteToLeader(ctx context.Context, teamID, userID uuid.UUID) error
	GetMemberTeam(ctx context.Context, userID uuid.UUID) (*model.TeamSummary, error)
}

type TaskRepository interface {
	CreateTask(ctx context.Context, t *model.Task) error
	GetAllTasks(ctx context.Context) ([]model.Task, error)
	GetTaskByID(ctx context.Context, id uuid.UUID) (*model.Task, error)
	UpdateTask(ctx context.Context, id uuid.UUID, t *model.Task) (*model.Task, error)
	DeleteTask(ctx context.Context, id uuid.UUID) error
	AssignTaskToTeam(ctx context.Context, teamID, taskID uuid.UUID) (*model.TeamTask, error)
	CompleteTeamTask(ctx context.Context, teamTaskID uuid.UUID) error
	GetTeamTasks(ctx context.Context, teamID uuid.UUID) ([]model.TeamTaskDetail, error)
	GetAllTeamTasks(ctx context.Context) ([]model.TeamTaskDetail, error)
	GetTeamTaskByID(ctx context.Context, teamTaskID uuid.UUID) (*model.TeamTask, error)
	AddTeamXP(ctx context.Context, teamID uuid.UUID, xp int) error
	LogTeamActivity(ctx context.Context, entry *model.TeamActivityEntry) error
}

// Compile-time assertions that *DB satisfies every repository interface.
var (
	_ UserRepository        = (*DB)(nil)
	_ DormitoryRepository   = (*DB)(nil)
	_ MedicalRepository     = (*DB)(nil)
	_ JobRepository         = (*DB)(nil)
	_ PsychologyRepository  = (*DB)(nil)
	_ GuideRepository       = (*DB)(nil)
	_ PageContentRepository = (*DB)(nil)
	_ TeamRepository        = (*DB)(nil)
	_ TaskRepository        = (*DB)(nil)
)
