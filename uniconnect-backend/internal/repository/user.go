package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"golang.org/x/crypto/bcrypt"
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
	query := `SELECT id, name, email, password_hash, country, university, role, COALESCE(avatar_url, ''), COALESCE(language, ''), COALESCE(language_level, ''), created_at FROM users WHERE email = $1`
	err := db.Pool.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash,
		&user.Country, &user.University, &user.Role, &user.AvatarURL,
		&user.Language, &user.LanguageLevel, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (db *DB) GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	user := &model.User{}
	query := `SELECT id, name, email, password_hash, country, university, role, COALESCE(avatar_url, ''), COALESCE(language, ''), COALESCE(language_level, ''), created_at FROM users WHERE id = $1`
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash,
		&user.Country, &user.University, &user.Role, &user.AvatarURL,
		&user.Language, &user.LanguageLevel, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (db *DB) UpdateUser(ctx context.Context, id uuid.UUID, name, country, university, avatarURL, language, languageLevel string) (*model.User, error) {
	user := &model.User{}
	query := `
		UPDATE users SET name=$2, country=$3, university=$4, avatar_url=NULLIF($5,''), language=$6, language_level=$7
		WHERE id=$1
		RETURNING id, name, email, password_hash, country, university, role, COALESCE(avatar_url,''), COALESCE(language,''), COALESCE(language_level,''), created_at`
	err := db.Pool.QueryRow(ctx, query, id, name, country, university, avatarURL, language, languageLevel).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash,
		&user.Country, &user.University, &user.Role, &user.AvatarURL,
		&user.Language, &user.LanguageLevel, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (db *DB) UpdateUserPassword(ctx context.Context, id uuid.UUID, newPasswordHash string) error {
	query := `UPDATE users SET password_hash = $2 WHERE id = $1`
	_, err := db.Pool.Exec(ctx, query, id, newPasswordHash)
	return err
}

func (db *DB) GetAllUsers(ctx context.Context) ([]model.User, error) {
	query := `SELECT id, name, email, password_hash, country, university, role, COALESCE(avatar_url, ''), COALESCE(language, ''), COALESCE(language_level, ''), created_at FROM users ORDER BY created_at DESC`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Country, &u.University, &u.Role, &u.AvatarURL, &u.Language, &u.LanguageLevel, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (db *DB) VerifyUserPassword(ctx context.Context, id uuid.UUID, password string) error {
	var hash string
	err := db.Pool.QueryRow(ctx, `SELECT password_hash FROM users WHERE id = $1`, id).Scan(&hash)
	if err != nil {
		return err
	}
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}
