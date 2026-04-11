package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
)

// User admin operations

func (db *DB) UpdateUserRole(ctx context.Context, id uuid.UUID, role string) (*model.User, error) {
	u := &model.User{}
	err := db.Pool.QueryRow(ctx, `
		UPDATE users SET role = $2 WHERE id = $1
		RETURNING id, name, email, password_hash, country, university, role, created_at`,
		id, role,
	).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Country, &u.University, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (db *DB) DeleteUser(ctx context.Context, id uuid.UUID) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	return err
}

// Dormitory admin CRUD

func (db *DB) CreateDormitory(ctx context.Context, d *model.Dormitory) error {
	return db.Pool.QueryRow(ctx, `
		INSERT INTO dormitories (id, name, address, total_rooms, available_rooms, price_per_month, description, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING created_at`,
		d.ID, d.Name, d.Address, d.TotalRooms, d.AvailableRooms, d.PricePerMonth, d.Description,
	).Scan(&d.CreatedAt)
}

func (db *DB) UpdateDormitory(ctx context.Context, id uuid.UUID, d *model.Dormitory) (*model.Dormitory, error) {
	out := &model.Dormitory{}
	err := db.Pool.QueryRow(ctx, `
		UPDATE dormitories
		SET name = $2, address = $3, total_rooms = $4, available_rooms = $5, price_per_month = $6, description = $7
		WHERE id = $1
		RETURNING id, name, address, total_rooms, available_rooms, price_per_month, description, created_at`,
		id, d.Name, d.Address, d.TotalRooms, d.AvailableRooms, d.PricePerMonth, d.Description,
	).Scan(&out.ID, &out.Name, &out.Address, &out.TotalRooms, &out.AvailableRooms, &out.PricePerMonth, &out.Description, &out.CreatedAt)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (db *DB) DeleteDormitory(ctx context.Context, id uuid.UUID) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM dormitories WHERE id = $1`, id)
	return err
}

// Job admin CRUD

func (db *DB) CreateJob(ctx context.Context, j *model.Job) error {
	return db.Pool.QueryRow(ctx, `
		INSERT INTO jobs (id, title, company, description, salary, schedule, location, requirements, contact_email, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
		RETURNING created_at`,
		j.ID, j.Title, j.Company, j.Description, j.Salary, j.Schedule, j.Location, j.Requirements, j.ContactEmail,
	).Scan(&j.CreatedAt)
}

func (db *DB) UpdateJob(ctx context.Context, id uuid.UUID, j *model.Job) (*model.Job, error) {
	out := &model.Job{}
	err := db.Pool.QueryRow(ctx, `
		UPDATE jobs
		SET title = $2, company = $3, description = $4, salary = $5, schedule = $6, location = $7, requirements = $8, contact_email = $9
		WHERE id = $1
		RETURNING id, title, company, description, salary, schedule, location, requirements, contact_email, created_at`,
		id, j.Title, j.Company, j.Description, j.Salary, j.Schedule, j.Location, j.Requirements, j.ContactEmail,
	).Scan(&out.ID, &out.Title, &out.Company, &out.Description, &out.Salary, &out.Schedule, &out.Location, &out.Requirements, &out.ContactEmail, &out.CreatedAt)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (db *DB) DeleteJob(ctx context.Context, id uuid.UUID) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM jobs WHERE id = $1`, id)
	return err
}

func (db *DB) GetAllJobApplications(ctx context.Context) ([]model.JobApplication, error) {
	rows, err := db.Pool.Query(ctx, `SELECT id, user_id, job_id, status, created_at FROM job_applications ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var apps []model.JobApplication
	for rows.Next() {
		var a model.JobApplication
		if err := rows.Scan(&a.ID, &a.UserID, &a.JobID, &a.Status, &a.CreatedAt); err != nil {
			return nil, err
		}
		apps = append(apps, a)
	}
	return apps, nil
}

// Medical admin CRUD

func (db *DB) CreateMedicalService(ctx context.Context, s *model.MedicalService) error {
	_, err := db.Pool.Exec(ctx, `
		INSERT INTO medical_services (id, name, type, address, phone, working_hours, description, is_free)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		s.ID, s.Name, s.Type, s.Address, s.Phone, s.WorkingHours, s.Description, s.IsFree,
	)
	return err
}

func (db *DB) UpdateMedicalService(ctx context.Context, id uuid.UUID, s *model.MedicalService) (*model.MedicalService, error) {
	out := &model.MedicalService{}
	err := db.Pool.QueryRow(ctx, `
		UPDATE medical_services
		SET name = $2, type = $3, address = $4, phone = $5, working_hours = $6, description = $7, is_free = $8
		WHERE id = $1
		RETURNING id, name, type, address, phone, working_hours, description, is_free`,
		id, s.Name, s.Type, s.Address, s.Phone, s.WorkingHours, s.Description, s.IsFree,
	).Scan(&out.ID, &out.Name, &out.Type, &out.Address, &out.Phone, &out.WorkingHours, &out.Description, &out.IsFree)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (db *DB) DeleteMedicalService(ctx context.Context, id uuid.UUID) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM medical_services WHERE id = $1`, id)
	return err
}

// Guide admin CRUD

func (db *DB) CreateGuide(ctx context.Context, g *model.Guide) error {
	return db.Pool.QueryRow(ctx, `
		INSERT INTO guides (id, title, category, content, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING created_at`,
		g.ID, g.Title, g.Category, g.Content,
	).Scan(&g.CreatedAt)
}

func (db *DB) UpdateGuide(ctx context.Context, id uuid.UUID, g *model.Guide) (*model.Guide, error) {
	out := &model.Guide{}
	err := db.Pool.QueryRow(ctx, `
		UPDATE guides SET title = $2, category = $3, content = $4
		WHERE id = $1
		RETURNING id, title, category, content, created_at`,
		id, g.Title, g.Category, g.Content,
	).Scan(&out.ID, &out.Title, &out.Category, &out.Content, &out.CreatedAt)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (db *DB) DeleteGuide(ctx context.Context, id uuid.UUID) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM guides WHERE id = $1`, id)
	return err
}

// Psychology admin

func (db *DB) GetAllPsychologyRequests(ctx context.Context) ([]model.PsychologyRequest, error) {
	rows, err := db.Pool.Query(ctx, `SELECT id, user_id, topic, message, preferred_date, status, created_at FROM psychology_requests ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []model.PsychologyRequest
	for rows.Next() {
		var r model.PsychologyRequest
		if err := rows.Scan(&r.ID, &r.UserID, &r.Topic, &r.Message, &r.PreferredDate, &r.Status, &r.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, nil
}

func (db *DB) UpdatePsychologyRequestStatus(ctx context.Context, id uuid.UUID, status string) (*model.PsychologyRequest, error) {
	out := &model.PsychologyRequest{}
	err := db.Pool.QueryRow(ctx, `
		UPDATE psychology_requests SET status = $2 WHERE id = $1
		RETURNING id, user_id, topic, message, preferred_date, status, created_at`,
		id, status,
	).Scan(&out.ID, &out.UserID, &out.Topic, &out.Message, &out.PreferredDate, &out.Status, &out.CreatedAt)
	if err != nil {
		return nil, err
	}
	return out, nil
}
