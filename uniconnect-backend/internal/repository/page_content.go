package repository

import (
	"context"

	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
)

func (db *DB) GetAllPageContents(ctx context.Context) ([]model.PageContent, error) {
	rows, err := db.Pool.Query(ctx, `SELECT key, title, body, updated_at FROM page_contents ORDER BY key`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.PageContent
	for rows.Next() {
		var p model.PageContent
		if err := rows.Scan(&p.Key, &p.Title, &p.Body, &p.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}

func (db *DB) GetPageContent(ctx context.Context, key string) (*model.PageContent, error) {
	p := &model.PageContent{}
	err := db.Pool.QueryRow(ctx,
		`SELECT key, title, body, updated_at FROM page_contents WHERE key = $1`, key,
	).Scan(&p.Key, &p.Title, &p.Body, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

// UpsertPageContent inserts or updates a piece of editable copy. Used
// by the admin "page content" editor.
func (db *DB) UpsertPageContent(ctx context.Context, key, title, body string) (*model.PageContent, error) {
	p := &model.PageContent{}
	err := db.Pool.QueryRow(ctx, `
		INSERT INTO page_contents (key, title, body, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (key) DO UPDATE
		SET title = EXCLUDED.title, body = EXCLUDED.body, updated_at = NOW()
		RETURNING key, title, body, updated_at`,
		key, title, body,
	).Scan(&p.Key, &p.Title, &p.Body, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}
