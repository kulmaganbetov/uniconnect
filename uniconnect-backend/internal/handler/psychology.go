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

type PsychologyHandler struct {
	svc *service.PsychologyService
}

func NewPsychologyHandler(svc *service.PsychologyService) *PsychologyHandler {
	return &PsychologyHandler{svc: svc}
}

func (h *PsychologyHandler) CreateRequest(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req model.PsychologyRequestCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	pr, err := h.svc.CreateRequest(r.Context(), userID, req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to create psychology request"})
		return
	}

	writeJSON(w, http.StatusCreated, model.APIResponse{Success: true, Data: pr})
}

func (h *PsychologyHandler) MyRequests(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	requests, err := h.svc.GetMyRequests(r.Context(), userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch psychology requests"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: requests})
}

// Counsellor (teacher/admin) operations

func (h *PsychologyHandler) AllRequests(w http.ResponseWriter, r *http.Request) {
	requests, err := h.svc.GetAllRequests(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch psychology requests"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: requests})
}

func (h *PsychologyHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request id"})
		return
	}
	var req model.UpdateApplicationStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}
	if req.Status != "pending" && req.Status != "in_progress" && req.Status != "resolved" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "status must be pending, in_progress, or resolved"})
		return
	}
	out, err := h.svc.UpdateStatus(r.Context(), id, req.Status)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to update status"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: out})
}
