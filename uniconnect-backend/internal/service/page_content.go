package service

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type PageContentService struct {
	repo repository.PageContentRepository
}

func NewPageContentService(repo repository.PageContentRepository) *PageContentService {
	return &PageContentService{repo: repo}
}

func (s *PageContentService) GetAll(ctx context.Context) ([]model.PageContent, error) {
	out, err := s.repo.GetAllPageContents(ctx)
	if err != nil {
		return nil, ErrInternal
	}
	return out, nil
}

func (s *PageContentService) Get(ctx context.Context, key string) (*model.PageContent, error) {
	p, err := s.repo.GetPageContent(ctx, key)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, ErrInternal
	}
	return p, nil
}

// Upsert creates or updates a piece of editable copy. Admin-only.
func (s *PageContentService) Upsert(ctx context.Context, key string, req model.UpdatePageContentRequest) (*model.PageContent, error) {
	key = strings.TrimSpace(key)
	if key == "" {
		return nil, errors.New("key is required")
	}
	p, err := s.repo.UpsertPageContent(ctx, key, req.Title, req.Body)
	if err != nil {
		return nil, ErrInternal
	}
	return p, nil
}
