package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type JobService struct {
	repo repository.JobRepository
}

func NewJobService(repo repository.JobRepository) *JobService {
	return &JobService{repo: repo}
}

func (s *JobService) GetAll(ctx context.Context) ([]model.Job, error) {
	return s.repo.GetAllJobs(ctx)
}

func (s *JobService) GetByID(ctx context.Context, id uuid.UUID) (*model.Job, error) {
	return s.repo.GetJobByID(ctx, id)
}

func (s *JobService) Apply(ctx context.Context, userID uuid.UUID, req model.JobApplyRequest) (*model.JobApplication, error) {
	app := &model.JobApplication{
		ID:     uuid.New(),
		UserID: userID,
		JobID:  req.JobID,
		Status: "pending",
	}

	if err := s.repo.CreateJobApplication(ctx, app); err != nil {
		return nil, err
	}
	return app, nil
}

func (s *JobService) GetMyApplications(ctx context.Context, userID uuid.UUID) ([]model.JobApplication, error) {
	return s.repo.GetUserJobApplications(ctx, userID)
}

// Manager/admin operations

func (s *JobService) GetAllApplications(ctx context.Context) ([]model.JobApplication, error) {
	return s.repo.GetAllJobApplications(ctx)
}

func (s *JobService) Create(ctx context.Context, req model.JobUpsertRequest) (*model.Job, error) {
	j := &model.Job{
		ID:           uuid.New(),
		Title:        req.Title,
		Company:      req.Company,
		Description:  req.Description,
		Salary:       req.Salary,
		Schedule:     req.Schedule,
		Location:     req.Location,
		Requirements: req.Requirements,
		ContactEmail: req.ContactEmail,
	}
	if err := s.repo.CreateJob(ctx, j); err != nil {
		return nil, ErrInternal
	}
	return j, nil
}

func (s *JobService) Update(ctx context.Context, id uuid.UUID, req model.JobUpsertRequest) (*model.Job, error) {
	j := &model.Job{
		Title:        req.Title,
		Company:      req.Company,
		Description:  req.Description,
		Salary:       req.Salary,
		Schedule:     req.Schedule,
		Location:     req.Location,
		Requirements: req.Requirements,
		ContactEmail: req.ContactEmail,
	}
	out, err := s.repo.UpdateJob(ctx, id, j)
	if err != nil {
		return nil, ErrInternal
	}
	return out, nil
}

func (s *JobService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.DeleteJob(ctx, id); err != nil {
		return ErrInternal
	}
	return nil
}
