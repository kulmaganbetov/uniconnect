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
	Token string `json:"token"`
	User  User   `json:"user"`
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
