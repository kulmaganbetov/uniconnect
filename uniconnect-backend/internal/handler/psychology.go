package handler

import (
	"encoding/json"
	"net/http"

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
