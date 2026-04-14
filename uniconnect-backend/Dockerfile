FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git curl

COPY . .

RUN go mod tidy && go mod download

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

# migrate-ді Go арқылы орнату (URL мәселесінсіз)
RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.17.0

FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /server .
COPY --from=builder /go/bin/migrate .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

CMD ["sh", "-c", "./migrate -path=./migrations -database=$DATABASE_URL up && ./server"]
