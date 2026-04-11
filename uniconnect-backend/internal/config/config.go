package config

import (
	"fmt"
	"os"
)

type Config struct {
	DatabaseURL     string
	JWTSecret       string
	Port            string
	AnthropicAPIKey string
	AnthropicModel  string
}

func Load() (*Config, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// ANTHROPIC_API_KEY is optional. If absent the AI consultant
	// endpoint returns a friendly "AI is not configured" error instead
	// of crashing the server.
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	model := os.Getenv("ANTHROPIC_MODEL")
	if model == "" {
		model = "claude-haiku-4-5"
	}

	return &Config{
		DatabaseURL:     dbURL,
		JWTSecret:       jwtSecret,
		Port:            port,
		AnthropicAPIKey: apiKey,
		AnthropicModel:  model,
	}, nil
}
