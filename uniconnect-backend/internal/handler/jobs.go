package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/middleware"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/service"
)

type JobHandler struct {
	svc *service.JobService
}

func NewJobHandler(svc *service.JobService) *JobHandler {
	return &JobHandler{svc: svc}
}

func (h *JobHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	jobs, err := h.svc.GetAll(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch jobs"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: jobs})
}

func (h *JobHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid job id"})
		return
	}

	job, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "job not found"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: job})
}

func (h *JobHandler) Apply(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req model.JobApplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	app, err := h.svc.Apply(r.Context(), userID, req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to submit job application"})
		return
	}

	writeJSON(w, http.StatusCreated, model.APIResponse{Success: true, Data: app})
}

func (h *JobHandler) MyApplications(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	apps, err := h.svc.GetMyApplications(r.Context(), userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch job applications"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: apps})
}
