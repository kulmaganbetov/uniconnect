package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type MedicalService struct {
	db *repository.DB
}

func NewMedicalService(db *repository.DB) *MedicalService {
	return &MedicalService{db: db}
}

func (s *MedicalService) GetAll(ctx context.Context) ([]model.MedicalService, error) {
	return s.db.GetAllMedicalServices(ctx)
}

func (s *MedicalService) GetByID(ctx context.Context, id uuid.UUID) (*model.MedicalService, error) {
	return s.db.GetMedicalServiceByID(ctx, id)
}

func (s *MedicalService) BookAppointment(ctx context.Context, userID uuid.UUID, req model.MedicalAppointmentRequest) (*model.MedicalAppointment, error) {
	app := &model.MedicalAppointment{
		ID:        uuid.New(),
		UserID:    userID,
		ServiceID: req.ServiceID,
		Date:      req.Date,
		Time:      req.Time,
		Status:    "pending",
	}

	if err := s.db.CreateMedicalAppointment(ctx, app); err != nil {
		return nil, err
	}
	return app, nil
}

func (s *MedicalService) GetMyAppointments(ctx context.Context, userID uuid.UUID) ([]model.MedicalAppointment, error) {
	return s.db.GetUserMedicalAppointments(ctx, userID)
}
