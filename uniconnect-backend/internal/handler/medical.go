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

type MedicalHandler struct {
	svc *service.MedicalService
}

func NewMedicalHandler(svc *service.MedicalService) *MedicalHandler {
	return &MedicalHandler{svc: svc}
}

func (h *MedicalHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	services, err := h.svc.GetAll(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch medical services"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: services})
}

func (h *MedicalHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid service id"})
		return
	}

	svc, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "medical service not found"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: svc})
}

func (h *MedicalHandler) BookAppointment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req model.MedicalAppointmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	app, err := h.svc.BookAppointment(r.Context(), userID, req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to book appointment"})
		return
	}

	writeJSON(w, http.StatusCreated, model.APIResponse{Success: true, Data: app})
}

func (h *MedicalHandler) MyAppointments(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	appointments, err := h.svc.GetMyAppointments(r.Context(), userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch appointments"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: appointments})
}
