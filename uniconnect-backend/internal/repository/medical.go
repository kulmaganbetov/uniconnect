package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
)

func (db *DB) GetAllMedicalServices(ctx context.Context) ([]model.MedicalService, error) {
	query := `SELECT id, name, type, address, phone, working_hours, description, is_free FROM medical_services ORDER BY name`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []model.MedicalService
	for rows.Next() {
		var s model.MedicalService
		if err := rows.Scan(&s.ID, &s.Name, &s.Type, &s.Address, &s.Phone, &s.WorkingHours, &s.Description, &s.IsFree); err != nil {
			return nil, err
		}
		services = append(services, s)
	}
	return services, nil
}

func (db *DB) GetMedicalServiceByID(ctx context.Context, id uuid.UUID) (*model.MedicalService, error) {
	s := &model.MedicalService{}
	query := `SELECT id, name, type, address, phone, working_hours, description, is_free FROM medical_services WHERE id = $1`
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.Name, &s.Type, &s.Address, &s.Phone, &s.WorkingHours, &s.Description, &s.IsFree,
	)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (db *DB) CreateMedicalAppointment(ctx context.Context, app *model.MedicalAppointment) error {
	query := `
		INSERT INTO medical_appointments (id, user_id, service_id, date, time, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING created_at`
	return db.Pool.QueryRow(ctx, query,
		app.ID, app.UserID, app.ServiceID, app.Date, app.Time, app.Status,
	).Scan(&app.CreatedAt)
}

func (db *DB) GetUserMedicalAppointments(ctx context.Context, userID uuid.UUID) ([]model.MedicalAppointment, error) {
	query := `SELECT id, user_id, service_id, date, time, status, created_at FROM medical_appointments WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := db.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var appointments []model.MedicalAppointment
	for rows.Next() {
		var a model.MedicalAppointment
		if err := rows.Scan(&a.ID, &a.UserID, &a.ServiceID, &a.Date, &a.Time, &a.Status, &a.CreatedAt); err != nil {
			return nil, err
		}
		appointments = append(appointments, a)
	}
	return appointments, nil
}
