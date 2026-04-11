package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
)

// These interfaces describe the persistence contract that each domain
// service depends on. Services should be constructed with the interface
// type, not *DB, so they can be unit tested with in-memory fakes.
// The concrete *DB type satisfies every interface implicitly.

type UserRepository interface {
	CreateUser(ctx context.Context, user *model.User) error
	GetUserByEmail(ctx context.Context, email string) (*model.User, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error)
	UpdateUser(ctx context.Context, id uuid.UUID, name, country, university string) (*model.User, error)
	GetAllUsers(ctx context.Context) ([]model.User, error)
}

type DormitoryRepository interface {
	GetAllDormitories(ctx context.Context) ([]model.Dormitory, error)
	GetDormitoryByID(ctx context.Context, id uuid.UUID) (*model.Dormitory, error)
	CreateDormitoryApplication(ctx context.Context, app *model.DormitoryApplication) error
	GetUserDormitoryApplications(ctx context.Context, userID uuid.UUID) ([]model.DormitoryApplication, error)
	GetAllDormitoryApplications(ctx context.Context) ([]model.DormitoryApplication, error)
	UpdateDormitoryApplicationStatus(ctx context.Context, id uuid.UUID, status string) (*model.DormitoryApplication, error)
}

type MedicalRepository interface {
	GetAllMedicalServices(ctx context.Context) ([]model.MedicalService, error)
	GetMedicalServiceByID(ctx context.Context, id uuid.UUID) (*model.MedicalService, error)
	CreateMedicalAppointment(ctx context.Context, app *model.MedicalAppointment) error
	GetUserMedicalAppointments(ctx context.Context, userID uuid.UUID) ([]model.MedicalAppointment, error)
}

type JobRepository interface {
	GetAllJobs(ctx context.Context) ([]model.Job, error)
	GetJobByID(ctx context.Context, id uuid.UUID) (*model.Job, error)
	CreateJobApplication(ctx context.Context, app *model.JobApplication) error
	GetUserJobApplications(ctx context.Context, userID uuid.UUID) ([]model.JobApplication, error)
}

type PsychologyRepository interface {
	CreatePsychologyRequest(ctx context.Context, req *model.PsychologyRequest) error
	GetUserPsychologyRequests(ctx context.Context, userID uuid.UUID) ([]model.PsychologyRequest, error)
}

type GuideRepository interface {
	GetAllGuides(ctx context.Context, category string) ([]model.Guide, error)
	GetGuideByID(ctx context.Context, id uuid.UUID) (*model.Guide, error)
}

// Compile-time assertions that *DB satisfies every repository interface.
var (
	_ UserRepository       = (*DB)(nil)
	_ DormitoryRepository  = (*DB)(nil)
	_ MedicalRepository    = (*DB)(nil)
	_ JobRepository        = (*DB)(nil)
	_ PsychologyRepository = (*DB)(nil)
	_ GuideRepository      = (*DB)(nil)
)
