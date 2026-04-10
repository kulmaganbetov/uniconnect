package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
)

func (db *DB) CreatePsychologyRequest(ctx context.Context, req *model.PsychologyRequest) error {
	query := `
		INSERT INTO psychology_requests (id, user_id, topic, message, preferred_date, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING created_at`
	return db.Pool.QueryRow(ctx, query,
		req.ID, req.UserID, req.Topic, req.Message, req.PreferredDate, req.Status,
	).Scan(&req.CreatedAt)
}

func (db *DB) GetUserPsychologyRequests(ctx context.Context, userID uuid.UUID) ([]model.PsychologyRequest, error) {
	query := `SELECT id, user_id, topic, message, preferred_date, status, created_at FROM psychology_requests WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := db.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []model.PsychologyRequest
	for rows.Next() {
		var r model.PsychologyRequest
		if err := rows.Scan(&r.ID, &r.UserID, &r.Topic, &r.Message, &r.PreferredDate, &r.Status, &r.CreatedAt); err != nil {
			return nil, err
		}
		requests = append(requests, r)
	}
	return requests, nil
}

func (db *DB) GetAllGuides(ctx context.Context, category string) ([]model.Guide, error) {
	var query string
	var args []interface{}

	if category != "" {
		query = `SELECT id, title, category, content, created_at FROM guides WHERE category = $1 ORDER BY created_at DESC`
		args = append(args, category)
	} else {
		query = `SELECT id, title, category, content, created_at FROM guides ORDER BY created_at DESC`
	}

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var guides []model.Guide
	for rows.Next() {
		var g model.Guide
		if err := rows.Scan(&g.ID, &g.Title, &g.Category, &g.Content, &g.CreatedAt); err != nil {
			return nil, err
		}
		guides = append(guides, g)
	}
	return guides, nil
}

func (db *DB) GetGuideByID(ctx context.Context, id uuid.UUID) (*model.Guide, error) {
	g := &model.Guide{}
	query := `SELECT id, title, category, content, created_at FROM guides WHERE id = $1`
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&g.ID, &g.Title, &g.Category, &g.Content, &g.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return g, nil
}
