package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type AdminService struct {
	users repository.UserRepository
}

func NewAdminService(users repository.UserRepository) *AdminService {
	return &AdminService{users: users}
}

// GetAllUsers returns the sanitized list of every user in the system.
// Only admin-gated handlers should call this.
func (s *AdminService) GetAllUsers(ctx context.Context) ([]model.UserResponse, error) {
	users, err := s.users.GetAllUsers(ctx)
	if err != nil {
		return nil, ErrInternal
	}
	return model.SanitizeUsers(users), nil
}

// UpdateUserRole changes a user's role to one of the allowed values.
func (s *AdminService) UpdateUserRole(ctx context.Context, id uuid.UUID, role string) (model.UserResponse, error) {
	if !model.IsValidRole(role) {
		return model.UserResponse{}, errors.New("invalid role")
	}
	user, err := s.users.UpdateUserRole(ctx, id, role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.UserResponse{}, ErrNotFound
		}
		return model.UserResponse{}, ErrInternal
	}
	return model.SanitizeUser(user), nil
}

// DeleteUser removes a user account. The cascade rules in the schema
// take care of dependent application/appointment rows.
func (s *AdminService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	if err := s.users.DeleteUser(ctx, id); err != nil {
		return ErrInternal
	}
	return nil
}
