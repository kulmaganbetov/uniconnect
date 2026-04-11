package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type PsychologyService struct {
	repo repository.PsychologyRepository
}

func NewPsychologyService(repo repository.PsychologyRepository) *PsychologyService {
	return &PsychologyService{repo: repo}
}

func (s *PsychologyService) CreateRequest(ctx context.Context, userID uuid.UUID, req model.PsychologyRequestCreate) (*model.PsychologyRequest, error) {
	pr := &model.PsychologyRequest{
		ID:            uuid.New(),
		UserID:        userID,
		Topic:         req.Topic,
		Message:       req.Message,
		PreferredDate: req.PreferredDate,
		Status:        "pending",
	}

	if err := s.repo.CreatePsychologyRequest(ctx, pr); err != nil {
		return nil, err
	}
	return pr, nil
}

func (s *PsychologyService) GetMyRequests(ctx context.Context, userID uuid.UUID) ([]model.PsychologyRequest, error) {
	return s.repo.GetUserPsychologyRequests(ctx, userID)
}

// Counsellor (teacher/admin) operations

func (s *PsychologyService) GetAllRequests(ctx context.Context) ([]model.PsychologyRequest, error) {
	return s.repo.GetAllPsychologyRequests(ctx)
}

func (s *PsychologyService) UpdateStatus(ctx context.Context, id uuid.UUID, status string) (*model.PsychologyRequest, error) {
	out, err := s.repo.UpdatePsychologyRequestStatus(ctx, id, status)
	if err != nil {
		return nil, ErrInternal
	}
	return out, nil
}
