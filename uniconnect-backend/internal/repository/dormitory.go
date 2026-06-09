package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
)

func (db *DB) GetAllDormitories(ctx context.Context) ([]model.Dormitory, error) {
	query := `SELECT id, name, address, total_rooms, available_rooms, single_rooms, double_rooms, price_per_month, description, COALESCE(image_url, ''), created_at FROM dormitories ORDER BY created_at DESC`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var dorms []model.Dormitory
	for rows.Next() {
		var d model.Dormitory
		if err := rows.Scan(&d.ID, &d.Name, &d.Address, &d.TotalRooms, &d.AvailableRooms, &d.SingleRooms, &d.DoubleRooms, &d.PricePerMonth, &d.Description, &d.ImageURL, &d.CreatedAt); err != nil {
			return nil, err
		}
		dorms = append(dorms, d)
	}
	return dorms, nil
}

func (db *DB) GetDormitoryByID(ctx context.Context, id uuid.UUID) (*model.Dormitory, error) {
	d := &model.Dormitory{}
	query := `SELECT id, name, address, total_rooms, available_rooms, single_rooms, double_rooms, price_per_month, description, COALESCE(image_url, ''), created_at FROM dormitories WHERE id = $1`
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&d.ID, &d.Name, &d.Address, &d.TotalRooms, &d.AvailableRooms, &d.SingleRooms, &d.DoubleRooms, &d.PricePerMonth, &d.Description, &d.ImageURL, &d.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return d, nil
}

func (db *DB) CreateDormitoryApplication(ctx context.Context, app *model.DormitoryApplication) error {
	query := `
		INSERT INTO dormitory_applications (id, user_id, dormitory_id, status, room_type, message, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING created_at`
	return db.Pool.QueryRow(ctx, query,
		app.ID, app.UserID, app.DormitoryID, app.Status, app.RoomType, app.Message,
	).Scan(&app.CreatedAt)
}

func (db *DB) GetUserDormitoryApplications(ctx context.Context, userID uuid.UUID) ([]model.DormApplicationDetail, error) {
	query := `
		SELECT da.id, da.user_id, da.dormitory_id, da.status, COALESCE(da.room_type, 'any'), da.message, da.created_at,
		       COALESCE(d.name, '') AS dormitory_name
		FROM dormitory_applications da
		LEFT JOIN dormitories d ON d.id = da.dormitory_id
		WHERE da.user_id = $1
		ORDER BY da.created_at DESC`
	rows, err := db.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []model.DormApplicationDetail
	for rows.Next() {
		var a model.DormApplicationDetail
		if err := rows.Scan(&a.ID, &a.UserID, &a.DormitoryID, &a.Status, &a.RoomType, &a.Message, &a.CreatedAt, &a.DormitoryName); err != nil {
			return nil, err
		}
		apps = append(apps, a)
	}
	return apps, nil
}

func (db *DB) GetAllDormitoryApplications(ctx context.Context) ([]model.DormApplicationDetail, error) {
	query := `
		SELECT da.id, da.user_id, da.dormitory_id, da.status, COALESCE(da.room_type, 'any'), da.message, da.created_at,
		       COALESCE(d.name, '') AS dormitory_name,
		       COALESCE(u.name, '') AS user_name,
		       COALESCE(u.email, '') AS user_email,
		       COALESCE(u.country, '') AS user_country
		FROM dormitory_applications da
		LEFT JOIN dormitories d ON d.id = da.dormitory_id
		LEFT JOIN users u ON u.id = da.user_id
		ORDER BY da.created_at DESC`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []model.DormApplicationDetail
	for rows.Next() {
		var a model.DormApplicationDetail
		if err := rows.Scan(&a.ID, &a.UserID, &a.DormitoryID, &a.Status, &a.RoomType, &a.Message, &a.CreatedAt,
			&a.DormitoryName, &a.UserName, &a.UserEmail, &a.UserCountry); err != nil {
			return nil, err
		}
		apps = append(apps, a)
	}
	return apps, nil
}

func (db *DB) UpdateDormitoryApplicationStatus(ctx context.Context, id uuid.UUID, status string) (*model.DormitoryApplication, error) {
	// Get current application state first to handle room count transitions
	var current model.DormitoryApplication
	err := db.Pool.QueryRow(ctx,
		`SELECT id, user_id, dormitory_id, status, COALESCE(room_type, 'any'), message, created_at FROM dormitory_applications WHERE id = $1`,
		id,
	).Scan(&current.ID, &current.UserID, &current.DormitoryID, &current.Status, &current.RoomType, &current.Message, &current.CreatedAt)
	if err != nil {
		return nil, err
	}

	// Update the status
	app := &model.DormitoryApplication{}
	query := `
		UPDATE dormitory_applications SET status = $2
		WHERE id = $1
		RETURNING id, user_id, dormitory_id, status, COALESCE(room_type, 'any'), message, created_at`
	err = db.Pool.QueryRow(ctx, query, id, status).Scan(
		&app.ID, &app.UserID, &app.DormitoryID, &app.Status, &app.RoomType, &app.Message, &app.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Adjust room counts based on status transitions
	wasApproved := current.Status == "approved"
	isApproved := status == "approved"

	if !wasApproved && isApproved {
		// Approval: decrement available rooms and specific room type counter
		roomType := current.RoomType
		switch roomType {
		case "single":
			_, _ = db.Pool.Exec(ctx, `
				UPDATE dormitories SET
					available_rooms = GREATEST(available_rooms - 1, 0),
					single_rooms = GREATEST(single_rooms - 1, 0)
				WHERE id = $1`, current.DormitoryID)
		case "double":
			_, _ = db.Pool.Exec(ctx, `
				UPDATE dormitories SET
					available_rooms = GREATEST(available_rooms - 1, 0),
					double_rooms = GREATEST(double_rooms - 1, 0)
				WHERE id = $1`, current.DormitoryID)
		default:
			_, _ = db.Pool.Exec(ctx, `
				UPDATE dormitories SET available_rooms = GREATEST(available_rooms - 1, 0)
				WHERE id = $1`, current.DormitoryID)
		}
	} else if wasApproved && !isApproved {
		// Un-approval (rejected/pending): restore room count
		roomType := current.RoomType
		switch roomType {
		case "single":
			_, _ = db.Pool.Exec(ctx, `
				UPDATE dormitories SET
					available_rooms = LEAST(available_rooms + 1, total_rooms),
					single_rooms = single_rooms + 1
				WHERE id = $1`, current.DormitoryID)
		case "double":
			_, _ = db.Pool.Exec(ctx, `
				UPDATE dormitories SET
					available_rooms = LEAST(available_rooms + 1, total_rooms),
					double_rooms = double_rooms + 1
				WHERE id = $1`, current.DormitoryID)
		default:
			_, _ = db.Pool.Exec(ctx, `
				UPDATE dormitories SET available_rooms = LEAST(available_rooms + 1, total_rooms)
				WHERE id = $1`, current.DormitoryID)
		}
	}

	return app, nil
}
