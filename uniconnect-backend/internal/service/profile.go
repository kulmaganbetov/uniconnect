package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

// ErrNotFound is returned when a requested entity does not exist.
var ErrNotFound = errors.New("not found")

type ProfileService struct {
	users repository.UserRepository
}

func NewProfileService(users repository.UserRepository) *ProfileService {
	return &ProfileService{users: users}
}

// GetProfile returns the sanitized profile for the authenticated user.
func (s *ProfileService) GetProfile(ctx context.Context, userID uuid.UUID) (model.UserResponse, error) {
	user, err := s.users.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.UserResponse{}, ErrNotFound
		}
		return model.UserResponse{}, ErrInternal
	}
	return model.SanitizeUser(user), nil
}

// UpdateProfile mutates the user's mutable fields and returns the
// sanitized result.
func (s *ProfileService) UpdateProfile(ctx context.Context, userID uuid.UUID, req model.UpdateProfileRequest) (model.UserResponse, error) {
	user, err := s.users.UpdateUser(ctx, userID, req.Name, req.Country, req.University)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.UserResponse{}, ErrNotFound
		}
		return model.UserResponse{}, ErrInternal
	}
	return model.SanitizeUser(user), nil
}
