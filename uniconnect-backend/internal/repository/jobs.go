package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
)

func (db *DB) GetAllJobs(ctx context.Context) ([]model.Job, error) {
	query := `SELECT id, title, company, description, salary, schedule, location, requirements, contact_email, created_at FROM jobs ORDER BY created_at DESC`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []model.Job
	for rows.Next() {
		var j model.Job
		if err := rows.Scan(&j.ID, &j.Title, &j.Company, &j.Description, &j.Salary, &j.Schedule, &j.Location, &j.Requirements, &j.ContactEmail, &j.CreatedAt); err != nil {
			return nil, err
		}
		jobs = append(jobs, j)
	}
	return jobs, nil
}

func (db *DB) GetJobByID(ctx context.Context, id uuid.UUID) (*model.Job, error) {
	j := &model.Job{}
	query := `SELECT id, title, company, description, salary, schedule, location, requirements, contact_email, created_at FROM jobs WHERE id = $1`
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&j.ID, &j.Title, &j.Company, &j.Description, &j.Salary, &j.Schedule, &j.Location, &j.Requirements, &j.ContactEmail, &j.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return j, nil
}

func (db *DB) CreateJobApplication(ctx context.Context, app *model.JobApplication) error {
	query := `
		INSERT INTO job_applications (id, user_id, job_id, status, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING created_at`
	return db.Pool.QueryRow(ctx, query,
		app.ID, app.UserID, app.JobID, app.Status,
	).Scan(&app.CreatedAt)
}

func (db *DB) GetUserJobApplications(ctx context.Context, userID uuid.UUID) ([]model.JobApplication, error) {
	query := `SELECT id, user_id, job_id, status, created_at FROM job_applications WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := db.Pool.Query(ctx, query, userID)
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
