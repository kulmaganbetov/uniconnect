package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type MedicalService struct {
	repo repository.MedicalRepository
}

func NewMedicalService(repo repository.MedicalRepository) *MedicalService {
	return &MedicalService{repo: repo}
}

func (s *MedicalService) GetAll(ctx context.Context) ([]model.MedicalService, error) {
	return s.repo.GetAllMedicalServices(ctx)
}

func (s *MedicalService) GetByID(ctx context.Context, id uuid.UUID) (*model.MedicalService, error) {
	return s.repo.GetMedicalServiceByID(ctx, id)
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

	if err := s.repo.CreateMedicalAppointment(ctx, app); err != nil {
		return nil, err
	}
	return app, nil
}

func (s *MedicalService) GetMyAppointments(ctx context.Context, userID uuid.UUID) ([]model.MedicalAppointment, error) {
	return s.repo.GetUserMedicalAppointments(ctx, userID)
}
