package service

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

// ErrInternal is returned when an unexpected repository/database error
// occurs. Handlers should translate this to HTTP 500.
var ErrInternal = errors.New("internal server error")

type AuthService struct {
	users     repository.UserRepository
	jwtSecret string
}

func NewAuthService(users repository.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{users: users, jwtSecret: jwtSecret}
}

// Register creates a new student account. It returns a sanitized
// UserResponse (never the raw User with PasswordHash).
func (s *AuthService) Register(ctx context.Context, req model.RegisterRequest) (model.UserResponse, error) {
	// Check email availability. Only pgx.ErrNoRows means "available";
	// any other error is a real failure and must not be silently ignored.
	existing, err := s.users.GetUserByEmail(ctx, req.Email)
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
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hash),
		Country:      req.Country,
		University:   req.University,
		Role:         "student",
	}

	if err := s.users.CreateUser(ctx, user); err != nil {
		return model.UserResponse{}, ErrInternal
	}

	return model.SanitizeUser(user), nil
}

func (s *AuthService) Login(ctx context.Context, req model.LoginRequest) (*model.LoginResponse, error) {
	user, err := s.users.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("invalid email or password")
		}
		return nil, ErrInternal
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	token, err := s.generateToken(user.ID, user.Role)
	if err != nil {
		return nil, ErrInternal
	}

	return &model.LoginResponse{
		Token: token,
		User:  model.SanitizeUser(user),
	}, nil
}

// GetMe returns the authenticated user's sanitized profile.
func (s *AuthService) GetMe(ctx context.Context, userID uuid.UUID) (model.UserResponse, error) {
	user, err := s.users.GetUserByID(ctx, userID)
	if err != nil {
		return model.UserResponse{}, err
	}
	return model.SanitizeUser(user), nil
}

func (s *AuthService) generateToken(userID uuid.UUID, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID.String(),
		"role":    role,
		"exp":     time.Now().Add(72 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}
