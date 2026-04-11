package service

import (
	"context"

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
