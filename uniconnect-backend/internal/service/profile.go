package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

// ErrNotFound is returned when a requested entity does not exist.
var ErrNotFound = errors.New("not found")

type ProfileService struct {
	users repository.UserRepository
}

func NewProfileService(users repository.UserRepository) *ProfileService {
	return &ProfileService{users: users}
}

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

func (s *ProfileService) UpdateProfile(ctx context.Context, userID uuid.UUID, req model.UpdateProfileRequest) (model.UserResponse, error) {
	user, err := s.users.UpdateUser(ctx, userID, req.Name, req.Country, req.University, req.AvatarURL, req.Language, req.LanguageLevel)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.UserResponse{}, ErrNotFound
		}
		return model.UserResponse{}, ErrInternal
	}
	return model.SanitizeUser(user), nil
}

func (s *ProfileService) ChangePassword(ctx context.Context, userID uuid.UUID, req model.ChangePasswordRequest) error {
	if err := s.users.VerifyUserPassword(ctx, userID, req.CurrentPassword); err != nil {
		return errors.New("current password is incorrect")
	}
	if len(req.NewPassword) < 6 {
		return errors.New("new password must be at least 6 characters")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return ErrInternal
	}
	return s.users.UpdateUserPassword(ctx, userID, string(hash))
}
