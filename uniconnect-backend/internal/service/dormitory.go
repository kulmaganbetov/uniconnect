package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type DormitoryService struct {
	repo repository.DormitoryRepository
}

func NewDormitoryService(repo repository.DormitoryRepository) *DormitoryService {
	return &DormitoryService{repo: repo}
}

func (s *DormitoryService) GetAll(ctx context.Context) ([]model.Dormitory, error) {
	return s.repo.GetAllDormitories(ctx)
}

func (s *DormitoryService) GetByID(ctx context.Context, id uuid.UUID) (*model.Dormitory, error) {
	return s.repo.GetDormitoryByID(ctx, id)
}

func (s *DormitoryService) Apply(ctx context.Context, userID uuid.UUID, req model.DormitoryApplyRequest) (*model.DormitoryApplication, error) {
	app := &model.DormitoryApplication{
		ID:          uuid.New(),
		UserID:      userID,
		DormitoryID: req.DormitoryID,
		Status:      "pending",
		Message:     req.Message,
	}

	if err := s.repo.CreateDormitoryApplication(ctx, app); err != nil {
		return nil, err
	}
	return app, nil
}

func (s *DormitoryService) GetMyApplications(ctx context.Context, userID uuid.UUID) ([]model.DormApplicationDetail, error) {
	return s.repo.GetUserDormitoryApplications(ctx, userID)
}

func (s *DormitoryService) GetAllApplications(ctx context.Context) ([]model.DormApplicationDetail, error) {
	return s.repo.GetAllDormitoryApplications(ctx)
}

func (s *DormitoryService) UpdateApplicationStatus(ctx context.Context, id uuid.UUID, status string) (*model.DormitoryApplication, error) {
	return s.repo.UpdateDormitoryApplicationStatus(ctx, id, status)
}

// Create inserts a new dormitory. Admin/dormitory_manager only.
func (s *DormitoryService) Create(ctx context.Context, req model.DormitoryUpsertRequest) (*model.Dormitory, error) {
	d := &model.Dormitory{
		ID:             uuid.New(),
		Name:           req.Name,
		Address:        req.Address,
		TotalRooms:     req.TotalRooms,
		AvailableRooms: req.AvailableRooms,
		PricePerMonth:  req.PricePerMonth,
		Description:    req.Description,
		ImageURL:       req.ImageURL,
	}
	if err := s.repo.CreateDormitory(ctx, d); err != nil {
		return nil, ErrInternal
	}
	return d, nil
}

// Update mutates an existing dormitory.
func (s *DormitoryService) Update(ctx context.Context, id uuid.UUID, req model.DormitoryUpsertRequest) (*model.Dormitory, error) {
	d := &model.Dormitory{
		Name:           req.Name,
		Address:        req.Address,
		TotalRooms:     req.TotalRooms,
		AvailableRooms: req.AvailableRooms,
		PricePerMonth:  req.PricePerMonth,
		Description:    req.Description,
		ImageURL:       req.ImageURL,
	}
	out, err := s.repo.UpdateDormitory(ctx, id, d)
	if err != nil {
		return nil, ErrInternal
	}
	return out, nil
}

func (s *DormitoryService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.DeleteDormitory(ctx, id); err != nil {
		return ErrInternal
	}
	return nil
}
