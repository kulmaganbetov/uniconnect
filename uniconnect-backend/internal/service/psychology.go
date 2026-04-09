package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type PsychologyService struct {
	db *repository.DB
}

func NewPsychologyService(db *repository.DB) *PsychologyService {
	return &PsychologyService{db: db}
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

	if err := s.db.CreatePsychologyRequest(ctx, pr); err != nil {
		return nil, err
	}
	return pr, nil
}

func (s *PsychologyService) GetMyRequests(ctx context.Context, userID uuid.UUID) ([]model.PsychologyRequest, error) {
	return s.db.GetUserPsychologyRequests(ctx, userID)
}
