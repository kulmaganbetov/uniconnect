package handler

import (
	"errors"
	"regexp"
	"strings"

	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
)

// emailRegex is a pragmatic email validator. It rejects obvious
// malformed addresses without trying to exhaustively model RFC 5322.
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

const minPasswordLength = 8

// validateEmail returns a descriptive error if the email is missing or
// does not look like a valid email address.
func validateEmail(email string) error {
	email = strings.TrimSpace(email)
	if email == "" {
		return errors.New("email is required")
	}
	if !emailRegex.MatchString(email) {
		return errors.New("email must be a valid email address")
	}
	return nil
}

// validatePassword enforces the minimum password length.
func validatePassword(password string) error {
	if password == "" {
		return errors.New("password is required")
	}
	if len(password) < minPasswordLength {
		return errors.New("password must be at least 8 characters")
	}
	return nil
}

// validateName ensures the name is present (after trimming whitespace).
func validateName(name string) error {
	if strings.TrimSpace(name) == "" {
		return errors.New("name is required")
	}
	return nil
}

// validateRegisterRequest runs every field-level validation for a
// registration payload and returns the first failure.
func validateRegisterRequest(req model.RegisterRequest) error {
	if err := validateName(req.Name); err != nil {
		return err
	}
	if err := validateEmail(req.Email); err != nil {
		return err
	}
	if err := validatePassword(req.Password); err != nil {
		return err
	}
	if strings.TrimSpace(req.Country) == "" {
		return errors.New("country is required")
	}
	if strings.TrimSpace(req.University) == "" {
		return errors.New("university is required")
	}
	return nil
}

// validateLoginRequest checks that login credentials are well-formed.
func validateLoginRequest(req model.LoginRequest) error {
	if err := validateEmail(req.Email); err != nil {
		return err
	}
	if req.Password == "" {
		return errors.New("password is required")
	}
	return nil
}

// validateUpdateProfileRequest checks the update-profile payload.
func validateUpdateProfileRequest(req model.UpdateProfileRequest) error {
	if err := validateName(req.Name); err != nil {
		return err
	}
	if strings.TrimSpace(req.Country) == "" {
		return errors.New("country is required")
	}
	if strings.TrimSpace(req.University) == "" {
		return errors.New("university is required")
	}
	return nil
}
