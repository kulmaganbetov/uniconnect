package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
)

func (db *DB) CreateUser(ctx context.Context, user *model.User) error {
	query := `
		INSERT INTO users (id, name, email, password_hash, country, university, role, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING created_at`
	return db.Pool.QueryRow(ctx, query,
		user.ID, user.Name, user.Email, user.PasswordHash,
		user.Country, user.University, user.Role,
	).Scan(&user.CreatedAt)
}

func (db *DB) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	user := &model.User{}
	query := `SELECT id, name, email, password_hash, country, university, role, created_at FROM users WHERE email = $1`
	err := db.Pool.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash,
		&user.Country, &user.University, &user.Role, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (db *DB) GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	user := &model.User{}
	query := `SELECT id, name, email, password_hash, country, university, role, created_at FROM users WHERE id = $1`
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash,
		&user.Country, &user.University, &user.Role, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (db *DB) UpdateUser(ctx context.Context, id uuid.UUID, name, country, university string) (*model.User, error) {
	user := &model.User{}
	query := `
		UPDATE users SET name = $2, country = $3, university = $4
		WHERE id = $1
		RETURNING id, name, email, password_hash, country, university, role, created_at`
	err := db.Pool.QueryRow(ctx, query, id, name, country, university).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash,
		&user.Country, &user.University, &user.Role, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (db *DB) GetAllUsers(ctx context.Context) ([]model.User, error) {
	query := `SELECT id, name, email, password_hash, country, university, role, created_at FROM users ORDER BY created_at DESC`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Country, &u.University, &u.Role, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}
