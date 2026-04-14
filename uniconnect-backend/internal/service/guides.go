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

// Admin/teacher operations

func (s *GuideService) Create(ctx context.Context, req model.GuideUpsertRequest) (*model.Guide, error) {
	g := &model.Guide{
		ID:       uuid.New(),
		Title:    req.Title,
		Category: req.Category,
		Content:  req.Content,
		ImageURL: req.ImageURL,
	}
	if err := s.repo.CreateGuide(ctx, g); err != nil {
		return nil, ErrInternal
	}
	return g, nil
}

func (s *GuideService) Update(ctx context.Context, id uuid.UUID, req model.GuideUpsertRequest) (*model.Guide, error) {
	g := &model.Guide{
		Title:    req.Title,
		Category: req.Category,
		Content:  req.Content,
		ImageURL: req.ImageURL,
	}
	out, err := s.repo.UpdateGuide(ctx, id, g)
	if err != nil {
		return nil, ErrInternal
	}
	return out, nil
}

func (s *GuideService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.DeleteGuide(ctx, id); err != nil {
		return ErrInternal
	}
	return nil
}
