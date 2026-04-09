package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type GuideService struct {
	db *repository.DB
}

func NewGuideService(db *repository.DB) *GuideService {
	return &GuideService{db: db}
}

func (s *GuideService) GetAll(ctx context.Context, category string) ([]model.Guide, error) {
	return s.db.GetAllGuides(ctx, category)
}

func (s *GuideService) GetByID(ctx context.Context, id uuid.UUID) (*model.Guide, error) {
	return s.db.GetGuideByID(ctx, id)
}
