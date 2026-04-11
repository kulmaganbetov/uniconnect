package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type GuideService struct {
	repo repository.GuideRepository
}

func NewGuideService(repo repository.GuideRepository) *GuideService {
	return &GuideService{repo: repo}
}

func (s *GuideService) GetAll(ctx context.Context, category string) ([]model.Guide, error) {
	return s.repo.GetAllGuides(ctx, category)
}

func (s *GuideService) GetByID(ctx context.Context, id uuid.UUID) (*model.Guide, error) {
	return s.repo.GetGuideByID(ctx, id)
}
