package service

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AdminService struct {
	users repository.UserRepository
}

func NewAdminService(users repository.UserRepository) *AdminService {
	return &AdminService{users: users}
}

// CreateUser provisions a new account from the admin panel. Unlike the
// public /register endpoint, admins can set the role directly and are
// not bound to "student". The chosen role must still be in AllRoles.
func (s *AdminService) CreateUser(ctx context.Context, req model.AdminCreateUserRequest) (model.UserResponse, error) {
	name := strings.TrimSpace(req.Name)
	email := strings.TrimSpace(strings.ToLower(req.Email))
	if name == "" || email == "" || req.Password == "" {
		return model.UserResponse{}, errors.New("name, email and password are required")
	}
	if len(req.Password) < 6 {
		return model.UserResponse{}, errors.New("password must be at least 6 characters")
	}
	role := req.Role
	if role == "" {
		role = model.RoleStudent
	}
	if !model.IsValidRole(role) {
		return model.UserResponse{}, errors.New("invalid role")
	}

	existing, err := s.users.GetUserByEmail(ctx, email)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return model.UserResponse{}, ErrInternal
	}
	if existing != nil {
		return model.UserResponse{}, errors.New("email already registered")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return model.UserResponse{}, ErrInternal
	}

	user := &model.User{
		ID:           uuid.New(),
		Name:         name,
		Email:        email,
		PasswordHash: string(hash),
		Country:      req.Country,
		University:   req.University,
		Role:         role,
	}
	if err := s.users.CreateUser(ctx, user); err != nil {
		return model.UserResponse{}, ErrInternal
	}
	return model.SanitizeUser(user), nil
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
