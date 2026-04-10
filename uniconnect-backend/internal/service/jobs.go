package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type JobService struct {
	db *repository.DB
}

func NewJobService(db *repository.DB) *JobService {
	return &JobService{db: db}
}

func (s *JobService) GetAll(ctx context.Context) ([]model.Job, error) {
	return s.db.GetAllJobs(ctx)
}

func (s *JobService) GetByID(ctx context.Context, id uuid.UUID) (*model.Job, error) {
	return s.db.GetJobByID(ctx, id)
}

func (s *JobService) Apply(ctx context.Context, userID uuid.UUID, req model.JobApplyRequest) (*model.JobApplication, error) {
	app := &model.JobApplication{
		ID:     uuid.New(),
		UserID: userID,
		JobID:  req.JobID,
		Status: "pending",
	}

	if err := s.db.CreateJobApplication(ctx, app); err != nil {
		return nil, err
	}
	return app, nil
}

func (s *JobService) GetMyApplications(ctx context.Context, userID uuid.UUID) ([]model.JobApplication, error) {
	return s.db.GetUserJobApplications(ctx, userID)
}
