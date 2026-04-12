package model

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Country      string    `json:"country"`
	University   string    `json:"university"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

// UserResponse is the public representation of a user. It intentionally
// omits PasswordHash and any other sensitive fields so callers cannot
// accidentally leak credentials in API responses.
type UserResponse struct {
	ID         uuid.UUID `json:"id"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	Country    string    `json:"country"`
	University string    `json:"university"`
	Role       string    `json:"role"`
	CreatedAt  time.Time `json:"created_at"`
}

// SanitizeUser strips sensitive fields from a User and returns the
// client-safe UserResponse. Always use this when returning user data
// from an API handler.
func SanitizeUser(u *User) UserResponse {
	if u == nil {
		return UserResponse{}
	}
	return UserResponse{
		ID:         u.ID,
		Name:       u.Name,
		Email:      u.Email,
		Country:    u.Country,
		University: u.University,
		Role:       u.Role,
		CreatedAt:  u.CreatedAt,
	}
}

// SanitizeUsers converts a slice of users to their sanitized form.
func SanitizeUsers(users []User) []UserResponse {
	out := make([]UserResponse, len(users))
	for i := range users {
		out[i] = SanitizeUser(&users[i])
	}
	return out
}

type Dormitory struct {
	ID             uuid.UUID `json:"id"`
	Name           string    `json:"name"`
	Address        string    `json:"address"`
	TotalRooms     int       `json:"total_rooms"`
	AvailableRooms int       `json:"available_rooms"`
	PricePerMonth  float64   `json:"price_per_month"`
	Description    string    `json:"description"`
	CreatedAt      time.Time `json:"created_at"`
}

type DormitoryApplication struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	DormitoryID uuid.UUID `json:"dormitory_id"`
	Status      string    `json:"status"`
	Message     string    `json:"message"`
	CreatedAt   time.Time `json:"created_at"`
}

// DormApplicationDetail is a richer view returned by admin and
// my-applications endpoints. It includes the dormitory name and
// (for admins) the applicant's name, email, and country.
type DormApplicationDetail struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"user_id"`
	DormitoryID   uuid.UUID `json:"dormitory_id"`
	Status        string    `json:"status"`
	Message       string    `json:"message"`
	CreatedAt     time.Time `json:"created_at"`
	DormitoryName string    `json:"dormitory_name"`
	UserName      string    `json:"user_name,omitempty"`
	UserEmail     string    `json:"user_email,omitempty"`
	UserCountry   string    `json:"user_country,omitempty"`
}

type MedicalService struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Type         string    `json:"type"`
	Address      string    `json:"address"`
	Phone        string    `json:"phone"`
	WorkingHours string    `json:"working_hours"`
	Description  string    `json:"description"`
	IsFree       bool      `json:"is_free"`
}

type MedicalAppointment struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	ServiceID uuid.UUID `json:"service_id"`
	Date      string    `json:"date"`
	Time      string    `json:"time"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type Job struct {
	ID           uuid.UUID `json:"id"`
	Title        string    `json:"title"`
	Company      string    `json:"company"`
	Description  string    `json:"description"`
	Salary       string    `json:"salary"`
	Schedule     string    `json:"schedule"`
	Location     string    `json:"location"`
	Requirements string    `json:"requirements"`
	ContactEmail string    `json:"contact_email"`
	CreatedAt    time.Time `json:"created_at"`
}

type JobApplication struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	JobID     uuid.UUID `json:"job_id"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type PsychologyRequest struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"user_id"`
	Topic         string    `json:"topic"`
	Message       string    `json:"message"`
	PreferredDate string    `json:"preferred_date"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type Guide struct {
	ID        uuid.UUID `json:"id"`
	Title     string    `json:"title"`
	Category  string    `json:"category"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// Request/Response types

type RegisterRequest struct {
	Name       string `json:"name"`
	Email      string `json:"email"`
	Password   string `json:"password"`
	Country    string `json:"country"`
	University string `json:"university"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type DormitoryApplyRequest struct {
	DormitoryID uuid.UUID `json:"dormitory_id"`
	Message     string    `json:"message"`
}

type MedicalAppointmentRequest struct {
	ServiceID uuid.UUID `json:"service_id"`
	Date      string    `json:"date"`
	Time      string    `json:"time"`
}

type JobApplyRequest struct {
	JobID uuid.UUID `json:"job_id"`
}

type PsychologyRequestCreate struct {
	Topic         string `json:"topic"`
	Message       string `json:"message"`
	PreferredDate string `json:"preferred_date"`
}

type UpdateProfileRequest struct {
	Name       string `json:"name"`
	Country    string `json:"country"`
	University string `json:"university"`
}

type UpdateApplicationStatusRequest struct {
	Status string `json:"status"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// Roles recognised by the application. The string values are persisted
// in users.role and embedded in JWT claims.
const (
	RoleStudent          = "student"
	RoleAdmin            = "admin"
	RoleManager          = "manager"
	RoleTeacher          = "teacher"
	RoleDormitoryManager = "dormitory_manager"
)

// AllRoles is the canonical list of every assignable role. The admin
// UI uses this to populate the role-change dropdown.
var AllRoles = []string{
	RoleStudent,
	RoleAdmin,
	RoleManager,
	RoleTeacher,
	RoleDormitoryManager,
}

// IsValidRole reports whether the supplied role string matches one of
// the known roles.
func IsValidRole(role string) bool {
	for _, r := range AllRoles {
		if r == role {
			return true
		}
	}
	return false
}

// PageContent is an admin-editable piece of copy keyed by a stable
// identifier (e.g. "landing_hero").
type PageContent struct {
	Key       string    `json:"key"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UpdatePageContentRequest struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

type UpdateUserRoleRequest struct {
	Role string `json:"role"`
}

// AI consultant types

type ChatMessage struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"`
}

type ChatRequest struct {
	Messages []ChatMessage `json:"messages"`
}

type ChatResponse struct {
	Reply string `json:"reply"`
}

// Admin CRUD payloads

type DormitoryUpsertRequest struct {
	Name           string  `json:"name"`
	Address        string  `json:"address"`
	TotalRooms     int     `json:"total_rooms"`
	AvailableRooms int     `json:"available_rooms"`
	PricePerMonth  float64 `json:"price_per_month"`
	Description    string  `json:"description"`
}

type JobUpsertRequest struct {
	Title        string `json:"title"`
	Company      string `json:"company"`
	Description  string `json:"description"`
	Salary       string `json:"salary"`
	Schedule     string `json:"schedule"`
	Location     string `json:"location"`
	Requirements string `json:"requirements"`
	ContactEmail string `json:"contact_email"`
}

type MedicalUpsertRequest struct {
	Name         string `json:"name"`
	Type         string `json:"type"`
	Address      string `json:"address"`
	Phone        string `json:"phone"`
	WorkingHours string `json:"working_hours"`
	Description  string `json:"description"`
	IsFree       bool   `json:"is_free"`
}

type GuideUpsertRequest struct {
	Title    string `json:"title"`
	Category string `json:"category"`
	Content  string `json:"content"`
}
