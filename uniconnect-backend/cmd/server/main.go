package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/config"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/handler"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/middleware"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/service"
)

func main() {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx := context.Background()
	db, err := repository.NewDB(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Services — each one receives only the repository interface it
	// needs, so they can be unit tested with in-memory fakes.
	authSvc := service.NewAuthService(db, cfg.JWTSecret)
	dormSvc := service.NewDormitoryService(db)
	medSvc := service.NewMedicalService(db)
	jobSvc := service.NewJobService(db)
	psySvc := service.NewPsychologyService(db)
	guideSvc := service.NewGuideService(db)
	profileSvc := service.NewProfileService(db)
	adminSvc := service.NewAdminService(db)

	// Handlers
	authH := handler.NewAuthHandler(authSvc)
	dormH := handler.NewDormitoryHandler(dormSvc)
	medH := handler.NewMedicalHandler(medSvc)
	jobH := handler.NewJobHandler(jobSvc)
	psyH := handler.NewPsychologyHandler(psySvc)
	guideH := handler.NewGuideHandler(guideSvc)
	profileH := handler.NewProfileHandler(profileSvc)
	adminH := handler.NewAdminHandler(adminSvc)

	// Router
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RequestID)
	r.Use(cors.Handler(middleware.CORSHandler()))

	// JWT middleware
	jwtAuth := middleware.JWTAuth(cfg.JWTSecret)
	adminOnly := middleware.AdminOnly

	// Public routes
	r.Route("/api", func(r chi.Router) {
		// Auth
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authH.Register)
			r.Post("/login", authH.Login)
			r.With(jwtAuth).Get("/me", authH.Me)
		})

		// Dormitory
		r.Route("/dormitory", func(r chi.Router) {
			r.Get("/", dormH.GetAll)
			r.Get("/{id}", dormH.GetByID)
			r.With(jwtAuth).Post("/apply", dormH.Apply)
			r.With(jwtAuth).Get("/my-applications", dormH.MyApplications)
		})

		// Medical
		r.Route("/medical", func(r chi.Router) {
			r.Get("/", medH.GetAll)
			r.Get("/{id}", medH.GetByID)
			r.With(jwtAuth).Post("/appointment", medH.BookAppointment)
			r.With(jwtAuth).Get("/my-appointments", medH.MyAppointments)
		})

		// Jobs
		r.Route("/jobs", func(r chi.Router) {
			r.Get("/", jobH.GetAll)
			r.Get("/{id}", jobH.GetByID)
			r.With(jwtAuth).Post("/apply", jobH.Apply)
			r.With(jwtAuth).Get("/my-applications", jobH.MyApplications)
		})

		// Psychology
		r.Route("/psychology", func(r chi.Router) {
			r.With(jwtAuth).Post("/request", psyH.CreateRequest)
			r.With(jwtAuth).Get("/my-requests", psyH.MyRequests)
		})

		// Guides
		r.Route("/guides", func(r chi.Router) {
			r.Get("/", guideH.GetAll)
			r.Get("/{id}", guideH.GetByID)
		})

		// Profile
		r.Route("/profile", func(r chi.Router) {
			r.Use(jwtAuth)
			r.Get("/", profileH.GetProfile)
			r.Put("/", profileH.UpdateProfile)
		})

		// Admin
		r.Route("/admin", func(r chi.Router) {
			r.Use(jwtAuth)
			r.Use(adminOnly)
			r.Get("/applications", dormH.GetAllApplications)
			r.Put("/applications/{id}", dormH.UpdateApplicationStatus)
			r.Get("/users", adminH.GetAllUsers)
		})
	})

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}
	log.Println("Server stopped")
}
