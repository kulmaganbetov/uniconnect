FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY . .

RUN go mod tidy && go mod download

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

# Скачиваем migrate binary
RUN wget -qO /migrate https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64 \
    && chmod +x /migrate

FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /server .
COPY --from=builder /migrate .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

# Сначала миграции, потом сервер
CMD ["sh", "-c", "./migrate -path=./migrations -database=$DATABASE_URL up && ./server"]
