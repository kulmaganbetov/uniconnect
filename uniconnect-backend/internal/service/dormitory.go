package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type DormitoryService struct {
	db *repository.DB
}

func NewDormitoryService(db *repository.DB) *DormitoryService {
	return &DormitoryService{db: db}
}

func (s *DormitoryService) GetAll(ctx context.Context) ([]model.Dormitory, error) {
	return s.db.GetAllDormitories(ctx)
}

func (s *DormitoryService) GetByID(ctx context.Context, id uuid.UUID) (*model.Dormitory, error) {
	return s.db.GetDormitoryByID(ctx, id)
}

func (s *DormitoryService) Apply(ctx context.Context, userID uuid.UUID, req model.DormitoryApplyRequest) (*model.DormitoryApplication, error) {
	app := &model.DormitoryApplication{
		ID:          uuid.New(),
		UserID:      userID,
		DormitoryID: req.DormitoryID,
		Status:      "pending",
		Message:     req.Message,
	}

	if err := s.db.CreateDormitoryApplication(ctx, app); err != nil {
		return nil, err
	}
	return app, nil
}

func (s *DormitoryService) GetMyApplications(ctx context.Context, userID uuid.UUID) ([]model.DormitoryApplication, error) {
	return s.db.GetUserDormitoryApplications(ctx, userID)
}

func (s *DormitoryService) GetAllApplications(ctx context.Context) ([]model.DormitoryApplication, error) {
	return s.db.GetAllDormitoryApplications(ctx)
}

func (s *DormitoryService) UpdateApplicationStatus(ctx context.Context, id uuid.UUID, status string) (*model.DormitoryApplication, error) {
	return s.db.UpdateDormitoryApplicationStatus(ctx, id, status)
}
