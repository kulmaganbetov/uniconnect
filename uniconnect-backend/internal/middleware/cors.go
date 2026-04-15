package middleware

import (
	"github.com/go-chi/cors"
)

func CORSHandler() cors.Options {
	return cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"https://*.vercel.app",
			"https://uniconnect-frontend.vercel.app",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}
}
