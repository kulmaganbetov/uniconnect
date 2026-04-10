# UniConnect KZ Backend

Backend API for UniConnect KZ — a platform for foreign students in Kazakhstan to find dormitories, medical services, jobs, psychological support, and digital service guides.

## Tech Stack

- **Language**: Go 1.22+
- **Router**: chi
- **Database**: PostgreSQL 16
- **Auth**: JWT (bcrypt password hashing)
- **Migrations**: golang-migrate

## Running with Docker

```bash
# Start PostgreSQL, run migrations, and launch the server
docker-compose up --build

# Seed the database (in a separate terminal)
docker-compose exec server sh -c "cd /app && go run seeds/seed.go"
```

Or seed locally after docker-compose is running:

```bash
DATABASE_URL=postgres://postgres:password@localhost:5432/uniconnect?sslmode=disable go run seeds/seed.go
```

The API will be available at `http://localhost:8080`.

## Running Locally

### Prerequisites

- Go 1.22+
- PostgreSQL 16+
- [golang-migrate](https://github.com/golang-migrate/migrate)

### Setup

```bash
# Clone and enter the directory
cd uniconnect-backend

# Copy environment config
cp .env.example .env
# Edit .env with your database credentials

# Create the database
createdb uniconnect

# Run migrations
migrate -path migrations -database "$DATABASE_URL" up

# Seed the database
go run seeds/seed.go

# Install dependencies and run
go mod tidy
go run cmd/server/main.go
```

## API Endpoints

### Auth

| Method | Endpoint             | Auth     | Description          |
|--------|----------------------|----------|----------------------|
| POST   | `/api/auth/register` | -        | Register new user    |
| POST   | `/api/auth/login`    | -        | Login, get JWT token |
| GET    | `/api/auth/me`       | JWT      | Get current user     |

### Dormitory

| Method | Endpoint                          | Auth | Description               |
|--------|-----------------------------------|------|---------------------------|
| GET    | `/api/dormitory`                  | -    | List all dormitories      |
| GET    | `/api/dormitory/{id}`             | -    | Get one dormitory         |
| POST   | `/api/dormitory/apply`            | JWT  | Submit application        |
| GET    | `/api/dormitory/my-applications`  | JWT  | Get user's applications   |

### Medical

| Method | Endpoint                         | Auth | Description               |
|--------|----------------------------------|------|---------------------------|
| GET    | `/api/medical`                   | -    | List medical services     |
| GET    | `/api/medical/{id}`              | -    | Get one service           |
| POST   | `/api/medical/appointment`       | JWT  | Book appointment          |
| GET    | `/api/medical/my-appointments`   | JWT  | Get user's appointments   |

### Jobs

| Method | Endpoint                      | Auth | Description               |
|--------|-------------------------------|------|---------------------------|
| GET    | `/api/jobs`                   | -    | List all jobs             |
| GET    | `/api/jobs/{id}`              | -    | Get one job               |
| POST   | `/api/jobs/apply`             | JWT  | Apply for job             |
| GET    | `/api/jobs/my-applications`   | JWT  | Get user's applications   |

### Psychology

| Method | Endpoint                        | Auth | Description               |
|--------|---------------------------------|------|---------------------------|
| POST   | `/api/psychology/request`       | JWT  | Submit support request    |
| GET    | `/api/psychology/my-requests`   | JWT  | Get user's requests       |

### Guides

| Method | Endpoint             | Auth | Description                              |
|--------|----------------------|------|------------------------------------------|
| GET    | `/api/guides`        | -    | List guides (optional `?category=...`)   |
| GET    | `/api/guides/{id}`   | -    | Get one guide                            |

### Profile

| Method | Endpoint        | Auth | Description          |
|--------|-----------------|------|----------------------|
| GET    | `/api/profile`  | JWT  | Get user profile     |
| PUT    | `/api/profile`  | JWT  | Update user profile  |

### Admin (requires admin role)

| Method | Endpoint                       | Auth       | Description                    |
|--------|--------------------------------|------------|--------------------------------|
| GET    | `/api/admin/applications`      | JWT+Admin  | List all dormitory apps        |
| PUT    | `/api/admin/applications/{id}` | JWT+Admin  | Update application status      |
| GET    | `/api/admin/users`             | JWT+Admin  | List all users                 |

### Health

| Method | Endpoint   | Description        |
|--------|------------|--------------------|
| GET    | `/health`  | Health check       |

## Response Format

All responses follow a consistent envelope:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "error message"
}
```

## Authentication

Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <your-token>
```

## Seed Data

Run `go run seeds/seed.go` to populate the database with:

- 2 admin users (`admin@uniconnect.kz` / `admin123`, `admin2@uniconnect.kz` / `admin123`)
- 3 dormitories
- 5 medical services
- 5 job listings
- 3 guides (transport, banking, mobile)
